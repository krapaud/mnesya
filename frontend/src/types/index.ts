/**
 * Navigation type definitions for the application.
 * 
 * Defines parameter lists for stack and tab navigators used throughout the app.
 * 
 * @module types
 */
export type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    Register: undefined;
    CreateProfile: undefined;
    UserPairing: undefined;
    Dashboard: undefined;
    CreateReminder: { profileId?: number };
    UserProfileDetails: { profileId: number};
    UserDashboard: undefined;
    ReminderNotification: { 
        reminderId: number;
        message?: string;
        profileId?: string | number;
    };
}

export type CaregiverTabsParamList = {
    Home: undefined;
    Reminders: undefined;
    Profile: undefined;
}

export type UserTabsParamList = {
    Home: undefined;
    Profile: undefined;
}
