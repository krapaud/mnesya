/**
 * Navigation type definitions for the app.
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
    CreateReminder: { profileId?: string };
    UserProfileDetails: { profileId: string};
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
    Refresh: undefined;
}
