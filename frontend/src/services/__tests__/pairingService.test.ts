/**
 * Unit tests for pairingService.
 *
 * @module pairingService.test
 */
import { generatePairingCode, verifyPairingCode } from '../pairingService';
import apiClient from '../api';
import { PairingCodeResponse, PairingCodeVerifyResponse } from '../../types/interfaces';

jest.mock('../api', () => ({
    post: jest.fn(),
}));

const mockCodeResponse: PairingCodeResponse = {
    code: 'ABC123',
    expires_at: '2026-02-26T11:00:00Z',
};

const mockVerifyResponse: PairingCodeVerifyResponse = {
    user_id: 'user-1',
    user: { first_name: 'Alice', last_name: 'Dupont' },
    caregiver_id: 'caregiver-1',
    access_token: 'mock-jwt-token',
    token_type: 'bearer',
    expires_in: 3600,
};

describe('pairingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generatePairingCode', () => {
        it('should generate and return a pairing code', async () => {
            (apiClient.post as jest.Mock).mockResolvedValue({ data: mockCodeResponse });

            const result = await generatePairingCode('user-1');

            expect(apiClient.post).toHaveBeenCalledWith('/api/pairing/generate', {
                user_id: 'user-1',
            });
            expect(result.code).toBe('ABC123');
            expect(result.expires_at).toBeDefined();
        });

        it('should throw on unauthorized', async () => {
            (apiClient.post as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            await expect(generatePairingCode('user-1')).rejects.toThrow('Unauthorized');
        });

        it('should throw when user not found', async () => {
            (apiClient.post as jest.Mock).mockRejectedValue(new Error('User not found'));

            await expect(generatePairingCode('bad-id')).rejects.toThrow('User not found');
        });
    });

    describe('verifyPairingCode', () => {
        it('should verify code and return auth data', async () => {
            (apiClient.post as jest.Mock).mockResolvedValue({ data: mockVerifyResponse });

            const result = await verifyPairingCode('ABC123');

            expect(apiClient.post).toHaveBeenCalledWith('/api/pairing/verify', { code: 'ABC123' });
            expect(result.access_token).toBe('mock-jwt-token');
            expect(result.user_id).toBe('user-1');
        });

        it('should throw on invalid code', async () => {
            (apiClient.post as jest.Mock).mockRejectedValue(new Error('Invalid code'));

            await expect(verifyPairingCode('WRONG1')).rejects.toThrow('Invalid code');
        });

        it('should throw on expired code', async () => {
            (apiClient.post as jest.Mock).mockRejectedValue(new Error('Code expired'));

            await expect(verifyPairingCode('OLD123')).rejects.toThrow('Code expired');
        });

        it('should return user name info in response', async () => {
            (apiClient.post as jest.Mock).mockResolvedValue({ data: mockVerifyResponse });

            const result = await verifyPairingCode('ABC123');

            expect(result.user.first_name).toBe('Alice');
            expect(result.user.last_name).toBe('Dupont');
        });
    });
});
