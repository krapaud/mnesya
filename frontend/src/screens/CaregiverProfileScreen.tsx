/**
 * CaregiverProfileScreen - Profile settings page for caregivers
 * 
 * Displays caregiver account information and provides access to:
 * - Profile information (name, email)
 * - Profile editing functionality
 * - Password change functionality
 * - Logout action with confirmation modal
 * 
 * @module CaregiverProfileScreen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverTabsParamList, RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { logout, updateCaregiverProfile } from '../services/authService';
import { useCaregiverProfile } from '../hooks';
import { UpdateCaregiverProfileModal } from '../components';

type Props = CompositeScreenProps<
    BottomTabScreenProps<CaregiverTabsParamList, 'Profile'>,
    NativeStackScreenProps<RootStackParamList>
>;

/**
 * Caregiver profile settings screen component.
 * 
 * Displays account information and settings options for caregivers.
 * Provides logout and password change functionality.
 * 
 * @param props - Component properties
 * @returns Profile settings screen
 */
const CaregiverProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();

    // Use custom hook for profile management
    const { caregiverData, loading, error, reload } = useCaregiverProfile(
        () => navigation.navigate('Welcome')
    );

    // Modal visibility states
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    /**
     * Handles password change navigation.
     */
    const handleChangePassword = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO: Navigate to password change screen when implemented
        console.log('Change password clicked');
    };

    /**
     * Handles logout button click.
     * Opens confirmation modal before proceeding.
     */
    const handleLogout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowLogoutModal(true);
    };

    /**
     * Handles logout confirmation.
     * Calls logout service and navigates to Welcome screen.
     */
    const handleConfirmLogout = async () => {
        setShowLogoutModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        try {
            await logout();
            navigation.navigate('Welcome');
        } catch (err) {
            console.error('Logout failed:', err);
            // Even if logout fails, clear local state and navigate
            navigation.navigate('Welcome');
        }
    };

    /**
     * Opens the profile edit modal.
     */
    const handleEditProfile = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowMenu(false);
        setShowUpdateModal(true);
    };

    /**
     * Handles profile update.
     * 
     * Sends updated profile data to backend and refreshes caregiver data on success.
     */
    const handleUpdateProfile = async (data: { first_name: string; last_name: string; email: string }) => {
        try {
            await updateCaregiverProfile(data);
            await reload(); // Refresh profile data
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            throw err;
        }
    };

    /**
     * Handles logout cancellation.
     * Closes the confirmation modal.
     */
    const handleCancelLogout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowLogoutModal(false);
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

            {/* Loading state */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text style={styles.loadingText}>{t('common.messages.loading')}</Text>
                </View>
            )}

            {/* Error state */}
            {error && !loading && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
                    <Text style={styles.errorText}>{t(error)}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={reload}>
                        <Text style={styles.retryButtonText}>{t('caregiverProfile.buttons.retry')}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Content - only shown when data is loaded */}
            {!loading && !error && caregiverData && (
            <ScrollView style={styles.scrollContainer}>
                {/* Profile Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('caregiverProfile.sections.accountInfo')}</Text>
                    
                    {/* Name */}
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={24} color="#666666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>{t('caregiverProfile.fields.name')}</Text>
                            <Text style={styles.infoValue}>
                                {caregiverData.first_name} {caregiverData.last_name}
                            </Text>
                        </View>
                    </View>

                    {/* Email */}
                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={24} color="#666666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>{t('caregiverProfile.fields.email')}</Text>
                            <Text style={styles.infoValue}>{caregiverData.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Actions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('caregiverProfile.sections.actions')}</Text>
                    
                    {/* Change Password Button */}
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleChangePassword}
                    >
                        <View style={styles.actionButtonContent}>
                            <Ionicons name="key-outline" size={24} color="#4A90E2" />
                            <Text style={styles.actionButtonText}>
                                {t('caregiverProfile.buttons.changePassword')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#999999" />
                    </TouchableOpacity>

                    {/* Logout Button */}
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.logoutButton]}
                        onPress={handleLogout}
                    >
                        <View style={styles.actionButtonContent}>
                            <Ionicons name="log-out-outline" size={24} color="#E53935" />
                            <Text style={[styles.actionButtonText, styles.logoutText]}>
                                {t('caregiverProfile.buttons.logout')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#999999" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
            )}

            {/* Logout Confirmation Modal */}
            <Modal
                visible={showLogoutModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCancelLogout}
            >
                <View style={commonStyles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Warning icon */}
                        <View style={styles.warningIconContainer}>
                            <Ionicons name="log-out-outline" size={48} color="#E53935" />
                        </View>

                        {/* Title */}
                        <Text style={styles.modalTitle}>{t('caregiverProfile.modal.title')}</Text>

                        {/* Warning message */}
                        <Text style={styles.modalMessage}>
                            {t('caregiverProfile.modal.message')}
                        </Text>

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={handleCancelLogout}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {t('caregiverProfile.modal.cancel')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleConfirmLogout}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {t('caregiverProfile.modal.confirm')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Context Menu Overlay */}
            {showMenu && (
                <Modal
                    visible={showMenu}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowMenu(false)}
                >
                    <TouchableOpacity 
                        style={styles.menuOverlay}
                        activeOpacity={1}
                        onPress={() => setShowMenu(false)}
                    >
                        <View style={styles.menuContainer}>
                            <TouchableOpacity 
                                style={styles.menuItem}
                                onPress={handleEditProfile}
                            >
                                <Ionicons name="create-outline" size={20} color="#4A90E2" />
                                <Text style={styles.menuItemText}>{t('common.buttons.Edit')}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}

            {/* Update Profile Modal */}
            {caregiverData && (
                <UpdateCaregiverProfileModal
                    visible={showUpdateModal}
                    onClose={() => setShowUpdateModal(false)}
                    onSave={handleUpdateProfile}
                    initialData={{
                        first_name: caregiverData.first_name,
                        last_name: caregiverData.last_name,
                        email: caregiverData.email,
                    }}
                />
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
    scrollContainer: {
        width: '100%',
        paddingBottom: 10,
    },
    
    // TYPOGRAPHY
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    
    // SECTIONS
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    infoContent: {
        marginLeft: 15,
        flex: 1,
    },
    infoLabel: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    actionButtonText: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
    },
    logoutButton: {
        borderColor: '#E53935',
        backgroundColor: '#FFF5F5',
    },
    logoutText: {
        color: '#E53935',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 25,
        width: '85%',
        alignItems: 'center',
    },
    warningIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF5F5',
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
        backgroundColor: '#E53935',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    // MENU STYLES
    menuButton: {
        padding: 8,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 105,
        paddingRight: 15,
    },
    menuContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingVertical: 5,
        minWidth: 150,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        gap: 10,
    },
    menuItemText: {
        fontSize: 16,
        color: '#333333',
    },
});

export default CaregiverProfileScreen;
