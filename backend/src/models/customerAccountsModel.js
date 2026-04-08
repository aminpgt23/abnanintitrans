const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/db');

class CustomerAccountsModel {
  static buildSetupLink(token) {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    return `${frontendUrl}/customer-setup/${token}`;
  }

  static sanitize(row) {
    if (!row) return null;
    const { password_hash, ...safe } = row;
    return {
      ...safe,
      account_type: 'customer',
    };
  }

  static async getById(id) {
    const [rows] = await pool.query(
      `SELECT
         ca.id,
         ca.customer_id,
         ca.email,
         ca.full_name,
         ca.phone,
         ca.is_active,
         ca.last_login,
         ca.created_at,
         ca.updated_at,
         c.code AS customer_code,
         c.name AS customer_name,
         c.company_name,
         c.email AS customer_email,
         c.phone AS customer_phone,
         c.whatsapp,
         c.address,
         c.city,
         c.province,
         c.country,
         c.postal_code,
         c.assigned_sales_id,
         u.full_name AS sales_name,
         u.employee_id AS sales_employee_id
       FROM customer_accounts ca
       INNER JOIN customers c ON c.id = ca.customer_id
       LEFT JOIN users u ON u.id = c.assigned_sales_id
       WHERE ca.id = ?`,
      [id]
    );
    return this.sanitize(rows[0] || null);
  }

  static async getByCustomerId(customerId) {
    const [rows] = await pool.query(
      `SELECT
         ca.id,
         ca.customer_id,
         ca.email,
         ca.full_name,
         ca.phone,
         ca.is_active,
         ca.last_login,
         ca.created_at,
         ca.updated_at,
         c.code AS customer_code,
         c.name AS customer_name,
         c.company_name,
         c.email AS customer_email,
         c.phone AS customer_phone,
         c.whatsapp,
         c.address,
         c.city,
         c.province,
         c.country,
         c.postal_code,
         c.assigned_sales_id,
         u.full_name AS sales_name,
         u.employee_id AS sales_employee_id
       FROM customer_accounts ca
       INNER JOIN customers c ON c.id = ca.customer_id
       LEFT JOIN users u ON u.id = c.assigned_sales_id
       WHERE ca.customer_id = ?`,
      [customerId]
    );
    return this.sanitize(rows[0] || null);
  }

  static async getByEmail(email) {
    const [rows] = await pool.query(
      `SELECT
         ca.*,
         c.code AS customer_code,
         c.name AS customer_name,
         c.company_name,
         c.email AS customer_email,
         c.phone AS customer_phone,
         c.whatsapp,
         c.address,
         c.city,
         c.province,
         c.country,
         c.postal_code,
         c.assigned_sales_id,
         u.full_name AS sales_name,
         u.employee_id AS sales_employee_id
       FROM customer_accounts ca
       INNER JOIN customers c ON c.id = ca.customer_id
       LEFT JOIN users u ON u.id = c.assigned_sales_id
       WHERE ca.email = ?`,
      [String(email || '').trim().toLowerCase()]
    );
    return rows[0] || null;
  }

  static async verifyPassword(email, password) {
    const account = await this.getByEmail(email);
    if (!account || !account.password_hash || !account.is_active) return null;

    const isValid = await bcrypt.compare(password, account.password_hash);
    if (!isValid) return null;

    await pool.query('UPDATE customer_accounts SET last_login = NOW() WHERE id = ?', [account.id]);
    return this.getById(account.id);
  }

