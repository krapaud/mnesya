/**
 * Main screen for elderly users, showing their upcoming reminders.
 *
 * @module UserHomeScreen
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UserTabsParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { getUserInfo, deleteToken, deleteUserInfo } from '../services/tokenService';
import { useRefresh } from '../contexts/RefreshContext';
import { getUserReminders } from '../services/reminderService';
import { useReminderStatus } from '../hooks';
import type { CaregiverProfile, ReminderData } from '../types/interfaces';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../services/api';
import i18n from '../i18n';

type Props = NativeStackScreenProps<UserTabsParamList, 'Refresh'>;

/** Maps reminder status keys to their corresponding style from commonStyles. */
const statusColorMap: Record<string, object> = {
    'DONE': commonStyles.statusDone,
    'PENDING': commonStyles.statusPending,
    'POSTPONED': commonStyles.statusPostponed,
    'UNABLE': commonStyles.statusUnable,
};

interface UserReminderItemProps {
    reminder: ReminderData;
    onBellPress: () => void;
}

/**
 * Displays a single reminder card with its status badge.
 * The bell icon is disabled (grey) when the status is DONE or UNABLE.
 *
 * Extracted as a sub-component so that `useReminderStatus` can be called
 * as a proper React hook (hooks cannot be called inside `.map()`).
 */
