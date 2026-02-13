/**
 * Shared interfaces used across the application
 */

// Profile interface for elderly users
export interface ProfileItem {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
}

// Reminder interface for reminder items
export interface ReminderItem {
    id: number;
    title: string;
    message: string;
    date: string;
    time: string;
    status: 'Done' | 'Pending' | 'Postponed' | 'Unable';
    profileName: string;
}

// Authentication interfaces
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface CaregiverProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}
