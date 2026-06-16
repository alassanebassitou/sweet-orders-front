import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const sessionId = useAuthStore.getState().sessionId;
  if (sessionId) {
    config.headers['X-Session-Id'] = sessionId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const sessionId = useAuthStore.getState().sessionId;
      const path = window.location.pathname;
      const publicPaths = ['/', '/login', '/contact', '/signup', '/login/verify'];
      const isPublicPage = publicPaths.some(p => path === p || path.startsWith(p));

      if (sessionId && !isPublicPage) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (!isPublicPage) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    const message = error?.response?.data?.message 
      || error?.response?.data?.error
      || (typeof error?.response?.data === 'string' ? error.response.data : null) 
      || error?.message 
      || 'Une erreur est survenue';

    if (error?.response?.status !== 401) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
