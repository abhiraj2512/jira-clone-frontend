import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
});

// Request interceptor to attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Core error handler for Axios responses.
 * Exported for modularity, testability, and deterministic unit verification.
 */
export function handleAxiosResponseError(
  error: any,
  currentPath: string = typeof window !== 'undefined' ? window.location.pathname : '/',
  redirectFn: (url: string) => void = (url: string) => {
    if (typeof window !== 'undefined') window.location.href = url;
  },
  storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any)
) {
  // 1. Separate Network Errors from Authentication/HTTP Errors
  if (!error.response) {
    console.error('[Axios Network Error] Network connectivity failure or server unreachable:', error?.message);
    return Promise.reject(error);
  }

  // 2. Handle 401 Unauthorized (Expired or Invalid Session)
  if (error.response.status === 401) {
    if (typeof storage?.removeItem === 'function') {
      storage.removeItem('token');
      storage.removeItem('accessToken');
    }

    const requestUrl = error.config?.url || '';
    const isLoginEndpoint = requestUrl.includes('/auth/login');

    // Prevent redirect loops: only redirect when not already on login page ('/')
    // and not responding to a bad credential attempt on the login endpoint itself.
    if (currentPath !== '/' && !isLoginEndpoint) {
      redirectFn('/');
    }
  }

  return Promise.reject(error);
}

// Response interceptor to handle expired sessions and network errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => handleAxiosResponseError(error)
);

export default axiosInstance;
