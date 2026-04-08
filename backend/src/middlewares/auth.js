/**
 * ============================================================
 * ABNAN CRM — Auth Middleware (FIXED)
 * ============================================================
 */

'use strict';

const jwt    = require('jsonwebtoken');
const { query, cache, respond } = require('../utils/performance');

const JWT_SECRET  = process.env.JWT_SECRET  || 'GANTI_DENGAN_SECRET_KUAT_MINIMAL_32_CHAR';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// ── Token Management ──────────────────────────────────────────

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// ── Auth Middleware ───────────────────────────────────────────

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return respond.unauth(res, 'Token autentikasi diperlukan');
    }

    const token = header.slice(7);
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return respond.unauth(res, 'Token sudah kadaluarsa, silakan login kembali');
      }
      return respond.unauth(res, 'Token tidak valid');
    }

    // Cache user lookup for 5 minutes
    const cacheKey = `user:${decoded.id}`;
    let user = cache.get(cacheKey);

    if (!user) {
      if (decoded.account_type === 'customer') {
        const [userData] = await query(
          `SELECT id, customer_id, email, full_name, phone, is_active, 'customer' as account_type
           FROM customer_accounts WHERE id = ? AND is_active = 1 LIMIT 1`,
          [decoded.id]
        );
        if (!userData) return respond.unauth(res, 'Akun customer tidak ditemukan atau dinonaktifkan');
        user = userData;
      } else {
        const [userData] = await query(
          `SELECT id, employee_id, full_name, email, role, 'staff' as account_type, is_active
           FROM users WHERE id = ? AND is_active = 1 LIMIT 1`,
          [decoded.id]
        );
        if (!userData) return respond.unauth(res, 'Akun tidak ditemukan atau dinonaktifkan');
        user = userData;
      }
      cache.set(cacheKey, user, 5 * 60 * 1000);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    respond.error(res, err, 'Error autentikasi');
  }
}

// ── Role-Based Authorization ──────────────────────────────────

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return respond.unauth(res);
    if (roles.length && !roles.includes(req.user.role)) {
      return respond.forbidden(res, 'Anda tidak memiliki akses ke resource ini');
    }
    next();
  };
}

// Named role helpers
const isSuperAdmin    = authorize('super_admin');
const isGMOrAbove     = authorize('super_admin', 'general_manager');
const isSalesOrAbove  = authorize('super_admin', 'general_manager', 'sales_manager', 'sales');
const isFinanceOrAbove= authorize('super_admin', 'general_manager', 'finance');
const isManagerOrAbove= authorize('super_admin', 'general_manager', 'sales_manager');

// ── Account Type Guards ───────────────────────────────────────

function staffOnly(req, res, next) {
  if (!req.user) return respond.unauth(res);
  if (req.user.account_type === 'customer') {
    return respond.forbidden(res, 'Halaman ini hanya untuk staff internal');
  }
  next();
}

function customerOnly(req, res, next) {
  if (!req.user) return respond.unauth(res);
  if (req.user.account_type !== 'customer') {
    return respond.forbidden(res, 'Halaman ini hanya untuk customer');
  }
  next();
}

// ── Owner or Admin Guard ──────────────────────────────────────

function ownerOrAdmin(getResourceOwnerId) {
  return async (req, res, next) => {
    if (!req.user) return respond.unauth(res);
    if (['super_admin', 'general_manager'].includes(req.user.role)) {
      return next();
    }
    try {
      const ownerId = typeof getResourceOwnerId === 'function'
        ? await getResourceOwnerId(req)
        : req.params[getResourceOwnerId];
      if (String(req.user.id) === String(ownerId)) {
        return next();
      }
      return respond.forbidden(res, 'Anda hanya bisa mengakses resource milik Anda sendiri');
    } catch (err) {
      return respond.error(res, err);
    }
  };
}

// ── Login Handler ─────────────────────────────────────────────

