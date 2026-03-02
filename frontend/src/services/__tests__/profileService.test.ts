/**
 * Unit tests for profileService.
 *
 * @module profileService.test
 */
import {
    createProfile,
    getProfiles,
    getProfile,
    updateProfile,
    deleteProfile,
} from '../profileService';
import apiClient from '../api';
import { CreateUserProfileData, UserProfileData } from '../../types/interfaces';

jest.mock('../api', () => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
}));

const mockProfile: UserProfileData = {
    id: 'user-1',
    first_name: 'Alice',
    last_name: 'Dupont',
    birthday: '1950-06-15',
    caregiver_id: 'caregiver-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
};

describe('profileService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createProfile', () => {
        it('should create a profile and return the data', async () => {
            const payload: CreateUserProfileData = {
                first_name: 'Alice',
                last_name: 'Dupont',
                birthday: '1950-06-15',
            };
            (apiClient.post as jest.Mock).mockResolvedValue({ data: mockProfile });

            const result = await createProfile(payload);

            expect(apiClient.post).toHaveBeenCalledWith('/api/users', payload);
            expect(result).toEqual(mockProfile);
        });

        it('should throw on API error', async () => {
            (apiClient.post as jest.Mock).mockRejectedValue(new Error('Server error'));

            await expect(
                createProfile({ first_name: 'A', last_name: 'B', birthday: '2000-01-01' })
            ).rejects.toThrow('Server error');
        });
    });

    describe('getProfiles', () => {
        it('should return a list of profiles', async () => {
            (apiClient.get as jest.Mock).mockResolvedValue({ data: [mockProfile] });

            const result = await getProfiles();

            expect(apiClient.get).toHaveBeenCalledWith('/api/users');
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockProfile);
        });

        it('should return an empty list when no profiles exist', async () => {
            (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });

            const result = await getProfiles();

            expect(result).toEqual([]);
        });

        it('should throw on network error', async () => {
            (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));

            await expect(getProfiles()).rejects.toThrow('Network error');
        });
    });

    describe('getProfile', () => {
        it('should return a single profile by ID', async () => {
            (apiClient.get as jest.Mock).mockResolvedValue({ data: mockProfile });

            const result = await getProfile('user-1');

            expect(apiClient.get).toHaveBeenCalledWith('/api/users/user-1');
            expect(result).toEqual(mockProfile);
        });

        it('should throw on not found', async () => {
            (apiClient.get as jest.Mock).mockRejectedValue(new Error('Not found'));

            await expect(getProfile('unknown-id')).rejects.toThrow('Not found');
        });
    });

    describe('updateProfile', () => {
        it('should update and return the updated profile', async () => {
            const updated = { ...mockProfile, first_name: 'Alicia' };
            (apiClient.put as jest.Mock).mockResolvedValue({ data: updated });

            const result = await updateProfile('user-1', { first_name: 'Alicia' });

            expect(apiClient.put).toHaveBeenCalledWith('/api/users/user-1', {
                first_name: 'Alicia',
            });
            expect(result.first_name).toBe('Alicia');
        });

        it('should throw on unauthorized', async () => {
            (apiClient.put as jest.Mock).mockRejectedValue({ response: { status: 401 } });

            await expect(updateProfile('user-1', { first_name: 'X' })).rejects.toEqual({
                response: { status: 401 },
            });
        });
    });

    describe('deleteProfile', () => {
        it('should delete a profile without returning data', async () => {
            (apiClient.delete as jest.Mock).mockResolvedValue({});

            await expect(deleteProfile('user-1')).resolves.toBeUndefined();
            expect(apiClient.delete).toHaveBeenCalledWith('/api/users/user-1');
        });

        it('should throw on not found', async () => {
            (apiClient.delete as jest.Mock).mockRejectedValue(new Error('Not found'));

            await expect(deleteProfile('bad-id')).rejects.toThrow('Not found');
        });
    });
});
