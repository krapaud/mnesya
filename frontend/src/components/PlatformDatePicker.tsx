/**
 * Cross-platform date picker component.
 * 
 * Wraps the native DateTimePicker to provide a consistent interface
 * across iOS and Android platforms, handling platform-specific behaviors.
 * 
 * @module PlatformDatePicker
 */

import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { commonStyles } from '../styles/commonStyles';

/**
 * Props for the PlatformDatePicker component.
 */
interface PlatformDatePickerProps {
    /** Currently selected date */
    value: Date;
    /** Callback triggered when date changes */
    onChange: (date: Date) => void;
    /** Controls the visibility of the picker */
    visible: boolean;
    /** Callback triggered when picker closes */
    onClose: () => void;
    /** Optional custom date formatting function */
    displayFormat?: (date: Date) => string;
}

/**
 * Platform-adapted date picker component.
 * 
 * Displays a native date picker with platform-specific handling:
 * iOS shows a spinner with validation button, Android auto-closes on selection.
 * 
 * @param props - Component properties
 * @returns Date picker component or null if not visible
 */
const PlatformDatePicker: React.FC<PlatformDatePickerProps> = ({
    value,
    onChange,
    visible,
    onClose,
    displayFormat
}) => {
    /**
     * Handles date change with platform-specific behavior.
     * Automatically closes picker on Android after selection.
     */
    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
        if (selectedDate) {
            onChange(selectedDate);
        }
        
        if (Platform.OS === 'android') {
            onClose();
        }
    };

    /**
     * Formats date for display.
     * Uses displayFormat if provided, otherwise defaults to DD/MM/YYYY format.
     * 
     * @param date - Date to format
     * @returns Formatted date string
     */
    const formatDate = (date: Date): string => {
        if (displayFormat) {
            return displayFormat(date);
        }
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    if (!visible) {
        return null;
    }

    return (
        <View style={commonStyles.datePickerContainer}>
            <DateTimePicker
                value={value}
                mode="date"
                display={Platform.OS === 'android' ? 'default' : 'spinner'}
                onChange={handleDateChange}
            />
            
            {Platform.OS === 'ios' && (
                <TouchableOpacity
                    style={commonStyles.validateButton}
                    onPress={onClose}
                >
                    <Text style={commonStyles.validateButtonText}>Validate</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default PlatformDatePicker;
