/**
 * Screen showing the caregiver's profile info and settings.
 *
 * @module CaregiverProfileScreen
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverTabsParamList, RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { logout, updateCaregiverProfile, changePassword } from '../services/authService';
import { useCaregiverProfile, usePlan } from '../hooks';
import {
    UpdateCaregiverProfileModal,
    ChangePasswordModal,
    ConfirmationModal,
    MenuModal,
    PremiumModal,
} from '../components';

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = CompositeScreenProps<
    BottomTabScreenProps<CaregiverTabsParamList, 'Profile'>,
    NativeStackScreenProps<RootStackParamList>
>;

// ─── Screen ──────────────────────────────────────────────────────────────────

const CaregiverProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();

    // Use custom hook for profile management
    const handleAuthError = useCallback(() => navigation.navigate('Welcome'), [navigation]);
    const { caregiverData, loading, error, reload } = useCaregiverProfile(handleAuthError);
    const { isPremium } = usePlan();

    // Modal visibility states
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    /**
     * Opens the change password modal.
     */
    const handleChangePassword = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowMenu(false);
        setShowChangePasswordModal(true);
    };

    /**
     * Handles password change form submission.
     */
    const handleSavePassword = async (data: { current_password: string; password: string }) => {
        await changePassword(data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        } catch (_err) {
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
    const handleUpdateProfile = async (data: {
        first_name: string;
        last_name: string;
    }) => {
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
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.goBack();
                    }}
                >
                    <View style={commonStyles.ArrowIconCircle}>
                        <Ionicons name="arrow-back" size={24} color="#4A90E2" />
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
                <Text style={styles.title}>{t('caregiverProfile.title')}</Text>
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
                        <Text style={styles.retryButtonText}>
                            {t('caregiverProfile.buttons.retry')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Content - only shown when data is loaded */}
            {!loading && !error && caregiverData && (
                <ScrollView style={styles.scrollContainer}>
                    {/* Profile Information Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {t('caregiverProfile.sections.accountInfo')}
                        </Text>

                        {/* Name */}
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={24} color="#666666" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>
                                    {t('caregiverProfile.fields.name')}
                                </Text>
                                <Text style={styles.infoValue}>
                                    {caregiverData.first_name} {caregiverData.last_name}
                                </Text>
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={24} color="#666666" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>
                                    {t('caregiverProfile.fields.email')}
                                </Text>
                                <Text style={styles.infoValue}>{caregiverData.email}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Plan Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {t('caregiverProfile.sections.plan')}
                        </Text>

                        {/* Current plan badge */}
                        <View style={[styles.infoRow, isPremium ? styles.premiumRow : styles.freeRow]}>
                            <Ionicons
                                name="star"
                                size={24}
                                color={isPremium ? '#F6AD55' : '#999999'}
                            />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>
                                    {t('caregiverProfile.fields.plan')}
                                </Text>
                                <Text style={[styles.infoValue, isPremium ? styles.premiumText : styles.freeText]}>
                                    {isPremium
                                        ? t('caregiverProfile.plan.premium')
                                        : t('caregiverProfile.plan.free')}
                                </Text>
                            </View>
                        </View>

                        {/* Upgrade button — only for free users */}
                        {!isPremium && (
                            <TouchableOpacity
                                style={styles.upgradeButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowPremiumModal(true);
                                }}
                            >
                                <Ionicons name="star" size={20} color="#FFFFFF" />
                                <Text style={styles.upgradeButtonText}>
                                    {t('caregiverProfile.plan.upgradeButton')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Actions Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {t('caregiverProfile.sections.actions')}
                        </Text>

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
            <ConfirmationModal
                visible={showLogoutModal}
                onClose={handleCancelLogout}
                onConfirm={handleConfirmLogout}
                title={t('caregiverProfile.modal.title')}
                message={t('caregiverProfile.modal.message')}
                icon="log-out-outline"
                iconColor="#E53935"
                confirmText={t('caregiverProfile.modal.confirm')}
                cancelText={t('caregiverProfile.modal.cancel')}
            />

            {/* Context Menu Overlay */}
            <MenuModal
                visible={showMenu}
                onClose={() => setShowMenu(false)}
                actions={[
                    {
                        label: t('common.buttons.Edit'),
                        icon: 'create-outline',
                        color: '#4A90E2',
                        onPress: handleEditProfile,
                    },
                ]}
                topOffset={105}
            />

            {/* Update Profile Modal */}
            {caregiverData && (
                <UpdateCaregiverProfileModal
                    visible={showUpdateModal}
                    onClose={() => setShowUpdateModal(false)}
                    onSave={handleUpdateProfile}
                    initialData={{
                        first_name: caregiverData.first_name,
                        last_name: caregiverData.last_name,
                    }}
                />
            )}

            {/* Change Password Modal */}
            <ChangePasswordModal
                visible={showChangePasswordModal}
                onClose={() => setShowChangePasswordModal(false)}
                onSave={handleSavePassword}
            />

            {/* Premium Upgrade Modal */}
            <PremiumModal
                visible={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                feature="profiles"
            />
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // LAYOUT
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 12,
        marginBottom: 12,
    },
    scrollContainer: {
        width: '100%',
        paddingBottom: 6,
    },

    // TYPOGRAPHY
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 6,
    },

    // SECTIONS
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 10,
        marginBottom: 6,
    },
    infoContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: '#333333',
        fontWeight: '500',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
    premiumRow: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#F6AD55',
    },
    freeRow: {
        backgroundColor: '#F5F5F5',
    },
    premiumText: {
        color: '#D69E2E',
        fontWeight: '700',
    },
    freeText: {
        color: '#666666',
    },
    upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F6AD55',
        padding: 14,
        borderRadius: 10,
        marginTop: 6,
    },
    upgradeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
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
});

export default CaregiverProfileScreen;
