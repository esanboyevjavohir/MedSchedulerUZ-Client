import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// ===========================
// AXIOS INSTANCE
// ===========================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE_URL}/Api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — token qo'shish
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — 401 da refresh token
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const userId = localStorage.getItem('userId');
      const refreshToken = localStorage.getItem('refreshToken');

      if (userId && refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/Api/User/refresh-token`, {
            id: userId,
            refreshToken,
          });

          if (res.data?.succedded) {
            const { accessToken, refreshToken: newRefresh } = res.data.result;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefresh);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch {
          // refresh ham ishlamadi — login ga yo'naltir
        }
      }

      localStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;