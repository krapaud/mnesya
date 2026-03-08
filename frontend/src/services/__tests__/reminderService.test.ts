/**
 * Unit tests for reminderService.
 *
 * @module reminderService.test
 */
import {
    createReminder,
    getReminder,
    getUserReminders,
    getCaregiverReminders,
    updateReminder,
    deleteReminder,
    getReminderStatus,
    updateReminderStatus,
} from '../reminderService';
import apiClient from '../api';
import { CreateReminder, ReminderData, ReminderStatus } from '../../types/interfaces';

jest.mock('../api', () => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
}));

const mockReminder: ReminderData = {
    id: 'reminder-1',
    title: 'Take medications',
    description: 'Morning medications',
    scheduled_at: '2026-02-26T09:00:00Z',
    user_id: 'user-1',
    caregiver_id: 'caregiver-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
};

const mockStatus: ReminderStatus = {
    id: 'status-1',
    status: 'Pending',
    reminder_id: 'reminder-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
};

describe('reminderService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createReminder', () => {
        it('should create a reminder and return the data', async () => {
            const payload: CreateReminder = {
                title: 'Take medications',
                description: 'Morning medications',
                scheduled_at: '2026-02-26T09:00:00Z',
                user_id: 'user-1',
            };
            (apiClient.post as jest.Mock).mockResolvedValue({ data: mockReminder });

            const result = await createReminder(payload);

            expect(apiClient.post).toHaveBeenCalledWith('/api/reminder', payload);
            expect(result).toEqual(mockReminder);
        });

        it('should throw on API error', async () => {
            (apiClient.post as jest.Mock).mockRejectedValue(new Error('Server error'));

            await expect(
                createReminder({ title: 'X', scheduled_at: '2026-01-01T00:00:00Z', user_id: 'u-1' })
            ).rejects.toThrow('Server error');
        });
    });

    describe('getReminder', () => {
        it('should return a single reminder by ID', async () => {
            (apiClient.get as jest.Mock).mockResolvedValue({ data: mockReminder });

            const result = await getReminder('reminder-1');

            expect(apiClient.get).toHaveBeenCalledWith('/api/reminder/reminder-1');
            expect(result).toEqual(mockReminder);
        });

        it('should throw when reminder not found', async () => {
            (apiClient.get as jest.Mock).mockRejectedValue(new Error('Not found'));

            await expect(getReminder('bad-id')).rejects.toThrow('Not found');
        });
    });

    describe('getUserReminders', () => {
        it('should return all reminders for the user', async () => {
            (apiClient.get as jest.Mock).mockResolvedValue({ data: [mockReminder] });

            const result = await getUserReminders();

            expect(apiClient.get).toHaveBeenCalledWith('/api/reminder/user');
            expect(result).toHaveLength(1);
        });

        it('should return an empty list when no reminders', async () => {
            (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });

            const result = await getUserReminders();

            expect(result).toEqual([]);
        });
    });

    describe('getCaregiverReminders', () => {
        it('should return all reminders created by the caregiver', async () => {
            (apiClient.get as jest.Mock).mockResolvedValue({ data: [mockReminder] });

            const result = await getCaregiverReminders();

            expect(apiClient.get).toHaveBeenCalledWith('/api/reminder/caregiver');
            expect(result).toHaveLength(1);
        });

        it('should return an empty list when no reminders', async () => {
            (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });

            const result = await getCaregiverReminders();

            expect(result).toEqual([]);
        });
    });

    describe('updateReminder', () => {
        it('should update and return the updated reminder', async () => {
            const updated = { ...mockReminder, title: 'Updated title' };
            (apiClient.put as jest.Mock).mockResolvedValue({ data: updated });

            const result = await updateReminder('reminder-1', { title: 'Updated title' });

            expect(apiClient.put).toHaveBeenCalledWith('/api/reminder/reminder-1', {
                title: 'Updated title',
            });
            expect(result.title).toBe('Updated title');
        });

        it('should throw on unauthorized', async () => {
            (apiClient.put as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

            await expect(updateReminder('reminder-1', { title: 'X' })).rejects.toThrow(
                'Unauthorized'
            );
        });
    });

    describe('deleteReminder', () => {
        it('should delete a reminder without returning data', async () => {
            (apiClient.delete as jest.Mock).mockResolvedValue({});

            await expect(deleteReminder('reminder-1')).resolves.toBeUndefined();
            expect(apiClient.delete).toHaveBeenCalledWith('/api/reminder/reminder-1');
        });

        it('should throw on not found', async () => {
            (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Not found'));

            await expect(deleteReminder('bad-id')).rejects.toThrow('Not found');
        });
    });

    describe('getReminderStatus', () => {
        it('should return the current status of a reminder', async () => {
            (apiClient.get as jest.Mock).mockResolvedValue({ data: mockStatus });

            const result = await getReminderStatus('reminder-1');

            expect(apiClient.get).toHaveBeenCalledWith('/api/reminder-status/reminder-1/current');
            expect(result).toEqual(mockStatus);
        });

        it('should throw when reminder not found', async () => {
            (apiClient.get as jest.Mock).mockRejectedValue(new Error('Not found'));

            await expect(getReminderStatus('bad-id')).rejects.toThrow('Not found');
        });
    });

    describe('updateReminderStatus', () => {
        it('should update and return the new status', async () => {
            const updated = { ...mockStatus, status: 'Done' };
            (apiClient.put as jest.Mock).mockResolvedValue({ data: updated });

            const result = await updateReminderStatus('reminder-1', { status: 'Done' });

            expect(apiClient.put).toHaveBeenCalledWith('/api/reminder-status/reminder-1', {
                status: 'Done',
            });
            expect(result.status).toBe('Done');
        });

        it('should throw on invalid status', async () => {
            (apiClient.put as jest.Mock).mockRejectedValue(new Error('Invalid status'));

            await expect(updateReminderStatus('reminder-1', { status: 'Invalid' })).rejects.toThrow(
                'Invalid status'
            );
        });
    });
});
