/**
 * Bottom tabs for the caregiver interface (Home, Reminders, Profile).
 *
 * @module CaregiverTabs
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CaregiverTabsParamList } from '../types/index';

import DashboardScreen from '../screens/DashboardScreen';
import RemindersListScreen from '../screens/RemindersListScreen';
import CaregiverProfileScreen from '../screens/CaregiverProfileScreen';

const Tab = createBottomTabNavigator<CaregiverTabsParamList>();

const CaregiverTabs: React.FC = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            id="caregiver-tabs"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: styles.activeTab.color,
                tabBarInactiveTintColor: styles.inactiveTab.color,
                tabBarStyle: {
                    height: 40 + insets.bottom,
                    paddingBottom: 6 + insets.bottom,
                    paddingTop: 5,
                },
                tabBarLabelStyle: styles.tabBarLabel,
            }}
        >
            {/* Home tab - Dashboard */}
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    tabBarLabel: t('tabs.Home'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />

            {/* Reminders tab - List of all reminders */}
            <Tab.Screen
                name="Reminders"
                component={RemindersListScreen}
                options={{
                    tabBarLabel: t('tabs.Reminders'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="notifications" size={size} color={color} />
                    ),
                }}
            />

            {/* Profile tab */}
            <Tab.Screen
                name="Profile"
                component={CaregiverProfileScreen}
                options={{
                    tabBarLabel: t('tabs.Profile'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    activeTab: {
        color: '#4A90E2',
    },
    inactiveTab: {
        color: '#999999',
    },
    tabBarLabel: {
        fontSize: 12,
    },
});

export default CaregiverTabs;
