// ============================================================
// AUTH ROUTES
// ============================================================
const express = require('express');
const jwt = require('jsonwebtoken');
const UsersModel = require('../models/usersModel');
const CustomerAccountsModel = require('../models/customerAccountsModel');
const { authenticate, authorize } = require('../middlewares/auth');
const { sendResponse } = require('../utils/response');

const authRouter = express.Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const { login, employee_id, email, password } = req.body;
    const credential = String(login || email || employee_id || '').trim();

    if (!password) {
      return sendResponse(res, false, 'Password wajib diisi', null, 400);
    }

    if (!credential) {
      return sendResponse(res, false, 'ID karyawan atau email customer wajib diisi', null, 400);
    }

    const looksLikeEmail = credential.includes('@');

    if (looksLikeEmail) {
      const account = await CustomerAccountsModel.verifyPassword(credential.toLowerCase(), password);
      if (!account) return sendResponse(res, false, 'Login atau password salah', null, 401);

      const token = jwt.sign(
        {
          id: account.id,
          customer_id: account.customer_id,
          account_type: 'customer',
          full_name: account.full_name || account.customer_name,
          email: account.email,
        },
        process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

      return sendResponse(res, true, 'Login berhasil', { token, user: account });
    }

    const user = await UsersModel.verifyPassword(credential.toUpperCase(), password);
    if (!user) return sendResponse(res, false, 'Login atau password salah', null, 401);
    const token = jwt.sign(
      {
        id: user.id,
        employee_id: user.employee_id,
        role: user.role,
        full_name: user.full_name,
        account_type: 'staff',
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    sendResponse(res, true, 'Login berhasil', { token, user: { ...user, account_type: 'staff' } });
  } catch(e) { next(e); }
});

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    if (req.user.account_type === 'customer') {
      const account = await CustomerAccountsModel.getById(req.user.id);
      if (!account) return sendResponse(res, false, 'Akun customer tidak ditemukan', null, 404);
      return sendResponse(res, true, 'OK', account);
    }

    const user = await UsersModel.getById(req.user.id);
    if (!user) return sendResponse(res, false, 'User tidak ditemukan', null, 404);
    sendResponse(res, true, 'OK', { ...user, account_type: 'staff' });
  } catch(e) { next(e); }
});

authRouter.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    if (req.user.account_type === 'customer') {
      const account = await CustomerAccountsModel.verifyPassword(req.user.email, old_password);
      if (!account) return sendResponse(res, false, 'Password lama salah', null, 400);
      await CustomerAccountsModel.updatePassword(req.user.id, new_password);
      return sendResponse(res, true, 'Password customer berhasil diubah');
    }

    const ok = await UsersModel.verifyPassword(req.user.employee_id, old_password);
    if (!ok) return sendResponse(res, false, 'Password lama salah', null, 400);
    await UsersModel.update(req.user.id, { password: new_password });
    sendResponse(res, true, 'Password berhasil diubah');
  } catch(e) { next(e); }
});

module.exports.authRouter = authRouter;

// ============================================================
// USERS ROUTES
// ============================================================
const usersRouter = express.Router();

usersRouter.get('/', authenticate, authorize('super_admin','general_manager','sales_manager'), async (req, res, next) => {
  try {
    const { page=1, limit=20, ...filters } = req.query;
    const users = await UsersModel.getAll(filters, { limit: parseInt(limit), offset: (page-1)*limit });
    sendResponse(res, true, 'OK', { users, total: users.length });
  } catch(e) { next(e); }
});

usersRouter.post('/', authenticate, authorize('super_admin'), async (req, res, next) => {
  try {
    const user = await UsersModel.create(req.body);
    sendResponse(res, true, 'Karyawan berhasil ditambahkan', user, 201);
  } catch(e) { next(e); }
});

usersRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await UsersModel.getById(req.params.id);
    if (!user) return sendResponse(res, false, 'User tidak ditemukan', null, 404);
    sendResponse(res, true, 'OK', user);
  } catch(e) { next(e); }
});

usersRouter.put('/:id', authenticate, authorize('super_admin'), async (req, res, next) => {
  try {
    const user = await UsersModel.update(req.params.id, req.body);
    sendResponse(res, true, 'User diperbarui', user);
  } catch(e) { next(e); }
});

usersRouter.delete('/:id', authenticate, authorize('super_admin'), async (req, res, next) => {
  try {
    await UsersModel.update(req.params.id, { is_active: false });
    sendResponse(res, true, 'User dinonaktifkan');
  } catch(e) { next(e); }
});

module.exports.usersRouter = usersRouter;

// ============================================================
// CUSTOMERS ROUTES
// ============================================================
const CustomersModel = require('../models/customersModel');
const customersRouter = express.Router();

customersRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { page=1, limit=20, ...filters } = req.query;
    // Sales only sees their own customers
    if (req.user.role === 'sales') filters.assigned_sales_id = req.user.id;
    const data = await CustomersModel.getAll(filters, { limit: parseInt(limit), offset: (page-1)*limit });
    sendResponse(res, true, 'OK', data);
  } catch(e) { next(e); }
});

