/**
 * Screen showing the full list of reminders for a caregiver.
 *
 * Features:
 * - Filter by profile (shows full name) and by date using `FilterPickerModal`
 * - Delete a reminder with a confirmation modal before proceeding
 *
 * @component
 */
import React, { useCallback, useState, useRef } from 'react';
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
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, CaregiverTabsParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelNotifications } from '../utils/notifications';
import { deleteReminder } from '../services/reminderService';
import { useCaregiverReminders } from '../hooks';
import ReminderCard from '../components/ReminderCard';
import FilterPickerModal from '../components/FilterPickerModal';
import { ConfirmationModal } from '../components';

type Props = CompositeScreenProps<
    BottomTabScreenProps<CaregiverTabsParamList, 'Reminders'>,
    NativeStackScreenProps<RootStackParamList>
>;

const RemindersListScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const { reminderData, loading: _loading, error: _error, reload } = useCaregiverReminders();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [reloadCounter, setReloadCounter] = useState(0);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await reload();
        setReloadCounter((c) => c + 1);
        setIsRefreshing(false);
    }, [reload]);

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

    useFocusEffect(
        useCallback(() => {
            reload();
            setReloadCounter((c) => c + 1);
        }, [reload])
    );

    // Filter state management for profile and date selection
    const [selectedProfile, setSelectedProfile] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [showProfilePicker, setShowProfilePicker] = useState<boolean>(false);
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<boolean>(false);

    // Filter reminders based on selected profile and date
    const getFilteredReminders = () => {
        return reminderData
            ?.filter((reminder) => {
                const matchProfile = !selectedProfile || reminder.user_id === selectedProfile;
                const matchDate = !selectedDate || reminder.scheduled_at === selectedDate;
                return matchProfile && matchDate;
            })
            .sort(
                (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
            );
    };

    // Get unique profiles as {id, name} objects (deduplicated by user_id)
    const uniqueProfiles = Array.from(
        new Map(
            reminderData?.map((r) => [
                r.user_id,
                {
                    id: r.user_id,
                    name:
                        r.user_first_name && r.user_last_name
                            ? `${r.user_first_name} ${r.user_last_name}`
                            : r.user_id,
                },
            ]) ?? []
        ).values()
    );

    // Get the display name for the currently selected profile
    const selectedProfileName = uniqueProfiles.find((p) => p.id === selectedProfile)?.name;

    // Get unique dates filtered by selected profile
    const uniqueDates = Array.from(
        new Set(
            reminderData
                ?.filter((r) => !selectedProfile || r.user_id === selectedProfile)
                .map((r) => r.scheduled_at)
        )
    );

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    /**
     * Initiates the reminder deletion flow by storing the target ID.
     * The actual deletion is deferred until the user confirms in the modal.
     */
    const handleDeleteReminder = (reminderId: string) => {
        setPendingDeleteId(reminderId);
    };

    /**
     * Executes the deletion after user confirmation:
     * cancels scheduled notifications, removes the reminder, then reloads the list.
     */
    const confirmDeleteReminder = async () => {
        if (!pendingDeleteId) return;
        try {
            const storageKey = `notification_ids_${pendingDeleteId}`;
            const storedIds = await AsyncStorage.getItem(storageKey);
            if (storedIds) {
                const notificationIds = JSON.parse(storedIds) as string[];
                await cancelNotifications(notificationIds);
                await AsyncStorage.removeItem(storageKey);
            }
            await deleteReminder(pendingDeleteId);
            reload();
        } catch {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setDeleteError(true);
        } finally {
            setPendingDeleteId(null);
        }
    };

    return (
        <View style={commonStyles.container}>
            {/* Header with app logo and name */}
            <View style={commonStyles.header}>
                <View style={commonStyles.headerSpacer} />
                <View style={commonStyles.headerCenter}>
                    <Image
                        source={require('../../assets/mnesya-logo.png')}
                        style={commonStyles.logo}
                    />
                    <Text style={commonStyles.appName}>Mnesya</Text>
                </View>
                <View style={commonStyles.headerSpacer} />
            </View>
            {/* Page title */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>{t('reminders.Title')}</Text>
            </View>

            {/* Action button */}
            <TouchableOpacity
                style={commonStyles.primaryButton}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('CreateReminder', {});
                }}
            >
                <Text style={commonStyles.primaryButtonText}>
                    {t('reminders.buttons.New Reminder')}
                </Text>
            </TouchableOpacity>

            {/* Filters section */}
            <View style={styles.filtersSection}>
                <View style={styles.filterRow}>
                    <View style={styles.filterItem}>
                        <Text style={styles.filterLabel}>
                            {t('reminders.pickersTitle.Profile')}:
                        </Text>
                        <TouchableOpacity
                            style={styles.filterDropdown}
                            onPress={() => {
                                setShowProfilePicker(!showProfilePicker);
                                setShowDatePicker(false);
                            }}
                        >
                            <Text style={styles.filterDropdownText}>
                                {selectedProfileName || t('common.pickersText.All Profiles')}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#666666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.filterItem}>
                        <Text style={styles.filterLabel}>{t('reminders.labels.Date:')}</Text>
                        <TouchableOpacity
                            style={styles.filterDropdown}
                            onPress={() => {
                                setShowDatePicker(!showDatePicker);
                                setShowProfilePicker(false);
                            }}
                        >
                            <Text style={styles.filterDropdownText}>
                                {selectedDate
                                    ? formatDate(selectedDate)
                                    : t('common.pickersText.All Dates')}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#666666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Reset filters button */}
                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => {
                        if (selectedProfile || selectedDate) {
                            setSelectedProfile('');
                            setSelectedDate('');
                        }
                    }}
                    disabled={!selectedProfile && !selectedDate}
                >
                    <Ionicons
                        name="close-circle"
                        size={16}
                        color={selectedProfile || selectedDate ? '#4A90E2' : '#CCCCCC'}
                    />
                    <Text
                        style={[
                            styles.resetButtonText,
                            !(selectedProfile || selectedDate) && styles.resetButtonTextDisabled,
                        ]}
                    >
                        {t('reminders.buttons.Reset Filters')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Reminder delete confirmation */}
            <ConfirmationModal
                visible={pendingDeleteId !== null}
                onClose={() => setPendingDeleteId(null)}
                onConfirm={confirmDeleteReminder}
                title={t('reminders.deleteModal.title')}
                message={t('reminders.deleteModal.message')}
                icon="trash-outline"
                iconColor="#E53935"
                confirmText={t('reminders.deleteModal.confirm')}
                confirmColor="#E53935"
            />

            {/* Reminder delete error */}
            <ConfirmationModal
                visible={deleteError}
                onClose={() => setDeleteError(false)}
                title={t('common.errors.genericErrorTitle')}
                message={t('common.errors.failedToDeleteReminder')}
                icon="alert-circle-outline"
                iconColor="#E53935"
                confirmText="OK"
                confirmColor="#4A90E2"
                showCancelButton={false}
            />

            {/* Profile Picker Modal */}
            <FilterPickerModal
                visible={showProfilePicker}
                title={t('reminders.pickersTitle.Profile')}
                items={[
                    { value: '', label: t('common.pickersText.All Profiles') },
                    ...uniqueProfiles.map((p) => ({ value: p.id, label: p.name })),
                ]}
                selectedValue={selectedProfile}
                onSelect={(value) => {
                    setSelectedProfile(value);
                    setShowProfilePicker(false);
                }}
                onClose={() => setShowProfilePicker(false)}
            />

            {/* Date Picker Modal */}
            <FilterPickerModal
                visible={showDatePicker}
                title={t('reminders.labels.Date:')}
                items={[
                    { value: '', label: t('common.pickersText.All Dates') },
                    ...uniqueDates.map((d) => ({ value: d, label: formatDate(d) })),
                ]}
                selectedValue={selectedDate}
                onSelect={(value) => {
                    setSelectedDate(value);
                    setShowDatePicker(false);
                }}
                onClose={() => setShowDatePicker(false)}
            />

            {/* Delete error feedback */}
            {deleteError && (
                <View style={commonStyles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={24} color="#E53935" />
                    <Text style={commonStyles.errorText}>{t('reminders.errors.deleteError')}</Text>
                </View>
            )}

            {/* Reminders list */}
            <View style={styles.listWrapper}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.remindersList}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                    }
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onLayout={(e) => {
                        scrollContainerHeight.current = e.nativeEvent.layout.height;
                    }}
                    onContentSizeChange={handleContentSizeChange}
                >
                    {(getFilteredReminders?.() ?? []).length === 0 ? (
                        <Text style={commonStyles.emptyMessage}>No reminders yet</Text>
                    ) : (
                        (getFilteredReminders?.() ?? []).map((reminder) => (
                            <ReminderCard
                                key={reminder.id}
                                reminder={reminder}
                                onDelete={handleDeleteReminder}
                                reloadTrigger={reloadCounter}
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
        </View>
    );
};

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

    // FILTER COMPONENTS
    filtersSection: {
        marginTop: 10,
        marginBottom: 10,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    filterItem: {
        flex: 1,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
        color: '#333333',
    },
    filterDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        minHeight: 44,
    },
    filterDropdownText: {
        fontSize: 16,
        color: '#333333',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 1,
        gap: 6,
    },
    resetButtonText: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: '600',
    },
    resetButtonTextDisabled: {
        color: '#CCCCCC',
    },
    remindersList: {
        flex: 1,
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
});

export default RemindersListScreen;
