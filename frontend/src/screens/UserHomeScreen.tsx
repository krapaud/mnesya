/**
 * Main screen for elderly users, showing their upcoming reminders.
 *
 * @module UserHomeScreen
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { UserTabsParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { getUserInfo, deleteToken, deleteUserInfo } from '../services/tokenService';
import { useRefresh } from '../contexts/RefreshContext';
import { getUserReminders } from '../services/reminderService';
import { useReminderStatus } from '../hooks';
import { ConfirmationModal, MenuModal } from '../components';
import type { CaregiverProfile, ReminderData } from '../types/interfaces';

type Props = NativeStackScreenProps<UserTabsParamList, 'Refresh'>;

/** Maps reminder status keys to their corresponding style from commonStyles. */
const statusColorMap: Record<string, object> = {
    DONE: commonStyles.statusDone,
    PENDING: commonStyles.statusPending,
    POSTPONED: commonStyles.statusPostponed,
    UNABLE: commonStyles.statusUnable,
    MISSED: commonStyles.statusMissed,
};

interface UserReminderItemProps {
    reminder: ReminderData;
    onBellPress: () => void;
    reloadTrigger?: number;
}

/**
 * Displays a single reminder card with its status badge.
 * The bell icon is disabled (grey) when the status is DONE or UNABLE.
 *
 * Extracted as a sub-component so that `useReminderStatus` can be called
 * as a proper React hook (hooks cannot be called inside `.map()`).
 */
