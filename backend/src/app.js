const express = require('express');
const { v1Router } = require('./routes/v1');
const { authenticateStaff } = require('./middlewares/auth');
const { customerPortalRouter, customerPortalAdminRouter } = require('./routes/customerPortal');

const {
  authRouter, usersRouter, customersRouter, invoicesRouter,
  paymentsRouter, commissionsRouter, financeRouter, analyticsRouter,
  dashboardRouter, productsRouter, documentsRouter, notifRouter,
  taxRouter, discountRouter, kbRouter, exchangeRouter, shipmentsRouter
} = require('./routes/index');

const app = express();

// Health check
app.get('/health', (_, res) => res.json({ ok: true, service: 'PT Abnan Inti Trans API', time: new Date().toISOString() }));

// API Routes (tanpa middleware global, karena akan ditambahkan di server.js)
app.use('/api/auth', authRouter);
app.use('/api/customer-portal', customerPortalRouter);
app.use('/api/customer-portal-admin', customerPortalAdminRouter);
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
app.use('/api/knowledge-base', kbRouter);
app.use('/api/exchange-rates', exchangeRouter);
app.use('/api/shipments', authenticateStaff, shipmentsRouter);
app.use('/api/v1', authenticateStaff, v1Router);

// Error handler (fallback)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;