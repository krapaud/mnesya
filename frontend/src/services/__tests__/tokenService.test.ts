/**
 * Unit tests for token service
 * 
 * Tests token storage, retrieval, and deletion using AsyncStorage.
 * Uses mocked AsyncStorage to avoid actual device storage during tests.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveToken, getToken, deleteToken } from '../tokenService';

// Mock AsyncStorage module
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('tokenService', () => {
  // Clear all mocks before each test to ensure clean state
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveToken', () => {
    it('should save token to AsyncStorage with correct key', async () => {
      const testToken = 'test-jwt-token-12345';
      
      await saveToken(testToken);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@mnesya/auth_token',
        testToken
      );
    });

    it('should handle empty string token', async () => {
      const emptyToken = '';
      
      await saveToken(emptyToken);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@mnesya/auth_token',
        emptyToken
      );
    });

    it('should handle very long token strings', async () => {
      const longToken = 'a'.repeat(1000);
      
      await saveToken(longToken);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@mnesya/auth_token',
        longToken
      );
    });
  });

  describe('getToken', () => {
    it('should retrieve token from AsyncStorage', async () => {
      const mockToken = 'stored-token-67890';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockToken);
      
      const result = await getToken();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@mnesya/auth_token');
      expect(result).toBe(mockToken);
    });

    it('should return null when no token is stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await getToken();
      
      expect(result).toBeNull();
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const mockError = new Error('AsyncStorage read error');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(mockError);
      
      await expect(getToken()).rejects.toThrow('AsyncStorage read error');
    });
  });

  describe('deleteToken', () => {
    it('should remove token from AsyncStorage', async () => {
      await deleteToken();
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@mnesya/auth_token');
    });

    it('should handle deletion when no token exists', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      
      await deleteToken();
      
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle AsyncStorage deletion errors', async () => {
      const mockError = new Error('AsyncStorage deletion error');
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(mockError);
      
      await expect(deleteToken()).rejects.toThrow('AsyncStorage deletion error');
    });
  });

  describe('integration scenarios', () => {
    it('should save and retrieve the same token', async () => {
      const testToken = 'integration-test-token';
      
      // Mock both save and get
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(testToken);
      
      await saveToken(testToken);
      const retrievedToken = await getToken();
      
      expect(retrievedToken).toBe(testToken);
    });

    it('should return null after token deletion', async () => {
      // Mock delete and subsequent get returning null
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      await deleteToken();
      const retrievedToken = await getToken();
      
      expect(retrievedToken).toBeNull();
    });
  });
});
