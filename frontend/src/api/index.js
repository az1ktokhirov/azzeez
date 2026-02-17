import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const superToken = localStorage.getItem("superToken");

    if (superToken && config.url?.startsWith("/super")) {
      config.headers.Authorization = `Bearer ${superToken}`;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;

// Auth API
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// Super Admin API
export const superAdminAPI = {
  login: (data) => api.post("/super/login", data),
  getStores: () => api.get("/super/stores"),
  createStore: (data) => api.post("/super/stores", data),
  getStoreDetails: (id) => api.get(`/super/stores/${id}`),
  updateStoreStatus: (id, data) =>
    api.patch(`/super/stores/${id}/status`, data),
  sendAnnouncement: (data) => api.post("/super/announce", data),
  getAnalytics: () => api.get("/super/analytics"),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get("/products", { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  restock: (id, data) => api.patch(`/products/${id}/restock`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get("/categories"),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Sales API
export const salesAPI = {
  create: (data) => api.post("/sales", data),
  getAll: (params) => api.get("/sales", { params }),
  getOne: (id) => api.get(`/sales/${id}`),
};

// Reports API
export const reportsAPI = {
  getSummary: (params) => api.get("/reports/summary", { params }),
  getTopProducts: (params) => api.get("/reports/top-products", { params }),
  getByCategory: (params) => api.get("/reports/by-category", { params }),
  getByCashier: (params) => api.get("/reports/by-cashier", { params }),
  getByBranch: (params) => api.get("/reports/by-branch", { params }),
  getChartData: (params) => api.get("/reports/chart", { params }),
  export: (params) =>
    api.get("/reports/export", { params, responseType: "blob" }),
};

// Branches API
export const branchesAPI = {
  getAll: () => api.get("/branches"),
  create: (data) => api.post("/branches", data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
};

// Users API
export const usersAPI = {
  getAll: () => api.get("/users"),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggle: (id) => api.patch(`/users/${id}/toggle`),
  delete: (id) => api.delete(`/users/${id}`),
};
