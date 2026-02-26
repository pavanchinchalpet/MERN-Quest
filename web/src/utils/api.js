import axios from 'axios';

// Simple cache implementation
const cache = new Map();

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 second timeout
});

// Response interceptor to handle errors and cache responses
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses (compute cache key here)
    const { method = 'get', url = '', params } = response.config || {};
    if (method.toLowerCase() === 'get' && url) {
      const cacheKey = `${url}${JSON.stringify(params || {})}`;
      cache.set(cacheKey, { data: response, timestamp: Date.now() });
    }
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // If unauthorized and we haven't retried yet, attempt refresh using HttpOnly cookie
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshClient = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      return refreshClient
        .post('/api/auth/refresh')
        .then(() => api(originalRequest))
        .catch((refreshErr) => {
          // If refresh fails, redirect to login
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        });
    }

    return Promise.reject(error);
  }
);

// Cache management utilities
export const clearCache = () => {
  cache.clear();
};

export const clearCacheForUrl = (urlPattern) => {
  for (const [key] of cache) {
    if (key.includes(urlPattern)) {
      cache.delete(key);
    }
  }
};

export default api;
