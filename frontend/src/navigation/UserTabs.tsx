/**
 * Bottom tabs for the user interface (Home, Profile).
 * 
 * @module UserTabs
 */
import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { UserTabsParamList } from '../types/index';

import UserHomeScreen from '../screens/UserHomeScreen';
import { RefreshProvider, useRefresh } from '../contexts/RefreshContext';

const Tab = createBottomTabNavigator<UserTabsParamList>();

const UserTabsContent: React.FC = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { triggerRefresh, isRefreshing } = useRefresh();
    
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
            {/* Refresh button - Single tab that reloads data */}
            <Tab.Screen 
                name="Refresh" 
                component={UserHomeScreen}
                listeners={() => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        // Trigger haptic feedback
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        // Show spinner then trigger refresh
                        triggerRefresh();
                    },
                })}
                options={{
                    tabBarLabel: t('tabs.Refresh'),
                    tabBarIcon: ({ color, size }) => (
                        isRefreshing
                            ? <ActivityIndicator size={size} color={color} />
                            : <Ionicons name="refresh" size={size} color={color} />
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
    tabBar: {
        height: 70,
        paddingBottom: 10,
        paddingTop: 5,
    },
    tabBarLabel: {
        fontSize: 12,
    },
});

const UserTabs: React.FC = () => {
    return (
        <RefreshProvider>
            <UserTabsContent />
        </RefreshProvider>
    );
};

export default UserTabs;
