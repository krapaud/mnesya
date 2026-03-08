/**
 * Hook for loading the list of user profiles linked to the caregiver.
 *
 * @module useUserProfiles
 */

import { useState, useEffect, useCallback } from 'react';
import { getProfiles } from '../services/profileService';
import type { UserProfileData } from '../types/interfaces';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UseUserProfilesResult {
    userData: UserProfileData[] | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Fetches the list of user profiles linked to the logged-in caregiver.
 *
 * @param onAuthError - Optional callback invoked on a 401 response.
 * @returns userData, loading flag, error key and a reload function.
 */
export const useUserProfiles = (onAuthError?: () => void): UseUserProfilesResult => {
    const [userData, setUserData] = useState<UserProfileData[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
