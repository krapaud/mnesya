/**
 * Token management service for JWT authentication.
 * 
 * Provides functions to store, retrieve, and delete authentication tokens
 * using AsyncStorage for persistent local storage on mobile devices.
 * 
 * @module tokenService
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Storage key for the JWT authentication token */
const AUTH_TOKEN_KEY = '@mnesya/auth_token';

/**
 * Saves the authentication token to local storage.
 * 
 * @param token - JWT access token to store
 * @returns Promise that resolves when token is saved
 */
export const saveToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * Retrieves the authentication token from local storage.
 * 
 * @returns Promise that resolves to the stored token, or null if no token exists
 */
export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Deletes the authentication token from local storage.
 * 
 * Used during logout to remove the user's session.
 * 
 * @returns Promise that resolves when token is deleted
 */
export const deleteToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
};
