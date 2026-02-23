/**
 * Hook for loading, updating, and deleting a single user profile by ID.
 *
 * Fetches the profile on mount based on the provided ID and exposes
 * action functions for CRUD operations.
 *
 * @module useUserProfile
 */
import { useState, useEffect, useCallback } from 'react';
import { getProfile, updateProfile, deleteProfile } from '../services/profileService';
import type { UserProfileData, UpdateUserProfileData } from '../types/interfaces';

/**
 * Return type for useUserProfile hook.
 */
interface UseUserProfileResult {
    /** User profile data, null if not yet loaded */
    userData: UserProfileData | null;
    /** Loading state indicator */
    loading: boolean;
    /** Error message, null if no error */
    error: string | null;
    /** Function to reload the profile */
    reload: () => Promise<void>;
    /** Function to update the profile */
    update: (data: UpdateUserProfileData) => Promise<void>;
    /** Function to delete the profile */
    remove: () => Promise<void>;
}

/**
 * Hook to manage a single user profile by ID.
 * 
 * @param profileId - The ID of the profile to load
 * @param onAuthError - Optional callback for authentication errors
 * @returns Profile data, loading state, error state, and action functions
 */
export const useUserProfile = (
    profileId: string,
    onAuthError?: () => void
): UseUserProfileResult => {
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Loads profile from backend API.
     * Memoized with useCallback to ensure stable reference for dependencies.
     */
    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const profileData = await getProfile(profileId);
            setProfile(profileData);
        } catch (err) {
            setError('common.errors.failedToLoadProfile');

            // Handle authentication errors
            if (err instanceof Error && err.message.includes('401')) {
                onAuthError?.();
            }
        } finally {
            setLoading(false);
        }
    }, [profileId, onAuthError]);

    /**
     * Updates the profile with new data.
     * 
     * @param data - Partial profile data to update
     */
    const updateProfileData = useCallback(async (data: UpdateUserProfileData) => {
        try {
            setLoading(true);
            setError(null);
            const updatedProfile = await updateProfile(profileId, data);
            setProfile(updatedProfile);
        } catch (err) {
            setError('common.errors.failedToUpdateProfile');

            // Handle authentication errors
            if (err instanceof Error && err.message.includes('401')) {
                onAuthError?.();
            }
            throw err;
        } finally {
            setLoading(false);
        }
    }, [profileId, onAuthError]);

    /**
     * Deletes the profile.
     */
    const removeProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            await deleteProfile(profileId);
            setProfile(null);
        } catch (err) {
            setError('common.errors.failedToDeleteProfile');

            // Handle authentication errors
            if (err instanceof Error && err.message.includes('401')) {
                onAuthError?.();
            }
            throw err;
        } finally {
            setLoading(false);
        }
    }, [profileId, onAuthError]);

    // Load profile on mount or when profileId changes
    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    return {
        userData: profile,
        loading,
        error,
        reload: loadProfile,
        update: updateProfileData,
        remove: removeProfile,
    };
};
