import { useState, useEffect, useCallback } from 'react';
import { getProfiles } from '../services/profileService';
import type { UserProfileData } from '../types/interfaces';

/**
 * Return type for useUserProfiles hook.
 */
interface UseUserProfilesResult {
    /** Array of user profiles, null if not yet loaded */
    userData: UserProfileData[] | null;
    /** Loading state indicator */
    loading: boolean;
    /** Error message, null if no error */
    error: string | null;
    /** Function to reload the profiles list */
    reload: () => Promise<void>;
}

export const useUserProfiles = (
    onAuthError?: () => void
): UseUserProfilesResult => {
    const [userData, setUserData] = useState<UserProfileData[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Loads profiles from backend API.
     * Memoized with useCallback to ensure stable reference for dependencies.
     */
    const loadProfiles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const profiles = await getProfiles();
            setUserData(profiles);
        } catch (err) {
            setError('common.errors.failedToLoadProfiles');

            // Handle authentication errors
            if (err instanceof Error && err.message.includes('401')) {
                onAuthError?.();
            }
        } finally {
            setLoading(false);
        }
    }, [onAuthError]);

    // Load profiles on mount
    useEffect(() => {
        loadProfiles();
    }, [loadProfiles]);

    return {
        userData,
        loading,
        error,
        reload: loadProfiles,
    };
};
