/**
 * Reminder service for managing reminders between caregivers and users.
 *
 * Provides operations to create, retrieve, update, and delete reminders.
 * All requests are authenticated via the API client.
 *
 * @module reminderService
 */
import apiClient from "./api";
import { CreateReminder, UpdateReminder, ReminderData } from "../types/interfaces";

/**
 * Creates a new reminder for a user.
 *
 * @param data - Reminder data including title, optional description, scheduled time, and user ID
 * @returns Promise resolving to the created reminder
 */
export const createReminder = async (data: CreateReminder): Promise<ReminderData> => {
  const response = await apiClient.post('/api/reminder', data);
  return response.data;
};

/**
 * Retrieves a single reminder by ID.
 *
 * @param id - The reminder ID to retrieve
 * @returns Promise resolving to the reminder data
 */
export const getReminder = async (id: string): Promise<ReminderData> => {
  const response = await apiClient.get(`/api/reminder/${id}`);
  return response.data;
};

/**
 * Retrieves all reminders assigned to the authenticated user.
 *
 * @returns Promise resolving to an array of reminders for the user
 */
export const getUserReminders = async (): Promise<ReminderData[]> => {
  const response = await apiClient.get('/api/reminder/user');
  return response.data;
};

/**
 * Retrieves all reminders created by the authenticated caregiver.
 *
 * @returns Promise resolving to an array of reminders created by the caregiver
 */
export const getCaregiverReminders = async (): Promise<ReminderData[]> => {
  const response = await apiClient.get('/api/reminder/caregiver');
  return response.data;
};

/**
 * Updates an existing reminder.
 *
 * @param id - The reminder ID to update
 * @param data - Partial reminder data with fields to update
 * @returns Promise resolving to the updated reminder
 */
export const updateReminder = async (id: string, data: UpdateReminder): Promise<ReminderData> => {
  const response = await apiClient.put(`/api/reminder/${id}`, data);
  return response.data;
};

/**
 * Deletes a reminder by ID.
 *
 * @param id - The reminder ID to delete
 * @returns Promise that resolves when the reminder is deleted
 */
export const deleteReminder = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/reminder/${id}`);
};
