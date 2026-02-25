/**
 * Unit tests for useUserReminders hook.
 *
 * @module useUserReminders.test
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { useUserReminders } from '../useUserReminders';
import { getUserReminders } from '../../services/reminderService';

jest.mock('../../services/reminderService', () => ({
  getUserReminders: jest.fn(),
}));

const mockReminders = [
  {
    id: 'reminder-1',
    title: 'Take medications',
    description: 'Morning medications',
    scheduled_at: '2026-02-26T09:00:00Z',
    user_id: 'user-1',
    caregiver_id: 'caregiver-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('useUserReminders', () => {
  const mockOnAuthError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial loading', () => {
    it('should fetch and return reminders for the user', async () => {
      (getUserReminders as jest.Mock).mockResolvedValue(mockReminders);

      const { result } = renderHook(() => useUserReminders(mockOnAuthError));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reminderData).toEqual(mockReminders);
      expect(result.current.error).toBeNull();
    });

    it('should return an empty list when no reminders', async () => {
      (getUserReminders as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useUserReminders(mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.reminderData).toEqual([]);
    });

    it('should set error on fetch failure', async () => {
      (getUserReminders as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUserReminders(mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.reminderData).toBeNull();
      expect(result.current.error).toBe('common.errors.failedToLoadReminders');
    });
  });

  describe('reload', () => {
    it('should refetch reminders when reload is called', async () => {
      const updated = [...mockReminders, { ...mockReminders[0], id: 'reminder-2' }];
      (getUserReminders as jest.Mock)
        .mockResolvedValueOnce(mockReminders)
        .mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useUserReminders(mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.reload();

      await waitFor(() => {
        expect(result.current.reminderData).toHaveLength(2);
      });

      expect(getUserReminders).toHaveBeenCalledTimes(2);
    });
  });

  describe('auth error handling', () => {
    it('should call onAuthError when error includes 401', async () => {
      (getUserReminders as jest.Mock).mockRejectedValue(new Error('401 Unauthorized'));

      renderHook(() => useUserReminders(mockOnAuthError));

      await waitFor(() => {
        expect(mockOnAuthError).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onAuthError on non-auth errors', async () => {
      (getUserReminders as jest.Mock).mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useUserReminders(mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockOnAuthError).not.toHaveBeenCalled();
    });
  });
});
