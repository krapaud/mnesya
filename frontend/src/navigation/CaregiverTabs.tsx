/**
 * CaregiverTabs - Bottom tab navigation for caregiver screens
 * Provides navigation between Dashboard, Reminders, and Profile
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { CaregiverTabsParamList } from '../types/index';

// Screen imports
import DashboardScreen from '../screens/DashboardScreen';
import RemindersListScreen from '../screens/RemindersListScreen';

const Tab = createBottomTabNavigator<CaregiverTabsParamList>();

const CaregiverTabs: React.FC = () => {
    const { t } = useTranslation();
    
    return (
        <Tab.Navigator
            id='caregiver-tabs'
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: styles.activeTab.color,
                tabBarInactiveTintColor: styles.inactiveTab.color,
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
                component={DashboardScreen}
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

export default CaregiverTabs;
