/**
 * Unit tests for authentication service
 *
 * Tests login, registration, logout, user profile retrieval, and profile updates.
 * Uses mocked API client and token service to isolate functionality.
 */
import { login, register, logout, getCurrentUser, updateCaregiverProfile } from '../authService';
import apiClient from '../api';
import { saveToken, deleteToken } from '../tokenService';
import { LoginData, RegisterData, AuthResponse, CaregiverProfile } from '../../types/interfaces';

// Mock the API client
jest.mock('../api', () => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
}));

// Mock the token service
jest.mock('../tokenService', () => ({
    saveToken: jest.fn(),
    deleteToken: jest.fn(),
}));

describe('authService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('should successfully login and save token', async () => {
            const mockCredentials: LoginData = {
                email: 'test@example.com',
                password: 'SecurePass123!',
            };

            const mockResponse: AuthResponse = {
                access_token: 'mock-jwt-token-12345',
                token_type: 'bearer',
                expires_in: 3600,
            };

            (apiClient.post as jest.Mock).mockResolvedValue({
                data: mockResponse,
            });

            const result = await login(mockCredentials);

            expect(apiClient.post).toHaveBeenCalledTimes(1);
            expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', mockCredentials);
            expect(saveToken).toHaveBeenCalledTimes(1);
            expect(saveToken).toHaveBeenCalledWith('mock-jwt-token-12345');
            expect(result).toEqual(mockResponse);
        });

        it('should throw error on invalid credentials', async () => {
            const mockCredentials: LoginData = {
                email: 'wrong@example.com',
                password: 'wrongpassword',
            };

            const mockError = new Error('Invalid credentials');
            (apiClient.post as jest.Mock).mockRejectedValue(mockError);

            await expect(login(mockCredentials)).rejects.toThrow('Invalid credentials');
            expect(saveToken).not.toHaveBeenCalled();
        });

        it('should handle network errors during login', async () => {
            const mockCredentials: LoginData = {
                email: 'test@example.com',
                password: 'password123',
            };

            const networkError = new Error('Network request failed');
            (apiClient.post as jest.Mock).mockRejectedValue(networkError);

            await expect(login(mockCredentials)).rejects.toThrow('Network request failed');
        });

        it('should save token even if expires_in is very large', async () => {
            const mockCredentials: LoginData = {
                email: 'test@example.com',
                password: 'password123',
            };

            const mockResponse: AuthResponse = {
                access_token: 'long-lived-token',
                token_type: 'bearer',
                expires_in: 86400000, // Very long expiry
            };

            (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

            await login(mockCredentials);

            expect(saveToken).toHaveBeenCalledWith('long-lived-token');
        });
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const mockRegistrationData: RegisterData = {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                password: 'SecurePass123!',
            };

            (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });

            await register(mockRegistrationData);

            expect(apiClient.post).toHaveBeenCalledTimes(1);
            expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', mockRegistrationData);
        });

        it('should throw error when email already exists', async () => {
            const mockRegistrationData: RegisterData = {
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'existing@example.com',
                password: 'Password123!',
            };

            const mockError = new Error('Email already registered');
            (apiClient.post as jest.Mock).mockRejectedValue(mockError);

            await expect(register(mockRegistrationData)).rejects.toThrow(
                'Email already registered'
            );
        });

        it('should handle validation errors during registration', async () => {
            const mockRegistrationData: RegisterData = {
                first_name: '',
                last_name: '',
                email: 'invalid-email',
                password: '123',
            };

            const validationError = new Error('Validation failed');
            (apiClient.post as jest.Mock).mockRejectedValue(validationError);

            await expect(register(mockRegistrationData)).rejects.toThrow('Validation failed');
        });

        it('should handle registration with special characters in names', async () => {
            const mockRegistrationData: RegisterData = {
                first_name: 'Jean-François',
                last_name: "O'Brien",
                email: 'special@example.com',
                password: 'SecurePass123!',
            };

            (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });

            await register(mockRegistrationData);

            expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', mockRegistrationData);
        });
    });

    describe('logout', () => {
        it('should successfully logout and delete token', async () => {
            (deleteToken as jest.Mock).mockResolvedValue(undefined);

            await logout();

            expect(deleteToken).toHaveBeenCalledTimes(1);
        });

        it('should handle logout when no token exists', async () => {
            (deleteToken as jest.Mock).mockResolvedValue(undefined);

            await expect(logout()).resolves.not.toThrow();
            expect(deleteToken).toHaveBeenCalled();
        });

        it('should propagate errors from deleteToken', async () => {
            const mockError = new Error('Failed to delete token');
            (deleteToken as jest.Mock).mockRejectedValue(mockError);

            await expect(logout()).rejects.toThrow('Failed to delete token');
        });
    });

    describe('getCurrentUser', () => {
        it('should successfully fetch current user profile', async () => {
            const mockProfile: CaregiverProfile = {
                id: '123',
                first_name: 'Alice',
                last_name: 'Johnson',
                email: 'alice.johnson@example.com',
                created_at: '2026-01-15T10:30:00Z',
            };

            (apiClient.get as jest.Mock).mockResolvedValue({
                data: mockProfile,
            });

            const result = await getCurrentUser();

            expect(apiClient.get).toHaveBeenCalledTimes(1);
            expect(apiClient.get).toHaveBeenCalledWith('/api/auth/me');
            expect(result).toEqual(mockProfile);
        });

        it('should throw error when not authenticated', async () => {
            const authError = new Error('Unauthorized');
            (apiClient.get as jest.Mock).mockRejectedValue(authError);

            await expect(getCurrentUser()).rejects.toThrow('Unauthorized');
        });

        it('should handle network errors when fetching profile', async () => {
            const networkError = new Error('Network error');
            (apiClient.get as jest.Mock).mockRejectedValue(networkError);

            await expect(getCurrentUser()).rejects.toThrow('Network error');
        });

        it('should correctly parse profile with all fields', async () => {
            const completeProfile: CaregiverProfile = {
                id: '456',
                first_name: 'Robert',
                last_name: 'Williams',
                email: 'robert.williams@example.com',
                created_at: '2025-12-01T08:00:00Z',
            };

            (apiClient.get as jest.Mock).mockResolvedValue({
                data: completeProfile,
            });

            const result = await getCurrentUser();

            expect(result.id).toBe('456');
            expect(result.first_name).toBe('Robert');
            expect(result.last_name).toBe('Williams');
            expect(result.email).toBe('robert.williams@example.com');
            expect(result.created_at).toBe('2025-12-01T08:00:00Z');
        });
    });

    describe('integration scenarios', () => {
        it('should successfully complete login and fetch user workflow', async () => {
            const mockCredentials: LoginData = {
                email: 'integration@example.com',
                password: 'TestPass123!',
            };

            const mockAuthResponse: AuthResponse = {
                access_token: 'integration-token',
                token_type: 'bearer',
                expires_in: 3600,
            };

            const mockProfile: CaregiverProfile = {
                id: '789',
                first_name: 'Integration',
                last_name: 'Test',
                email: 'integration@example.com',
                created_at: '2026-02-13T12:00:00Z',
            };

            (apiClient.post as jest.Mock).mockResolvedValue({ data: mockAuthResponse });
            (apiClient.get as jest.Mock).mockResolvedValue({ data: mockProfile });

            // Login
            const authResult = await login(mockCredentials);
            expect(authResult).toEqual(mockAuthResponse);
            expect(saveToken).toHaveBeenCalledWith('integration-token');

            // Fetch profile
            const profileResult = await getCurrentUser();
            expect(profileResult).toEqual(mockProfile);
        });

        it('should complete full user lifecycle: register, login, fetch profile, logout', async () => {
            const mockRegistrationData: RegisterData = {
                first_name: 'Lifecycle',
                last_name: 'User',
                email: 'lifecycle@example.com',
                password: 'LifeCycle123!',
            };

            const mockLoginData: LoginData = {
                email: 'lifecycle@example.com',
                password: 'LifeCycle123!',
            };

            const mockAuthResponse: AuthResponse = {
                access_token: 'lifecycle-token',
                token_type: 'bearer',
                expires_in: 3600,
            };

            const mockProfile: CaregiverProfile = {
                id: '999',
                first_name: 'Lifecycle',
                last_name: 'User',
                email: 'lifecycle@example.com',
                created_at: '2026-02-13T15:00:00Z',
            };

            // Setup mocks
            (apiClient.post as jest.Mock).mockImplementation((url) => {
                if (url === '/api/auth/register') {
                    return Promise.resolve({ data: {} });
                }
                if (url === '/api/auth/login') {
                    return Promise.resolve({ data: mockAuthResponse });
                }
            });
            (apiClient.get as jest.Mock).mockResolvedValue({ data: mockProfile });
            (deleteToken as jest.Mock).mockResolvedValue(undefined);

            // Register
            await register(mockRegistrationData);
            expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', mockRegistrationData);

            // Login
            await login(mockLoginData);
            expect(saveToken).toHaveBeenCalledWith('lifecycle-token');

            // Get profile
            const profile = await getCurrentUser();
            expect(profile.email).toBe('lifecycle@example.com');

            // Logout
            await logout();
            expect(deleteToken).toHaveBeenCalled();
        });
    });

    describe('updateCaregiverProfile', () => {
        it('should successfully update caregiver profile', async () => {
            const mockUpdateData = {
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane.smith@example.com',
            };

            const mockUpdatedProfile: CaregiverProfile = {
                id: '123',
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane.smith@example.com',
                created_at: '2026-01-01T00:00:00Z',
            };

            (apiClient.put as jest.Mock).mockResolvedValue({
                data: mockUpdatedProfile,
            });

            const result = await updateCaregiverProfile(mockUpdateData);

            expect(apiClient.put).toHaveBeenCalledTimes(1);
            expect(apiClient.put).toHaveBeenCalledWith('/api/auth/me', mockUpdateData);
            expect(result).toEqual(mockUpdatedProfile);
        });

        it('should handle email already in use error', async () => {
            const mockUpdateData = {
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'existing@example.com',
            };

            const mockError = new Error('Email already registered');
            (apiClient.put as jest.Mock).mockRejectedValue(mockError);

            await expect(updateCaregiverProfile(mockUpdateData)).rejects.toThrow(
                'Email already registered'
            );
        });

        it('should handle validation errors during update', async () => {
            const mockUpdateData = {
                first_name: '',
                last_name: '',
                email: 'invalid-email',
            };

            const validationError = new Error('Validation failed');
            (apiClient.put as jest.Mock).mockRejectedValue(validationError);

            await expect(updateCaregiverProfile(mockUpdateData)).rejects.toThrow(
                'Validation failed'
            );
        });

        it('should handle unauthorized error when token is invalid', async () => {
            const mockUpdateData = {
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane.smith@example.com',
            };

            const authError = {
                response: {
                    status: 401,
                    data: { detail: 'Invalid authentication credentials' },
                },
            };
            (apiClient.put as jest.Mock).mockRejectedValue(authError);

            await expect(updateCaregiverProfile(mockUpdateData)).rejects.toEqual(authError);
        });

        it('should update only provided fields', async () => {
            const mockUpdateData = {
                first_name: 'Jane',
                last_name: 'Doe',
                email: 'same@example.com',
            };

            const mockUpdatedProfile: CaregiverProfile = {
                id: '123',
                first_name: 'Jane',
                last_name: 'Doe',
                email: 'same@example.com',
                created_at: '2026-01-01T00:00:00Z',
            };

            (apiClient.put as jest.Mock).mockResolvedValue({
                data: mockUpdatedProfile,
            });

            const result = await updateCaregiverProfile(mockUpdateData);

            expect(result.first_name).toBe('Jane');
            expect(result.email).toBe('same@example.com');
        });

        it('should handle network errors during update', async () => {
            const mockUpdateData = {
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane.smith@example.com',
            };

            const networkError = new Error('Network request failed');
            (apiClient.put as jest.Mock).mockRejectedValue(networkError);

            await expect(updateCaregiverProfile(mockUpdateData)).rejects.toThrow(
                'Network request failed'
            );
        });

        it('should update profile with special characters in names', async () => {
            const mockUpdateData = {
                first_name: 'Marie-José',
                last_name: "O'Connor",
                email: 'marie.jose@example.com',
            };

            const mockUpdatedProfile: CaregiverProfile = {
                id: '123',
                first_name: 'Marie-José',
                last_name: "O'Connor",
                email: 'marie.jose@example.com',
                created_at: '2026-01-01T00:00:00Z',
            };

            (apiClient.put as jest.Mock).mockResolvedValue({
                data: mockUpdatedProfile,
            });

            const result = await updateCaregiverProfile(mockUpdateData);

            expect(result.first_name).toBe('Marie-José');
            expect(result.last_name).toBe("O'Connor");
        });
    });
});
