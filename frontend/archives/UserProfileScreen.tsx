/**
 * UserProfileScreen - Profile settings page for elderly users
 * 
 * Displays user account information with a simplified interface:
 * - Profile information (name, age)
 * - Re-pairing action with confirmation modal
 * 
 * Designed with larger elements and clear labels for accessibility.
 * 
 * @module UserProfileScreen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UserTabsParamList, RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { fakeProfiles } from '../data/fakeData';

type Props = CompositeScreenProps<
    BottomTabScreenProps<UserTabsParamList, 'Profile'>,
    NativeStackScreenProps<RootStackParamList>
>;

/**
 * User profile settings screen component.
 * 
 * Displays account information for elderly users with a simplified,
 * accessible interface. Provides logout functionality.
 * 
 * @param props - Component properties
 * @returns Profile settings screen
 */
const UserProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    
    // Modal visibility state
    const [showWarningModal, setShowWarningModal] = useState(false);
    
    // TODO: Replace with actual user data from context/store
    // Temporary simulation using fake data
    const currentUser = fakeProfiles.find(p => p.firstName === "Marie");

    /**
     * Handles re-pairing button click.
     * Opens warning modal before proceeding.
     */
    const handleRePairing = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowWarningModal(true);
    };

    /**
     * Handles re-pairing confirmation.
     * Closes modal and navigates to pairing screen.
     */
    const handleConfirmRePairing = () => {
        setShowWarningModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        navigation.getParent()?.navigate('UserPairing');
    };

    /**
     * Handles re-pairing cancellation.
     * Closes the warning modal.
     */
    const handleCancelRePairing = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowWarningModal(false);
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
                <Text style={styles.title}>{t('userProfile.title')}</Text>
            </View>

            <ScrollView style={styles.scrollContainer}>
                {/* Profile Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('userProfile.sections.accountInfo')}</Text>
                    
                    {/* Name */}
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={24} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>{t('userProfile.fields.name')}</Text>
                            <Text style={styles.infoValue}>
                                {currentUser?.firstName} {currentUser?.lastName}
                            </Text>
                        </View>
                    </View>

                    {/* Age */}
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={24} color="#666" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>{t('userProfile.fields.age')}</Text>
                            <Text style={styles.infoValue}>
                                {currentUser?.age} {t('common.units.years old')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Actions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('userProfile.sections.actions')}</Text>
                    
                    {/* Re-Pairing Button */}
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.pairingButton]}
                        onPress={handleRePairing}
                    >
                        <View style={styles.actionButtonContent}>
                            <Ionicons name="sync-outline" size={24} color="#4A90E2" />
                            <Text style={[styles.actionButtonText, styles.pairingText]}>
                                {t('userProfile.buttons.rePairing')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#999" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Re-Pairing Warning Modal */}
            <Modal
                visible={showWarningModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCancelRePairing}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Warning icon */}
                        <View style={styles.warningIconContainer}>
                            <Ionicons name="warning-outline" size={48} color="#FF9800" />
                        </View>

                        {/* Title */}
                        <Text style={styles.modalTitle}>{t('userProfile.modal.title')}</Text>

                        {/* Warning message */}
                        <Text style={styles.modalMessage}>
                            {t('userProfile.modal.message')}
                        </Text>

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={handleCancelRePairing}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {t('userProfile.modal.cancel')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleConfirmRePairing}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {t('userProfile.modal.confirm')}
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
    pairingButton: {
        borderColor: '#4A90E2',
        backgroundColor: '#E8F4FF',
    },
    pairingText: {
        color: '#4A90E2',
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
        backgroundColor: '#FFF3E0',
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
        backgroundColor: '#FF9800',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default UserProfileScreen;