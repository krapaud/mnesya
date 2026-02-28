/**
 * Hook for fetching and updating the status of a reminder.
 *
 * @module useReminderStatus
 */
import { useState, useEffect, useCallback } from "react";
import { getReminderStatus, postponeReminder } from "../services/reminderService";
import type { ReminderStatus } from "../types/interfaces";


interface UseReminderStatus {
    reminderStatus: ReminderStatus | null;
    loading: boolean;
    error: string | null;
    postpone: (delayMinute: number) => Promise<void>;
    reload: () => Promise<void>;
}

export const useReminderStatus = (
    reminderId: string,
    onAuthError?: () => void
): UseReminderStatus => {
    const [reminderStatus, setReminderStatus] = useState<ReminderStatus | null>(null);
    const [loading, setLoading] =useState(true);
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
    }, [loadReminderStatus]);

    const postpone = useCallback(async (delayMinutes: number) => {
        await postponeReminder(reminderId, delayMinutes);
        await loadReminderStatus();
    }, [reminderId, loadReminderStatus]);

    return {
        reminderStatus,
        loading,
        error,
        postpone,
        reload: loadReminderStatus,
    };
};