const UserReminderItem: React.FC<UserReminderItemProps> = ({
    reminder,
    onBellPress,
    reloadTrigger,
}) => {
    const { t } = useTranslation();
    const { reminderStatus } = useReminderStatus(reminder.id, undefined, reloadTrigger);

    const statusKey = reminderStatus?.status
        ? reminderStatus.status.charAt(0).toUpperCase() +
          reminderStatus.status.slice(1).toLowerCase()
        : null;

    const isClosed =
        reminderStatus?.status === 'DONE' ||
        reminderStatus?.status === 'UNABLE' ||
        reminderStatus?.status === 'MISSED';

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
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                }}
            >
                <View style={commonStyles.reminderDetails}>
                    <View style={commonStyles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#666666" />
                        <Text style={commonStyles.detailText}>
                            {new Date(reminder.scheduled_at).toLocaleDateString('fr-FR')}
                        </Text>
                    </View>
                    <View style={commonStyles.detailRow}>
                        <Ionicons name="time-outline" size={16} color="#666666" />
                        <Text style={commonStyles.detailText}>
                            {new Date(reminder.scheduled_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>
                </View>
                {statusKey && (
                    <Text
                        style={[
                            commonStyles.statusText,
                            statusColorMap[reminderStatus!.status] ?? commonStyles.statusPending,
                        ]}
                    >
                        {t(`reminders.status.${statusKey}`)}
                    </Text>
                )}
            </View>
        </View>
    );
};

const UserHomeScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const { refreshTrigger, isRefreshing, setIsRefreshing, triggerRefresh } = useRefresh();

    const [showAlert, setShowAlert] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [currentUser, setCurrentUser] = useState<CaregiverProfile | null>(null);
    const [userReminders, setUserReminders] = useState<ReminderData[]>([]);
    const [focusTrigger, setFocusTrigger] = useState(0);

    /** Controls the bottom fade indicator — hidden when scrolled to the end. */
    const [showScrollFade, setShowScrollFade] = useState(true);
    const [isScrollable, setIsScrollable] = useState(false);
    const scrollContainerHeight = useRef(0);

    const handleContentSizeChange = (_: number, contentHeight: number) => {
        setIsScrollable(contentHeight > scrollContainerHeight.current);
    };

    const handleScroll = (event: {
        nativeEvent: {
            contentOffset: { y: number };
            layoutMeasurement: { height: number };
            contentSize: { height: number };
        };
    }) => {
        const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
        const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 10;
        setShowScrollFade(!isAtBottom);
    };

    /**
     * Increments focusTrigger each time the screen comes into focus,
     * which causes loadUserData to re-run via the useEffect below.
     */
    useFocusEffect(
        useCallback(() => {
            setFocusTrigger((prev) => prev + 1);
        }, [])
    );

    /**
     * Loads user data and reminders.
     * Re-runs when refreshTrigger changes (pull-to-refresh) or focusTrigger changes (screen focus).
     */
    useEffect(() => {
        const loadUserData = async () => {
            const user = await getUserInfo();
            setCurrentUser(user);

            const reminders = await getUserReminders();
            setUserReminders(reminders);

            setIsRefreshing(false);
        };
        loadUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger, focusTrigger]);

    const isReminderAvailable = (scheduled_at: string): boolean => {
        return new Date(scheduled_at) <= new Date();
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
        } catch (_error) {}
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
                    style={styles.menuButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowMenu(true);
                    }}
                >
                    <Ionicons name="ellipsis-vertical" size={24} color="#333333" />
                </TouchableOpacity>
            </View>

            {/*
             * Personalized greeting using the user's first name
             * Helps elderly users feel comfortable with the app
             */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>
                    {t('UserHome.greeting')} {currentUser?.first_name} !
                </Text>
                <Text style={styles.subtitle}>{t('UserHome.subtitle')}</Text>
            </View>
            <View style={styles.listWrapper}>
                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={triggerRefresh} />
                    }
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onLayout={(e) => {
                        scrollContainerHeight.current = e.nativeEvent.layout.height;
                    }}
                    onContentSizeChange={handleContentSizeChange}
                >
                    {/*
                     * Reminder list with empty state handling
                     * Each reminder displayed as a card with tap feedback for accessibility
                     */}
                    {userReminders.length === 0 ? (
                        <Text style={commonStyles.emptyMessage}>
                            {t('UserHome.messages.noReminders')}
                        </Text>
                    ) : (
                        userReminders.map((reminder) => (
                            <UserReminderItem
                                key={reminder.id}
                                reminder={reminder}
                                reloadTrigger={refreshTrigger + focusTrigger}
                                onBellPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    if (isReminderAvailable(reminder.scheduled_at)) {
                                        navigation.getParent()?.navigate('ReminderNotification', {
                                            reminderId: reminder.id,
                                        });
                                    } else {
                                        setShowAlert(true);
                                    }
                                }}
                            />
                        ))
                    )}
                </ScrollView>
                {/* Bottom fade — signals more content below */}
                {showScrollFade && isScrollable && (
                    <View style={styles.scrollFade} pointerEvents="none">
                        <Ionicons name="chevron-down" size={24} color="#4A90E2" />
                    </View>
                )}
            </View>
            {/* Info Alert Modal */}
            <ConfirmationModal
                visible={showAlert}
                onClose={() => setShowAlert(false)}
                title={t('UserHome.messages.notAvailableMessage')}
                message=""
                icon="information-circle-outline"
                iconColor="#4A90E2"
                confirmText={t('UserHome.messages.ok')}
                confirmColor="#4A90E2"
                showCancelButton={false}
            />

            {/* Menu Modal */}
            <MenuModal
                visible={showMenu}
                onClose={() => setShowMenu(false)}
                actions={[
                    {
                        label: t('UserProfile.buttons.Logout'),
                        icon: 'log-out-outline',
                        color: '#E74C3C',
                        onPress: () => setShowLogoutConfirm(true),
                    },
                ]}
            />

            {/* Logout Confirm Modal */}
            <ConfirmationModal
                visible={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogoutConfirm}
                title={t('caregiverProfile.modal.title')}
                message={t('caregiverProfile.modal.message')}
                icon="log-out-outline"
                iconColor="#E53935"
                confirmText={t('caregiverProfile.modal.confirm')}
                cancelText={t('caregiverProfile.modal.cancel')}
            />
        </View>
    );
};

export default UserHomeScreen;

const styles = StyleSheet.create({
    // LAYOUT
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 20,
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
    listWrapper: {
        flex: 1,
        position: 'relative',
    },
    scrollFade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    // Menu styles
    menuButton: {
        padding: 8,
    },
});
