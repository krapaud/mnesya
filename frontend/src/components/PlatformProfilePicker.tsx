/**
 * Modal picker for selecting a user profile.
 * 
 * @module PlatformProfilePicker
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../styles/commonStyles';

export interface Profile {
    id: number | string;
    firstName: string;
    lastName: string;
}

interface PlatformProfilePickerProps {
    profiles: Profile[];
    selectedValue: string | number;
    onValueChange: (profileId: string | number) => void;
    visible: boolean;
    onClose: () => void;
    placeholder?: string;
}
const PlatformProfilePicker: React.FC<PlatformProfilePickerProps> = ({
    profiles,
    selectedValue: _selectedValue,
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
            <View style={commonStyles.modalOverlay}>
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
