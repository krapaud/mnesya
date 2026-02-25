/**
 * Service for authentication — login, register, logout, and profile.
 * 
 * @module authService
 */
import apiClient from './api';
import { saveToken, deleteToken } from './tokenService';
import { LoginData, RegisterData, AuthResponse, CaregiverProfile } from '../types/interfaces';

/** Logs in a caregiver and stores the token. */
export const login = async (credentials: LoginData): Promise<AuthResponse> => {
  const response = await apiClient.post('/api/auth/login', credentials);
  
  await saveToken(response.data.access_token);
  
  return response.data;
};

/** Creates a new caregiver account. */
export const register = async (data: RegisterData): Promise<void> => {
  await apiClient.post('/api/auth/register', data);
};

/** Logs out the current user and removes the stored token. */
export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout');
  await deleteToken();
};

/** Returns the profile of the currently logged-in caregiver. */
export const getCurrentUser = async (): Promise<CaregiverProfile> => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
};

/** Updates the caregiver's profile info (name, email). */
export const updateCaregiverProfile = async (data: {
  first_name: string;
  last_name: string;
  email: string;
}): Promise<CaregiverProfile> => {
  const response = await apiClient.put('/api/auth/me', data);
  return response.data;
};
