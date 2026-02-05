/**
 * RemindersListScreen - Displays a filterable list of all reminders
 * 
 * Allows caregivers to view and manage reminders across all profiles.
 * Features dropdown filters for profile and date selection with dynamic filtering.
 * 
 * Key features:
 * - Filter by profile and/or date
 * - Reset filters button (only active when filters applied)
 * - Status badges with color coding for each reminder
 * - Scrollable list view with empty state handling
 * 
 * @component
 * @param {Props} navigation - Navigation object for screen transitions
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { ReminderItem } from '../types/interfaces';
import { fakeReminders } from '../data/fakeData';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const RemindersListScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    // Reminders data - currently using fake data, will be replaced with API in Sprint 2
    const [reminders, setReminders] = useState(fakeReminders);

    // Filter state management for profile and date selection
    const [selectedProfile, setSelectedProfile] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [showProfilePicker, setShowProfilePicker] = useState<boolean>(false);
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

    // Filter reminders based on selected profile and date
    const getFilteredReminders = () => {
        return reminders.filter(reminder => {
            const matchProfile = !selectedProfile || reminder.profileName === selectedProfile;
            const matchDate = !selectedDate || reminder.date === selectedDate;
            return matchProfile && matchDate;
        });
    };

    // Get unique profile names
    const uniqueProfiles = Array.from(new Set(reminders.map(r => r.profileName)));

    // Get unique dates
    const uniqueDates = Array.from(new Set(reminders.map(r => r.date)));

    return (
         <View style={commonStyles.container}>
                    {/* Header with back button and logo */}
                    <View style={commonStyles.header}>
                        <TouchableOpacity onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.goBack();
                        }}>
                            <View style={commonStyles.ArrowIconCircle}>
                                <Ionicons name="arrow-back" size={24} color='#4A90E2'
                            />
                            </View>
                        </TouchableOpacity>
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
                    <View style={commonStyles.titleSection}>
                        <Text style={commonStyles.title}>{t('reminders.Title')}</Text>
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
                                    <Ionicons name="chevron-down" size={20} color="#666" />
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
                                    <Ionicons name="chevron-down" size={20} color="#666" />
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
                                style={[commonStyles.validateButton, { marginTop: 10 }]}
                                onPress={() => setShowProfilePicker(false)}
                            >
                                <Text style={commonStyles.validateButtonText}>Validate</Text>
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
                                style={[commonStyles.validateButton, { marginTop: 10 }]}
                                onPress={() => setShowDatePicker(false)}
                            >
                                <Text style={commonStyles.validateButtonText}>{t('common.buttons.Validate')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Reminders list */}
                    {!showProfilePicker && !showDatePicker && (
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.remindersList}>
                        {getFilteredReminders().length === 0 ? (
                            <Text style={commonStyles.emptyMessage}>No reminders yet</Text>
                        ) : (
                            getFilteredReminders().map((reminder) => (
                                <View key={reminder.id} style={commonStyles.reminderCard}>
                                    <View style={commonStyles.reminderHeader}>
                                        <Text style={commonStyles.reminderTitle}>{reminder.title}</Text>
                                        <Text style={[commonStyles.statusText, commonStyles[`status${reminder.status}`]]}>
                                            {reminder.status}
                                        </Text>
                                    </View>
                                    
                                    <View style={commonStyles.reminderDetails}>
                                        <View style={commonStyles.detailRow}>
                                            <Ionicons name="person-outline" size={16} color="#666" />
                                            <Text style={commonStyles.detailText}>{reminder.profileName}</Text>
                                        </View>
                                        <View style={commonStyles.detailRow}>
                                            <Ionicons name="calendar-outline" size={16} color="#666" />
                                            <Text style={commonStyles.detailText}>{reminder.date}</Text>
                                        </View>
                                        <View style={commonStyles.detailRow}>
                                            <Ionicons name="time-outline" size={16} color="#666" />
                                            <Text style={commonStyles.detailText}>{reminder.time}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                    )}
            </View>
    );
};

const styles = StyleSheet.create({
    // Screen-specific styles
    filtersSection: {
        marginTop: 20,
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
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
        color: '#333',
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
    },
    filterDropdownText: {
        fontSize: 14,
        color: '#333',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 6,
    },
    resetButtonText: {
        fontSize: 14,
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
