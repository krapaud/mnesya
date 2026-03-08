/**
 * Shared types and interfaces used across the app.
 *
 * @module interfaces
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Credentials payload for the login endpoint. */
export interface LoginData {
    email: string;
    password: string;
}

/** Registration payload for creating a new caregiver account. */
export interface RegisterData {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
}

/** Response returned by the backend after a successful login. */
export interface AuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

/** Caregiver profile data returned by the backend. */
export interface CaregiverProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
}

/** Payload for creating a new elderly user profile. */
export interface CreateUserProfileData {
    first_name: string;
    last_name: string;
    birthday: string;
}

/** Partial payload for updating an existing elderly user profile. */
export interface UpdateUserProfileData {
    first_name?: string;
    last_name?: string;
    birthday?: string;
}

/** Full elderly user profile data returned by the backend. */
export interface UserProfileData {
    id: string;
    first_name: string;
    last_name: string;
    birthday: string;
    caregiver_id: string;
    created_at: string;
    updated_at: string;
}

/** Response from creating a user profile — includes user data and the generated pairing code. */
export interface UserWithPairingCodeResponse {
    user: UserProfileData;
    pairing_code: PairingCodeResponse;
}

/** Payload for requesting a new pairing code for a user. */
export interface PairingCodeCreate {
    user_id: string;
}

/** Pairing code data returned after generation. */
export interface PairingCodeResponse {
    code: string;
    expires_at: string;
}

/** Payload for verifying a pairing code entered by a user. */
export interface PairingCodeVerify {
    code: string;
}

/** Response returned after a successful pairing code verification, including auth token. */
export interface PairingCodeVerifyResponse {
    user_id: string;
    user: UserInfo;
    caregiver_id: string;
    access_token: string;
    token_type: string;
    expires_in: number;
}

/** Basic user name information embedded in pairing responses. */
export interface UserInfo {
    first_name: string;
    last_name: string;
}

/** Response returned by the silent token refresh endpoint. */
export interface UserTokenRefreshResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

/** Payload for creating a new reminder. */
export interface CreateReminder {
    title: string;
    description?: string;
    scheduled_at: string;
    user_id: string;
}

/** Full reminder data returned by the backend. */
export interface ReminderData {
    id: string;
    title: string;
    description: string;
    scheduled_at: string;
    user_id: string;
    user_first_name?: string;
    user_last_name?: string;
    caregiver_id: string;
    created_at: string;
    updated_at: string;
}

/** Partial payload for updating an existing reminder. */
export interface UpdateReminder {
    title?: string;
    description?: string;
    scheduled_at?: string;
    caregiver_id?: string;
    user_id?: string;
}

export interface ReminderStatus {
    id: string;
    status: string;
    reminder_id: string;
    created_at: string;
    updated_at: string;
}

export interface UpdateReminderStatus {
    status?: string;
    reminder_id?: string;
}

export interface ActivityLogEntry {
    status_id: string;
    status: string;
    reminder_id: string;
    reminder_title: string;
    user_first_name: string;
    user_last_name: string;
    occurred_at: string;
}
