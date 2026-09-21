import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import useAuthStore from '../store/authStore';

// Cấu hình Server URL mặc định cho Mobile Native (IP LAN máy chủ)
export const DEFAULT_LAN_SERVER_URL = 'http://192.168.88.233:5199';

/**
 * Lấy Base URL của Server Backend (không kèm /api)
 */
export function getServerUrl() {
  if (typeof window === 'undefined') return '';
  const saved = localStorage.getItem('vbace_server_url');
  if (saved && saved.trim()) {
    return saved.trim().replace(/\/+$/, '');
  }

  // Nếu đang chạy trên Native App (Android / iOS)
  if (Capacitor.isNativePlatform()) {
    return (import.meta.env.VITE_API_BASE_URL || DEFAULT_LAN_SERVER_URL).replace(/\/+$/, '');
  }

  // Trên Web: ưu tiên env nếu có, hoặc để rỗng (dùng same-origin / proxy)
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
}

/**
 * Lấy API Base URL đầy đủ (kèm /api)
 */
export function getApiBaseUrl() {
  const server = getServerUrl();
  return server ? `${server}/api` : '/api';
}

/**
 * Lưu Server URL mới và áp dụng ngay
 */
export function setServerUrl(url) {
  if (!url || !url.trim()) {
    localStorage.removeItem('vbace_server_url');
  } else {
    localStorage.setItem('vbace_server_url', url.trim().replace(/\/+$/, ''));
  }
  axiosClient.defaults.baseURL = getApiBaseUrl();
}

/**
 * Chuyển đổi đường dẫn media tương đối (/audios/..., /uploads/...) thành URL tuyệt đối có thể phát trên Mobile
 */
export function resolveMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const server = getServerUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return server ? `${server}${cleanPath}` : cleanPath;
}

const axiosClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // Gửi cookie khi chạy cùng origin hoặc hỗ trợ cross-origin credentials
});

// REQUEST Interceptor — Tự động cập nhật baseURL và gắn Token Bearer
axiosClient.interceptors.request.use((config) => {
  // Cập nhật baseURL động theo cấu hình hiện tại
  config.baseURL = getApiBaseUrl();

  // Đọc token từ Zustand store hoặc localStorage fallback
  const token = useAuthStore.getState().token || localStorage.getItem('vbace_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE Interceptor — Unwrap Response<T> + Auto-logout khi 401
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        window.location.href = '/auth';
      }
    }
    const message = error.response?.data?.message || error.response?.data?.detail || error.message || 'Có lỗi xảy ra kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
