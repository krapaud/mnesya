/**
 * User profile service for managing elderly user profiles.
 *
 * Provides CRUD operations for user profiles (elderly users managed
 * by a caregiver). All requests are authenticated via the API client.
 *
 * @module profileService
 */
import apiClient from './api';
import { CreateUserProfileData, UserProfileData } from '../types/interfaces';

/**
 * Creates a new user profile.
 *
 * @param data - Profile data including first name, last name, and birthday
 * @returns Promise resolving to the created user profile
 */
export const createProfile = async (data: CreateUserProfileData): Promise<UserProfileData> => {
  const response = await apiClient.post('/api/users', data);
  return response.data;
};

/**
 * Retrieves all user profiles for the authenticated caregiver.
 *
 * @returns Promise resolving to an array of user profiles
 */
export const getProfiles = async (): Promise<UserProfileData[]> => {
  const response = await apiClient.get('/api/users');
  return response.data;
};

/**
 * Updates an existing user profile.
 *
 * @param id - The profile ID to update
 * @param data - Partial profile data with fields to update
 * @returns Promise resolving to the updated user profile
 */
export const updateProfile = async (id: string, data: Partial<CreateUserProfileData>): Promise<UserProfileData> => {
  const response = await apiClient.put(`/api/users/${id}`, data);
  return response.data;
};

/**
 * Retrieves a single user profile by ID.
 *
 * @param id - The profile ID to retrieve
 * @returns Promise resolving to the user profile data
 */
export const getProfile = async (id: string): Promise<UserProfileData> => {
  const response = await apiClient.get(`/api/users/${id}`);
  return response.data;
};

/**
 * Deletes a user profile by ID.
 *
 * @param id - The profile ID to delete
 * @returns Promise that resolves when the profile is deleted
 */
export const deleteProfile = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/users/${id}`);
};