customersRouter.post('/', authenticate, async (req, res, next) => {
  try {
    if (req.user.role === 'sales') req.body.assigned_sales_id = req.user.id;
    const cust = await CustomersModel.create(req.body);
    let customerAccess = null;

    if (cust.email) {
      customerAccess = await CustomerAccountsModel.issueSetupLink(
        cust.id,
        {
          email: cust.email,
          full_name: cust.name,
          phone: cust.phone || cust.whatsapp,
        },
        req.user.id
      );
    }

    sendResponse(res, true, 'Customer berhasil ditambahkan', {
      ...cust,
      customer_access: customerAccess,
    }, 201);
  } catch(e) { next(e); }
});

customersRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const cust = await CustomersModel.getById(req.params.id);
    if (!cust) return sendResponse(res, false, 'Customer tidak ditemukan', null, 404);
    if (req.user.role === 'sales' && cust.assigned_sales_id !== req.user.id)
      return sendResponse(res, false, 'Akses ditolak', null, 403);
    sendResponse(res, true, 'OK', cust);
  } catch(e) { next(e); }
});

customersRouter.put('/:id', authenticate, async (req, res, next) => {
  try {
    const cust = await CustomersModel.update(req.params.id, req.body);
    sendResponse(res, true, 'Customer diperbarui', cust);
  } catch(e) { next(e); }
});

customersRouter.delete('/:id', authenticate, authorize('super_admin','sales_manager','general_manager'), async (req, res, next) => {
  try {
    await CustomersModel.delete(req.params.id);
    sendResponse(res, true, 'Customer dihapus');
  } catch(e) { next(e); }
});

module.exports.customersRouter = customersRouter;

// ============================================================
// INVOICES ROUTES
// ============================================================
const InvoicesModel = require('../models/invoicesModel');
const invoicesRouter = express.Router();

invoicesRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { page=1, limit=20, ...filters } = req.query;
    if (req.user.role === 'sales') filters.sales_id = req.user.id;
    const data = await InvoicesModel.getAll(filters, { limit: parseInt(limit), offset: (page-1)*limit });
    sendResponse(res, true, 'OK', data);
  } catch(e) { next(e); }
});

invoicesRouter.post('/', authenticate, async (req, res, next) => {
  try {
    if (req.user.role === 'sales') req.body.sales_id = req.user.id;
    const inv = await InvoicesModel.create(req.body);
    sendResponse(res, true, 'Invoice berhasil dibuat', inv, 201);
  } catch(e) { next(e); }
});

invoicesRouter.get('/stats', authenticate, async (req, res, next) => {
  try {
    const filters = {};
    if (req.user.role === 'sales') filters.sales_id = req.user.id;
    const stats = await InvoicesModel.getStats(filters);
    sendResponse(res, true, 'OK', stats);
  } catch(e) { next(e); }
});

invoicesRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const inv = await InvoicesModel.getById(req.params.id);
    if (!inv) return sendResponse(res, false, 'Invoice tidak ditemukan', null, 404);
    sendResponse(res, true, 'OK', inv);
  } catch(e) { next(e); }
});

invoicesRouter.put('/:id', authenticate, async (req, res, next) => {
  try {
    const inv = await InvoicesModel.update(req.params.id, req.body);
    sendResponse(res, true, 'Invoice diperbarui', inv);
  } catch(e) { next(e); }
});

invoicesRouter.delete('/:id', authenticate, authorize('super_admin','sales_manager','general_manager'), async (req, res, next) => {
  try {
    await InvoicesModel.delete(req.params.id);
    sendResponse(res, true, 'Invoice dihapus');
  } catch(e) { next(e); }
});

module.exports.invoicesRouter = invoicesRouter;

// ============================================================
// PAYMENTS ROUTES (dummy midtrans)
// ============================================================
const pool = require('../config/db');
const paymentsRouter = express.Router();

