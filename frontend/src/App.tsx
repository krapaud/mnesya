/**
 * Root component — sets up navigation and notifications.
 *
 * @module App
 */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './i18n'; // Initialize internationalization before any component renders
import AppNavigator from './navigation/AppNavigator';
import { registerForPushNotifications, cancelNotifications } from './utils/notifications';
import * as Notifications from 'expo-notifications';

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

const App: React.FC = () => {
    const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>(); // Create reference to access navigation from outside the NavigationContainer

    useEffect(() => {
        const setupNotifications = async () => {
            await registerForPushNotifications();
        };
        setupNotifications();

        // Listen for notification clicks
        const subscription = Notifications.addNotificationResponseReceivedListener(
            async (response) => {
                const data = response.notification.request.content.data as {
                    reminderId: number;
                    message: string;
                    profileId: string | number;
                    isUserNotification?: boolean;
                    isCaregiverAlert?: boolean;
                };

                // If it's a user notification, cancel all other remaining notifications
                if (data.isUserNotification && data.reminderId) {
                    try {
                        const storageKey = `notification_ids_${data.reminderId}`;
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
                if (navigationRef.current && data && !data.isCaregiverAlert) {
                    navigationRef.current.navigate('ReminderNotification', {
                        reminderId: String(data.reminderId),
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
