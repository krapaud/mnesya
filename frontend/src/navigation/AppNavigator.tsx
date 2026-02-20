/**
 * AppNavigator - Main navigation stack configuration.
 *
 * Defines the navigation structure and screen routes for the entire application.
 * Determines the initial route based on authentication and user type (caregiver or user).
 * Uses React Navigation's native stack navigator for optimal performance.
 *
 * @module AppNavigator
 */
import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from '../types/index';
import { getToken, saveToken } from "../services/tokenService";
import { getCurrentUser } from "../services/authService";
import { getUserInfo } from "../services/tokenService";

// Screen imports
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CaregiverTabs from './CaregiverTabs';
import UserTabs from "./UserTabs";
import UserPairingScreen from '../screens/UserPairingScreen';
import CreateProfileScreen from '../screens/CreateProfileScreen';
import CreateReminderScreen from '../screens/CreateReminderScreen';
import UserProfileDetailScreen from '../screens/UserProfileDetailScreen';
import ReminderNotificationScreen from '../screens/ReminderNotificationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Welcome');
    
    useEffect(() => {
        const checkAuth = async () => {
            const token = await getToken();
            if (token) {
                const userInfo = await getUserInfo();
                if (userInfo && userInfo.caregiver_id) {
                    setInitialRoute('UserDashboard');
                } else {
                    try {
                        await getCurrentUser();
                        setInitialRoute('Dashboard');
                    } catch (err) {
                        setInitialRoute('Welcome');
                    }
                }
            }
            setIsLoading(false);
        };
        
        checkAuth();
    }, []);

    return (
        <>
            {isLoading ? (
                // Écran de chargement temporaire
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            ) : (
                // Navigation normale une fois le chargement terminé
                <Stack.Navigator id='root' initialRouteName={initialRoute}>
                    {/* Initial screen - Profile type selection */}
                    <Stack.Screen 
                        name="Welcome" 
                        component={WelcomeScreen} 
                        options={{ headerShown: false }} 
                    />
                    
                    {/* Caregiver authentication flow */}
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                        />
                    <Stack.Screen
                        name="Register"
                        component={RegisterScreen}
                        options={{ headerShown: false }}
                        />
                        
                    {/* Main caregiver dashboard with tabs */}
                    <Stack.Screen
                        name="Dashboard"
                        component={CaregiverTabs}
                        options={{ headerShown: false }}
                        />
                        
                    {/* Main user dashboard with tabs */}
                    <Stack.Screen
                        name="UserDashboard"
                        component={UserTabs}
                        options={{ headerShown: false }}
                        />
                        
                    {/* User pairing and setup flow */}
                    <Stack.Screen
                        name="UserPairing"
                        component={UserPairingScreen}
                        options={{ headerShown: false }}
                        />
                    <Stack.Screen
                        name="CreateProfile"
                        component={CreateProfileScreen}
                        options={{ headerShown: false }}
                        />
                    <Stack.Screen
                        name="CreateReminder"
                        component={CreateReminderScreen}
                        options={{ headerShown: false }}
                        />
                        
                    {/* User information */}
                    <Stack.Screen
                        name='UserProfileDetails'
                        component={UserProfileDetailScreen}
                        options={{ headerShown: false}}
                        />
                    {/* User notifications */}
                    <Stack.Screen
                        name='ReminderNotification'
                        component={ReminderNotificationScreen}
                        options={{ headerShown: false }}
                        />
                        
                </Stack.Navigator>
            )}
        </>
    );
}

export default AppNavigator;