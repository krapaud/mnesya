/**
 * Axios client configured to attach the JWT token to every request.
 *
 * @module api
 */
import axios from 'axios';
import { getToken } from './tokenService';
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

export default apiClient;
