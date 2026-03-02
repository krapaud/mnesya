/**
 * Service for pairing users with a caregiver via a code.
 *
 * @module pairingService
 */
import { PairingCodeResponse, PairingCodeVerifyResponse } from '../types/interfaces';
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
