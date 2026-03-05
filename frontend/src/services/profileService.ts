/**
 * Service for managing user profiles (elderly users).
 *
 * @module profileService
 */
import apiClient from './api';
import {
    CreateUserProfileData,
    UserProfileData,
    UserWithPairingCodeResponse,
} from '../types/interfaces';

/** Creates a new user profile and returns the user data along with the generated pairing code. */
export const createProfile = async (
    data: CreateUserProfileData
): Promise<UserWithPairingCodeResponse> => {
    const response = await apiClient.post('/api/users', data);
    return response.data;
};

/** Returns all user profiles for the logged-in caregiver. */
export const getProfiles = async (): Promise<UserProfileData[]> => {
    const response = await apiClient.get('/api/users');
    return response.data;
};

/** Updates a user profile by ID. */
export const updateProfile = async (
    id: string,
    data: Partial<CreateUserProfileData>
): Promise<UserProfileData> => {
    const response = await apiClient.put(`/api/users/${id}`, data);
    return response.data;
};

/** Returns a single user profile by ID. */
export const getProfile = async (id: string): Promise<UserProfileData> => {
    const response = await apiClient.get(`/api/users/${id}`);
    return response.data;
};

/** Deletes a user profile by ID. */
export const deleteProfile = async (id: string): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
};

/** Returns the current authenticated user's own profile. */
export const getCurrentUserProfile = async (): Promise<UserProfileData> => {
    const response = await apiClient.get('/api/users/me');
    return response.data;
};
