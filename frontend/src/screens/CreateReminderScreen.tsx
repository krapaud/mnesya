/**
 * CreateReminderScreen - Form for creating reminders for user profiles.
 * 
 * Allows caregivers to create scheduled reminders by selecting a profile,
 * entering a title and message, and choosing a date and time. Features
 * cross-platform pickers for profile, date, and time selection with
 * mutual exclusion to prevent UI overlap.
 * 
 * @module CreateReminderScreen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { fakeProfiles } from '../data/fakeData';
import { PlatformDatePicker, PlatformTimePicker, PlatformProfilePicker } from '../components';
import { scheduleReminderWithRepetitions } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateReminder'>;

/**
 * Screen component for creating reminders for user profiles.
 * 
 * Provides a comprehensive form with profile selection, title, message,
 * date and time inputs. Implements mutual exclusion between pickers to
 * ensure clean UI interaction.
 * 
 * @param props - Navigation props
 * @returns Reminder creation form screen
 */
const CreateReminderScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    /** Reminder title input state */
    const [reminderTitle, setReminderTitle] = useState<string>('');
    /** Reminder message/description input state */
    const [reminderMessage, setReminderMessage] = useState<string>('');
    /** Selected date and time for the reminder */
    const [reminderDate, setReminderDate] = useState<Date>(new Date());
    
    /** Controls date picker visibility - mutually exclusive with other pickers */
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    /** Controls time picker visibility - mutually exclusive with other pickers */
    const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
    /** Controls profile picker visibility - mutually exclusive with other pickers */
    const [showProfilePicker, setShowProfilePicker] = useState<boolean>(false);
    /** Selected profile ID */
    const [selectedProfile, setSelectedProfile] = useState<string | number>('');

    /** Currently selected profile data object */
    const selectedProfileData = fakeProfiles.find(p => p.id === Number(selectedProfile));

    /**
     * Formats a date to DD/MM/YYYY string format for display.
     * 
     * @param date - Date object to format
     * @returns Formatted date string
     */
    const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    /**
     * Formats a time to HH:MM string format for display.
     * 
     * @param date - Date object containing the time to format
     * @returns Formatted time string
     */
    const formatTime = (date: Date): string => {
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${hour}:${minute}`;
    };

    /**
     * Opens the date picker and closes other pickers.
     * 
     * Ensures mutual exclusion between pickers to prevent UI overlap
     * and maintain clean user experience.
     */
    const openDatePicker = () => {
        setShowDatePicker(true);
        setShowTimePicker(false);
        setShowProfilePicker(false);
    };

    /**
     * Opens the time picker and closes other pickers.
     * 
     * Ensures mutual exclusion between pickers to prevent UI overlap
     * and maintain clean user experience.
     */
    const openTimePicker = () => {
        setShowTimePicker(true);
        setShowDatePicker(false);
        setShowProfilePicker(false);
    };

    const handleSaveReminder = async () => {
        if (!selectedProfile) {
            Alert.alert(t('CreateReminder.errors.title'), t('CreateReminder.errors.Please select a profile'));
            return;
        }

        if (!reminderTitle.trim()) {
            Alert.alert(t('CreateReminder.errors.title'), t('CreateReminder.errors.Please enter a title'));
            return;
        }

        if (!reminderMessage.trim()) {
            Alert.alert(t('CreateReminder.errors.title'), t('CreateReminder.errors.Please enter a message'));
            return;
        }
        try {
            const notificationIds = await scheduleReminderWithRepetitions(
                reminderTitle,
                reminderMessage,
                reminderDate,
                {
                    reminderId: Date.now(),
                    message: reminderMessage,
                    profileId: selectedProfile,
                    profileName: selectedProfileData ? `${selectedProfileData.firstName} ${selectedProfileData.lastName}` : 'Utilisateur',
                    allNotificationIds: []
                }
            );

            console.log('Scheduled notifications with IDs:', notificationIds);
            console.log(`${notificationIds.length} notifications scheduled (4 user + 1 caregiver)`);
            console.log('Reminder saved (local)');

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(t('CreateReminder.success.title'), t('CreateReminder.success.Reminder created successfully'));
            navigation.navigate('Dashboard');
            
        } catch (error) {
            Alert.alert(t('CreateReminder.errors.title'), t('CreateReminder.errors.Error scheduling notification'));
            console.error(error);
            return;
        }
    };

    return (
        <View style={commonStyles.container}>
            {/* Header with back button and logo */}
            <View style={commonStyles.header}>
                <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Dashboard');
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
                <Text style={commonStyles.title}>{t('CreateReminder.Title')}</Text>
            </View>
            {/* Content */}
            <ScrollView style={commonStyles.content}>
                <Text style={commonStyles.label}>{t('CreateReminder.fields.For Profile')}</Text>
                <TouchableOpacity 
                    style={[commonStyles.formsButton, { marginBottom: 0 }]}
                    onPress={() => setShowProfilePicker(true)}
                >
                    <View style={styles.profilePicker}>
                        <Text>{selectedProfileData ? `${selectedProfileData.firstName} ${selectedProfileData.lastName}` : t('common.pickersText.Select a profile')}</Text>
                        <Ionicons name="chevron-down" size={20} color="#999" />
                    </View>
                </TouchableOpacity>
                {!showProfilePicker && (
                    <>
                    <Text style={commonStyles.label}>{t('CreateReminder.fields.Reminder Title')}</Text>
                <View style={commonStyles.formsButton}>
                    <TextInput
                        placeholder={t('CreateReminder.placeholders.Ex. : Take Medication')}
                        onChangeText={newText => setReminderTitle(newText)}
                        defaultValue={reminderTitle}
                    />
                </View>
                <Text style={commonStyles.label}>Message</Text>
                <View style={[commonStyles.formsButton, styles.messageInput]}>
                    <TextInput multiline={true}
                        numberOfLines={4}
                        placeholder={t('CreateReminder.placeholders.Enter the description about your reminder')}
                        onChangeText={newText => setReminderMessage(newText)}
                        defaultValue={reminderMessage}
                    />
                </View>
                <Text style={styles.text}>
                    {t('CreateReminder.message.Be careful not to enter sensitive confidential information.')}</Text>
                <View style={commonStyles.pickerContainer}>
                <View style={commonStyles.pickerColumn}>
                    <Text style={commonStyles.label}>Date</Text>
                <TouchableOpacity 
                    style={commonStyles.formsButton}
                    onPress={openDatePicker}
                >
                    <View style={commonStyles.pickerRow}>
                        <Text>{formatDate(reminderDate)}</Text>
                        <Ionicons name="calendar-outline" size={20} color="#999" />
                    </View>
                </TouchableOpacity>
                </View>
                <View style={commonStyles.pickerColumn}>
                    <Text style={commonStyles.label}>{t('CreateReminder.fields.Time')}</Text>
                <TouchableOpacity 
                    style={commonStyles.formsButton}
                    onPress={openTimePicker}
                >
                    <View style={commonStyles.pickerRow}>
                        <Text>{formatTime(reminderDate)}</Text>
                        <Ionicons name="time-outline" size={20} color="#999" />
                    </View>
                </TouchableOpacity>
                        </View>
                    </View>
                        </>
                    )}
                        {/* Cross-platform date picker component */}
                        <PlatformDatePicker
                            value={reminderDate}
                            onChange={setReminderDate}
                            visible={showDatePicker}
                            onClose={() => setShowDatePicker(false)}
                            displayFormat={formatDate}
                        />
                        {/* Cross-platform time picker component */}
                        <PlatformTimePicker
                            value={reminderDate}
                            onChange={setReminderDate}
                            visible={showTimePicker}
                            onClose={() => setShowTimePicker(false)}
                            displayFormat={formatTime}
                        />
                        
                    {/* Cross-platform profile picker component */}
                    <PlatformProfilePicker
                        profiles={fakeProfiles}
                        selectedValue={selectedProfile}
                        onValueChange={setSelectedProfile}
                        visible={showProfilePicker}
                        onClose={() => setShowProfilePicker(false)}
                        placeholder={t('common.pickersText.Select a profile')}
                    />
                    {/* Save button - navigates back to Dashboard after reminder creation */}
                    {!showDatePicker && !showTimePicker && !showProfilePicker && (
                    <TouchableOpacity 
                        style={commonStyles.primaryButton}
                        onPress={handleSaveReminder}
                        >
                        <Text style={commonStyles.primaryButtonText}>{t('CreateReminder.buttons.Save Reminder')}</Text>
                    </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
    );
};

const styles = StyleSheet.create({
    // Screen-specific styles
    profilePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    messageInput: {
        height: 80,
    },
    text: {
        fontSize: 12,
        width: '100%',
        justifyContent: 'flex-start',
        color: '#FF0000',
    },
});

export default CreateReminderScreen;