const UserReminderItem: React.FC<UserReminderItemProps> = ({ reminder, onBellPress }) => {
    const { t } = useTranslation();
    const { reminderStatus } = useReminderStatus(reminder.id);

    const statusKey = reminderStatus?.status
        ? reminderStatus.status.charAt(0).toUpperCase() + reminderStatus.status.slice(1).toLowerCase()
        : null;

    const isClosed = reminderStatus?.status === 'DONE' || reminderStatus?.status === 'UNABLE';

    return (
        <View style={commonStyles.reminderCard}>
            <View style={commonStyles.reminderHeader}>
                <Text style={commonStyles.reminderTitle}>{reminder.title}</Text>
                <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={isClosed ? undefined : onBellPress}
                    disabled={isClosed}
                >
                    <Ionicons
                        name="notifications-outline"
                        size={28}
                        color={isClosed ? '#CCCCCC' : '#4A90E2'}
                    />
                </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View style={commonStyles.reminderDetails}>
                    <View style={commonStyles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#666666" />
                        <Text style={commonStyles.detailText}>{new Date(reminder.scheduled_at).toLocaleDateString('fr-FR')}</Text>
                    </View>
                    <View style={commonStyles.detailRow}>
                        <Ionicons name="time-outline" size={16} color="#666666" />
                        <Text style={commonStyles.detailText}>{new Date(reminder.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                </View>
                {statusKey && (
                    <Text style={[commonStyles.statusText, statusColorMap[reminderStatus!.status] ?? commonStyles.statusPending]}>
                        {t(`reminders.status.${statusKey}`)}
                    </Text>
                )}
            </View>
        </View>
    );
};

const UserHomeScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const { refreshTrigger, isRefreshing, setIsRefreshing } = useRefresh();

    const [showAlert, setShowAlert] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [currentUser, setCurrentUser] = useState<CaregiverProfile | null>(null);
    const [userReminders, setUserReminders] = useState<ReminderData[]>([]);
    const [_loading, setLoading] = useState(true);
    const loadUserTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Re-register push token on every app open (handles token refresh or reinstall)
    useEffect(() => {
        const registerToken = async () => {
            try {
                const expoPushToken = await SecureStore.getItemAsync('expo_push_token');
                const user = await getUserInfo();
                if (expoPushToken && user?.user_id) {
                    await apiClient.post('/api/push-tokens/register', {
                        token: expoPushToken,
                        user_id: user.user_id,
                        locale: i18n.language
                    });
                }
            } catch (err) {
                console.error('[UserHome] Failed to re-register push token:', err);
            }
        };
        registerToken();
    }, []);

    /**
     * Loads user data and filters reminders.
     * Re-runs when refreshTrigger changes (when user taps refresh button).
     * Ensures loading indicator displays for minimum 1 second for better UX.
     */
    useEffect(() => {
        const loadUserData = async () => {
            const startTime = Date.now();
            
            const user = await getUserInfo();
            setCurrentUser(user);
            
            const reminders = await getUserReminders();
            setUserReminders(reminders);
            
            // Ensure minimum 1 second display time for loading indicator
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1000 - elapsedTime);
            
            loadUserTimerRef.current = setTimeout(() => {
                setLoading(false);
                setIsRefreshing(false);
            }, remainingTime);
        };
        loadUserData();

        return () => {
            if (loadUserTimerRef.current) {
                clearTimeout(loadUserTimerRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger]);

    const isReminderAvailable = (scheduled_at: string): boolean => {
        return new Date(scheduled_at) <= new Date();
    };

    /**
     * Handles user logout by clearing tokens and navigation reset.
     * Removes stored authentication token and user info, then redirects to Welcome screen.
     */
    const _handleLogout = async () => {
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            await deleteToken();
            await deleteUserInfo();
            
            // Reset navigation to Welcome screen
            navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
            });
        } catch (_error) {
        }
        setShowLogoutConfirm(false);
    };

    return (
        <View style={commonStyles.container}>
            {/* Header with logo */}
            <View style={commonStyles.header}>
                <View style={commonStyles.headerSpacer} />
                <View style={commonStyles.headerCenter}>
                    <Image 
                        source={require('../../assets/mnesya-logo.png')} 
                        style={commonStyles.logo}
                    />
                    <Text style={commonStyles.appName}>Mnesya</Text>
                </View>
                    <TouchableOpacity 
                    style={commonStyles.headerSpacer}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowMenu(true);
                    }}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#333333" />
                </TouchableOpacity>
            </View>

            {/* 
             * Personalized greeting using the user's first name
             * Helps elderly users feel comfortable with the app
             */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>{t('UserHome.greeting')} {currentUser?.first_name} !</Text>
                <Text style={styles.subtitle}>{t('UserHome.subtitle')}</Text>
            </View>
            <ScrollView>
                {/* 
                 * Reminder list with empty state handling
                 * Each reminder displayed as a card with tap feedback for accessibility
                 */}
                {userReminders.length === 0 ? (
                    <Text style={commonStyles.emptyMessage}>{t('UserHome.messages.noReminders')}</Text>
                ) : (
                    userReminders.map((reminder) => (
                        <UserReminderItem
                            key={reminder.id}
                            reminder={reminder}
                            onBellPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                if (isReminderAvailable(reminder.scheduled_at)) {
                                    navigation.getParent()?.navigate('ReminderNotification', { reminderId: reminder.id });
                                } else {
                                    setShowAlert(true);
                                }
                            }}
                        />
                    ))
                )}
            </ScrollView>
            <Modal
                transparent={true}
                visible={showAlert}
                animationType="fade"
            >
                <View style={commonStyles.modalOverlay}>
                    <View style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, width: '80%' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>{t('UserHome.messages.notAvailableTitle')}</Text>
                        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>{t('UserHome.messages.notAvailableMessage')}</Text>
                        <TouchableOpacity 
                            style={{ backgroundColor: '#4A90E2', padding: 18, borderRadius: 5 }}
                            onPress={() => setShowAlert(false)}
                        >
                            <Text style={{ color: '#FFFFFF', textAlign: 'center', fontSize: 16 }}>{t('UserHome.messages.ok')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Menu Modal */}
            <Modal
                transparent={true}
                visible={showMenu}
                animationType="fade"
                onRequestClose={() => setShowMenu(false)}
            >
                <TouchableOpacity 
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMenu(false)}
                >
                        <View style={styles.menuContent}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333333', paddingHorizontal: 16, paddingVertical: 8 }}>{t('UserProfile.title')}</Text>
                            <TouchableOpacity 
                                style={styles.menuItem}
                                onPress={async () => {
                                    setShowMenu(false);
                                    setShowLogoutConfirm(true);
                                }}
                            >
                                <Ionicons name="log-out-outline" size={24} color="#E74C3C" />
                                <Text style={styles.menuItemText}>{t('UserProfile.buttons.Logout')}</Text>
                            </TouchableOpacity>
                        </View>
                </TouchableOpacity>
            </Modal>

            {/* Logout Confirm Modal */}
            <Modal
                transparent={true}
                visible={showLogoutConfirm}
                animationType="fade"
                onRequestClose={() => setShowLogoutConfirm(false)}
            >
                <View style={commonStyles.modalOverlay}>
                    <View style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, width: '80%' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
                            {t('caregiverProfile.modal.title')}
                        </Text>
                        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#666666' }}>
                            {t('caregiverProfile.modal.message')}
                        </Text>
                        <TouchableOpacity 
                            style={{ backgroundColor: '#E74C3C', padding: 15, borderRadius: 8, marginBottom: 10 }}
                            onPress={handleLogoutConfirm}
                        >
                            <Text style={{ color: '#FFFFFF', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                                {t('caregiverProfile.modal.confirm')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={{ backgroundColor: '#F0F0F0', padding: 15, borderRadius: 8 }}
                            onPress={() => setShowLogoutConfirm(false)}
                        >
                            <Text style={{ color: '#333333', textAlign: 'center', fontSize: 16 }}>
                                {t('caregiverProfile.modal.cancel')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Refresh loading overlay */}
            {isRefreshing && (
                <View style={styles.refreshOverlay}>
                    <View style={styles.refreshIndicator}>
                        <ActivityIndicator size="large" color="#4A90E2" />
                        <Text style={styles.refreshText}>{t('common.messages.loading')}</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

export default UserHomeScreen;

const styles = StyleSheet.create({
    // LAYOUT
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 30,
        marginBottom: 20,
    },
    
    // TYPOGRAPHY
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666666',
        marginBottom: 40,
    },
    // Refresh overlay styles
    refreshOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshIndicator: {
        backgroundColor: '#FFFFFF',
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    refreshText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666666',
    },
    // Menu styles
    menuOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 110,
        paddingRight: 20,
    },
    menuContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 200,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        gap: 10,
    },
    menuItemText: {
        fontSize: 16,
        color: '#E74C3C',
        fontWeight: '500',
    },
});