paymentsRouter.post('/midtrans/create', authenticate, async (req, res, next) => {
  try {
    const { invoice_id, amount } = req.body;
    const inv = await InvoicesModel.getById(invoice_id);
    if (!inv) return sendResponse(res, false, 'Invoice tidak ditemukan', null, 404);
    // DUMMY Midtrans response (replace with real midtrans-client in production)
    const orderId = `ABNAN-${invoice_id}-${Date.now()}`;
    const dummyToken = `dummy-snap-token-${orderId}`;
    const dummyRedirectUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${dummyToken}`;
    await InvoicesModel.update(invoice_id, { midtrans_order_id: orderId, midtrans_snap_token: dummyToken, midtrans_status: 'pending' });
    sendResponse(res, true, 'Payment token created (DUMMY)', { token: dummyToken, redirect_url: dummyRedirectUrl, order_id: orderId });
  } catch(e) { next(e); }
});

paymentsRouter.post('/midtrans/callback', async (req, res) => {
  // Midtrans webhook callback - handle payment notifications
  const { order_id, transaction_status, payment_type, gross_amount } = req.body;
  try {
    const [invRows] = await pool.query('SELECT * FROM invoices WHERE midtrans_order_id=?', [order_id]);
    if (invRows.length) {
      const inv = invRows[0];
      let status = inv.status;
      if (transaction_status === 'settlement' || transaction_status === 'capture') {
        status = 'paid';
        await InvoicesModel.update(inv.id, { status: 'paid', midtrans_status: 'settlement', midtrans_payment_type: payment_type, amount_paid: gross_amount, amount_due: 0, paid_date: new Date().toISOString().split('T')[0] });
        await CustomersModel.recalcRating(inv.customer_id);
      } else if (transaction_status === 'pending') {
        await InvoicesModel.update(inv.id, { midtrans_status: 'pending', midtrans_payment_type: payment_type });
      } else if (['deny','expire','cancel'].includes(transaction_status)) {
        await InvoicesModel.update(inv.id, { midtrans_status: transaction_status });
      }
    }
    res.json({ status: 200 });
  } catch(e) { res.json({ status: 500 }); }
});

paymentsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { invoice_id, page=1, limit=20 } = req.query;
    let q = `SELECT
      p.*,
      u.full_name as created_by_name,
      v.full_name as verified_by_name,
      i.invoice_number,
      i.customer_id,
      c.name as customer_name,
      c.company_name
    FROM payments p
    LEFT JOIN users u ON p.created_by=u.id
    LEFT JOIN users v ON p.verified_by=v.id
    LEFT JOIN invoices i ON p.invoice_id=i.id
    LEFT JOIN customers c ON i.customer_id=c.id
    WHERE 1=1`;
    const params = [];
    if (invoice_id) { q += ' AND p.invoice_id=?'; params.push(invoice_id); }
    q += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page-1)*limit);
    const [rows] = await pool.query(q, params);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

paymentsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { invoice_id, invoice_number, amount, payment_method, reference_number, notes, payment_date } = req.body;
    let resolvedInvoiceId = invoice_id;

    if (!resolvedInvoiceId && invoice_number) {
      const [[invoice]] = await pool.query('SELECT id FROM invoices WHERE invoice_number=?', [invoice_number]);
      resolvedInvoiceId = invoice?.id;
    }

    if (!resolvedInvoiceId) {
      return sendResponse(res, false, 'Invoice wajib dipilih', null, 400);
    }

    const [res2] = await pool.query(
      `INSERT INTO payments (invoice_id,amount,payment_date,payment_method,reference_number,notes,created_by) VALUES (?,?,?,?,?,?,?)`,
      [resolvedInvoiceId, amount, payment_date||new Date(), payment_method||'transfer', reference_number||null, notes||null, req.user.id]
    );
    const [[payment]] = await pool.query(
      `SELECT p.*, i.invoice_number, i.customer_id, c.name as customer_name, c.company_name
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id=i.id
       LEFT JOIN customers c ON i.customer_id=c.id
       WHERE p.id=?`,
      [res2.insertId]
    );
    sendResponse(res, true, 'Pembayaran dicatat', payment, 201);
  } catch(e) { next(e); }
});

paymentsRouter.put('/:id/verify', authenticate, authorize('finance','general_manager','super_admin'), async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    await pool.query('UPDATE payments SET status=?,verified_by=?,verified_at=NOW(),notes=? WHERE id=?', [status, req.user.id, notes||null, req.params.id]);
    if (status === 'verified') {
      const [[pay]] = await pool.query('SELECT * FROM payments WHERE id=?', [req.params.id]);
      const inv = await InvoicesModel.getById(pay.invoice_id);
      const newPaid = parseFloat(inv.amount_paid||0) + parseFloat(pay.amount);
      const newDue = Math.max(0, parseFloat(inv.grand_total) - newPaid);
      await InvoicesModel.update(pay.invoice_id, { amount_paid: newPaid, amount_due: newDue, status: newDue <= 0 ? 'paid' : 'partial', paid_date: newDue <= 0 ? new Date().toISOString().split('T')[0] : undefined });
      if (newDue <= 0) await CustomersModel.recalcRating(inv.customer_id);
    }
    sendResponse(res, true, 'Status pembayaran diperbarui');
  } catch(e) { next(e); }
});

module.exports.paymentsRouter = paymentsRouter;

// ============================================================
// COMMISSIONS ROUTES
// ============================================================
const commissionsRouter = express.Router();

commissionsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { page=1, limit=20, sales_id, status } = req.query;
    let q = `SELECT c.*,u.full_name as sales_name,i.invoice_number FROM commissions c LEFT JOIN users u ON c.sales_id=u.id LEFT JOIN invoices i ON c.invoice_id=i.id WHERE 1=1`;
    const p = [];
    // Sales only sees own
    if (req.user.role === 'sales') { q += ' AND c.sales_id=?'; p.push(req.user.id); }
    else if (sales_id) { q += ' AND c.sales_id=?'; p.push(sales_id); }
    if (status) { q += ' AND c.status=?'; p.push(status); }
    q += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    p.push(parseInt(limit), (page-1)*limit);
    const [rows] = await pool.query(q, p);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

commissionsRouter.post('/request', authenticate, authorize('sales'), async (req, res, next) => {
  try {
    const { commission_ids } = req.body;
    await pool.query(`UPDATE commissions SET status='requested',request_date=NOW() WHERE id IN (?) AND sales_id=?`, [commission_ids, req.user.id]);
    sendResponse(res, true, 'Komisi berhasil diajukan');
  } catch(e) { next(e); }
});

commissionsRouter.put('/:id/approve-sm', authenticate, authorize('sales_manager','general_manager','super_admin'), async (req, res, next) => {
  try {
    await pool.query(`UPDATE commissions SET status='approved_sm',sm_approval_date=NOW(),sm_approved_by=? WHERE id=?`, [req.user.id, req.params.id]);
    sendResponse(res, true, 'Disetujui oleh Sales Manager');
  } catch(e) { next(e); }
});

commissionsRouter.put('/:id/approve', authenticate, authorize('finance','general_manager','super_admin'), async (req, res, next) => {
  try {
    await pool.query(`UPDATE commissions SET status='approved',approval_date=NOW(),approved_by=? WHERE id=?`, [req.user.id, req.params.id]);
    sendResponse(res, true, 'Komisi disetujui Finance');
  } catch(e) { next(e); }
});

commissionsRouter.put('/:id/pay', authenticate, authorize('finance','general_manager','super_admin'), async (req, res, next) => {
  try {
    await pool.query(`UPDATE commissions SET status='paid',paid_date=NOW(),paid_by=? WHERE id=?`, [req.user.id, req.params.id]);
    sendResponse(res, true, 'Komisi telah dibayarkan');
  } catch(e) { next(e); }
});

commissionsRouter.get('/summary/:salesId', authenticate, async (req, res, next) => {
  try {
    const sid = req.user.role === 'sales' ? req.user.id : req.params.salesId;
    const [[row]] = await pool.query(`SELECT SUM(commission_amount) as total,SUM(CASE WHEN status='paid' THEN commission_amount ELSE 0 END) as paid,SUM(CASE WHEN status!='paid' THEN commission_amount ELSE 0 END) as pending FROM commissions WHERE sales_id=?`, [sid]);
    sendResponse(res, true, 'OK', row);
  } catch(e) { next(e); }
});

module.exports.commissionsRouter = commissionsRouter;

// ============================================================
// FINANCE ROUTES
// ============================================================
const financeRouter = express.Router();

financeRouter.get('/transactions', authenticate, authorize('finance','general_manager','super_admin'), async (req, res, next) => {
  try {
    const { page=1, limit=20, type, date_from, date_to } = req.query;
    let q = `SELECT ft.*,u.full_name as created_by_name,a.full_name as approved_by_name FROM finance_transactions ft LEFT JOIN users u ON ft.created_by=u.id LEFT JOIN users a ON ft.approved_by=a.id WHERE 1=1`;
    const p = [];
    if (type) { q += ' AND ft.type=?'; p.push(type); }
    if (date_from) { q += ' AND ft.transaction_date>=?'; p.push(date_from); }
    if (date_to) { q += ' AND ft.transaction_date<=?'; p.push(date_to); }
    q += ' ORDER BY ft.transaction_date DESC LIMIT ? OFFSET ?';
    p.push(parseInt(limit), (page-1)*limit);
    const [rows] = await pool.query(q, p);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

financeRouter.post('/transactions', authenticate, authorize('finance','general_manager','super_admin'), async (req, res, next) => {
  try {
    const num = `TRX-${Date.now()}`;
    const { type, category, amount, tax_amount, description, reference_type, reference_id, payment_proof_url, transaction_date } = req.body;
    const [r] = await pool.query(`INSERT INTO finance_transactions (transaction_number,type,category,amount,tax_amount,description,reference_type,reference_id,payment_proof_url,transaction_date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [num,type,category||null,amount,tax_amount||0,description||null,reference_type||'other',reference_id||null,payment_proof_url||null,transaction_date,req.user.id]);
    const [[trx]] = await pool.query('SELECT * FROM finance_transactions WHERE id=?', [r.insertId]);
    sendResponse(res, true, 'Transaksi dicatat', trx, 201);
  } catch(e) { next(e); }
});

