/**
 * Authentication service for user login, registration, and logout.
 * 
 * Handles communication with the backend authentication API and manages
 * local token storage for authenticated sessions.
 * 
 * @module authService
 */
import apiClient from './api';
import { saveToken, deleteToken } from './tokenService';
import { LoginData, RegisterData, AuthResponse, CaregiverProfile } from '../types/interfaces';

/**
 * Authenticates a caregiver with email and password.
 * 
 * Sends login credentials to the backend and stores the received JWT token
 * for subsequent authenticated requests.
 * 
 * @param credentials - User email and password
 * @returns Promise resolving to authentication response with access token
 * @throws Error if credentials are invalid or network request fails
 */
export const login = async (credentials: LoginData): Promise<AuthResponse> => {
  const response = await apiClient.post('/api/auth/login', credentials);
  
  await saveToken(response.data.access_token);
  
  return response.data;
};

/**
 * Registers a new caregiver account.
 * 
 * Sends registration data to the backend to create a new user account.
 * Does not automatically log in the user after registration.
 * 
 * @param data - Registration information (first name, last name, email, password)
 * @returns Promise that resolves when registration is complete
 * @throws Error if email is already registered or validation fails
 */
export const register = async (data: RegisterData): Promise<void> => {
  await apiClient.post('/api/auth/register', data);
};

/**
 * Logs out the current user.
 * 
 * Removes the stored authentication token from local storage,
 * effectively ending the user's session.
 * 
 * @returns Promise that resolves when logout is complete
 */
export const logout = async (): Promise<void> => {
  await deleteToken();
};

/**
 * Fetches the current authenticated caregiver's profile.
 * 
 * Retrieves profile information for the currently logged-in caregiver
 * using the stored JWT token for authentication.
 * 
 * @returns Promise resolving to caregiver profile data
 * @throws Error if not authenticated or request fails
 */
export const getCurrentUser = async (): Promise<CaregiverProfile> => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
};
