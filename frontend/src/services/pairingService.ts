/**
 * Service for pairing users with a caregiver via a code.
 *
 * @module pairingService
 */
import {
    PairingCodeResponse,
    PairingCodeVerifyResponse,
    UserTokenRefreshResponse,
} from '../types/interfaces';
import apiClient from './api';

/** Generates a pairing code for the given user. */
export const generatePairingCode = async (user_id: string): Promise<PairingCodeResponse> => {
    const response = await apiClient.post('/api/pairing/generate', { user_id });
    return response.data;
};

/** Verifies a pairing code and links the user to a caregiver. */
export const verifyPairingCode = async (code: string): Promise<PairingCodeVerifyResponse> => {
    const response = await apiClient.post('/api/pairing/verify', { code });
    return response.data;
};

/**
 * Silently refreshes the user's JWT token.
 * Calls POST /api/pairing/refresh with the current Bearer token.
 * The interceptor in api.ts handles this automatically, but this function
 * can also be called explicitly if needed.
 */
export const refreshUserToken = async (): Promise<UserTokenRefreshResponse> => {
    const response = await apiClient.post('/api/pairing/refresh');
    return response.data;
};