financeRouter.get('/summary', authenticate, authorize('finance','general_manager','super_admin'), async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    let where = 'status="approved"'; const p = [];
    if (date_from) { where += ' AND transaction_date>=?'; p.push(date_from); }
    if (date_to) { where += ' AND transaction_date<=?'; p.push(date_to); }
    const [[row]] = await pool.query(`SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_income,SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense,SUM(CASE WHEN type='income' THEN tax_amount ELSE 0 END) as tax_collected,SUM(CASE WHEN type='expense' THEN tax_amount ELSE 0 END) as tax_paid FROM finance_transactions WHERE ${where}`, p);
    sendResponse(res, true, 'OK', row);
  } catch(e) { next(e); }
});

financeRouter.get('/payment-requests', authenticate, authorize('sales','finance','sales_manager','general_manager','super_admin'), async (req, res, next) => {
  try {
    const { page=1, limit=20, status } = req.query;
    let q = `SELECT pr.*,i.invoice_number,i.grand_total,u.full_name as requested_by_name,c.name as customer_name FROM payment_requests pr LEFT JOIN invoices i ON pr.invoice_id=i.id LEFT JOIN users u ON pr.requested_by=u.id LEFT JOIN customers c ON i.customer_id=c.id WHERE 1=1`;
    const p = [];
    if (status) { q += ' AND pr.status=?'; p.push(status); }
    if (req.user.role === 'sales') {
      q += ' AND pr.requested_by=?';
      p.push(req.user.id);
    }
    if (req.user.role === 'sales_manager') {
      q += ' AND pr.status IN ("pending_sm","approved_sm","rejected_sm")';
    }
    q += ' ORDER BY pr.created_at DESC LIMIT ? OFFSET ?';
    p.push(parseInt(limit), (page-1)*limit);
    const [rows] = await pool.query(q, p);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

financeRouter.post('/payment-requests', authenticate, authorize('sales'), async (req, res, next) => {
  try {
    const { invoice_id, amount } = req.body;
    const [r] = await pool.query(`INSERT INTO payment_requests (invoice_id,requested_by,amount) VALUES (?,?,?)`, [invoice_id, req.user.id, amount]);
    sendResponse(res, true, 'Pengajuan pembayaran dikirim', { id: r.insertId }, 201);
  } catch(e) { next(e); }
});

financeRouter.put('/payment-requests/:id/review-sm', authenticate, authorize('sales_manager','general_manager','super_admin'), async (req, res, next) => {
  try {
    const { approved, notes } = req.body;
    const status = approved ? 'approved_sm' : 'rejected_sm';
    await pool.query(`UPDATE payment_requests SET status=?,sm_review_by=?,sm_review_at=NOW(),sm_notes=? WHERE id=?`, [status, req.user.id, notes||null, req.params.id]);
    sendResponse(res, true, approved ? 'Disetujui SM' : 'Ditolak SM');
  } catch(e) { next(e); }
});

financeRouter.put('/payment-requests/:id/review-finance', authenticate, authorize('finance','general_manager','super_admin'), async (req, res, next) => {
  try {
    const { approved, notes } = req.body;
    const status = approved ? 'paid' : 'rejected_finance';
    await pool.query(`UPDATE payment_requests SET status=?,finance_review_by=?,finance_review_at=NOW(),finance_notes=?,paid_at=? WHERE id=?`,
      [status, req.user.id, notes||null, approved ? new Date() : null, req.params.id]);
    if (approved) {
      const [[pr]] = await pool.query('SELECT * FROM payment_requests WHERE id=?', [req.params.id]);
      await InvoicesModel.update(pr.invoice_id, { status: 'paid', amount_due: 0 });
    }
    sendResponse(res, true, approved ? 'Pembayaran dikonfirmasi' : 'Ditolak Finance');
  } catch(e) { next(e); }
});

module.exports.financeRouter = financeRouter;

// ============================================================
// ANALYTICS / DASHBOARD
// ============================================================
const analyticsRouter = express.Router();
const dashboardRouter = express.Router();

dashboardRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const data = {};

    if (['super_admin','general_manager'].includes(role)) {
      const [[rev]] = await pool.query(`SELECT COALESCE(SUM(grand_total),0) as revenue FROM invoices WHERE status='paid' AND MONTH(paid_date)=MONTH(NOW()) AND YEAR(paid_date)=YEAR(NOW())`);
      const [[custs]] = await pool.query(`SELECT COUNT(*) as cnt FROM customers`);
      const [[inv]] = await pool.query(`SELECT COUNT(*) as cnt FROM invoices WHERE status='paid' AND MONTH(paid_date)=MONTH(NOW())`);
      const [[salesCnt]] = await pool.query(`SELECT COUNT(*) as cnt FROM users WHERE role='sales' AND is_active=TRUE`);
      data.revenue_this_month = parseFloat(rev.revenue);
      data.total_customers = custs.cnt;
      data.invoices_this_month = inv.cnt;
      data.active_sales = salesCnt.cnt;
    }

    if (role === 'sales_manager') {
      const [[row]] = await pool.query(`SELECT COUNT(DISTINCT u.id) as sales_count,COALESCE(SUM(i.grand_total),0) as total_revenue,COUNT(i.id) as invoice_count FROM users u LEFT JOIN invoices i ON i.sales_id=u.id AND i.status='paid' AND MONTH(i.paid_date)=MONTH(NOW()) WHERE u.role='sales' AND u.is_active=TRUE`);
      const [salesPerf] = await pool.query(`SELECT u.id,u.full_name,COUNT(i.id) as inv_count,COALESCE(SUM(i.grand_total),0) as revenue FROM users u LEFT JOIN invoices i ON i.sales_id=u.id AND i.status='paid' AND MONTH(i.paid_date)=MONTH(NOW()) WHERE u.role='sales' GROUP BY u.id ORDER BY revenue DESC`);
      data.summary = row;
      data.sales_performance = salesPerf;
    }

    if (role === 'sales') {
      const [[row]] = await pool.query(`SELECT COUNT(*) as invoice_count,COALESCE(SUM(grand_total),0) as revenue FROM invoices WHERE sales_id=? AND status='paid' AND MONTH(paid_date)=MONTH(NOW())`, [userId]);
      const [[comm]] = await pool.query(`SELECT COALESCE(SUM(commission_amount),0) as pending_commission FROM commissions WHERE sales_id=? AND status!='paid'`, [userId]);
      const [[custs]] = await pool.query(`SELECT COUNT(*) as cnt FROM customers WHERE assigned_sales_id=?`, [userId]);
      data.invoices_this_month = row.invoice_count;
      data.revenue_this_month = parseFloat(row.revenue);
      data.pending_commission = parseFloat(comm.pending_commission);
      data.total_customers = custs.cnt;
    }

    if (role === 'finance') {
      const [[row]] = await pool.query(`SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) as income,COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) as expense FROM finance_transactions WHERE status='approved' AND MONTH(transaction_date)=MONTH(NOW())`);
      const [[pend]] = await pool.query(`SELECT COUNT(*) as cnt FROM payment_requests WHERE status='approved_sm'`);
      data.income_this_month = parseFloat(row.income);
      data.expense_this_month = parseFloat(row.expense);
      data.pending_approvals = pend.cnt;
    }

    sendResponse(res, true, 'OK', data);
  } catch(e) { next(e); }
});

