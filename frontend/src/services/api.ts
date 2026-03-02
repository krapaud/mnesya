/**
 * Axios client configured to attach the JWT token to every request.
 * Includes a response interceptor to handle 401 errors globally.
 *
 * @module api
 */
import axios from 'axios';
import { getToken, deleteToken } from './tokenService';
import { API_BASE_URL } from '../config/api';

const BASE_API_URL = API_BASE_URL;

const apiClient = axios.create({
    baseURL: BASE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
});

// Attach the JWT token to every outgoing request
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

// Handle responses globally — clear token on 401 Unauthorized
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await deleteToken();
        }
        return Promise.reject(error);
    }
);

export default apiClient;
