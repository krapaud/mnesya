/**
 * Hook for fetching and updating the status of a reminder.
 *
 * @module useReminderStatus
 */

import { useState, useEffect, useCallback } from 'react';
import { getReminderStatus, postponeReminder } from '../services/reminderService';
import type { ReminderStatus } from '../types/interfaces';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UseReminderStatus {
    reminderStatus: ReminderStatus | null;
    loading: boolean;
    error: string | null;
    postpone: (delayMinutes: number) => Promise<void>;
    reload: () => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Fetches and updates the status of a single reminder.
 *
 * @param reminderId - ID of the reminder to track.
 * @param onAuthError - Optional callback invoked on a 401 response.
 * @param reloadTrigger - Increment this value to force a status refresh.
 * @returns reminderStatus, loading flag, error key and a status update function.
 */
export const useReminderStatus = (
    reminderId: string,
    onAuthError?: () => void,
    reloadTrigger?: number
): UseReminderStatus => {
    const [reminderStatus, setReminderStatus] = useState<ReminderStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadReminderStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const reminderStatus = await getReminderStatus(reminderId);
            setReminderStatus(reminderStatus);
        } catch (err) {
            setError('common.errors.failedToLoadRemindersStatus');
            if (err instanceof Error && err.message.includes('401')) {
                onAuthError?.();
            }
        } finally {
            setLoading(false);
        }
    }, [reminderId, onAuthError]);
    useEffect(() => {
        loadReminderStatus();
    }, [loadReminderStatus, reloadTrigger]);

    const postpone = useCallback(
        async (delayMinutes: number) => {
            await postponeReminder(reminderId, delayMinutes);
            await loadReminderStatus();
        },
        [reminderId, loadReminderStatus]
    );

    return {
        reminderStatus,
        loading,
        error,
        postpone,
        reload: loadReminderStatus,
    };
};
