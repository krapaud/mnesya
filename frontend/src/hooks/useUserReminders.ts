/**
 * Hook for fetching all reminders assigned to the user.
 *
 * @module useUserReminders
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserReminders } from '../services/reminderService';
import type { ReminderData } from '../types/interfaces';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UseReminderResult {
    reminderData: ReminderData[] | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Fetches all reminders assigned to the currently authenticated user.
 *
 * @param onAuthError - Optional callback invoked on a 401 response.
 * @returns reminderData, loading flag, error key and a reload function.
 */
export const useUserReminders = (onAuthError?: () => void): UseReminderResult => {
    const [reminderData, setReminderData] = useState<ReminderData[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadReminders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const reminders = await getUserReminders();
            setReminderData(reminders);
        } catch (err) {
            setError('common.errors.failedToLoadReminders');
            if (err instanceof Error && err.message.includes('401')) {
                onAuthError?.();
            }
        } finally {
            setLoading(false);
        }
    }, [onAuthError]);
    useEffect(() => {
        loadReminders();
    }, [loadReminders]);
    return {
        reminderData,
        loading,
        error,
        reload: loadReminders,
    };
};
