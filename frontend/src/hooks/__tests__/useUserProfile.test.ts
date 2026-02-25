/**
 * Unit tests for useUserProfile hook.
 *
 * @module useUserProfile.test
 */
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useUserProfile } from '../useUserProfile';
import { getProfile, updateProfile, deleteProfile } from '../../services/profileService';

jest.mock('../../services/profileService', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  deleteProfile: jest.fn(),
}));

const mockProfile = {
  id: 'user-1',
  first_name: 'Alice',
  last_name: 'Dupont',
  birthday: '1950-06-15',
  caregiver_id: 'caregiver-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('useUserProfile', () => {
  const mockOnAuthError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial loading', () => {
    it('should fetch and return the profile', async () => {
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useUserProfile('user-1', mockOnAuthError));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.userData).toEqual(mockProfile);
      expect(result.current.error).toBeNull();
      expect(getProfile).toHaveBeenCalledWith('user-1');
    });

    it('should set error on fetch failure', async () => {
      (getProfile as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUserProfile('user-1', mockOnAuthError));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.userData).toBeNull();
      expect(result.current.error).toBe('common.errors.failedToLoadProfile');
    });
  });

  describe('update', () => {
    it('should update the profile and refresh the local state', async () => {
      const updated = { ...mockProfile, first_name: 'Alicia' };
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (updateProfile as jest.Mock).mockResolvedValue(updated);

      const { result } = renderHook(() => useUserProfile('user-1', mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.update({ first_name: 'Alicia' });
      });

      expect(updateProfile).toHaveBeenCalledWith('user-1', { first_name: 'Alicia' });
      expect(result.current.userData?.first_name).toBe('Alicia');
    });

    it('should set error and rethrow on update failure', async () => {
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (updateProfile as jest.Mock).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUserProfile('user-1', mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      let caughtError: Error | null = null;
      await act(async () => {
        try {
          await result.current.update({ first_name: 'X' });
        } catch (e) {
          caughtError = e as Error;
        }
      });

      expect(caughtError?.message).toBe('Update failed');
      await waitFor(() => {
        expect(result.current.error).toBe('common.errors.failedToUpdateProfile');
      });
    });
  });

  describe('remove', () => {
    it('should delete the profile and set userData to null', async () => {
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (deleteProfile as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUserProfile('user-1', mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.remove();
      });

      expect(deleteProfile).toHaveBeenCalledWith('user-1');
      expect(result.current.userData).toBeNull();
    });

    it('should set error and rethrow on delete failure', async () => {
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (deleteProfile as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useUserProfile('user-1', mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      let caughtError: Error | null = null;
      await act(async () => {
        try {
          await result.current.remove();
        } catch (e) {
          caughtError = e as Error;
        }
      });

      expect(caughtError?.message).toBe('Delete failed');
      await waitFor(() => {
        expect(result.current.error).toBe('common.errors.failedToDeleteProfile');
      });
    });
  });

  describe('reload', () => {
    it('should refetch the profile when reload is called', async () => {
      const updated = { ...mockProfile, last_name: 'Martin' };
      (getProfile as jest.Mock).mockResolvedValueOnce(mockProfile).mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useUserProfile('user-1', mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await result.current.reload();

      await waitFor(() => {
        expect(result.current.userData?.last_name).toBe('Martin');
      });

      expect(getProfile).toHaveBeenCalledTimes(2);
    });
  });
});