async function handleLogin(req, res) {
  const { login: loginValue, password } = req.body;

  if (!loginValue || !password) {
    return respond.badReq(res, 'Login dan password wajib diisi');
  }

  try {
    // Coba login sebagai staff dulu
    const [user] = await query(
      `SELECT id, employee_id, full_name, email, role, account_type, password_hash, is_active
       FROM users
       WHERE (employee_id = ? OR email = ?) AND is_active = 1
       LIMIT 1`,
      [loginValue, loginValue]
    );

    if (!user) {
      // Coba login sebagai customer
      const [customerAccount] = await query(
        `SELECT id, customer_id, email, full_name, phone, is_active, password_hash
         FROM customer_accounts
         WHERE email = ? AND is_active = 1
         LIMIT 1`,
        [loginValue]
      );
      if (customerAccount) {
        const bcrypt = require('bcryptjs');
        const isValid = await bcrypt.compare(password, customerAccount.password_hash);
        if (!isValid) return respond.unauth(res, 'Login atau password salah');
        const token = signToken({
          id: customerAccount.id,
          customer_id: customerAccount.customer_id,
          account_type: 'customer',
          full_name: customerAccount.full_name,
          email: customerAccount.email,
        });
        await query('UPDATE customer_accounts SET last_login = NOW() WHERE id = ?', [customerAccount.id]);
        const { password_hash, ...safeUser } = customerAccount;
        return respond.ok(res, { token, user: { ...safeUser, account_type: 'customer' } }, 'Login berhasil');
      }
      return respond.unauth(res, 'ID karyawan / email tidak ditemukan');
    }

    // Verifikasi password staff
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return respond.unauth(res, 'Password salah');
    }

    const token = signToken({
      id: user.id,
      employee_id: user.employee_id,
      role: user.role,
      account_type: 'staff',
      full_name: user.full_name,
    });

    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    cache.del(`user:${user.id}`);
    const { password_hash, ...safeUser } = user;
    respond.ok(res, { token, user: { ...safeUser, account_type: 'staff' } }, 'Login berhasil');
  } catch (err) {
    respond.error(res, err, 'Error saat login');
  }
}

// ── Change Password ───────────────────────────────────────────

async function handleChangePassword(req, res) {
  const { old_password, new_password } = req.body;
  const userId = req.user.id;
  const isCustomer = req.user.account_type === 'customer';

  if (!old_password || !new_password) {
    return respond.badReq(res, 'Password lama dan baru wajib diisi');
  }
  if (new_password.length < 8) {
    return respond.badReq(res, 'Password baru minimal 8 karakter');
  }

  try {
    const bcrypt = require('bcryptjs');
    let user;
    if (isCustomer) {
      const [rows] = await query('SELECT password_hash FROM customer_accounts WHERE id = ?', [userId]);
      user = rows;
    } else {
      const [rows] = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
      user = rows;
    }
    if (!user) return respond.notFound(res, 'User tidak ditemukan');

    const isValid = await bcrypt.compare(old_password, user.password_hash);
    if (!isValid) return respond.badReq(res, 'Password lama tidak tepat');

    const newHash = await bcrypt.hash(new_password, 12);
    if (isCustomer) {
      await query('UPDATE customer_accounts SET password_hash = ? WHERE id = ?', [newHash, userId]);
    } else {
      await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    }
    cache.del(`user:${userId}`);
    respond.ok(res, null, 'Password berhasil diubah');
  } catch (err) {
    respond.error(res, err, 'Error mengubah password');
  }
}

module.exports = {
  authenticate,
  authorize,
  isSuperAdmin,
  isGMOrAbove,
  isSalesOrAbove,
  isFinanceOrAbove,
  isManagerOrAbove,
  staffOnly,
  customerOnly,
  ownerOrAdmin,
  signToken,
  verifyToken,
  handleLogin,
  handleChangePassword,
};