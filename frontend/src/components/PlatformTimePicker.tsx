/**
 * Cross-platform time picker component.
 * 
 * Wraps the DateTimePicker in time mode to provide a consistent
 * interface across iOS and Android platforms.
 * 
 * @module PlatformTimePicker
 */

import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { commonStyles } from '../styles/commonStyles';

/**
 * Props for the PlatformTimePicker component.
 */
interface PlatformTimePickerProps {
    /** Currently selected time (Date object) */
    value: Date;
    /** Callback triggered when time changes */
    onChange: (time: Date) => void;
    /** Controls the visibility of the picker */
    visible: boolean;
    /** Callback triggered when picker closes */
    onClose: () => void;
    /** Optional custom time formatting function */
    displayFormat?: (time: Date) => string;
}

/**
 * Platform-adapted time picker component.
 * 
 * Displays a native time picker with platform-specific handling:
 * iOS shows a spinner with validation button, Android auto-closes on selection.
 * 
 * @param props - Component properties
 * @returns Time picker component or null if not visible
 */
const PlatformTimePicker: React.FC<PlatformTimePickerProps> = ({
    value,
    onChange,
    visible,
    onClose,
    displayFormat
}) => {
    /**
     * Handles time change with platform-specific behavior.
     * Automatically closes picker on Android after selection.
     */
    const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date): void => {
        if (selectedTime) {
            onChange(selectedTime);
        }
        
        if (Platform.OS === 'android') {
            onClose();
        }
    };

    /**
     * Formats time for display.
     * Uses displayFormat if provided, otherwise defaults to HH:MM format.
     * 
     * @param time - Time to format
     * @returns Formatted time string
     */
    const formatTime = (time: Date): string => {
        if (displayFormat) {
            return displayFormat(time);
        }
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    if (!visible) {
        return null;
    }

    return (
        <View style={commonStyles.timePickerContainer}>
            <DateTimePicker
                value={value}
                mode="time"
                display={Platform.OS === 'android' ? 'default' : 'spinner'}
                onChange={handleTimeChange}
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

export default PlatformTimePicker;
