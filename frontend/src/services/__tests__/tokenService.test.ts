/**
 * Unit tests for token service
 *
 * Tests token storage, retrieval, and deletion using SecureStore.
 * Uses mocked SecureStore to avoid actual device storage during tests.
 */
import * as SecureStore from 'expo-secure-store';
import { saveToken, getToken, deleteToken } from '../tokenService';

// Mock SecureStore module
jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

describe('tokenService', () => {
    // Clear all mocks before each test to ensure clean state
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveToken', () => {
        it('should save token to SecureStore with correct key', async () => {
            const testToken = 'test-jwt-token-12345';

            await saveToken(testToken);

            expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', testToken);
        });

        it('should handle empty string token', async () => {
            const emptyToken = '';

            await saveToken(emptyToken);

            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', emptyToken);
        });

        it('should handle long token strings', async () => {
            const longToken = 'a'.repeat(1000);

            await saveToken(longToken);

            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', longToken);
        });
    });

    describe('getToken', () => {
        it('should retrieve token from SecureStore', async () => {
            const mockToken = 'stored-token-67890';
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(mockToken);

            const result = await getToken();

            expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
            expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
            expect(result).toBe(mockToken);
        });

        it('should return null when no token is stored', async () => {
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

            const result = await getToken();

            expect(result).toBeNull();
        });

        it('should handle SecureStore errors gracefully', async () => {
            const mockError = new Error('SecureStore read error');
            (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(mockError);

            await expect(getToken()).rejects.toThrow('SecureStore read error');
        });
    });

    describe('deleteToken', () => {
        it('should remove token from SecureStore', async () => {
            await deleteToken();

            expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
        });

        it('should handle deletion when no token exists', async () => {
            (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

            await deleteToken();

            expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
        });

        it('should handle SecureStore deletion errors', async () => {
            const mockError = new Error('SecureStore deletion error');
            (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(mockError);

            await expect(deleteToken()).rejects.toThrow('SecureStore deletion error');
        });
    });

    describe('integration scenarios', () => {
        it('should save and retrieve the same token', async () => {
            const testToken = 'integration-test-token';

            // Mock both save and get
            (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(testToken);

            await saveToken(testToken);
            const retrievedToken = await getToken();

            expect(retrievedToken).toBe(testToken);
        });

        it('should return null after token deletion', async () => {
            // Mock delete and subsequent get returning null
            (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

            await deleteToken();
            const retrievedToken = await getToken();

            expect(retrievedToken).toBeNull();
        });
    });
});
