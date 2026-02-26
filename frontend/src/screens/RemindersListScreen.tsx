/**
 * Screen showing the full list of reminders for a caregiver.
 *
 * Features:
 * - Filter by profile (shows full name) and by date using `FilterPickerModal`
 * - Delete a reminder with a confirmation modal before proceeding
 *
 * @component
 */
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
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
    const { reminderData, loading, error, reload } = useCaregiverReminders();

    useFocusEffect(
        useCallback(() => {
            reload();
        }, [reload])
    );

    // Filter state management for profile and date selection
    const [selectedProfile, setSelectedProfile] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [showProfilePicker, setShowProfilePicker] = useState<boolean>(false);
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState(false);

    // Filter reminders based on selected profile and date
    const getFilteredReminders = () => {
        return reminderData?.filter(reminder => {
            const matchProfile = !selectedProfile || reminder.user_id === selectedProfile;
            const matchDate = !selectedDate || reminder.scheduled_at === selectedDate;
            return matchProfile && matchDate;
        });
    };

    // Get unique profiles as {id, name} objects (deduplicated by user_id)
    const uniqueProfiles = Array.from(
        new Map(
            reminderData?.map(r => [
                r.user_id,
                {
                    id: r.user_id,
                    name: r.user_first_name && r.user_last_name
                        ? `${r.user_first_name} ${r.user_last_name}`
                        : r.user_id,
                },
            ]) ?? []
        ).values()
    );

    // Get the display name for the currently selected profile
    const selectedProfileName = uniqueProfiles.find(p => p.id === selectedProfile)?.name;

    // Get unique dates
    const uniqueDates = Array.from(new Set(reminderData?.map(r => r.scheduled_at)));

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
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
        } catch (error) {
            console.error('[DeleteReminder] Error:', error);
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
                        }}>
                        <Text style={commonStyles.primaryButtonText}>{t('reminders.buttons.New Reminder')}</Text>
                    </TouchableOpacity>

                    {/* Filters section */}
                    <View style={styles.filtersSection}>
                        <View style={styles.filterRow}>
                            <View style={styles.filterItem}>
                                <Text style={styles.filterLabel}>{t('reminders.pickersTitle.Profile')}:</Text>
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
                                        {selectedDate ? formatDate(selectedDate) : t('common.pickersText.All Dates')}
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
                                color={(selectedProfile || selectedDate) ? "#4A90E2" : "#CCCCCC"} 
                            />
                            <Text style={[
                                styles.resetButtonText,
                                !(selectedProfile || selectedDate) && styles.resetButtonTextDisabled
                            ]}>
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
                            ...uniqueProfiles.map(p => ({ value: p.id, label: p.name })),
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
                            ...uniqueDates.map(d => ({ value: d, label: formatDate(d) })),
                        ]}
                        selectedValue={selectedDate}
                        onSelect={(value) => {
                            setSelectedDate(value);
                            setShowDatePicker(false);
                        }}
                        onClose={() => setShowDatePicker(false)}
                    />

                    {/* Reminders list */}
                    {loading && (
                        <View style={commonStyles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4A90E2" />
                            <Text style={commonStyles.loadingText}>{t('common.messages.loading')}</Text>
                        </View>
                    )}
                    {error && !loading && (
                        <View style={commonStyles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
                            <Text style={commonStyles.errorText}>{t(error)}</Text>
                        </View>
                    )}
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.remindersList}>
                        {!loading && !error && (getFilteredReminders?.() ?? []).length === 0 ? (
                            <Text style={commonStyles.emptyMessage}>{t('reminders.messages.noReminders')}</Text>
                        ) : (
                            (getFilteredReminders?.() ?? []).map((reminder) => (
                                <ReminderCard
                                    key={reminder.id}
                                    reminder={reminder}
                                    onDelete={handleDeleteReminder}
                                />
                            ))
                        )}
                    </ScrollView>
            </View>
        );
};

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
});

export default RemindersListScreen;
