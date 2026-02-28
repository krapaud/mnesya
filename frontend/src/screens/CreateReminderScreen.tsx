/**
 * Screen for creating a reminder for a user profile.
 * 
 * @module CreateReminderScreen
 */
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Modal, ActivityIndicator, Animated} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { PlatformDatePicker, PlatformTimePicker, FilterPickerModal } from '../components';
import { scheduleReminderWithRepetitions } from '../utils/notifications';
import { useUserProfiles } from '../hooks';
import { createReminder } from '../services/reminderService';
import { createPulseAnimation, getPulseScale } from '../utils/animations';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateReminder'>;

const CreateReminderScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    
    // Load user profiles from API
    const { userData, loading: loadingProfiles, error: profilesError } = useUserProfiles();
    
    /** Reminder title input state */
    const [reminderTitle, setReminderTitle] = useState<string>('');
    /** Reminder message/description input state */
    const [reminderMessage, setReminderMessage] = useState<string>('');
    /** Selected date and time for the reminder */
    const [reminderDate, setReminderDate] = useState<Date>(new Date());

    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
    const [showProfilePicker, setShowProfilePicker] = useState<boolean>(false);
    const [selectedProfile, setSelectedProfile] = useState<string>('');

    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

    const [profileError, setProfileError] = useState<string>('');
    const [titleError, setTitleError] = useState<string>('');
    const [messageError, setMessageError] = useState<string>('');
    const [showProfileError, setShowProfileError] = useState<boolean>(false);
    const [showTitleError, setShowTitleError] = useState<boolean>(false);
    const [showMessageError, setShowMessageError] = useState<boolean>(false);

    const selectedProfileData = userData?.find(p => String(p.id) === selectedProfile);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        createPulseAnimation(pulseAnim).start();
    }, [pulseAnim]);

    const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

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

    const openProfilePicker = () => {
        setShowProfilePicker(true);
        setShowDatePicker(false);
        setShowTimePicker(false);
    };

    const handleSaveReminder = () => {
        // Reset all visual error indicators
        setShowProfileError(false);
        setShowTitleError(false);
        setShowMessageError(false);

        let hasError = false;

        // Validate profile selection
        if (!selectedProfile) {
            setProfileError(t('CreateReminder.errors.Please select a profile'));
            setShowProfileError(true);
            hasError = true;
        }

        // Validate title
        if (!reminderTitle.trim()) {
            setTitleError(t('CreateReminder.errors.Please enter a title'));
            setShowTitleError(true);
            hasError = true;
        }

        // Validate message
        if (!reminderMessage.trim()) {
            setMessageError(t('CreateReminder.errors.Please enter a message'));
            setShowMessageError(true);
            hasError = true;
        }

        // If there are errors, vibrate and stop
        if (hasError) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Open confirmation modal if validation passes
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowConfirmModal(true);
    };

    /**
     * Handles reminder creation confirmation.
     * Creates the reminder and schedules notifications.
     */
    const handleConfirmSave = async () => {
        setShowConfirmModal(false);
        
        try {
            const reminder = await createReminder({
                title: reminderTitle,
                description: reminderMessage,
                scheduled_at: reminderDate.toISOString(),
                user_id: String(selectedProfile),
            })
            const _notificationIds = await scheduleReminderWithRepetitions(
                reminderTitle,
                reminderMessage,
                reminderDate,
                {
                    reminderId: reminder.id,
                    message: reminderMessage,
                    profileId: selectedProfile,
                    profileName: selectedProfileData ? `${selectedProfileData.first_name} ${selectedProfileData.last_name}` : 'Utilisateur',
                    allNotificationIds: []
                }
            );


            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.navigate('Dashboard');
            
        } catch {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            // Show error inline on message field
            setMessageError(t('CreateReminder.errors.Error scheduling notification'));
            setShowMessageError(true);
        }
    };

    /**
     * Handles reminder creation cancellation.
     */
    const handleCancelSave = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowConfirmModal(false);
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
            <View style={styles.titleSection}>
                <Text style={styles.title}>{t('CreateReminder.Title')}</Text>
            </View>
            {/* Content */}
            <ScrollView style={styles.scrollContainer}>
                <Text style={styles.label}>{t('CreateReminder.fields.For Profile')}</Text>
                    {profilesError && <Text style={styles.errorText}>{profilesError}</Text>}
                <TouchableOpacity 
                    style={[styles.input, showProfileError && commonStyles.inputError]}
                    onPress={openProfilePicker}
                >
                    <View style={styles.profilePicker}>
                        <Text>{selectedProfileData ? `${selectedProfileData.first_name} ${selectedProfileData.last_name}` : t('common.pickersText.Select a profile')}</Text>
                        {loadingProfiles ? <ActivityIndicator size='small' color='#999999' /> : <Ionicons name="chevron-down" size={20} color="#999999" />}
                    </View>
                </TouchableOpacity>
                <Text style={[styles.errorText, {opacity: showProfileError ? 1 : 0}]}>
                    {profileError || t('CreateReminder.errors.Please select a profile')}
                </Text>
                {!showProfilePicker && (
                    <>
                    <Text style={styles.label}>{t('CreateReminder.fields.Reminder Title')}</Text>
                <View style={[styles.input, showTitleError && commonStyles.inputError]}>
                    <TextInput
                        placeholder={t('CreateReminder.placeholders.Ex. : Take Medication')}
                        onChangeText={newText => {
                            setShowTitleError(false);
                            setReminderTitle(newText);
                        }}
                        defaultValue={reminderTitle}
                    />
                </View>
                <Text style={[styles.errorText, {opacity: showTitleError ? 1 : 0}]}>
                    {titleError || t('CreateReminder.errors.Please enter a title')}
                </Text>
                <Text style={styles.messageLabel}>Message</Text>
                <View style={[styles.input, styles.messageInput, showMessageError && commonStyles.inputError]}>
                    <TextInput multiline={true}
                        numberOfLines={4}
                        maxLength={120}
                        placeholder={t('CreateReminder.placeholders.Enter the description about your reminder')}
                        onChangeText={newText => {
                            setShowMessageError(false);
                            setReminderMessage(newText);
                        }}
                        defaultValue={reminderMessage}
                    />
                </View>
                <Text style={[styles.errorText, {opacity: showMessageError ? 1 : 0}]}>
                    {messageError || t('CreateReminder.errors.Please enter a message')}
                </Text>
                <Animated.Text style={[styles.text, getPulseScale(pulseAnim)]}>
                    {t('CreateReminder.message.Be careful not to enter sensitive confidential information.')}</Animated.Text>
                <View style={styles.pickerContainer}>
                <View style={styles.pickerColumn}>
                    <Text style={styles.label}>Date</Text>
                <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={openDatePicker}
                >
                    <View style={styles.pickerRow}>
                        <Text>{formatDate(reminderDate)}</Text>
                        <Ionicons name="calendar-outline" size={20} color="#999999" />
                    </View>
                </TouchableOpacity>
                </View>
                <View style={styles.pickerColumn}>
                    <Text style={styles.label}>{t('CreateReminder.fields.Time')}</Text>
                <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={openTimePicker}
                >
                    <View style={styles.pickerRow}>
                        <Text>{formatTime(reminderDate)}</Text>
                        <Ionicons name="time-outline" size={20} color="#999999" />
                    </View>
                </TouchableOpacity>
                        </View>
                    </View>
                        </>
                    )}
                </ScrollView>
                
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
                <FilterPickerModal
                    title={t('common.pickersText.Select a profile')}
                    items={userData?.map(item => ({
                        value: String(item.id),
                        label: `${item.first_name} ${item.last_name}`,
                    })) ?? []}
                    selectedValue={selectedProfile}
                    onSelect={setSelectedProfile}
                    visible={showProfilePicker}
                    onClose={() => setShowProfilePicker(false)}
                />
                
                {/* Buttons section - fixed at bottom */}
                <View style={styles.buttonsContainer}>
                    {/* Save button - navigates back to Dashboard after reminder creation */}
                    {!showDatePicker && !showTimePicker && !showProfilePicker && (
                    <TouchableOpacity 
                        style={commonStyles.primaryButton}
                        onPress={handleSaveReminder}
                        >
                        <Text style={commonStyles.primaryButtonText}>{t('CreateReminder.buttons.Save Reminder')}</Text>
                    </TouchableOpacity>
                    )}
                </View>

            {/* Confirmation Modal */}
            <Modal
                visible={showConfirmModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCancelSave}
            >
                <View style={commonStyles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Confirmation icon */}
                        <View style={styles.confirmIconContainer}>
                            <Ionicons name="notifications-outline" size={48} color="#4A90E2" />
                        </View>

                        {/* Title */}
                        <Text style={styles.modalTitle}>{t('CreateReminder.modal.title')}</Text>

                        {/* Confirmation message */}
                        <Text style={styles.modalMessage}>
                            {t('CreateReminder.modal.message')}
                        </Text>

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={handleCancelSave}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {t('CreateReminder.modal.cancel')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleConfirmSave}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {t('CreateReminder.modal.confirm')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            </View>
    );
};

