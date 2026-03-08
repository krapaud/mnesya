/**
 * Hook for fetching the caregiver's recent activity log (last 48 hours).
 *
 * @module useActivityLog
 */

import { useState, useEffect, useCallback } from 'react';
import { getCaregiverActivityLog } from '../services/reminderService';
import type { ActivityLogEntry } from '../types/interfaces';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UseActivityLogResult {
    entries: ActivityLogEntry[] | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Fetches all DONE / POSTPONED / UNABLE / MISSED interactions across all
 * reminders managed by the authenticated caregiver in the last 48 hours.
 *
 * @param onAuthError - Optional callback invoked on a 401 response.
 * @returns entries, loading flag, error key and a reload function.
 */
export const useActivityLog = (onAuthError?: () => void): UseActivityLogResult => {
    const [entries, setEntries] = useState<ActivityLogEntry[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadEntries = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCaregiverActivityLog();
            setEntries(data);
        } catch (err) {
            setError('common.errors.failedToLoadActivityLog');
            if (err instanceof Error && err.message.includes('401')) {
                onAuthError?.();
            }
        } finally {
            setLoading(false);
        }
    }, [onAuthError]);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    return {
        entries,
        loading,
        error,
        reload: loadEntries,
    };
};
