/**
 * Modal component for updating user profile information.
 *
 * Provides a form to edit first name, last name, and birthday of a user profile.
 * Includes validation and date picker integration.
 *
 * @module UpdateProfileModal
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
import { validateName } from '../utils/validation';
import PlatformDatePicker from './PlatformDatePicker';
import { commonStyles } from '../styles/commonStyles';

/**
 * Props for UpdateProfileModal component.
 */
interface UpdateProfileModalProps {
    /** Controls modal visibility */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when save button is pressed */
    onSave: (data: { first_name: string; last_name: string; birthday: string }) => Promise<void>;
    /** Initial profile data to pre-fill the form */
    initialData: {
        first_name: string;
        last_name: string;
        birthday: string;
    } | null;
}

const UpdateProfileModal: React.FC<UpdateProfileModalProps> = ({
    visible,
    onClose,
    onSave,
    initialData,
}) => {
    const { t } = useTranslation();
    const [birthday, setBirthday] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
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
    });

    /**
     * Formats date for API (YYYY-MM-DD).
     */
    const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Pre-fill form when initialData changes
    useEffect(() => {
        if (initialData) {
            setValue('firstname', initialData.first_name);
            setValue('lastname', initialData.last_name);
            setBirthday(new Date(initialData.birthday));
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
                birthday: formatDateForAPI(birthday),
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
                                    autoCapitalize="sentences"
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
                                    autoCapitalize="sentences"
                                />
                                {showErrors.lastname && errors.lastname && (
                                    <Text style={styles.errorText}>{t(errors.lastname)}</Text>
                                )}
                            </View>

                            {/* Birthday */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    {t('CreateProfile.fields.Birthday')}
                                </Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateButtonText}>
                                        {birthday.toLocaleDateString()}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={24} color="#4A90E2" />
                                </TouchableOpacity>
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

                    {/* Date Picker */}
                    {showDatePicker && (
                        <PlatformDatePicker
                            value={birthday}
                            onChange={(date) => {
                                setBirthday(date);
                                setShowDatePicker(false);
                            }}
                            visible={showDatePicker}
                            onClose={() => setShowDatePicker(false)}
                            allowPastDates={true}
                        />
                    )}
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

export default UpdateProfileModal;
