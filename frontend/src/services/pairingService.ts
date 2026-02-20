/**
 * Pairing service for device linking between users and caregivers.
 *
 * Handles pairing code generation and verification with the backend API,
 * enabling users to connect their account to a caregiver.
 *
 * @module pairingService
 */
import { PairingCodeCreate, PairingCodeResponse, PairingCodeVerify, PairingCodeVerifyResponse } from "../types/interfaces";
import apiClient from './api';

/**
 * Generates a pairing code for a given user.
 *
 * @param user_id - The ID of the user requesting the pairing code
 * @returns Promise resolving to the generated pairing code and its expiration
 */
export const generatePairingCode = async (user_id: string): Promise<PairingCodeResponse> => {
    const response = await apiClient.post('/api/pairing/generate', {user_id});
    return response.data;
};

/**
 * Verifies a pairing code entered by a user.
 *
 * @param code - The 6-character alphanumeric pairing code to verify
 * @returns Promise resolving to user and caregiver data with authentication token
 */
export const verifyPairingCode = async (code: string): Promise<PairingCodeVerifyResponse> => {
    const response = await apiClient.post('/api/pairing/verify', {code});
    return response.data;
}
