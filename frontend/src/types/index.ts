export type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    Register: undefined;
    CreateProfile: undefined;
    UserPairing: undefined;
    Dashboard: undefined;
    CreateReminder: { profileId?: number };
    UserProfileDetails: { profileId: number};
    UserHome: { userName: string };
}

export type CaregiverTabsParamList = {
    Home: undefined;
    Reminders: undefined;
    Profile: undefined;
}