const styles = StyleSheet.create({
    // ========== LAYOUT ==========
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 30,
        marginBottom: 20,
    },
    scrollContainer: {
        width: '100%',
        paddingBottom: 10,
    },
    buttonsContainer: {
        paddingBottom: 40,
    },

    // ========== TYPOGRAPHY ==========
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    label: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 10,
        marginTop: 5,
    },
    messageLabel: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 10,
        marginTop: 0,
    },
    text: {
        fontSize: 13,
        width: '100%',
        justifyContent: 'flex-start',
        color: '#FF0000',
        marginTop: 0,
        marginBottom: 4,
        paddingBottom: 4,
    },

    // ========== FORM ELEMENTS ==========
    input: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 20,
        marginBottom: 10,
        width: '100%',
    },
    errorText: {
        color: '#FF0000',
        fontSize: 12,
        textAlign: 'right',
        marginTop: -5,
        marginBottom: 5,
        minHeight: 16,
        lineHeight: 16,
        paddingRight: 10,
    },
    profilePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    messageInput: {
        height: 80,
        marginBottom: 2,
    },

    // ========== PICKERS ==========
    pickerContainer: {
        flexDirection: 'row',
        width: '100%',
    },
    pickerColumn: {
        flex: 1,
        marginRight: 10,
    },
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerButton: {
        backgroundColor: '#F5F5F5',
        padding: 18,
        borderRadius: 20,
        marginBottom: 15,
        width: '100%',
    },

    // ========== MODAL ==========
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 25,
        width: '85%',
        alignItems: 'center',
    },
    confirmIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E3F2FD',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 25,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#E0E0E0',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    confirmButton: {
        backgroundColor: '#4A90E2',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default CreateReminderScreen;
