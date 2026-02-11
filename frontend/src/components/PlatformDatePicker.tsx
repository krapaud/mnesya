/**
 * Cross-platform calendar date picker component.
 * 
 * Provides a consistent modal-based calendar interface matching the
 * application's design system. Displays an interactive monthly calendar
 * view with navigation and date selection.
 * 
 * @module PlatformDatePicker
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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
 * Platform-adapted calendar date picker component.
 * 
 * Displays a modal with an interactive calendar. Provides month navigation,
 * visual date selection, and highlights today and selected dates.
 * 
 * @param props - Component properties
 * @returns Calendar date picker component or null if not visible
 */
const PlatformDatePicker: React.FC<PlatformDatePickerProps> = ({
    value,
    onChange,
    visible,
    onClose,
    displayFormat
}) => {
    const { t } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

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

    /**
     * Gets month name from date.
     * 
     * @param date - Date to extract month from
     * @returns Full month name
     */
    const getMonthName = (date: Date): string => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[date.getMonth()];
    };

    /**
     * Navigates to previous month.
     */
    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    /**
     * Navigates to next month.
     */
    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    /**
     * Generates calendar days for current month view.
     * Includes padding days from previous/next months for complete week rows.
     * 
     * @returns Array of dates (or null for empty cells) representing the calendar grid
     */
    const generateCalendarDays = (): (Date | null)[] => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        // First day of month (0 = Sunday, 6 = Saturday)
        const firstDay = new Date(year, month, 1).getDay();
        
        // Number of days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days: (Date | null)[] = [];
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        
        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        
        return days;
    };

    /**
     * Handles date selection and closes modal.
     * 
     * @param date - Selected date
     */
    const handleDateSelect = (date: Date) => {
        onChange(date);
        onClose();
    };

    /**
     * Checks if a date is today.
     * 
     * @param date - Date to check
     * @returns True if date is today
     */
    const isToday = (date: Date | null): boolean => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    /**
     * Checks if a date is currently selected.
     * 
     * @param date - Date to check
     * @returns True if date is selected
     */
    const isSelected = (date: Date | null): boolean => {
        if (!date) return false;
        return date.toDateString() === value.toDateString();
    };

    /**
     * Checks if a date is in the past.
     * 
     * @param date - Date to check
     * @returns True if date is before today
     */
    const isPastDate = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return date < today;
    };

    if (!visible) {
        return null;
    }

    const calendarDays = generateCalendarDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header with month navigation */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                            <Ionicons name="chevron-back" size={24} color="#4A90E2" />
                        </TouchableOpacity>
                        <Text style={styles.monthTitle}>
                            {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                        </Text>
                        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                            <Ionicons name="chevron-forward" size={24} color="#4A90E2" />
                        </TouchableOpacity>
                    </View>

                    {/* Week day headers */}
                    <View style={styles.weekDaysRow}>
                        {weekDays.map((day, index) => (
                            <View key={index} style={styles.weekDayCell}>
                                <Text style={styles.weekDayText}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={styles.calendarGrid}>
                        {calendarDays.map((date, index) => {
                            if (date === null) {
                                // Empty cell for padding
                                return <View key={`empty-${index}`} style={styles.dayCell} />;
                            }

                            const todayHighlight = isToday(date);
                            const selectedHighlight = isSelected(date);
                            const isPast = isPastDate(date);

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayCell,
                                        todayHighlight && styles.todayCell,
                                        selectedHighlight && styles.selectedCell
                                    ]}
                                    onPress={() => {
                                        if (isPast) return;
                                        handleDateSelect(date);
                                    }}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        selectedHighlight && styles.selectedDayText,
                                        isPast && styles.pastDayText,
                                    ]}>
                                        {date.getDate()}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Close button */}
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
        width: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    navButton: {
        padding: 8,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    weekDaysRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    weekDayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    weekDayText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%', // 100% / 7 days
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        padding: 12,
    },
    todayCell: {
        borderColor: '#4A90E2',
        borderRadius: 6,
    },
    selectedCell: {
        backgroundColor: '#4A90E2',
        borderRadius: 6,
    },
    dayText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        lineHeight: 20,
    },
    pastDayText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        lineHeight: 20,
        opacity: 0.4,
    },
    selectedDayText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    closeButton: {
        marginTop: 20,
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

export default PlatformDatePicker;
