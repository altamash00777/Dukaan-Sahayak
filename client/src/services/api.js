import axios from 'axios';

const api = axios.create({
  baseURL:'https://dukaan-sahayak-api.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('shop');
      localStorage.removeItem('shopName');
      localStorage.removeItem('userName');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Shop
export const shop = {
  getProfile: () => api.get('/shop/profile'),
  updateProfile: (data) => api.put('/shop/profile', data),
};

// Products
export const products = {
  getAll: (search = '') => api.get('/products', { params: search ? { search } : {} }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Customers
export const customers = {
  getAll: (search = '') => api.get('/customers', { params: search ? { search } : {} }),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  getLedger: (id) => api.get(`/customers/${id}/ledger`),
};

// Invoices
export const invoices = {
  // POST /api/invoices/draft — expects { customerId?, items: [{productId, quantity}], discountAmount?, notes? }
  createDraft: (data) => api.post('/invoices/draft', data),
  // POST /api/invoices/:id/confirm — expects { paymentStatus, paymentMethod, amountPaid?, notes? }
  confirmInvoice: (id, paymentData = {}) => api.post(`/invoices/${id}/confirm`, paymentData),
  getAll: (params = {}) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  
deleteDraft: (id) => api.delete(`/invoices/${id}`),
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),

  getPDFUrl: (id) => `/api/invoices/${id}/pdf`,
};

// Purchases
export const purchases = {
  create: (data) => api.post('/purchases', data),
  getAll: (params = {}) => api.get('/purchases', { params }),
};

// Inventory
export const inventory = {
  getAll: (lowStockOnly = false) => api.get('/inventory', { params: { lowStockOnly } }),
  getAlerts: () => api.get('/inventory/alerts'),
};

// Payments
export const payments = {
  record: (data) => api.post('/payments', data),
};

// Expenses
export const expenses = {
  create: (data) => api.post('/expenses', data),
  getAll: (params = {}) => api.get('/expenses', { params }),
};

// Assistant
export const assistant = {
  sendMessage: (data) => api.post('/assistant/chat', data),
};

// Reports
export const reports = {
  getDaily: (date = '') => api.get('/reports/daily', { params: date ? { date } : {} }),
  getMonthly: (year, month) => api.get('/reports/monthly', { params: { year, month } }),
  getSalesChart: (days = 7) => api.get('/reports/sales-chart', { params: { days } }),
  exportCSV: () => api.get('/reports/export-csv', { responseType: 'blob' }),
};

// WhatsApp
export const whatsapp = {
  // Send from a saved DB invoice
  sendInvoice: (invoiceId, phone) => api.post('/whatsapp/send-bill', { invoiceId, phone }),
  // Send from local bill data (no DB save needed)
  sendBill: (billData, phone) => api.post('/whatsapp/send-bill', { billData: { ...billData, phone }, phone }),
};

export default api;
