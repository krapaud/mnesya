/**
 * Screen showing the full list of reminders with filters.
 * 
 * @component
 */
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
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

type Props = CompositeScreenProps<
    BottomTabScreenProps<CaregiverTabsParamList, 'Reminders'>,
    NativeStackScreenProps<RootStackParamList>
>;

const RemindersListScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const { reminderData, loading: _loading, error: _error, reload } = useCaregiverReminders();

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

    // Filter reminders based on selected profile and date
    const getFilteredReminders = () => {
        return reminderData?.filter(reminder => {
            const matchProfile = !selectedProfile || reminder.user_id === selectedProfile;
            const matchDate = !selectedDate || reminder.scheduled_at === selectedDate;
            return matchProfile && matchDate;
        });
    };

    // Get unique profile names
    const uniqueProfiles = Array.from(new Set(reminderData?.map(r => r.user_id)));

    // Get unique dates
    const uniqueDates = Array.from(new Set(reminderData?.map(r => r.scheduled_at)));

    const handleDeleteReminder = async (reminderId: number) => {
        try {

            const storageKey = `notification_ids_${reminderId}`;
            const storedIds = await AsyncStorage.getItem(storageKey);

            if (storedIds) {
                const notificationIds = JSON.parse(storedIds) as string[];
                await cancelNotifications(notificationIds);
                await AsyncStorage.removeItem(storageKey);
            }
            await deleteReminder(String(reminderId));
            reload();
        } catch (_error) {
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
                                        {selectedProfile || t('common.pickersText.All Profiles')}
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
                                        {selectedDate || t('common.pickersText.All Dates')}
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

                    {/* Profile Picker Modal */}
                    {showProfilePicker && (
                        <View style={styles.pickerContainer}>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={selectedProfile}
                                    onValueChange={(itemValue) => setSelectedProfile(itemValue)}
                                >
                                    <Picker.Item label={t('common.pickersText.All Profiles')} value="" />
                                    {uniqueProfiles.map((profile) => (
                                        <Picker.Item 
                                            key={profile} 
                                            label={profile} 
                                            value={profile} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                            <TouchableOpacity
                                style={[commonStyles.primaryButton, { marginTop: 10 }]}
                                onPress={() => setShowProfilePicker(false)}
                            >
                                <Text style={commonStyles.primaryButtonText}>Validate</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Date Picker Modal */}
                    {showDatePicker && (
                        <View style={styles.pickerContainer}>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={selectedDate}
                                    onValueChange={(itemValue) => setSelectedDate(itemValue)}
                                >
                                    <Picker.Item label={t('common.pickersText.All Dates')} value="" />
                                    {uniqueDates.map((date) => (
                                        <Picker.Item 
                                            key={date} 
                                            label={date} 
                                            value={date} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                            <TouchableOpacity
                                style={[commonStyles.primaryButton, { marginTop: 10 }]}
                                onPress={() => setShowDatePicker(false)}
                            >
                                <Text style={commonStyles.primaryButtonText}>{t('common.buttons.Validate')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Reminders list */}
                    {!showProfilePicker && !showDatePicker && (
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.remindersList}>
                        {(getFilteredReminders?.() ?? []).length === 0 ? (
                            <Text style={commonStyles.emptyMessage}>No reminders yet</Text>
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
                    )}
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
    pickerContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        marginTop: 10,
    },
    pickerWrapper: {
        width: '100%',
        height: 150,
        overflow: 'hidden',
        borderRadius: 10,
    },
    remindersList: {
        flex: 1,
    },
});

export default RemindersListScreen;