  static async getLatestSetupByAccountId(accountId) {
    const [rows] = await pool.query(
      `SELECT id, customer_account_id, setup_token, expires_at, used_at, created_by, created_at
       FROM customer_account_setups
       WHERE customer_account_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [accountId]
    );

    const setup = rows[0] || null;
    if (!setup) return null;

    return {
      ...setup,
      is_expired: setup.expires_at ? new Date(setup.expires_at) < new Date() : false,
      setup_link: setup.used_at ? null : this.buildSetupLink(setup.setup_token),
    };
  }

  static async getValidSetupByToken(token) {
    const [rows] = await pool.query(
      `SELECT
         cas.id,
         cas.customer_account_id,
         cas.setup_token,
         cas.expires_at,
         cas.used_at,
         cas.created_at,
         ca.customer_id,
         ca.email,
         ca.full_name,
         ca.is_active,
         c.name AS customer_name,
         c.company_name
       FROM customer_account_setups cas
       INNER JOIN customer_accounts ca ON ca.id = cas.customer_account_id
       INNER JOIN customers c ON c.id = ca.customer_id
       WHERE cas.setup_token = ?
       LIMIT 1`,
      [token]
    );

    const setup = rows[0] || null;
    if (!setup) return null;
    if (setup.used_at) return null;
    if (setup.expires_at && new Date(setup.expires_at) < new Date()) return null;
    return setup;
  }

  static async issueSetupLink(customerId, data = {}, createdBy = null) {
    const normalizedEmail = String(data.email || '').trim().toLowerCase();
    const fullName = data.full_name || data.customer_name || null;
    const phone = data.phone || null;

    if (!normalizedEmail) {
      const error = new Error('Email customer wajib diisi untuk membuat link setup');
      error.status = 400;
      throw error;
    }

    let account = await this.getByCustomerId(customerId);

    if (account) {
      await pool.query(
        `UPDATE customer_accounts
         SET email = ?, full_name = ?, phone = ?, updated_at = NOW()
         WHERE id = ?`,
        [normalizedEmail, fullName, phone, account.id]
      );
    } else {
      const tempPasswordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
      const [result] = await pool.query(
        `INSERT INTO customer_accounts (customer_id, email, password_hash, full_name, phone, is_active)
         VALUES (?, ?, ?, ?, ?, FALSE)`,
        [customerId, normalizedEmail, tempPasswordHash, fullName, phone]
      );
      account = await this.getById(result.insertId);
    }

    account = await this.getByCustomerId(customerId);

    await pool.query(
      `UPDATE customer_account_setups
       SET used_at = NOW()
       WHERE customer_account_id = ? AND used_at IS NULL`,
      [account.id]
    );

    const setupToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + (72 * 60 * 60 * 1000));

    await pool.query(
      `INSERT INTO customer_account_setups (customer_account_id, setup_token, expires_at, created_by)
       VALUES (?, ?, ?, ?)`,
      [account.id, setupToken, expiresAt, createdBy]
    );

    return {
      account: await this.getByCustomerId(customerId),
      setup_token: setupToken,
      setup_link: this.buildSetupLink(setupToken),
      expires_at: expiresAt,
      status: account?.is_active ? 'active' : 'pending_activation',
    };
  }

  static async upsert(customerId, data = {}) {
    const normalizedEmail = String(data.email || '').trim().toLowerCase();
    const password = data.password ? String(data.password) : null;
    const fullName = data.full_name || data.customer_name || null;
    const phone = data.phone || null;
    const isActive = data.is_active !== undefined ? Boolean(data.is_active) : true;
    const existing = await this.getByCustomerId(customerId);

    if (!existing && !password) {
      const error = new Error('Password awal wajib diisi untuk membuat akses customer');
      error.status = 400;
      throw error;
    }

    if (!normalizedEmail) {
      const error = new Error('Email customer wajib diisi');
      error.status = 400;
      throw error;
    }

    if (existing) {
      const fields = ['email = ?', 'full_name = ?', 'phone = ?', 'is_active = ?', 'updated_at = NOW()'];
      const params = [normalizedEmail, fullName, phone, isActive];

      if (password) {
        fields.push('password_hash = ?');
        params.push(await bcrypt.hash(password, 10));
      }

      params.push(existing.id);
      await pool.query(`UPDATE customer_accounts SET ${fields.join(', ')} WHERE id = ?`, params);
      return this.getById(existing.id);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO customer_accounts (customer_id, email, password_hash, full_name, phone, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customerId, normalizedEmail, passwordHash, fullName, phone, isActive]
    );

    return this.getById(result.insertId);
  }

  static async updatePassword(accountId, newPassword) {
    await pool.query(
      'UPDATE customer_accounts SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [await bcrypt.hash(newPassword, 10), accountId]
    );
    return this.getById(accountId);
  }

  static async completeSetup(token, newPassword) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.query(
        `SELECT
           cas.id,
           cas.customer_account_id,
           cas.expires_at,
           cas.used_at,
           ca.customer_id
         FROM customer_account_setups cas
         INNER JOIN customer_accounts ca ON ca.id = cas.customer_account_id
         WHERE cas.setup_token = ?
         LIMIT 1`,
        [token]
      );

      const setup = rows[0] || null;

      if (!setup || setup.used_at || (setup.expires_at && new Date(setup.expires_at) < new Date())) {
        const error = new Error('Link setup password tidak valid atau sudah kedaluwarsa');
        error.status = 400;
        throw error;
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await connection.query(
        `UPDATE customer_accounts
         SET password_hash = ?, is_active = TRUE, updated_at = NOW()
         WHERE id = ?`,
        [passwordHash, setup.customer_account_id]
      );

      await connection.query(
        `UPDATE customer_account_setups
         SET used_at = NOW()
         WHERE id = ?`,
        [setup.id]
      );

      await connection.query(
        `UPDATE customers
         SET is_registered = TRUE, updated_at = NOW()
         WHERE id = ?`,
        [setup.customer_id]
      );

      await connection.commit();
      return this.getById(setup.customer_account_id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = CustomerAccountsModel;
