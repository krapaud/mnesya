/**
 * Axios client configured to attach the JWT token to every request.
 * Includes a request interceptor that silently refreshes the user token when
 * it is about to expire (< 7 days remaining), and a response interceptor to
 * handle 401 errors globally.
 *
 * @module api
 */
import axios from 'axios';
import { getToken, saveToken, deleteToken } from './tokenService';
import { API_BASE_URL } from '../config/api';

// ─── Constants ──────────────────────────────────────────────────────────────

const BASE_API_URL = API_BASE_URL;

/** Number of seconds before expiry at which a silent refresh is triggered (7 days). */
const REFRESH_THRESHOLD_SECONDS = 7 * 24 * 60 * 60;

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Decode a JWT payload without a library.
 * Handles base64url encoding (no padding, `-` and `_` instead of `+` and `/`).
 */
function decodeJwtPayload(token: string): { exp?: number; sub?: string } | null {
    try {
        const b64 = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
    } catch {
        return null;
    }
}

// ─── Client ───────────────────────────────────────────────────────────────────

const apiClient = axios.create({
    baseURL: BASE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
});

// ─── Interceptors ───────────────────────────────────────────────────────────────

// Attach the JWT token to every outgoing request.
// If the token expires in < 7 days, silently refresh it first (user side only).
apiClient.interceptors.request.use(
    async (config) => {
        let token = await getToken();

        if (token) {
            const payload = decodeJwtPayload(token);
            const now = Math.floor(Date.now() / 1000);

            // Only refresh user tokens (they carry `firstname` / `lastname`).
            // Caregiver tokens (60-min) should NOT be refreshed here.
            const isUserToken =
                payload?.sub !== undefined &&
                (payload as Record<string, unknown>)['firstname'] !== undefined;

            if (
                isUserToken &&
                payload?.exp !== undefined &&
                payload.exp - now < REFRESH_THRESHOLD_SECONDS
            ) {
                try {
                    // Use a standalone axios instance to avoid circular dependency
                    // (apiClient → interceptor → apiClient would cause an infinite loop).
                    const refreshResponse = await axios.post(
                        `${BASE_API_URL}/api/pairing/refresh`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const newToken: string = refreshResponse.data.access_token;
                    await saveToken(newToken);
                    token = newToken;
                } catch {
                    // Refresh failed (token already expired or server error).
                    // Let the request proceed with the old token — the 401 handler
                    // will clear it and redirect the user to re-pair.
                }
            }

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