analyticsRouter.get('/sales-monthly', authenticate, authorize('super_admin','general_manager','sales_manager'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT DATE_FORMAT(issue_date,'%Y-%m') as month,COALESCE(SUM(grand_total),0) as revenue,COUNT(*) as count FROM invoices WHERE status='paid' AND issue_date >= DATE_SUB(NOW(),INTERVAL 12 MONTH) GROUP BY month ORDER BY month`);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

analyticsRouter.get('/sales-by-rep', authenticate, authorize('super_admin','general_manager','sales_manager'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT u.full_name,u.employee_id,COUNT(i.id) as inv_count,COALESCE(SUM(i.grand_total),0) as revenue,AVG(i.grand_total) as avg_deal FROM users u LEFT JOIN invoices i ON i.sales_id=u.id AND i.status='paid' WHERE u.role='sales' GROUP BY u.id ORDER BY revenue DESC`);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

module.exports.analyticsRouter = analyticsRouter;
module.exports.dashboardRouter = dashboardRouter;

// ============================================================
// PRODUCTS ROUTES
// ============================================================
const productsRouter = express.Router();

productsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, category, page=1, limit=20 } = req.query;
    let q = 'SELECT * FROM products WHERE is_active=TRUE';
    const p = [];
    if (search) { q += ' AND (name LIKE ? OR sku LIKE ? OR brand LIKE ?)'; p.push(...Array(3).fill(`%${search}%`)); }
    if (category) { q += ' AND category=?'; p.push(category); }
    q += ' ORDER BY name LIMIT ? OFFSET ?';
    p.push(parseInt(limit), (page-1)*limit);
    const [rows] = await pool.query(q, p);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

