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
import { navigationRef } from './navigationService';

// ─── Constants ──────────────────────────────────────────────────────────────

const BASE_API_URL = API_BASE_URL;

/** Number of seconds before expiry at which a silent refresh is triggered for user tokens (7 days). */
const REFRESH_THRESHOLD_SECONDS = 7 * 24 * 60 * 60;

/** Number of seconds before expiry at which a silent refresh is triggered for caregiver tokens (1 day). */
const CAREGIVER_REFRESH_THRESHOLD_SECONDS = 24 * 60 * 60;

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

            // Identify token type from its claims.
            const payload_any = payload as Record<string, unknown>;
            const isUserToken =
                payload?.sub !== undefined && payload_any['firstname'] !== undefined;
            const isCaregiverToken =
                payload?.sub !== undefined &&
                payload_any['email'] !== undefined &&
                payload_any['firstname'] === undefined;

            // Silently refresh user tokens when < 7 days remain.
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

            // Silently refresh caregiver tokens when < 10 minutes remain.
            if (
                isCaregiverToken &&
                payload?.exp !== undefined &&
                payload.exp - now < CAREGIVER_REFRESH_THRESHOLD_SECONDS
            ) {
                try {
                    const refreshResponse = await axios.post(
                        `${BASE_API_URL}/api/auth/refresh`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const newToken: string = refreshResponse.data.access_token;
                    await saveToken(newToken);
                    token = newToken;
                } catch {
                    // Refresh failed — let the request proceed; the 401 handler
                    // will clear the token and redirect to login.
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

// Handle responses globally — clear token on 401 Unauthorized and redirect to login.
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Determine token type from the failed request's Authorization header
            // so we can redirect to the appropriate screen.
            const authHeader: string | undefined = error.config?.headers?.Authorization;
            let isCaregiver = false;
            if (authHeader) {
                const expiredToken = (authHeader as string).replace('Bearer ', '');
                const expiredPayload = decodeJwtPayload(expiredToken) as Record<string, unknown> | null;
                isCaregiver =
                    expiredPayload?.['sub'] !== undefined &&
                    expiredPayload?.['email'] !== undefined &&
                    expiredPayload?.['firstname'] === undefined;
            }

            await deleteToken();

            // Navigate to the appropriate authentication screen.
            if (navigationRef.current?.isReady()) {
                navigationRef.current.navigate(isCaregiver ? 'Login' : 'Welcome');
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
