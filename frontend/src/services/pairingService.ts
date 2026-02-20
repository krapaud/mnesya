import { PairingCodeCreate, PairingCodeResponse, PairingCodeVerify, PairingCodeVerifyResponse } from "../types/interfaces";
import apiClient from './api';

export const generatePairingCode = async (user_id: string): Promise<PairingCodeResponse> => {
    const response = await apiClient.post('/api/pairing/generate', {user_id});
    return response.data;
};

export const verifyPairingCode = async (code: string): Promise<PairingCodeVerifyResponse> => {
    const response = await apiClient.post('/api/pairing/verify', {code});
    return response.data;
}