productsRouter.post('/', authenticate, authorize('super_admin','general_manager','sales_manager'), async (req, res, next) => {
  try {
    const { sku, name, brand, category, description, unit, price_buy, price_sell, stock_qty, min_order, hs_code, country_of_origin, weight_kg } = req.body;
    const [r] = await pool.query(`INSERT INTO products (sku,name,brand,category,description,unit,price_buy,price_sell,stock_qty,min_order,hs_code,country_of_origin,weight_kg) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [sku,name,brand||null,category||null,description||null,unit||'pcs',price_buy||null,price_sell||null,stock_qty||0,min_order||1,hs_code||null,country_of_origin||null,weight_kg||null]);
    const [[prod]] = await pool.query('SELECT * FROM products WHERE id=?', [r.insertId]);
    sendResponse(res, true, 'Produk ditambahkan', prod, 201);
  } catch(e) { next(e); }
});

productsRouter.put('/:id', authenticate, authorize('super_admin','general_manager','sales_manager'), async (req, res, next) => {
  try {
    const fields = [], p = [];
    ['sku','name','brand','category','description','unit','price_buy','price_sell','stock_qty','min_order','hs_code','country_of_origin','weight_kg','is_active'].forEach(f => {
      if (req.body[f] !== undefined) { fields.push(`${f}=?`); p.push(req.body[f]); }
    });
    p.push(req.params.id);
    await pool.query(`UPDATE products SET ${fields.join(',')},updated_at=NOW() WHERE id=?`, p);
    const [[prod]] = await pool.query('SELECT * FROM products WHERE id=?', [req.params.id]);
    sendResponse(res, true, 'Produk diperbarui', prod);
  } catch(e) { next(e); }
});

module.exports.productsRouter = productsRouter;

// ============================================================
// DOCUMENTS ROUTES
// ============================================================
const documentsRouter = express.Router();

documentsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { type, invoice_id, customer_id, page=1, limit=20 } = req.query;
    let q = `SELECT d.*,c.name as customer_name,i.invoice_number,u.full_name as created_by_name FROM documents d LEFT JOIN customers c ON d.customer_id=c.id LEFT JOIN invoices i ON d.invoice_id=i.id LEFT JOIN users u ON d.created_by=u.id WHERE 1=1`;
    const p = [];
    if (type) { q += ' AND d.type=?'; p.push(type); }
    if (invoice_id) { q += ' AND d.invoice_id=?'; p.push(invoice_id); }
    if (customer_id) { q += ' AND d.customer_id=?'; p.push(customer_id); }
    q += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    p.push(parseInt(limit), (page-1)*limit);
    const [rows] = await pool.query(q, p);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

documentsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const num = `DOC-${Date.now()}`;
    const { type, title, customer_id, invoice_id, shipment_id, notes, issued_date, expiry_date } = req.body;
    const [r] = await pool.query(`INSERT INTO documents (document_number,type,title,customer_id,invoice_id,shipment_id,notes,issued_date,expiry_date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [num,type,title,customer_id||null,invoice_id||null,shipment_id||null,notes||null,issued_date||null,expiry_date||null,req.user.id]);
    const [[doc]] = await pool.query('SELECT * FROM documents WHERE id=?', [r.insertId]);
    sendResponse(res, true, 'Dokumen dibuat', doc, 201);
  } catch(e) { next(e); }
});

documentsRouter.put('/:id', authenticate, async (req, res, next) => {
  try {
    const fields = [], p = [];
    ['title','type','status','notes','issued_date','expiry_date','file_url'].forEach(f => {
      if (req.body[f] !== undefined) { fields.push(`${f}=?`); p.push(req.body[f]); }
    });
    p.push(req.params.id);
    await pool.query(`UPDATE documents SET ${fields.join(',')},updated_at=NOW() WHERE id=?`, p);
    const [[doc]] = await pool.query('SELECT * FROM documents WHERE id=?', [req.params.id]);
    sendResponse(res, true, 'Dokumen diperbarui', doc);
  } catch(e) { next(e); }
});

module.exports.documentsRouter = documentsRouter;

// ============================================================
// NOTIFICATIONS ROUTES
// ============================================================
const notifRouter = express.Router();

notifRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

notifRouter.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read=TRUE WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    sendResponse(res, true, 'OK');
  } catch(e) { next(e); }
});

