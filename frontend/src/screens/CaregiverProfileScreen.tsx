/**
 * CaregiverProfileScreen - Profile settings page for caregivers
 * 
 * Displays caregiver account information and provides access to:
 * - Profile information (name, email)
 * - Password change functionality
 * - Logout action with confirmation modal
 * 
 * @module CaregiverProfileScreen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverTabsParamList, RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';

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

    // Modal visibility state
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // TODO: Replace with actual user data from context/store
    const caregiverData = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com'
    };

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
     * Closes modal and navigates to Welcome screen.
     */
    const handleConfirmLogout = () => {
        setShowLogoutModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // TODO: Clear authentication state
        navigation.navigate('Welcome');
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
                <View style={commonStyles.headerSpacer} />
            </View>

            {/* Page title */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>{t('caregiverProfile.title')}</Text>
            </View>

            <ScrollView style={styles.scrollContainer}>
                {/* Profile Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('caregiverProfile.sections.accountInfo')}</Text>
                    
                    {/* Name */}
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={24} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>{t('caregiverProfile.fields.name')}</Text>
                            <Text style={styles.infoValue}>
                                {caregiverData.firstName} {caregiverData.lastName}
                            </Text>
                        </View>
                    </View>

                    {/* Email */}
                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={24} color="#666" />
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
                        <Ionicons name="chevron-forward" size={24} color="#999" />
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
                        <Ionicons name="chevron-forward" size={24} color="#999" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Logout Confirmation Modal */}
            <Modal
                visible={showLogoutModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCancelLogout}
            >
                <View style={styles.modalOverlay}>
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
        color: '#333',
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
        color: '#666',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
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
        color: '#333',
        fontWeight: '500',
    },
    logoutButton: {
        borderColor: '#E53935',
        backgroundColor: '#FFF5F5',
    },
    logoutText: {
        color: '#E53935',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
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
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: '#666',
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
        color: '#333',
    },
    confirmButton: {
        backgroundColor: '#E53935',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default CaregiverProfileScreen;
