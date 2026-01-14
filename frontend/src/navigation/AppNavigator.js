/**
 * AppNavigator - Main navigation stack configuration
 * Defines the navigation structure and screen routes for the entire application
 * Uses React Navigation's native stack navigator for optimal performance
 */
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screen imports
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import UserPairingScreen from '../screens/UserPairingScreen';
import UserSetPINScreen from '../screens/UserSetPINScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <Stack.Navigator>
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
            
            {/* Main caregiver dashboard */}
            <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ headerShown: false }}
                />
            
            {/* User pairing and setup flow */}
            <Stack.Screen
                name="UserPairing"
                component={UserPairingScreen}
                options={{ headerShown: false }}
                />
            <Stack.Screen
                name="UserSetPin"
                component={UserSetPINScreen}
                options={{ headerShown: false }}
                />
        </Stack.Navigator>
    );
}

export default AppNavigator;