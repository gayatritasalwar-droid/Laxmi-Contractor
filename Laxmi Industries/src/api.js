// src/api.js
import axios from 'axios';

// ✅ SIMPLE FIX - Sirf yeh line change karni hai
const API_BASE_URL = 'https://laxmi-contractor-backend.vercel.app/api';
export default API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,  // ✅ Yahan API_BASE_URL use karo, API_URL nahi
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('Response from:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;