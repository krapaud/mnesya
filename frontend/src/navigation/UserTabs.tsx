/**
 * UserTabs - Bottom tab navigation for elderly user screens
 * Provides simple navigation between Home and Profile (2 tabs for accessibility)
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { UserTabsParamList } from '../types/index';

// Screen imports
import UserHomeScreen from '../screens/UserHomeScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

const Tab = createBottomTabNavigator<UserTabsParamList>();

const UserTabs: React.FC = () => {
    return (
        <Tab.Navigator
            id='user-tabs'
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: styles.activeTab.color,
                tabBarInactiveTintColor: styles.inactiveTab.color,
            }}
        >
            {/* Home tab - Dashboard */}
            <Tab.Screen 
                name="Home" 
                component={UserHomeScreen}
                options={{
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
});

export default UserTabs;
