import apiClient from './api';
import { CreateUserProfileData, UserProfileData } from '../types/interfaces';

export const createProfile = async (data: CreateUserProfileData): Promise<UserProfileData> => {
  const response = await apiClient.post('/api/profiles', data);
  return response.data;
};

export const getProfiles = async (): Promise<UserProfileData[]> => {
  const response = await apiClient.get('/api/profiles');
  return response.data;
};

export const updateProfile = async (id: string, data: Partial<CreateUserProfileData>): Promise<UserProfileData> => {
  const response = await apiClient.put(`/api/profiles/${id}`, data);
  return response.data;
};

export const getProfile = async (id: string): Promise<UserProfileData> => {
  const response = await apiClient.get(`/api/profiles/${id}`);
  return response.data;
};

export const deleteProfile = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/profiles/${id}`);
};
