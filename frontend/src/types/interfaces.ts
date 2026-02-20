/**
 * Shared interfaces and types used across the entire application.
 *
 * Defines data models for profiles, reminders, authentication,
 * and API communication.
 *
 * @module interfaces
 */

/** Profile model for elderly users managed by a caregiver. */
export interface ProfileItem {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
}

/** Reminder model including status and assignment to a user profile. */
export interface ReminderItem {
    id: number;
    title: string;
    message: string;
    date: string;
    time: string;
    status: 'Done' | 'Pending' | 'Postponed' | 'Unable';
    profileName: string;
}

/** Credentials payload for the login endpoint. */
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

export interface CreateUserProfileData {
  first_name: string;
  last_name: string;
  birthday: string;
}

export interface UpdateUserProfileData {
  first_name?: string;
  last_name?: string;
  birthday?: string;
}

export interface UserProfileData {
  id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  caregiver_id: string;
  created_at: string;
  updated_at: string;
}

export interface PairingCodeCreate {
  user_id: string;
}

export interface PairingCodeResponse {
  code: string;
  expires_at: string;
}

export interface PairingCodeVerify {
  code: string;
}

export interface PairingCodeVerifyResponse {
  user_id: string;
  user: UserInfo;
  caregiver_id: string;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserInfo {
  first_name: string;
  last_name: string;
}
