/**
 * Unit tests for useReminderStatus hook.
 *
 * @module useReminderStatus.test
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { useReminderStatus } from '../useReminderStatus';
import { getReminderStatus } from '../../services/reminderService';

jest.mock('../../services/reminderService', () => ({
  getReminderStatus: jest.fn(),
}));

const mockStatus = {
  id: 'status-1',
  status: 'Pending',
  reminder_id: 'reminder-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('useReminderStatus', () => {
  const mockOnAuthError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial loading', () => {
    it('should fetch and return the reminder status', async () => {
      (getReminderStatus as jest.Mock).mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useReminderStatus('reminder-1', mockOnAuthError));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reminderStatus).toEqual(mockStatus);
      expect(result.current.error).toBeNull();
      expect(getReminderStatus).toHaveBeenCalledWith('reminder-1');
    });

    it('should set error on fetch failure', async () => {
      (getReminderStatus as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useReminderStatus('reminder-1', mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.reminderStatus).toBeNull();
      expect(result.current.error).toBe('common.errors.failedToLoadRemindersStatus');
    });

    it('should use the reminder ID passed as argument', async () => {
      (getReminderStatus as jest.Mock).mockResolvedValue(mockStatus);

      renderHook(() => useReminderStatus('reminder-42', mockOnAuthError));

      await waitFor(() => {
        expect(getReminderStatus).toHaveBeenCalledWith('reminder-42');
      });
    });
  });

  describe('reload', () => {
    it('should refetch the status when reload is called', async () => {
      const updatedStatus = { ...mockStatus, status: 'Done' };
      (getReminderStatus as jest.Mock)
        .mockResolvedValueOnce(mockStatus)
        .mockResolvedValueOnce(updatedStatus);

      const { result } = renderHook(() => useReminderStatus('reminder-1', mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.reload();

      await waitFor(() => {
        expect(result.current.reminderStatus?.status).toBe('Done');
      });

      expect(getReminderStatus).toHaveBeenCalledTimes(2);
    });
  });

  describe('auth error handling', () => {
    it('should call onAuthError when error includes 401', async () => {
      (getReminderStatus as jest.Mock).mockRejectedValue(new Error('401 Unauthorized'));

      renderHook(() => useReminderStatus('reminder-1', mockOnAuthError));

      await waitFor(() => {
        expect(mockOnAuthError).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onAuthError on non-auth errors', async () => {
      (getReminderStatus as jest.Mock).mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useReminderStatus('reminder-1', mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockOnAuthError).not.toHaveBeenCalled();
    });
  });
});
