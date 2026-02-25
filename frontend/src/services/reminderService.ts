/**
 * Service for managing reminders.
 *
 * @module reminderService
 */
import apiClient from "./api";
import { CreateReminder, UpdateReminder, ReminderData, ReminderStatus, UpdateReminderStatus } from "../types/interfaces";

/** Creates a new reminder. */
export const createReminder = async (data: CreateReminder): Promise<ReminderData> => {
  const response = await apiClient.post('/api/reminder', data);
  return response.data;
};

/** Returns a single reminder by ID. */
export const getReminder = async (id: string): Promise<ReminderData> => {
  const response = await apiClient.get(`/api/reminder/${id}`);
  return response.data;
};

/** Returns all reminders for the logged-in user. */
export const getUserReminders = async (): Promise<ReminderData[]> => {
  const response = await apiClient.get('/api/reminder/user');
  return response.data;
};

/** Returns all reminders created by the logged-in caregiver. */
export const getCaregiverReminders = async (): Promise<ReminderData[]> => {
  const response = await apiClient.get('/api/reminder/caregiver');
  return response.data;
};

/** Updates a reminder by ID. */
export const updateReminder = async (id: string, data: UpdateReminder): Promise<ReminderData> => {
  const response = await apiClient.put(`/api/reminder/${id}`, data);
  return response.data;
};

/** Deletes a reminder by ID. */
export const deleteReminder = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/reminder/${id}`);
};

/** Returns the current status of a reminder. */
export const getReminderStatus = async (reminderId: string): Promise<ReminderStatus> => {
  const response = await apiClient.get(`/api/reminder-status/${reminderId}/current`);
  return response.data;
}

/** Updates the status of a reminder. */
export const updateReminderStatus = async (reminderId: string, data: UpdateReminderStatus): Promise<ReminderStatus> => {
  const response = await apiClient.put(`/api/reminder-status/${reminderId}`, data);
  return response.data;
};
