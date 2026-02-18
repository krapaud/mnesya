/**
 * Token management service for JWT authentication.
 * 
 * Provides functions to store, retrieve, and delete authentication tokens
 * using SecureStore for encrypted persistent storage on mobile devices.
 * SecureStore uses the device's Keychain (iOS) or Keystore (Android) for secure storage.
 * 
 * @module tokenService
 */
import * as SecureStore from 'expo-secure-store';

/** Storage key for the JWT authentication token */
const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Saves the authentication token to secure storage.
 * 
 * @param token - JWT access token to store securely
 * @returns Promise that resolves when token is saved
 */
export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
};

/**
 * Retrieves the authentication token from secure storage.
 * 
 * @returns Promise that resolves to the stored token, or null if no token exists
 */
export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
};

/**
 * Deletes the authentication token from secure storage.
 * 
 * Used during logout to remove the user's session.
 * 
 * @returns Promise that resolves when token is deleted
 */
export const deleteToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
};
