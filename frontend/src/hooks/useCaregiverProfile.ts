/**
 * Custom hook for managing caregiver profile data.
 * 
 * Provides profile loading functionality with loading, error, and data states.
 * Automatically loads profile on mount and provides reload capability.
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

/**
 * Hook to fetch and manage current caregiver profile.
 * 
 * Automatically loads profile data on mount. Provides loading state,
 * error handling, and manual reload capability.
 * 
 * @param onAuthError - Optional callback when authentication fails (401)
 * @returns Profile data, loading state, error state, and reload function
 * 
 * @example
 * ```tsx
 * const { caregiverData, loading, error, reload } = useCaregiverProfile(
 *   () => navigation.navigate('Welcome')
 * );
 * 
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} onRetry={reload} />;
 * return <ProfileView data={caregiverData} />;
 * ```
 */
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
    } catch (err) {
      console.error('Failed to load caregiver profile:', err);
      setError('Failed to load profile');
      
      // Handle authentication errors (401 Unauthorized)
      if (err instanceof Error && err.message.includes('401')) {
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
