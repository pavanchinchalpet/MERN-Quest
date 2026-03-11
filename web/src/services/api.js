import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This is crucial for sending and receiving HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If we receive a 401 Unauthorized, it might mean the token expired or user is not logged in.
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized API call, redirecting to login or handling token expiry.");
      // Optional: you can automatically trigger a logout or event here
    }
    return Promise.reject(error);
  }
);

export default api;
