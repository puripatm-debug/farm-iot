import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token from localStorage OR cookie
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // ✅ แก้จาก /auth/login
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// ─── Farm API ────────────────────────────────────────────
export const farmAPI = {
  getFarms: () => api.get('/farms'),                          // ✅ แก้จาก /farm
  getFarmById: (id) => api.get(`/farms/${id}`),
  createFarm: (farmData) => api.post('/farms', farmData),
  updateFarm: (id, farmData) => api.put(`/farms/${id}`, farmData),
  deleteFarm: (id) => api.delete(`/farms/${id}`),
  getCategories: () => api.get('/farms/categories'),          // ✅ แก้จาก /farm/categories/list
};

// ─── IoT API ─────────────────────────────────────────────
export const iotAPI = {
  getDevices: (farmId) => api.get(`/iot/farms/${farmId}/devices`),
  getSensorData: (deviceUuid, limit = 100) =>
    api.get(`/iot/devices/${deviceUuid}/sensor-data?limit=${limit}`),
  sendCommand: (deviceUuid, command) =>
    api.post(`/iot/devices/${deviceUuid}/command`, command),
  getSensorTypes: () => api.get('/iot/sensor-types'),
  getAutoRules: (farmId) => api.get(`/iot/farms/${farmId}/auto-rules`),
};

// ─── Device API ──────────────────────────────────────────
export const deviceAPI = {
  getDevices: () => api.get('/devices'),                      // ✅ แก้จาก /device
  createDevice: (deviceData) => api.post('/devices', deviceData),
  sendCommand: (id, data) => api.post(`/devices/${id}/command`, data),
  getSensorData: (id) => api.get(`/devices/${id}/sensor-data`),
};

export default api;
