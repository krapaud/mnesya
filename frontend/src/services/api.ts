/**
 * API client configuration for HTTP requests.
 * 
 * Configures axios with base URL, default headers, and request interceptors
 * to automatically attach JWT authentication tokens to outgoing requests.
 * 
 * @module api
 */
import axios from 'axios';
import { getToken } from './tokenService';

/** Base URL for the backend API */
const BASE_API_URL = 'http://localhost:8000';

/**
 * Configured axios instance for making authenticated API requests.
 * 
 * Includes automatic JWT token attachment via request interceptor.
 */
const apiClient = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

/**
 * Request interceptor to automatically attach JWT token to requests.
 * 
 * Retrieves the stored authentication token and adds it to the
 * Authorization header as a Bearer token for all API requests.
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
