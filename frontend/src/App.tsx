/**
 * Root component — sets up navigation and notifications.
 *
 * @module App
 */
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppState as RNAppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './i18n'; // Initialize internationalization before any component renders
import AppNavigator from './navigation/AppNavigator';
import { registerForPushNotifications, cancelNotifications } from './utils/notifications';
import * as Notifications from 'expo-notifications';
import { navigationRef } from './services/navigationService';
import { getToken, saveToken } from './services/tokenService';
import axios from 'axios';
import { API_BASE_URL } from './config/api';

// Set the notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true, // Show banner notification
        shouldShowList: true, // Show in notification list
        shouldPlaySound: true, // Play notification sound
        shouldSetBadge: true, // Update app badge count
    }),
});

// ─── Component ──────────────────────────────────────────────────────────────

/** Decode a JWT payload without a library. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const b64 = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
    } catch {
        return null;
    }
}

const App: React.FC = () => {
    const appState = useRef<AppStateStatus>(RNAppState.currentState);

    useEffect(() => {
        // Refresh the caregiver token proactively when the app comes to the foreground.
        // This covers the case where the token is still valid but close to expiry
        // after the app has been in the background for a while.
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                const token = await getToken();
                if (token) {
                    const payload = decodeJwtPayload(token);
                    const now = Math.floor(Date.now() / 1000);
                    const isCaregiverToken =
                        payload?.['sub'] !== undefined &&
                        payload?.['email'] !== undefined &&
                        payload?.['firstname'] === undefined;
                    const exp = payload?.['exp'] as number | undefined;

                    if (isCaregiverToken && exp !== undefined && exp > now && exp - now < 24 * 60 * 60) {
                        try {
                            const response = await axios.post(
                                `${API_BASE_URL}/api/auth/refresh`,
                                {},
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            await saveToken(response.data.access_token as string);
                        } catch {
                            // Token already expired or refresh failed — the next API call
                            // will trigger the 401 handler and redirect to Login.
                        }
                    }
                }
            }
            appState.current = nextAppState;
        };

        const subscription = RNAppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        const setupNotifications = async () => {
            await registerForPushNotifications();
        };
        setupNotifications();

        // Listen for notification clicks
        const subscription = Notifications.addNotificationResponseReceivedListener(
            async (response) => {
                const data = response.notification.request.content.data as {
                    reminder_id: string;
                    message: string;
                    profileId: string | number;
                    isUserNotification?: boolean;
                    isCaregiverAlert?: boolean;
                };

                // If it's a user notification, cancel all other remaining notifications
                if (data.isUserNotification && data.reminder_id) {
                    try {
                        const storageKey = `notification_ids_${data.reminder_id}`;
                        const storedIds = await AsyncStorage.getItem(storageKey);

                        if (storedIds) {
                            const notificationIds = JSON.parse(storedIds) as string[];
                            await cancelNotifications(notificationIds);
                            await AsyncStorage.removeItem(storageKey);
                            await Notifications.setBadgeCountAsync(0);
                        }
                    } catch (_error) {}
                }

                // Navigate to ReminderNotificationScreen with notification data
                // Exclude caregiver alerts: locally scheduled ones use `isCaregiverAlert`,
                // server-sent T10 escalations use `type === "caregiver_alert"`.
                if (navigationRef.current && data && !data.isCaregiverAlert && data.type !== 'caregiver_alert') {
                    navigationRef.current.navigate('ReminderNotification', {
                        reminderId: data.reminder_id,
                        message: data.message,
                        profileId: data.profileId,
                    });
                }
            }
        );

        // Cleanup listener on component unmount
        return () => subscription.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <NavigationContainer ref={navigationRef}>
            <AppNavigator />
        </NavigationContainer>
    );
};

export default App;
