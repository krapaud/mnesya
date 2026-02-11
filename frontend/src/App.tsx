/**
 * App - Root component of the application
 * 
 * Initializes and wraps the navigation structure with NavigationContainer.
 * Entry point for the entire React Native application.
 * 
 * Key responsibilities:
 * - Loads i18n configuration for multi-language support
 * - Provides navigation context via NavigationContainer
 * - Initializes the main application navigator
 * 
 * @module App
 */
import React, { useEffect, useRef } from "react"; // Ajoute useRef
import { NavigationContainer } from "@react-navigation/native";
import type { NavigationContainerRef } from '@react-navigation/native'; // Nouveau type
import type { RootStackParamList } from './types/index'; // Import du type
import AsyncStorage from '@react-native-async-storage/async-storage';
import "./i18n"; // Initialize internationalization before any component renders
import AppNavigator from './navigation/AppNavigator';
import { registerForPushNotifications, cancelNotifications } from './utils/notifications';
import * as Notifications from 'expo-notifications';

// Set the comportment of notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,    // Show banner notification
    shouldShowList: true,      // Show in notification list
    shouldPlaySound: true,     // Play notification sound
    shouldSetBadge: true,      // Update app badge count
  }),
});

/**
 * Main application component that sets up navigation and i18n.
 * 
 * @returns The root component wrapped in NavigationContainer
 */
const App: React.FC = () => {
    const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>(); // Create reference to access navigation from outside the NavigationContainer

    useEffect(() => {
        const setupNotifications = async () => {
            await registerForPushNotifications();
        };
        setupNotifications();

        // Listen for notification clicks
        const subscription = Notifications.addNotificationResponseReceivedListener(async response => {
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
                        console.log(`Cancelled ${notificationIds.length} remaining notifications`);
                        await Notifications.setBadgeCountAsync(0);
                        console.log(`Badge set to 0`);
                    }
                } catch (error) {
                    console.error('Error cancelling notifications:', error);
                }
            }
            
            // Navigate to ReminderNotificationScreen with notification data
            if (navigationRef.current && data && !data.isCaregiverAlert) {
                navigationRef.current.navigate('ReminderNotification', {
                    reminderId: data.reminderId,
                    message: data.message,
                    profileId: data.profileId,
                });
            }
        });

        // Cleanup listener on component unmount
        return () => subscription.remove();
    }, []);

    return (
        <NavigationContainer ref={navigationRef}>
            <AppNavigator />
        </NavigationContainer>
    );
}

export default App;
