/**
 * Unit tests for useCaregiverProfile hook
 *
 * Tests caregiver profile data fetching, reload functionality,
 * error handling, and logout navigation.
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { useCaregiverProfile } from '../useCaregiverProfile';
import { getCurrentUser } from '../../services/authService';

// Mock the auth service
jest.mock('../../services/authService', () => ({
    getCurrentUser: jest.fn(),
}));

describe('useCaregiverProfile', () => {
    const mockOnLogout = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('initial loading', () => {
        it('should start in loading state and fetch caregiver data', async () => {
            const mockCaregiverData = {
                id: '123',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                created_at: new Date().toISOString(),
            };

            (getCurrentUser as jest.Mock).mockResolvedValue(mockCaregiverData);

            const { result } = renderHook(() => useCaregiverProfile(mockOnLogout));

            // Initially loading
            expect(result.current.loading).toBe(true);
            expect(result.current.caregiverData).toBeNull();
            expect(result.current.error).toBeNull();

            // Wait for data to load
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.caregiverData).toEqual(mockCaregiverData);
            expect(result.current.error).toBeNull();
            expect(getCurrentUser).toHaveBeenCalledTimes(1);
        });

        it('should handle loading error', async () => {
            const mockError = new Error('Network error');
            (getCurrentUser as jest.Mock).mockRejectedValue(mockError);

            const { result } = renderHook(() => useCaregiverProfile(mockOnLogout));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.caregiverData).toBeNull();
            expect(result.current.error).toBe('common.errors.failedToLoadProfile');
            expect(getCurrentUser).toHaveBeenCalledTimes(1);
        });

        it('should call onLogout when receiving 401 error', async () => {
            const mockError = {
                response: {
                    status: 401,
                },
            };
            (getCurrentUser as jest.Mock).mockRejectedValue(mockError);

            const { result } = renderHook(() => useCaregiverProfile(mockOnLogout));

            await waitFor(() => {
                expect(mockOnLogout).toHaveBeenCalledTimes(1);
            });

            expect(result.current.loading).toBe(false);
            expect(result.current.caregiverData).toBeNull();
        });
    });

    describe('reload functionality', () => {
        it('should reload caregiver data when reload is called', async () => {
            const initialData = {
                id: '123',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                created_at: new Date().toISOString(),
            };

            const updatedData = {
                ...initialData,
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane.smith@example.com',
            };

            (getCurrentUser as jest.Mock).mockResolvedValueOnce(initialData);

            const { result } = renderHook(() => useCaregiverProfile(mockOnLogout));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.caregiverData).toEqual(initialData);

            // Update mock to return new data
            (getCurrentUser as jest.Mock).mockResolvedValueOnce(updatedData);

            // Call reload
            await result.current.reload();

            await waitFor(() => {
                expect(result.current.caregiverData).toEqual(updatedData);
            });

            expect(getCurrentUser).toHaveBeenCalledTimes(2);
        });

        it('should handle reload error without clearing existing data', async () => {
            const initialData = {
                id: '123',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                created_at: new Date().toISOString(),
            };

            (getCurrentUser as jest.Mock).mockResolvedValueOnce(initialData);

            const { result } = renderHook(() => useCaregiverProfile(mockOnLogout));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // Mock error on reload
            (getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await result.current.reload();

            await waitFor(() => {
                expect(result.current.error).toBe('common.errors.failedToLoadProfile');
            });

            // Data should remain unchanged
            expect(result.current.caregiverData).toEqual(initialData);
        });
    });

    describe('error scenarios', () => {
        it('should set error message on generic API failure', async () => {
            (getCurrentUser as jest.Mock).mockRejectedValue(new Error('API Error'));

            const { result } = renderHook(() => useCaregiverProfile(mockOnLogout));

            await waitFor(() => {
                expect(result.current.error).toBe('common.errors.failedToLoadProfile');
            });
        });

        it('should trigger logout on 403 forbidden error', async () => {
            const mockError = {
                response: {
                    status: 403,
                },
            };
            (getCurrentUser as jest.Mock).mockRejectedValue(mockError);

            renderHook(() => useCaregiverProfile(mockOnLogout));

            await waitFor(() => {
                expect(mockOnLogout).toHaveBeenCalledTimes(1);
            });
        });

        it('should not trigger logout on non-auth errors', async () => {
            const mockError = {
                response: {
                    status: 500,
                },
            };
            (getCurrentUser as jest.Mock).mockRejectedValue(mockError);

            const { result } = renderHook(() => useCaregiverProfile(mockOnLogout));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(mockOnLogout).not.toHaveBeenCalled();
            expect(result.current.error).toBe('common.errors.failedToLoadProfile');
        });
    });

    describe('multiple reload calls', () => {
        it('should handle multiple rapid reload calls', async () => {
            const mockData = {
                id: '123',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                created_at: new Date().toISOString(),
            };

            (getCurrentUser as jest.Mock).mockResolvedValue(mockData);

            const { result } = renderHook(() => useCaregiverProfile(mockOnLogout));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // Call reload multiple times rapidly
            await Promise.all([
                result.current.reload(),
                result.current.reload(),
                result.current.reload(),
            ]);

            // Should still have valid data
            expect(result.current.caregiverData).toEqual(mockData);

            // API should have been called for initial load + reloads
            expect(getCurrentUser).toHaveBeenCalled();
        });
    });
});
