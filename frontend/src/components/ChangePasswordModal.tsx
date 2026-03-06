/**
 * Modal component for changing the caregiver's password.
 *
 * Provides a form with current password, new password, and confirmation fields.
 * Includes validation and show/hide password toggles.
 *
 * @module ChangePasswordModal
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFormValidation } from '../hooks';
import { validatePassword, validatePasswordMatch } from '../utils/validation';
import { commonStyles } from '../styles/commonStyles';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChangePasswordModalProps {
    /** Controls modal visibility */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when save button is pressed */
    onSave: (data: { current_password: string; password: string }) => Promise<void>;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ visible, onClose, onSave }) => {
    const { t } = useTranslation();
    const [isUpdating, setIsUpdating] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Show/hide password states
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Timers for auto-hide
    const timerCurrentRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timerNewRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timerConfirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleShowCurrent = () => {
        setShowCurrent(true);
        timerCurrentRef.current = setTimeout(() => setShowCurrent(false), 1000);
    };
    const handleShowNew = () => {
        setShowNew(true);
        timerNewRef.current = setTimeout(() => setShowNew(false), 1000);
    };
    const handleShowConfirm = () => {
        setShowConfirm(true);
        timerConfirmRef.current = setTimeout(() => setShowConfirm(false), 1000);
    };

    useEffect(() => {
        return () => {
            if (timerCurrentRef.current) clearTimeout(timerCurrentRef.current);
            if (timerNewRef.current) clearTimeout(timerNewRef.current);
            if (timerConfirmRef.current) clearTimeout(timerConfirmRef.current);
        };
    }, []);

    const { values, errors, showErrors, handleChange, validateAll, resetErrors, setValue } =
        useFormValidation({
            current_password: {
                validate: (v) =>
                    v.trim().length === 0 ? 'register.errors.This field is required' : null,
                initialValue: '',
            },
            password: {
                validate: validatePassword,
                initialValue: '',
            },
            confirmpassword: {
                validate: (v) => validatePasswordMatch(values.password, v),
                initialValue: '',
            },
        });

    const handleClose = () => {
        resetErrors();
        setValue('current_password', '');
        setValue('password', '');
        setValue('confirmpassword', '');
        setApiError(null);
        onClose();
    };

    const handleSave = async () => {
        setApiError(null);
        if (!validateAll()) return;

        setIsUpdating(true);
        try {
            await onSave({
                current_password: values.current_password,
                password: values.password,
            });
            handleClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } };
            const detail = error.response?.data?.detail;
            if (detail?.includes('incorrect')) {
                setApiError(t('caregiverProfile.changePassword.errors.wrongPassword'));
            } else {
                setApiError(t('caregiverProfile.changePassword.errors.generic'));
            }
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={commonStyles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {t('caregiverProfile.changePassword.title')}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={28} color="#666666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* API error */}
                        {apiError && <Text style={styles.apiError}>{apiError}</Text>}

                        {/* Current password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                {t('caregiverProfile.changePassword.fields.currentPassword')}
                            </Text>
                            <View
                                style={[
                                    styles.inputRow,
                                    showErrors.current_password &&
                                        errors.current_password &&
                                        styles.inputError,
                                ]}
                            >
                                <TextInput
                                    style={styles.inputFlex}
                                    secureTextEntry={!showCurrent}
                                    value={values.current_password}
                                    onChangeText={handleChange('current_password')}
                                    placeholder={t(
                                        'caregiverProfile.changePassword.placeholders.currentPassword'
                                    )}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={handleShowCurrent}>
                                    <Ionicons
                                        name="eye-outline"
                                        size={22}
                                        color={showCurrent ? '#999999' : '#4A90E2'}
                                    />
                                </TouchableOpacity>
                            </View>
                            {showErrors.current_password && errors.current_password && (
                                <Text style={styles.errorText}>{t(errors.current_password)}</Text>
                            )}
                        </View>

                        {/* New password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                {t('caregiverProfile.changePassword.fields.newPassword')}
                            </Text>
                            <View
                                style={[
                                    styles.inputRow,
                                    showErrors.password && errors.password && styles.inputError,
                                ]}
                            >
                                <TextInput
                                    style={styles.inputFlex}
                                    secureTextEntry={!showNew}
                                    value={values.password}
                                    onChangeText={handleChange('password')}
                                    placeholder={t(
                                        'caregiverProfile.changePassword.placeholders.newPassword'
                                    )}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={handleShowNew}>
                                    <Ionicons
                                        name="eye-outline"
                                        size={22}
                                        color={showNew ? '#999999' : '#4A90E2'}
                                    />
                                </TouchableOpacity>
                            </View>
                            {showErrors.password && errors.password && (
                                <Text style={styles.errorText}>{t(errors.password)}</Text>
                            )}
                        </View>

                        {/* Confirm new password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                {t('caregiverProfile.changePassword.fields.confirmPassword')}
                            </Text>
                            <View
                                style={[
                                    styles.inputRow,
                                    showErrors.confirmpassword &&
                                        errors.confirmpassword &&
                                        styles.inputError,
                                ]}
                            >
                                <TextInput
                                    style={styles.inputFlex}
                                    secureTextEntry={!showConfirm}
                                    value={values.confirmpassword}
                                    onChangeText={handleChange('confirmpassword')}
                                    placeholder={t(
                                        'caregiverProfile.changePassword.placeholders.confirmPassword'
                                    )}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={handleShowConfirm}>
                                    <Ionicons
                                        name="eye-outline"
                                        size={22}
                                        color={showConfirm ? '#999999' : '#4A90E2'}
                                    />
                                </TouchableOpacity>
                            </View>
                            {showErrors.confirmpassword && errors.confirmpassword && (
                                <Text style={styles.errorText}>{t(errors.confirmpassword)}</Text>
                            )}
                        </View>

                        {/* Action buttons */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={handleClose}
                                disabled={isUpdating}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {t('common.buttons.Cancel')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSave}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>
                                        {t('caregiverProfile.changePassword.buttons.save')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
        color: '#333333',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    inputFlex: {
        flex: 1,
        fontSize: 16,
    },
    inputError: {
        borderColor: '#E53935',
        borderWidth: 2,
    },
    errorText: {
        color: '#E53935',
        fontSize: 14,
        marginTop: 5,
    },
    apiError: {
        color: '#E53935',
        fontSize: 14,
        marginBottom: 15,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#E0E0E0',
    },
    cancelButtonText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#4A90E2',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ChangePasswordModal;
