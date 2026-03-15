import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 for non-auth endpoints (expired token)
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/')) {
      Cookies.remove('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData: any) => api.post('/auth/register', userData),
  login: (credentials: any) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

export const farmAPI = {
  getFarms: () => api.get('/farms'),
  getFarmById: (id: string) => api.get(`/farms/${id}`),
  createFarm: (farmData: any) => api.post('/farms', farmData),
  updateFarm: (id: string, farmData: any) => api.put(`/farms/${id}`, farmData),
  deleteFarm: (id: string) => api.delete(`/farms/${id}`),
  toggleStatus: (id: string) => api.patch(`/farms/${id}/status`),
  getCategories: () => api.get('/farms/categories'),
};

export const iotAPI = {
  getDevices: (farmId: string) => api.get(`/iot/farms/${farmId}/devices`),
  getSensorData: (deviceUuid: string, limit = 100) =>
    api.get(`/iot/devices/${deviceUuid}/sensor-data?limit=${limit}`),
  sendCommand: (deviceUuid: string, command: any) =>
    api.post(`/iot/devices/${deviceUuid}/command`, command),
  getSensorTypes: () => api.get('/iot/sensor-types'),
  getAutoRules: (farmId: string) => api.get(`/iot/farms/${farmId}/auto-rules`),
};

export const deviceAPI = {
  getDevices: () => api.get('/devices'),
  createDevice: (deviceData: any) => api.post('/devices', deviceData),
  updateDevice: (id: string, deviceData: any) => api.put(`/devices/${id}`, deviceData),
  deleteDevice: (id: string) => api.delete(`/devices/${id}`),
  sendCommand: (id: string, data: any) => api.post(`/devices/${id}/command`, data),
  getSensorData: (id: string) => api.get(`/devices/${id}/sensor-data`),
};

export default api;
