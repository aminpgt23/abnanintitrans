/**
 * ============================================================
 * ABNAN CRM — Express Server Entry Point (FIXED)
 * ============================================================
 */

'use strict';

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const path       = require('path');

const {
  createPool,
  applyPerformanceMiddleware,
  healthCheckRoute,
  respond,
} = require('./utils/performance');

const { authenticate } = require('./middlewares/auth');

// ── Init ──────────────────────────────────────────────────────
const app  = express();
const PORT = parseInt(process.env.PORT || '5000');

// ── DB Pool ───────────────────────────────────────────────────
createPool();
console.log('[DB] Connection pool initialized');

// ── Core Middleware ───────────────────────────────────────────
app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, cb) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
      .split(',').map(s => s.trim());
    if (!origin || allowed.includes(origin) || allowed.includes('*')) {
      cb(null, true);
    } else {
      cb(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Request-Id'],
  exposedHeaders: ['X-Cache','X-Request-Id'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

applyPerformanceMiddleware(app);

// ── Health Check ──────────────────────────────────────────────
const rootRouter = express.Router();
healthCheckRoute(rootRouter);
app.use('/', rootRouter);

// ── Middleware: authenticateStaff ─────────────────────────────
// Hanya mengizinkan akun staff (bukan customer)
async function authenticateStaff(req, res, next) {
  await authenticate(req, res, (err) => {
    if (err) return next(err);
    if (req.user && req.user.account_type === 'customer') {
      return respond.forbidden(res, 'Akses hanya untuk staff internal');
    }
    next();
  });
}

// ── Import semua router dari file yang benar ───────────────────
const {
  authRouter,
  usersRouter,
  customersRouter,
  invoicesRouter,
  paymentsRouter,
  commissionsRouter,
  financeRouter,
  analyticsRouter,
  dashboardRouter,
  productsRouter,
  documentsRouter,
  notifRouter,
  taxRouter,
  discountRouter,
  kbRouter,
  exchangeRouter,
  shipmentsRouter,
} = require('./routes/index');

const { customerPortalRouter, customerPortalAdminRouter } = require('./routes/customerPortal');
const { v1Router } = require('./routes/v1');

// ── Pasang endpoint API ───────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/customer-portal', customerPortalRouter);
app.use('/api/customer-portal-admin', customerPortalAdminRouter);

// Endpoint staff (wajib login + staff only)
app.use('/api/users', authenticateStaff, usersRouter);
app.use('/api/customers', authenticateStaff, customersRouter);
app.use('/api/invoices', authenticateStaff, invoicesRouter);
app.use('/api/payments', authenticateStaff, paymentsRouter);
app.use('/api/commissions', authenticateStaff, commissionsRouter);
app.use('/api/finance', authenticateStaff, financeRouter);
app.use('/api/analytics', authenticateStaff, analyticsRouter);
app.use('/api/dashboard', authenticateStaff, dashboardRouter);
app.use('/api/products', authenticateStaff, productsRouter);
app.use('/api/documents', authenticateStaff, documentsRouter);
app.use('/api/notifications', authenticateStaff, notifRouter);
app.use('/api/tax-reports', authenticateStaff, taxRouter);
app.use('/api/discount-events', authenticateStaff, discountRouter);
app.use('/api/knowledge-base', kbRouter);               // publik (tanpa auth)
app.use('/api/exchange-rates', exchangeRouter);         // publik
app.use('/api/shipments', authenticateStaff, shipmentsRouter);
app.use('/api/v1', authenticateStaff, v1Router);        // customer360, pipeline, search, import/export

// ── Serve React Build (Production) ───────────────────────────
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../build');
  app.use(express.static(buildPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
  }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  respond.notFound(res, `Route ${req.method} ${req.path} tidak ditemukan`);
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  if (err.name === 'UnauthorizedError') {
    return respond.unauth(res, 'Token tidak valid atau kadaluarsa');
  }
  if (err.name === 'ValidationError') {
    return respond.badReq(res, err.message);
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return respond.conflict(res, 'Data sudah ada (duplikat)');
  }
  respond.error(res, err, 'Terjadi kesalahan server');
});

// ── Start Server ──────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║  ABNAN CRM — Backend Server          ║
  ║  Port  : ${PORT}                         ║
  ║  Env   : ${(process.env.NODE_ENV || 'development').padEnd(12)}            ║
  ╚══════════════════════════════════════╝
  `);
});

// ── Graceful Shutdown ─────────────────────────────────────────
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT',  gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed');
    const { getPool } = require('./utils/performance');
    try {
      getPool().end();
      console.log('[DB] Pool closed');
    } catch {}
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Server] Forced exit');
    process.exit(1);
  }, 10000);
}

module.exports = app;