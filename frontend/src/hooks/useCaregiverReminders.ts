/**
 * Hook for fetching all reminders created by the caregiver.
 *
 * @module useCaregiverReminders
 */
import { useState, useEffect, useCallback } from 'react';
import { getCaregiverReminders } from '../services/reminderService';
import type { ReminderData } from '../types/interfaces';

interface UseReminderResult {
    reminderData: ReminderData[] | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export const useCaregiverReminders = (onAuthError?: () => void): UseReminderResult => {
    const [reminderData, setReminderData] = useState<ReminderData[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadReminders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const reminders = await getCaregiverReminders();
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
