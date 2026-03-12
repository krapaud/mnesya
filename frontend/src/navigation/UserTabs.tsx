/**
 * Bottom tabs for the user interface (Home, Profile).
 *
 * @module UserTabs
 */
import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { UserTabsParamList } from '../types/index';

// ─── Navigator ──────────────────────────────────────────────────────────────

import UserHomeScreen from '../screens/UserHomeScreen';
import { RefreshProvider, useRefresh } from '../contexts/RefreshContext';
import EmergencyModal from '../components/EmergencyModal';

const Tab = createBottomTabNavigator<UserTabsParamList>();

const UserTabsContent: React.FC = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { triggerRefresh, isRefreshing } = useRefresh();
    const [emergencyVisible, setEmergencyVisible] = useState(false);

    return (
        <>
            <Tab.Navigator
                id="user-tabs"
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
                {/* Emergency button - Opens emergency numbers modal */}
                <Tab.Screen
                    name="Emergency"
                    component={UserHomeScreen}
                    listeners={() => ({
                        tabPress: (e) => {
                            e.preventDefault();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            setEmergencyVisible(true);
                        },
                    })}
                    options={{
                        tabBarIcon: ({ size }) => (
                            <Ionicons name="call" size={size} color="#E53E3E" />
                        ),
                        tabBarLabel: () => (
                            <Text style={styles.emergencyLabel}>{t('tabs.Emergency')}</Text>
                        ),
                    }}
                />

                {/* Refresh button - Single tab that reloads data */}
                <Tab.Screen
                    name="Refresh"
                    component={UserHomeScreen}
                    listeners={() => ({
                        tabPress: (e) => {
                            e.preventDefault();
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            triggerRefresh();
                        },
                    })}
                    options={{
                        tabBarIcon: ({ size }) =>
                            isRefreshing ? (
                                <ActivityIndicator size={size} color="#4A90E2" />
                            ) : (
                                <Ionicons name="refresh" size={size} color="#4A90E2" />
                            ),
                        tabBarLabel: () => (
                            <Text style={styles.refreshLabel}>{t('tabs.Refresh')}</Text>
                        ),
                    }}
                />
            </Tab.Navigator>

            <EmergencyModal
                visible={emergencyVisible}
                onClose={() => setEmergencyVisible(false)}
            />
        </>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    emergencyLabel: {
        fontSize: 12,
        color: '#E53E3E',
    },
    refreshLabel: {
        fontSize: 12,
        color: '#4A90E2',
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
