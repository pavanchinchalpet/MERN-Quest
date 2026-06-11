import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

if (!process.env.REACT_APP_API_URL && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  console.warn('REACT_APP_API_URL is not set. API calls may fail if the backend is not on localhost.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let refreshRequest = null;

const refreshSession = async () => {
  if (!refreshRequest) {
    refreshRequest = api
      .post('/auth/refresh')
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

const responseCache = new Map();

const getCacheKey = (url, config = {}) => {
  const params = config?.params ? JSON.stringify(config.params) : '';
  return `${url}?${params}`;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const requestUrl = originalRequest?.url || '';
    const shouldSkipRefresh = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/refresh');

    if (error?.response?.status === 401 && originalRequest && !originalRequest._retry && !shouldSkipRefresh) {
      originalRequest._retry = true;

      try {
        await refreshSession();
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const unwrapResponse = (response) => {
  const payload = response?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

export const getErrorMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.message || fallback;

export const clearApiCache = (matcher) => {
  if (!matcher) {
    responseCache.clear();
    return;
  }

  Array.from(responseCache.keys()).forEach((key) => {
    if (typeof matcher === 'string' ? key.includes(matcher) : matcher(key)) {
      responseCache.delete(key);
    }
  });
};

export const fetchCached = async (url, config = {}, options = {}) => {
  const cacheKey = getCacheKey(url, config);
  const now = Date.now();
  const ttl = options.ttl ?? 30_000;
  const cachedEntry = responseCache.get(cacheKey);

  if (!options.force && cachedEntry && now - cachedEntry.timestamp < ttl) {
    return cachedEntry.data;
  }

  const response = await api.get(url, config);
  const data = unwrapResponse(response);
  responseCache.set(cacheKey, {
    data,
    timestamp: now,
  });
  return data;
};

export default api;
