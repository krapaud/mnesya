/**
 * Hook for loading, updating, and deleting a user profile.
 *
 * @module useUserProfile
 */
import { useState, useEffect, useCallback } from 'react';
import { getProfile, updateProfile, deleteProfile } from '../services/profileService';
import type { UserProfileData, UpdateUserProfileData } from '../types/interfaces';

interface UseUserProfileResult {
    userData: UserProfileData | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
    update: (data: UpdateUserProfileData) => Promise<void>;
    remove: () => Promise<void>;
}


export const useUserProfile = (
    profileId: string,
    onAuthError?: () => void
): UseUserProfileResult => {
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
