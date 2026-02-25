/**
 * Unit tests for useUserProfiles hook.
 *
 * @module useUserProfiles.test
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { useUserProfiles } from '../useUserProfiles';
import { getProfiles } from '../../services/profileService';

jest.mock('../../services/profileService', () => ({
  getProfiles: jest.fn(),
}));

const mockProfiles = [
  {
    id: 'user-1',
    first_name: 'Alice',
    last_name: 'Dupont',
    birthday: '1950-06-15',
    caregiver_id: 'caregiver-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('useUserProfiles', () => {
  const mockOnAuthError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial loading', () => {
    it('should start in loading state and fetch profiles', async () => {
      (getProfiles as jest.Mock).mockResolvedValue(mockProfiles);

      const { result } = renderHook(() => useUserProfiles(mockOnAuthError));

      expect(result.current.loading).toBe(true);
      expect(result.current.userData).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.userData).toEqual(mockProfiles);
      expect(result.current.error).toBeNull();
    });

    it('should set error message on API failure', async () => {
      (getProfiles as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUserProfiles(mockOnAuthError));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.userData).toBeNull();
      expect(result.current.error).toBe('common.errors.failedToLoadProfiles');
    });

    it('should return an empty list when no profiles exist', async () => {
      (getProfiles as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useUserProfiles(mockOnAuthError));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.userData).toEqual([]);
    });
  });

  describe('reload', () => {
    it('should refetch profiles when reload is called', async () => {
      const updatedProfiles = [...mockProfiles, { ...mockProfiles[0], id: 'user-2' }];
      (getProfiles as jest.Mock).mockResolvedValueOnce(mockProfiles);

      const { result } = renderHook(() => useUserProfiles(mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      (getProfiles as jest.Mock).mockResolvedValueOnce(updatedProfiles);
      await result.current.reload();

      await waitFor(() => {
        expect(result.current.userData).toHaveLength(2);
      });

      expect(getProfiles).toHaveBeenCalledTimes(2);
    });
  });

  describe('auth error handling', () => {
    it('should call onAuthError when error message includes 401', async () => {
      (getProfiles as jest.Mock).mockRejectedValue(new Error('401 Unauthorized'));

      renderHook(() => useUserProfiles(mockOnAuthError));

      await waitFor(() => {
        expect(mockOnAuthError).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onAuthError on non-auth errors', async () => {
      (getProfiles as jest.Mock).mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useUserProfiles(mockOnAuthError));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockOnAuthError).not.toHaveBeenCalled();
    });
  });
});
