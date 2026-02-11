/**
 * Bottom tab navigation component for elderly user interface.
 * 
 * Provides a simplified two-tab navigation optimized for accessibility:
 * - Home: User dashboard with active reminders
 * - Profile: User settings and paired profiles
 * 
 * Uses larger tab icons and labels for improved visibility and ease of use
 * for elderly users. Implements safe area handling for Android system UI.
 * 
 * @module UserTabs
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { UserTabsParamList } from '../types/index';

import UserHomeScreen from '../screens/UserHomeScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

const Tab = createBottomTabNavigator<UserTabsParamList>();

/**
 * User tab navigation component.
 * 
 * Renders a simplified bottom tab navigator designed for elderly users.
 * Features dynamic height adjustment for Android compatibility and
 * accessibility-focused design.
 * 
 * @returns Tab navigator component for user interface
 */
const UserTabs: React.FC = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    
    return (
        <Tab.Navigator
            id='user-tabs'
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: styles.activeTab.color,
                tabBarInactiveTintColor: styles.inactiveTab.color,
                tabBarStyle: {
                    height: 70 + insets.bottom,
                    paddingBottom: insets.bottom + 10,
                    paddingTop: 5,
                },
                tabBarLabelStyle: styles.tabBarLabel,
            }}
        >
            {/* Home tab - Dashboard */}
            <Tab.Screen 
                name="Home" 
                component={UserHomeScreen}
                options={{
                    tabBarLabel: t('tabs.Home'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            
            {/* Profile tab */}
            <Tab.Screen 
                name="Profile" 
                component={UserProfileScreen}
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
        color: '#999',
    },
    tabBar: {
        height: 70,
        paddingBottom: 10,
        paddingTop: 5,
    },
    tabBarLabel: {
        fontSize: 12,
    },
});

export default UserTabs;
