/**
 * Modal component for updating caregiver profile information.
 *
 * Provides a form to edit first name, last name, and email of a caregiver profile.
 * Includes validation for all fields.
 *
 * @module UpdateCaregiverProfileModal
 */

import React, { useState, useEffect } from 'react';
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
import { validateName, validateEmail } from '../utils/validation';
import { commonStyles } from '../styles/commonStyles';

/**
 * Props for UpdateCaregiverProfileModal component.
 */
interface UpdateCaregiverProfileModalProps {
    /** Controls modal visibility */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when save button is pressed */
    onSave: (data: { first_name: string; last_name: string; email: string }) => Promise<void>;
    /** Initial profile data to pre-fill the form */
    initialData: {
        first_name: string;
        last_name: string;
        email: string;
    } | null;
}

const UpdateCaregiverProfileModal: React.FC<UpdateCaregiverProfileModalProps> = ({
    visible,
    onClose,
    onSave,
    initialData,
}) => {
    const { t } = useTranslation();
    const [isUpdating, setIsUpdating] = useState(false);

    // Form validation
    const { values, errors, showErrors, handleChange, validateAll, setValue } = useFormValidation({
        firstname: {
            validate: validateName,
            initialValue: '',
        },
        lastname: {
            validate: validateName,
            initialValue: '',
        },
        email: {
            validate: validateEmail,
            initialValue: '',
        },
    });

    // Pre-fill form when initialData changes
    useEffect(() => {
        if (initialData) {
            setValue('firstname', initialData.first_name);
            setValue('lastname', initialData.last_name);
            setValue('email', initialData.email);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);

    /**
     * Handles save button press.
     */
    const handleSave = async () => {
        if (!validateAll()) {
            return;
        }

        setIsUpdating(true);
        try {
            await onSave({
                first_name: values.firstname,
                last_name: values.lastname,
                email: values.email,
            });
            onClose();
        } catch (_err) {
            // Error handled by parent
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
                onRequestClose={onClose}
            >
                <View style={commonStyles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {t('UserProfileDetail.modals.update.title')}
                            </Text>
                            <TouchableOpacity onPress={onClose} testID="close-button">
                                <Ionicons name="close" size={28} color="#666666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* First Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {t('CreateProfile.fields.First Name')}
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        showErrors.firstname &&
                                            errors.firstname &&
                                            styles.inputError,
                                    ]}
                                    value={values.firstname}
                                    onChangeText={handleChange('firstname')}
                                    placeholder={t(
                                        'CreateProfile.placeholders.Enter the profile First Name'
                                    )}
                                    autoCapitalize="words"
                                />
                                {showErrors.firstname && errors.firstname && (
                                    <Text style={styles.errorText}>{t(errors.firstname)}</Text>
                                )}
                            </View>

                            {/* Last Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {t('CreateProfile.fields.Last Name')}
                                </Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        showErrors.lastname && errors.lastname && styles.inputError,
                                    ]}
                                    value={values.lastname}
                                    onChangeText={handleChange('lastname')}
                                    placeholder={t(
                                        'CreateProfile.placeholders.Enter the profile Last Name'
                                    )}
                                    autoCapitalize="characters"
                                />
                                {showErrors.lastname && errors.lastname && (
                                    <Text style={styles.errorText}>{t(errors.lastname)}</Text>
                                )}
                            </View>

                            {/* Email */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('register.fields.Email')}</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        showErrors.email && errors.email && styles.inputError,
                                    ]}
                                    value={values.email}
                                    onChangeText={handleChange('email')}
                                    placeholder={t('register.placeholders.Enter your Email')}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                {showErrors.email && errors.email && (
                                    <Text style={styles.errorText}>{t(errors.email)}</Text>
                                )}
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={onClose}
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
                                        <ActivityIndicator
                                            size="small"
                                            color="#FFFFFF"
                                            testID="activity-indicator"
                                        />
                                    ) : (
                                        <Text style={styles.saveButtonText}>
                                            {t('UserProfileDetail.buttons.Save')}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

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
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        padding: 15,
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
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        padding: 15,
    },
    dateButtonText: {
        fontSize: 16,
        color: '#333333',
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

export default UpdateCaregiverProfileModal;
