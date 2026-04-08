const pool = require('../config/db');
const bcrypt = require('bcrypt');

class UsersModel {
  static async getAll(filters = {}, pagination = {}) {
    let q = `SELECT id,employee_id,full_name,email,phone,role,position,department,avatar_url,join_date,is_active,last_login,created_at FROM users WHERE 1=1`;
    const p = [];
    if (filters.role) { q += ' AND role=?'; p.push(filters.role); }
    if (filters.is_active !== undefined) { q += ' AND is_active=?'; p.push(filters.is_active); }
    if (filters.search) { q += ' AND (full_name LIKE ? OR employee_id LIKE ? OR email LIKE ?)'; p.push(...Array(3).fill(`%${filters.search}%`)); }
    q += ` ORDER BY created_at DESC`;
    if (pagination.limit) { q += ' LIMIT ? OFFSET ?'; p.push(pagination.limit, pagination.offset || 0); }
    const [rows] = await pool.query(q, p);
    return rows;
  }

  static async getById(id) {
    const [r] = await pool.query(`SELECT id,employee_id,full_name,email,phone,role,position,department,avatar_url,join_date,is_active,last_login,created_at FROM users WHERE id=?`, [id]);
    return r[0];
  }

  static async getByEmployeeId(empId) {
    const [r] = await pool.query(`SELECT * FROM users WHERE employee_id=? AND is_active=TRUE`, [empId]);
    return r[0];
  }

  static async create(data) {
    const hash = await bcrypt.hash(data.password, 10);
    const [res] = await pool.query(
      `INSERT INTO users (employee_id,full_name,email,phone,role,position,department,join_date,password_hash) VALUES (?,?,?,?,?,?,?,?,?)`,
      [data.employee_id, data.full_name, data.email||null, data.phone||null, data.role||'sales', data.position||null, data.department||null, data.join_date||null, hash]
    );
    return this.getById(res.insertId);
  }

  static async update(id, data) {
    const fields = [], p = [];
    ['full_name','email','phone','role','position','department','join_date','is_active'].forEach(f => {
      if (data[f] !== undefined) { fields.push(`${f}=?`); p.push(data[f]); }
    });
    if (data.password) { fields.push('password_hash=?'); p.push(await bcrypt.hash(data.password, 10)); }
    if (!fields.length) return null;
    p.push(id);
    await pool.query(`UPDATE users SET ${fields.join(',')},updated_at=NOW() WHERE id=?`, p);
    return this.getById(id);
  }

  static async verifyPassword(empId, password) {
    const user = await this.getByEmployeeId(empId);
    if (!user || !user.password_hash) return null;
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return null;
    await pool.query('UPDATE users SET last_login=NOW() WHERE id=?', [user.id]);
    const { password_hash, ...safe } = user;
    return safe;
  }

  static async count(filters = {}) {
    let q = 'SELECT COUNT(*) as c FROM users WHERE 1=1';
    const p = [];
    if (filters.role) { q += ' AND role=?'; p.push(filters.role); }
    const [r] = await pool.query(q, p);
    return r[0].c;
  }
}

module.exports = UsersModel;
