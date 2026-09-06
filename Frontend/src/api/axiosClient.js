import axios from 'axios';
import useAuthStore from '../store/authStore';

const axiosClient = axios.create({
  baseURL: '/api',           // Same-origin qua Vite Proxy (dev) hoặc wwwroot (prod)
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true       // BẮT BUỘC: Gửi HttpOnly cookie trong mọi request
});

// REQUEST Interceptor — Attach token từ Zustand store (fallback khi cookie chưa set)
axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// RESPONSE Interceptor — Unwrap Response<T> + Auto-logout khi 401
axiosClient.interceptors.response.use(
  (response) => response.data,  // Tự động unwrap: const res = await api.getAll() -> { success, data, message }
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        window.location.href = '/auth';
      }
    }
    const message = error.response?.data?.message || error.response?.data?.detail || 'Có lỗi xảy ra';
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
