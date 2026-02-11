/**
 * Cross-platform user profile picker component.
 * 
 * Provides a native picker for selecting a profile from a list
 * of available user profiles.
 * 
 * @module PlatformProfilePicker
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../styles/commonStyles';

/**
 * Interface representing a user profile.
 */
export interface Profile {
    /** Unique profile identifier */
    id: number | string;
    /** Person's first name */
    firstName: string;
    /** Person's last name */
    lastName: string;
}

/**
 * Props for the PlatformProfilePicker component.
 */
interface PlatformProfilePickerProps {
    /** List of available profiles for selection */
    profiles: Profile[];
    /** ID of the currently selected profile */
    selectedValue: string | number;
    /** Callback triggered when selection changes */
    onValueChange: (profileId: string | number) => void;
    /** Controls the visibility of the picker */
    visible: boolean;
    /** Callback triggered when picker closes */
    onClose: () => void;
    /** Optional placeholder text */
    placeholder?: string;
}
/**
 * Platform-adapted profile picker component.
 * 
 * Displays a modal with a list of profiles for selection.
 * 
 * @param props - Component properties
 * @returns Profile picker component or null if not visible
 */
const PlatformProfilePicker: React.FC<PlatformProfilePickerProps> = ({
    profiles,
    selectedValue,
    onValueChange,
    visible,
    onClose,
    placeholder = 'Select a profile'
}) => {
    const { t } = useTranslation();
    
    /**
     * Handles profile selection and closes the modal.
     */
    const handleProfileSelect = (profileId: string | number) => {
        onValueChange(profileId);
        onClose();
    };

    if (!visible) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{placeholder}</Text>
                    <FlatList
                        data={profiles}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.profileItem}
                                onPress={() => handleProfileSelect(item.id)}
                            >
                                <Text style={styles.profileText}>
                                    {`${item.firstName} ${item.lastName}`}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Text style={styles.closeButtonText}>{t('common.buttons.Cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        width: '85%',
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    profileItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    profileText: {
        fontSize: 16,
    },
    closeButton: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#E0E0E0',
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PlatformProfilePicker;
