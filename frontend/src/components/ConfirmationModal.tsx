/**
 * Generic confirmation modal component.
 *
 * Displays a confirmation dialog with customizable title, message, icon, and buttons.
 * Useful for delete confirmations, logout confirmations, etc.
 *
 * @module ConfirmationModal
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../styles/commonStyles';

/**
 * Props for ConfirmationModal component.
 */
interface ConfirmationModalProps {
    /** Controls modal visibility */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when confirm button is pressed */
    onConfirm?: () => void;
    /** Modal title */
    title: string;
    /** Modal message */
    message: string;
    /** Icon name from Ionicons (default: 'warning-outline') */
    icon?: keyof typeof Ionicons.glyphMap;
    /** Icon color (default: '#E53935') */
    iconColor?: string;
    /** Confirm button text (default: 'Confirm') */
    confirmText?: string;
    /** Confirm button color (default: '#E53935' for danger) */
    confirmColor?: string;
    /** Cancel button text (default: 'Cancel') */
    cancelText?: string;
    /** Whether to show the cancel button (default: true). Set to false for info/error modals with a single OK button. */
    showCancelButton?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    icon = 'warning-outline',
    iconColor = '#E53935',
    confirmText,
    confirmColor = '#E53935',
    cancelText,
    showCancelButton = true,
}) => {
    const { t } = useTranslation();

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <View style={commonStyles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Ionicons name={icon} size={60} color={iconColor} />
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalMessage}>{message}</Text>

                    <View style={styles.modalActions}>
                        {showCancelButton && (
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={onClose}
                            >
                                <Text
                                    style={styles.cancelButtonText}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {cancelText || t('common.buttons.Cancel')}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: confirmColor }]}
                            onPress={onConfirm ?? onClose}
                        >
                            <Text
                                style={styles.confirmButtonText}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {confirmText || t('common.buttons.Confirm')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 30,
        width: '85%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333333',
        marginTop: 15,
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 25,
    },
    modalActions: {
        flexDirection: 'column-reverse',
        width: '100%',
        gap: 10,
    },
    modalButton: {
        width: '100%',
        paddingVertical: 15,
        paddingHorizontal: 8,
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
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ConfirmationModal;
