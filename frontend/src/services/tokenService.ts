/**
 * Service for storing and retrieving the JWT token and user info using SecureStore.
 *
 * @module tokenService
 */
import * as SecureStore from 'expo-secure-store';

/** Storage key for the JWT authentication token */
const AUTH_TOKEN_KEY = 'auth_token';

/** Storage key for the user info */
const USER_INFO_KEY = 'user_info';

/** Saves the JWT token. */
export const saveToken = async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
};

/** Returns the stored JWT token, or null if not found. */
export const getToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
};

/** Deletes the stored JWT token (used on logout). */
export const deleteToken = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
};

/** Saves the user info. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveUserInfo = async (userInfo: any): Promise<void> => {
    await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(userInfo));
};

/** Returns the stored user info, or null if not found. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUserInfo = async (): Promise<any | null> => {
    const data = await SecureStore.getItemAsync(USER_INFO_KEY);
    return data ? JSON.parse(data) : null;
};

/** Deletes the stored user info (used on logout). */
export const deleteUserInfo = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(USER_INFO_KEY);
};
