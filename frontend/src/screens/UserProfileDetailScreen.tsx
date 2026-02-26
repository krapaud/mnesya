/**
 * Screen showing details and reminders for a specific user profile.
 *
 * @module UserProfileDetailScreen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { useUserProfile } from '../hooks';
import { useCaregiverReminders } from '../hooks';
import { PairingCodeModal, UpdateUserProfileModal, ConfirmationModal } from '../components';
import { calculateAge } from '../utils/dateUtils';
import { generatePairingCode } from '../services/pairingService';
import ReminderCard from '../components/ReminderCard';
import { deleteReminder } from '../services/reminderService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelNotifications } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfileDetails'>;


const UserProfileDetailScreen: React.FC<Props> = ({ navigation, route }: Props) => {
    const { t } = useTranslation();
    
    // Extract profileId from route params
    const profileId = route.params?.profileId;
    
    // Fetch user profile data from the backend
    const { userData, loading, error, reload: _reload, update, remove } = useUserProfile(profileId);

    // Fetch and filter reminders for this profile
    const { reminderData, reload: reloadReminders } = useCaregiverReminders();
    const profileReminders = reminderData?.filter(r => r.user_id === profileId) ?? [];

    // Pairing code modal state
    const [showPairingModal, setShowPairingModal] = useState(false);
    const [pairingCode, setPairingCode] = useState('');
    const [expiresAt, setExpiresAt] = useState<string | null>(null);

    // Update modal state
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Reminder delete confirmation state
    const [pendingDeleteReminderId, setPendingDeleteReminderId] = useState<string | null>(null);
    const [deleteReminderError, setDeleteReminderError] = useState(false);

    // Menu modal state
    const [showMenu, setShowMenu] = useState(false);

    const [isGeneratingCode, setIsGeneratingCode] = useState(false);

    /**
     * Handles profile update.
     */
    const handleUpdateProfile = async (data: { first_name: string; last_name: string; birthday: string }) => {
        try {
            await update(data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            throw err;
        }
    };

    /**
     * Handles profile deletion.
     */
    const handleDeleteProfile = async () => {
        try {
            await remove();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowDeleteModal(false);
            navigation.goBack();
        } catch (_err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setShowDeleteModal(false);
        }
    };

    /**
     * Initiates the reminder deletion flow by storing the target ID.
     * The actual deletion is deferred until the user confirms in the modal.
     */
    const handleDeleteReminder = (reminderId: string) => {
        setPendingDeleteReminderId(reminderId);
    };

    /**
     * Executes the deletion after user confirmation:
     * cancels scheduled notifications, removes the reminder, then reloads the list.
     */
    const confirmDeleteReminder = async () => {
        if (!pendingDeleteReminderId) return;
        try {
            const storageKey = `notification_ids_${pendingDeleteReminderId}`;
            const storedIds = await AsyncStorage.getItem(storageKey);
            if (storedIds) {
                const notificationIds = JSON.parse(storedIds) as string[];
                await cancelNotifications(notificationIds);
                await AsyncStorage.removeItem(storageKey);
            }
            await deleteReminder(pendingDeleteReminderId);
            reloadReminders();
        } catch (err) {
            console.error('[DeleteReminder] Error:', err);
            setDeleteReminderError(true);
        } finally {
            setPendingDeleteReminderId(null);
        }
    };

    /**
     * Handles pairing code generation and modal display.
     */
    const handleGeneratePairingCode = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsGeneratingCode(true);

            const response = await generatePairingCode(profileId);

            setPairingCode(response.code);
            setExpiresAt(response.expires_at);
            setShowPairingModal(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsGeneratingCode(false);
        }
    };

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
            <TouchableOpacity 
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowMenu(true);
                }}
                style={styles.menuButton}
            >
                <Ionicons name="ellipsis-vertical" size={24} color="#4A90E2" />
            </TouchableOpacity>
        </View>
        {/* Page title */}
        <View style={styles.titleSection}>
            <Text style={styles.title}>{t('UserProfileDetail.title')}</Text>
        </View>
        {/* Loading state */}
        {loading && (
            <View style={commonStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={commonStyles.loadingText}>{t('common.messages.loading')}</Text>
            </View>
        )}

        {/* Error state */}
        {error && !loading && (
            <View style={commonStyles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
                <Text style={commonStyles.errorText}>{t(error)}</Text>
            </View>
        )}
                
        {/* Profile content */}
        {!loading && !error && userData && (
            <ScrollView style={styles.scrollContainer}>
                {/* Profile information card - displays name and age */}
                <View style={styles.profileCard}>
                    <View style={styles.profileRow}>
                        <Text style={styles.profileNameValue}>{userData.first_name} {userData.last_name}</Text>
                    </View>
                    <View style={styles.profileRow}>
                        <Text style={styles.profileDetailValue}>{calculateAge(userData.birthday)} {t('common.units.years old')}</Text>
                    </View>
                </View>

                {/* Generate pairing code button - allows creating new pairing code for user */}
                <TouchableOpacity 
                    style={commonStyles.primaryButton}
                    onPress={handleGeneratePairingCode}
                    disabled={isGeneratingCode}
                >
                    {isGeneratingCode ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ActivityIndicator color="#FFFFFF" size="small" />
                            <Text style={[commonStyles.primaryButtonText, { fontSize: 20, marginLeft: 10 }]}>
                                {t('common.messages.loading')}
                            </Text>
                        </View>
                    ) : (
                        <Text style={[commonStyles.primaryButtonText, { fontSize: 20 }]}>
                            {t('UserProfileDetail.buttons.Generate pairing code')}
                        </Text>
                    )}
                </TouchableOpacity>
                
                {/* Active reminders section - displays filtered reminders for this profile */}
                <Text style={styles.sectionTitle}>{t('UserProfileDetail.sections.Active Reminders')}</Text>
                {profileReminders.length === 0 ? (
                    <Text style={commonStyles.emptyMessage}>{t('UserProfileDetail.messages.No active reminders')}</Text>
                ) : (
                    profileReminders.map(reminder => (
                        <ReminderCard
                            key={reminder.id}
                            reminder={reminder}
                            onDelete={handleDeleteReminder}
                        />
                    ))
                )}
            </ScrollView>
        )}

        {/* Pairing code modal */}
        <PairingCodeModal
            visible={showPairingModal}
            onClose={() => setShowPairingModal(false)}
            pairingCode={pairingCode}
            expiresAt={expiresAt}
            onExpired={handleGeneratePairingCode}
        />

        {/* Update Profile Modal */}
        <UpdateUserProfileModal
            visible={showUpdateModal}
            onClose={() => setShowUpdateModal(false)}
            onSave={handleUpdateProfile}
            initialData={userData ? {
                first_name: userData.first_name,
                last_name: userData.last_name,
                birthday: userData.birthday,
            } : null}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
            visible={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteProfile}
            title={t('UserProfileDetail.modals.delete.title')}
            message={t('UserProfileDetail.modals.delete.message')}
            confirmText={t('UserProfileDetail.buttons.Delete')}
            icon="trash-outline"
            iconColor="#E53935"
            confirmColor="#E53935"
        />

        {/* Reminder delete confirmation */}
        <ConfirmationModal
            visible={pendingDeleteReminderId !== null}
            onClose={() => setPendingDeleteReminderId(null)}
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
            visible={deleteReminderError}
            onClose={() => setDeleteReminderError(false)}
            title={t('common.errors.genericErrorTitle')}
            message={t('common.errors.failedToDeleteReminder')}
            icon="alert-circle-outline"
            iconColor="#E53935"
            confirmText="OK"
            confirmColor="#4A90E2"
            showCancelButton={false}
        />

        {/* Context menu modal */}
        {showMenu && (
            <TouchableOpacity 
                style={styles.menuOverlay} 
                activeOpacity={1} 
                onPress={() => setShowMenu(false)}
            >
                <View style={styles.menuContainer}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowMenu(false);
                            setShowUpdateModal(true);
                        }}
                    >
                        <Ionicons name="create-outline" size={20} color="#4A90E2" />
                        <Text style={styles.menuItemText}>{t('UserProfileDetail.buttons.Edit')}</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.menuDivider} />
                    
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowMenu(false);
                            setShowDeleteModal(true);
                        }}
                    >
                        <Ionicons name="trash-outline" size={20} color="#E53935" />
                        <Text style={[styles.menuItemText, { color: '#E53935' }]}>{t('UserProfileDetail.buttons.Delete')}</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        )}
    </View>
  );
};

export default UserProfileDetailScreen;

const styles = StyleSheet.create({
    // LAYOUT
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 30,
    },
    scrollContainer: {
        flex: 1,
        marginTop: 40,
        paddingBottom: 50,
    },
    
    // TYPOGRAPHY
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2C3E50',
        marginTop: 15,
        marginBottom: 15,
    },
    
    // PROFILE CARD
    profileCard: {
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    profileNameValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileDetailValue: {
        fontSize: 18,
    },
    errorMessage: {
        fontSize: 16,
        color: 'red',
    },

    // MENU
    menuButton: {
        padding: 8,
    },
    menuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
    },
    menuContainer: {
        position: 'absolute',
        top: 105,
        right: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 180,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        gap: 12,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    menuItemText: {
        fontSize: 16,
        color: '#2C3E50',
        fontWeight: '500',
    },
});
