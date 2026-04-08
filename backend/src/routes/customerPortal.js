const express = require('express');
const { authenticate, customerOnly, staffOnly } = require('../middlewares/auth');
const { sendResponse } = require('../utils/response');
const Customer360Service = require('../services/customer360Service');
const CustomerAccountsModel = require('../models/customerAccountsModel');
const CustomersModel = require('../models/customersModel');

const customerPortalRouter = express.Router();
const customerPortalAdminRouter = express.Router();

// Setup endpoint (tanpa auth)
customerPortalRouter.get('/setup/:token', async (req, res, next) => {
  try {
    const setup = await CustomerAccountsModel.getValidSetupByToken(req.params.token);
    if (!setup) {
      return sendResponse(res, false, 'Link setup password tidak valid atau sudah kedaluwarsa', null, 404);
    }
    sendResponse(res, true, 'OK', {
      email: setup.email,
      full_name: setup.full_name,
      customer_name: setup.customer_name,
      company_name: setup.company_name,
      expires_at: setup.expires_at,
    });
  } catch (error) {
    next(error);
  }
});

customerPortalRouter.post('/setup/:token', async (req, res, next) => {
  try {
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirm_password || '');
    if (!password || password.length < 8) {
      return sendResponse(res, false, 'Password minimal 8 karakter', null, 400);
    }
    if (password !== confirmPassword) {
      return sendResponse(res, false, 'Konfirmasi password tidak cocok', null, 400);
    }
    const account = await CustomerAccountsModel.completeSetup(req.params.token, password);
    sendResponse(res, true, 'Password berhasil dibuat. Silakan login.', account);
  } catch (error) {
    next(error);
  }
});

// Customer overview — harus login dan akun customer
customerPortalRouter.get('/overview', authenticate, customerOnly, async (req, res, next) => {
  try {
    const overview = await Customer360Service.getOverview(Number(req.user.customer_id), req.user);
    sendResponse(res, true, 'OK', overview);
  } catch (error) {
    next(error);
  }
});

// Admin endpoints untuk kelola akses customer (staff only)
customerPortalAdminRouter.get('/customers/:customerId/access', authenticate, staffOnly, async (req, res, next) => {
  try {
    const customerId = Number(req.params.customerId);
    const customer = await CustomersModel.getById(customerId);
    if (!customer) {
      return sendResponse(res, false, 'Customer tidak ditemukan', null, 404);
    }
    if (req.user.role === 'sales' && Number(customer.assigned_sales_id) !== Number(req.user.id)) {
      return sendResponse(res, false, 'Akses ditolak', null, 403);
    }
    const account = await CustomerAccountsModel.getByCustomerId(customerId);
    const setup = account ? await CustomerAccountsModel.getLatestSetupByAccountId(account.id) : null;
    sendResponse(res, true, 'OK', {
      customer: {
        id: customer.id,
        name: customer.name,
        company_name: customer.company_name,
        email: customer.email,
        phone: customer.phone,
      },
      account,
      setup,
    });
  } catch (error) {
    next(error);
  }
});

customerPortalAdminRouter.put('/customers/:customerId/access', authenticate, staffOnly, async (req, res, next) => {
  try {
    const customerId = Number(req.params.customerId);
    const customer = await CustomersModel.getById(customerId);
    if (!customer) {
      return sendResponse(res, false, 'Customer tidak ditemukan', null, 404);
    }
    if (req.user.role === 'sales' && Number(customer.assigned_sales_id) !== Number(req.user.id)) {
      return sendResponse(res, false, 'Akses ditolak', null, 403);
    }
    const account = await CustomerAccountsModel.upsert(customerId, {
      email: req.body.email || customer.email,
      password: req.body.password,
      full_name: req.body.full_name || customer.name,
      phone: req.body.phone || customer.phone || customer.whatsapp,
      is_active: req.body.is_active,
    });
    sendResponse(res, true, 'Akses customer diperbarui', account);
  } catch (error) {
    next(error);
  }
});

customerPortalAdminRouter.post('/customers/:customerId/setup-link', authenticate, staffOnly, async (req, res, next) => {
  try {
    const customerId = Number(req.params.customerId);
    const customer = await CustomersModel.getById(customerId);
    if (!customer) {
      return sendResponse(res, false, 'Customer tidak ditemukan', null, 404);
    }
    if (req.user.role === 'sales' && Number(customer.assigned_sales_id) !== Number(req.user.id)) {
      return sendResponse(res, false, 'Akses ditolak', null, 403);
    }
    const invite = await CustomerAccountsModel.issueSetupLink(customerId, {
      email: req.body.email || customer.email,
      full_name: req.body.full_name || customer.name,
      phone: req.body.phone || customer.phone || customer.whatsapp,
    }, req.user.id);
    sendResponse(res, true, 'Link setup customer berhasil dibuat', invite);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  customerPortalRouter,
  customerPortalAdminRouter,
};