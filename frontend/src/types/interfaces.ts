/**
 * Shared interfaces used across the application
 */

// Profile interface for elderly users
export interface ProfileItem {
    id: number;
    name: string;
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
