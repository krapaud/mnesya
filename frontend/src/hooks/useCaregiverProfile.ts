/**
 * Hook for loading and refreshing the authenticated caregiver's profile.
 *
 * Fetches profile data on mount and exposes a reload function for manual refresh.
 * Handles authentication errors via an optional callback.
 *
 * @module useCaregiverProfile
 */
import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import type { CaregiverProfile } from '../types/interfaces';

/**
 * Return type for useCaregiverProfile hook.
 */
interface UseCaregiverProfileResult {
  /** Current caregiver profile data, null if not loaded */
  caregiverData: CaregiverProfile | null;
  /** Loading state indicator */
  loading: boolean;
  /** Error message if loading failed, null otherwise */
  error: string | null;
  /** Function to reload profile data */
  reload: () => Promise<void>;
}

export const useCaregiverProfile = (
  onAuthError?: () => void
): UseCaregiverProfileResult => {
  const [caregiverData, setCaregiverData] = useState<CaregiverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads caregiver profile data from API.
   * Handles loading states, errors, and authentication failures.
   */
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await getCurrentUser();
      setCaregiverData(profile);
    } catch (err: any) {
      console.error('Failed to load caregiver profile:', err);
      setError('common.errors.failedToLoadProfile');
      
      // Handle authentication errors (401 Unauthorized, 403 Forbidden)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        onAuthError?.();
      }
    } finally {
      setLoading(false);
    }
  };

  // Load profile on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  return {
    caregiverData,
    loading,
    error,
    reload: loadProfile,
  };
};
