/**
 * Cross-platform user profile picker component.
 * 
 * Provides a native picker for selecting a profile from a list
 * of available user profiles.
 * 
 * @module PlatformProfilePicker
 */

import React from 'react';
import { View, TouchableOpacity, Text, Platform, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
 * Displays a native profile picker with platform-specific handling:
 * iOS shows a spinner with validation button, Android auto-closes on selection.
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
     * Handles selection change with platform-specific behavior.
     * Automatically closes picker on Android after selection.
     */
    const handleValueChange = (itemValue: string | number) => {
        onValueChange(itemValue);
        
        if (Platform.OS === 'android') {
            onClose();
        }
    };

    if (!visible) {
        return null;
    }

    return (
        <View style={styles.profilePickerContainer}>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={selectedValue}
                    onValueChange={handleValueChange}
                >
                    <Picker.Item label={placeholder} value="" />
                    {profiles.map((profile) => (
                        <Picker.Item 
                            key={profile.id} 
                            label={`${profile.firstName} ${profile.lastName}`} 
                            value={profile.id} 
                        />
                    ))}
                </Picker>
            </View>
            
            {Platform.OS === 'ios' && (
                <TouchableOpacity
                    style={commonStyles.validateButton}
                    onPress={onClose}
                >
                    <Text style={commonStyles.validateButtonText}>{t('common.buttons.Validate')}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    profilePickerContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
    },
    pickerWrapper: {
        width: '100%',
        height: 150,
        overflow: 'hidden',
    },
});

export default PlatformProfilePicker;