notifRouter.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read=TRUE WHERE user_id=?', [req.user.id]);
    sendResponse(res, true, 'Semua notifikasi dibaca');
  } catch(e) { next(e); }
});

module.exports.notifRouter = notifRouter;

// ============================================================
// TAX REPORTS ROUTES
// ============================================================
const taxRouter = express.Router();

taxRouter.get('/', authenticate, authorize('finance','general_manager','super_admin'), async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT tr.*,u.full_name as submitted_by_name FROM tax_reports tr LEFT JOIN users u ON tr.submitted_by=u.id ORDER BY created_at DESC`);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

taxRouter.post('/calculate', authenticate, authorize('finance','general_manager','super_admin'), async (req, res, next) => {
  try {
    const { period_start, period_end, period_name } = req.body;
    const [[inc]] = await pool.query(`SELECT COALESCE(SUM(grand_total),0) as total,COALESCE(SUM(tax_amount),0) as tax FROM invoices WHERE status='paid' AND paid_date BETWEEN ? AND ?`, [period_start, period_end]);
    const [[exp]] = await pool.query(`SELECT COALESCE(SUM(amount),0) as total,COALESCE(SUM(tax_amount),0) as tax FROM finance_transactions WHERE type='expense' AND status='approved' AND transaction_date BETWEEN ? AND ?`, [period_start, period_end]);
    const net_tax = parseFloat(inc.tax) - parseFloat(exp.tax);
    const [r] = await pool.query(`INSERT INTO tax_reports (period_start,period_end,period_name,total_income,total_tax_collected,total_expense,total_tax_paid,net_tax) VALUES (?,?,?,?,?,?,?,?)`,
      [period_start, period_end, period_name||`${period_start} s/d ${period_end}`, inc.total, inc.tax, exp.total, exp.tax, net_tax]);
    const [[rep]] = await pool.query('SELECT * FROM tax_reports WHERE id=?', [r.insertId]);
    sendResponse(res, true, 'Laporan pajak dihitung', rep, 201);
  } catch(e) { next(e); }
});

taxRouter.put('/:id/submit', authenticate, authorize('finance','general_manager','super_admin'), async (req, res, next) => {
  try {
    await pool.query('UPDATE tax_reports SET status="submitted",submitted_by=?,submitted_at=NOW() WHERE id=?', [req.user.id, req.params.id]);
    sendResponse(res, true, 'Laporan pajak disubmit');
  } catch(e) { next(e); }
});

module.exports.taxRouter = taxRouter;

// ============================================================
// DISCOUNT EVENTS
// ============================================================
const discountRouter = express.Router();

discountRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM discount_events WHERE is_active=TRUE ORDER BY created_at DESC');
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

discountRouter.post('/', authenticate, authorize('super_admin','general_manager','sales_manager','finance'), async (req, res, next) => {
  try {
    const { name, code, discount_type, discount_value, min_purchase, start_date, end_date, max_usage } = req.body;
    const [r] = await pool.query(`INSERT INTO discount_events (name,code,discount_type,discount_value,min_purchase,start_date,end_date,max_usage,created_by) VALUES (?,?,?,?,?,?,?,?,?)`,
      [name,code||null,discount_type||'percent',discount_value,min_purchase||0,start_date||null,end_date||null,max_usage||null,req.user.id]);
    const [[disc]] = await pool.query('SELECT * FROM discount_events WHERE id=?', [r.insertId]);
    sendResponse(res, true, 'Event diskon dibuat', disc, 201);
  } catch(e) { next(e); }
});

module.exports.discountRouter = discountRouter;

// ============================================================
// KNOWLEDGE BASE
// ============================================================
const kbRouter = express.Router();

kbRouter.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let q = 'SELECT * FROM knowledge_base WHERE is_published=TRUE';
    const p = [];
    if (search) { q += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)'; p.push(...Array(3).fill(`%${search}%`)); }
    if (category) { q += ' AND category=?'; p.push(category); }
    q += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(q, p);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

kbRouter.post('/', authenticate, authorize('super_admin','general_manager'), async (req, res, next) => {
  try {
    const { category, title, content, tags } = req.body;
    const [r] = await pool.query(`INSERT INTO knowledge_base (category,title,content,tags,created_by) VALUES (?,?,?,?,?)`, [category||null, title, content, tags||null, req.user.id]);
    const [[kb]] = await pool.query('SELECT * FROM knowledge_base WHERE id=?', [r.insertId]);
    sendResponse(res, true, 'Artikel ditambahkan', kb, 201);
  } catch(e) { next(e); }
});

module.exports.kbRouter = kbRouter;

// ============================================================
// EXCHANGE RATE (dummy/public API)
// ============================================================
const exchangeRouter = express.Router();

exchangeRouter.get('/', async (req, res, next) => {
  try {
    // Return dummy rates - in production fetch from real API
    const rates = {
      USD_IDR: 15750,
      EUR_IDR: 17200,
      SGD_IDR: 11800,
      CNY_IDR: 2200,
      JPY_IDR: 108,
      updated_at: new Date().toISOString()
    };
    sendResponse(res, true, 'OK', rates);
  } catch(e) { next(e); }
});

module.exports.exchangeRouter = exchangeRouter;

// ============================================================
// SHIPMENTS
// ============================================================
const shipmentsRouter = express.Router();

shipmentsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { page=1, limit=20, status, type, search } = req.query;
    let q = `SELECT s.*,c.name as customer_name,i.invoice_number FROM shipments s LEFT JOIN customers c ON s.customer_id=c.id LEFT JOIN invoices i ON s.invoice_id=i.id WHERE 1=1`;
    const p = [];
    if (status) { q += ' AND s.status=?'; p.push(status); }
    if (type) { q += ' AND s.type=?'; p.push(type); }
    if (search) { q += ' AND (s.tracking_id LIKE ? OR c.name LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
    q += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    p.push(parseInt(limit), (page-1)*limit);
    const [rows] = await pool.query(q, p);
    sendResponse(res, true, 'OK', rows);
  } catch(e) { next(e); }
});

shipmentsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const tid = `SHIP-${Date.now()}`;
    const { customer_id, invoice_id, type, status, origin, destination, carrier, estimated_arrival, weight_kg, volume_cbm, container_number, bl_number, hs_code, notes } = req.body;
    const [r] = await pool.query(`INSERT INTO shipments (tracking_id,customer_id,invoice_id,type,status,origin,destination,carrier,estimated_arrival,weight_kg,volume_cbm,container_number,bl_number,hs_code,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [tid,customer_id||null,invoice_id||null,type||'export',status||'pending',origin||null,destination||null,carrier||null,estimated_arrival||null,weight_kg||null,volume_cbm||null,container_number||null,bl_number||null,hs_code||null,notes||null,req.user.id]);
    const [[ship]] = await pool.query('SELECT * FROM shipments WHERE id=?', [r.insertId]);
    sendResponse(res, true, 'Shipment dibuat', ship, 201);
  } catch(e) { next(e); }
});

shipmentsRouter.put('/:id', authenticate, async (req, res, next) => {
  try {
    const fields = [], p = [];
    ['status','origin','destination','carrier','estimated_arrival','actual_arrival','weight_kg','volume_cbm','container_number','bl_number','hs_code','customs_status','notes'].forEach(f => {
      if (req.body[f] !== undefined) { fields.push(`${f}=?`); p.push(req.body[f]); }
    });
    p.push(req.params.id);
    await pool.query(`UPDATE shipments SET ${fields.join(',')},updated_at=NOW() WHERE id=?`, p);
    const [[ship]] = await pool.query('SELECT * FROM shipments WHERE id=?', [req.params.id]);
    sendResponse(res, true, 'Shipment diperbarui', ship);
  } catch(e) { next(e); }
});

module.exports.shipmentsRouter = shipmentsRouter;
