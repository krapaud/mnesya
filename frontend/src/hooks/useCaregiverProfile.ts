/**
 * Hook for loading the caregiver's own profile.
 *
 * @module useCaregiverProfile
 */

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../services/authService';
import type { CaregiverProfile } from '../types/interfaces';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UseCaregiverProfileResult {
    caregiverData: CaregiverProfile | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Fetches and mutates the authenticated caregiver's own profile.
 *
 * @param onAuthError - Optional callback invoked on a 401 response.
 * @returns caregiverData, loading flag, error key, reload, update and remove functions.
 */
export const useCaregiverProfile = (onAuthError?: () => void): UseCaregiverProfileResult => {
    const [caregiverData, setCaregiverData] = useState<CaregiverProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const profile = await getCurrentUser();
            setCaregiverData(profile);
        } catch (err: unknown) {
            setError('common.errors.failedToLoadProfile');

            // If the user is not logged in, call the auth error callback
            const error = err as { response?: { status?: number } };
            if (error?.response?.status === 401 || error?.response?.status === 403) {
                onAuthError?.();
            }
        } finally {
            setLoading(false);
        }
    }, [onAuthError]);

    // Load profile on component mount
    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    return {
        caregiverData,
        loading,
        error,
        reload: loadProfile,
    };
};
