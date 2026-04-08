/**
 * ============================================================
 * ABNAN CRM — Frontend API Service (FIXED)
 * ============================================================
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Axios Instances ───────────────────────────────────────────
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const publicApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
});

// ── Request Interceptor (Tambahkan Token) ─────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('abnan_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`✅ [API] ${config.method?.toUpperCase()} ${config.url} - Token attached`);
    } else {
      console.log(`⚠️ [API] ${config.method?.toUpperCase()} ${config.url} - No token`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor (Handle 401) ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('🔐 [API] 401 Unauthorized - Redirecting to login');
      localStorage.removeItem('abnan_token');
      localStorage.removeItem('abnan_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

// ── Helper: Retry untuk network error ─────────────────────────
async function withRetry(fn, retries = 2, delay = 500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isNetworkErr = !err.response && err.code !== 'ERR_CANCELED';
      if (attempt < retries && isNetworkErr) {
        await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
      } else {
        throw err;
      }
    }
  }
}

// ── API Modules ───────────────────────────────────────────────

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const customerPortalAPI = {
  getOverview: () => api.get('/customer-portal/overview'),
};

export const customerSetupAPI = {
  getSetupInfo: (token) => publicApi.get(`/customer-portal/setup/${token}`),
  completeSetup: (token, data) => publicApi.post(`/customer-portal/setup/${token}`, data),
};

export const portalAccessAPI = {
  getByCustomerId: (cid) => api.get(`/customer-portal-admin/customers/${cid}/access`),
  upsert: (cid, data) => api.put(`/customer-portal-admin/customers/${cid}/access`, data),
  createSetupLink: (cid, data) => api.post(`/customer-portal-admin/customers/${cid}/setup-link`, data),
};

export const usersAPI = {
  getAll: (params) => withRetry(() => api.get('/users', { params })),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, d) => api.put(`/users/${id}`, d),
  delete: (id) => api.delete(`/users/${id}`),
  profile: () => api.get('/users/me/profile'),
  updateProfile: (data) => api.put('/users/me/profile', data),
};

export const customersAPI = {
  getAll: (params) => withRetry(() => api.get('/customers', { params })),
  getById: (id) => api.get(`/customers/${id}`),
  getOverview: (id) => api.get(`/v1/customers/${id}/overview`),
  create: (data) => api.post('/customers', data),
  update: (id, d) => api.put(`/customers/${id}`, d),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const invoicesAPI = {
  getAll: (params) => withRetry(() => api.get('/invoices', { params })),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, d) => api.put(`/invoices/${id}`, d),
  delete: (id) => api.delete(`/invoices/${id}`),
  getStats: () => withRetry(() => api.get('/invoices/stats')),
};

export const paymentsAPI = {
  getAll: (params) => withRetry(() => api.get('/payments', { params })),
  create: (data) => api.post('/payments', data),
  verify: (id, d) => api.put(`/payments/${id}/verify`, d),
  createMidtrans: (data) => api.post('/payments/midtrans/create', data),
};

export const commissionsAPI = {
  getAll: (params) => withRetry(() => api.get('/commissions', { params })),
  request: (data) => api.post('/commissions/request', data),
  approveSM: (id) => api.put(`/commissions/${id}/approve-sm`),
  approve: (id) => api.put(`/commissions/${id}/approve`),
  pay: (id) => api.put(`/commissions/${id}/pay`),
  summary: (sid) => api.get(`/commissions/summary/${sid}`),
};

export const financeAPI = {
  getTransactions: (params) => withRetry(() => api.get('/finance/transactions', { params })),
  createTransaction: (data) => api.post('/finance/transactions', data),
  getSummary: (params) => withRetry(() => api.get('/finance/summary', { params })),
  getPaymentRequests: (params) => withRetry(() => api.get('/finance/payment-requests', { params })),
  createPaymentRequest: (data) => api.post('/finance/payment-requests', data),
  reviewSM: (id, d) => api.put(`/finance/payment-requests/${id}/review-sm`, d),
  reviewFinance: (id, d) => api.put(`/finance/payment-requests/${id}/review-finance`, d),
};

export const analyticsAPI = {
  salesMonthly: () => withRetry(() => api.get('/analytics/sales-monthly')),
  salesByRep: () => withRetry(() => api.get('/analytics/sales-by-rep')),
};

export const pipelineAPI = {
  getStages: () => withRetry(() => api.get('/v1/pipeline/stages')),
  getLeads: (params) => withRetry(() => api.get('/v1/pipeline/leads', { params })),
  createLead: (data) => api.post('/v1/pipeline/leads', data),
  convertLead: (id, d) => api.post(`/v1/pipeline/leads/${id}/convert`, d),
  getDeals: (params) => withRetry(() => api.get('/v1/pipeline/deals', { params })),
  createDeal: (data) => api.post('/v1/pipeline/deals', data),
  updateDealStage: (id, d) => api.put(`/v1/pipeline/deals/${id}/stage`, d),
  updateDeal: (id, d) => api.put(`/v1/pipeline/deals/${id}`, d),
};

export const importExportAPI = {
  exportModule: (mod, params = {}) =>
    api.get(`/v1/export/${mod}`, { params, responseType: 'blob' }),
  previewCustomerImport: (formData) =>
    api.post('/v1/import/customers/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  commitCustomerImport: (data) => api.post('/v1/import/customers/commit', data),
};

export const searchAPI = {
  global: (params) => api.get('/v1/search', { params }),
};

export const dashboardAPI = {
  get: () => withRetry(() => api.get('/dashboard')),
};

export const productsAPI = {
  getAll: (params) => withRetry(() => api.get('/products', { params })),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, d) => api.put(`/products/${id}`, d),
  delete: (id) => api.delete(`/products/${id}`),
};

export const documentsAPI = {
  getAll: (params) => withRetry(() => api.get('/documents', { params })),
  getById: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, d) => api.put(`/documents/${id}`, d),
  delete: (id) => api.delete(`/documents/${id}`),
};

export const shipmentsAPI = {
  getAll: (params) => withRetry(() => api.get('/shipments', { params })),
  getById: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post('/shipments', data),
  update: (id, d) => api.put(`/shipments/${id}`, d),
};

export const notifAPI = {
  getAll: () => withRetry(() => api.get('/notifications')),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const taxAPI = {
  getAll: () => withRetry(() => api.get('/tax-reports')),
  calculate: (data) => api.post('/tax-reports/calculate', data),
  submit: (id) => api.put(`/tax-reports/${id}/submit`),
};

export const discountAPI = {
  getAll: () => withRetry(() => api.get('/discount-events')),
  create: (data) => api.post('/discount-events', data),
};

export const kbAPI = {
  getAll: (params) => withRetry(() => api.get('/knowledge-base', { params })),
  getById: (id) => api.get(`/knowledge-base/${id}`),
  create: (data) => api.post('/knowledge-base', data),
  update: (id, d) => api.put(`/knowledge-base/${id}`, d),
  delete: (id) => api.delete(`/knowledge-base/${id}`),
};

export const exchangeAPI = {
  getRates: () => withRetry(() => api.get('/exchange-rates')),
};

export function cancelAllPendingRequests() {
  // optional cleanup
}

export default api;