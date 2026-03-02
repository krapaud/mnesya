/**
 * Modal calendar picker for selecting a date.
 *
 * @module PlatformDatePicker
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
    /** Allow selecting dates in the past (default: false) */
    allowPastDates?: boolean;
}

const PlatformDatePicker: React.FC<PlatformDatePickerProps> = ({
    value,
    onChange,
    visible,
    onClose,
    displayFormat,
    allowPastDates = false,
}) => {
    const { t } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState(
        new Date(value.getFullYear(), value.getMonth(), 1)
    );
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    /** Formats a date for display (DD/MM/YYYY by default). */
    const _formatDate = (date: Date): string => {
        if (displayFormat) {
            return displayFormat(date);
        }
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    /** Returns the full name of a month from a date. */
    const getMonthName = (date: Date): string => {
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        return months[date.getMonth()];
    };

    /** Returns the list of all month names. */
    const getMonthNames = (): string[] => {
        return [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
    };

    /** Generates the list of selectable years (1920 to next year). */
    const generateYears = (): number[] => {
        const currentYear = new Date().getFullYear();
        const years: number[] = [];
        for (let year = 1920; year <= currentYear + 1; year++) {
            years.push(year);
        }
        return years.reverse(); // Most recent first
    };

    const handleYearSelect = (year: number) => {
        setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
        setShowYearPicker(false);
    };

    const handleMonthSelect = (monthIndex: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
        setShowMonthPicker(false);
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    /** Builds the grid of days for the current month (includes null for empty cells). */
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

    const handleDateSelect = (date: Date) => {
        onChange(date);
        onClose();
    };

    const isToday = (date: Date | null): boolean => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date | null): boolean => {
        if (!date) return false;
        return date.toDateString() === value.toDateString();
    };

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
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={commonStyles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Show Year Picker if active */}
                    {showYearPicker && (
                        <View style={styles.pickerOverlay}>
                            <View style={styles.pickerContent}>
                                <View style={styles.pickerHeader}>
                                    <Text style={styles.pickerTitle}>Select Year</Text>
                                    <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                                        <Ionicons name="close" size={24} color="#666666" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.yearList}>
                                    {generateYears().map((year) => (
                                        <TouchableOpacity
                                            key={year}
                                            style={[
                                                styles.yearItem,
                                                year === currentMonth.getFullYear() &&
                                                    styles.selectedYearItem,
                                            ]}
                                            onPress={() => handleYearSelect(year)}
                                        >
                                            <Text
                                                style={[
                                                    styles.yearText,
                                                    year === currentMonth.getFullYear() &&
                                                        styles.selectedYearText,
                                                ]}
                                            >
                                                {year}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    )}

                    {/* Show Month Picker if active */}
                    {showMonthPicker && (
                        <View style={styles.pickerOverlay}>
                            <View style={styles.pickerContent}>
                                <View style={styles.pickerHeader}>
                                    <Text style={styles.pickerTitle}>Select Month</Text>
                                    <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                                        <Ionicons name="close" size={24} color="#666666" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.monthGrid}>
                                    {getMonthNames().map((month, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.monthItem,
                                                index === currentMonth.getMonth() &&
                                                    styles.selectedMonthItem,
                                            ]}
                                            onPress={() => handleMonthSelect(index)}
                                        >
                                            <Text
                                                style={[
                                                    styles.monthText,
                                                    index === currentMonth.getMonth() &&
                                                        styles.selectedMonthText,
                                                ]}
                                            >
                                                {month.substring(0, 3)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Header with month navigation */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                            <Ionicons name="chevron-back" size={24} color="#4A90E2" />
                        </TouchableOpacity>
                        <View style={styles.monthTitleContainer}>
                            <TouchableOpacity
                                onPress={() => setShowMonthPicker(true)}
                                style={styles.monthTitleButton}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.monthTitle}>{getMonthName(currentMonth)}</Text>
                                <Ionicons
                                    name="chevron-down"
                                    size={16}
                                    color="#4A90E2"
                                    style={styles.dropdownIcon}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowYearPicker(true)}
                                style={styles.yearTitleButton}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.monthTitle}>{currentMonth.getFullYear()}</Text>
                                <Ionicons
                                    name="chevron-down"
                                    size={16}
                                    color="#4A90E2"
                                    style={styles.dropdownIcon}
                                />
                            </TouchableOpacity>
                        </View>
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
                            const isDisabled = !allowPastDates && isPast;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayCell,
                                        todayHighlight && styles.todayCell,
                                        selectedHighlight && styles.selectedCell,
                                    ]}
                                    onPress={() => {
                                        if (isDisabled) return;
                                        handleDateSelect(date);
                                    }}
                                    disabled={isDisabled}
                                >
                                    <Text
                                        style={[
                                            styles.dayText,
                                            selectedHighlight && styles.selectedDayText,
                                            isDisabled && styles.pastDayText,
                                        ]}
                                    >
                                        {date.getDate()}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
        color: '#333333',
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
        color: '#666666',
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
        color: '#333333',
        textAlign: 'center',
        lineHeight: 20,
    },
    pastDayText: {
        fontSize: 16,
        color: '#333333',
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
    monthTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    monthTitleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#F0F8FF',
    },
    yearTitleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#F0F8FF',
        marginLeft: 5,
    },
    dropdownIcon: {
        marginLeft: 2,
    },
    // Year and Month Picker Overlay Styles
    pickerOverlay: {
        position: 'absolute',
        top: 70,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    pickerContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        width: '100%',
        maxHeight: '95%',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
    },
    yearList: {
        maxHeight: 400,
    },
    yearItem: {
        padding: 15,
        borderRadius: 8,
        marginVertical: 4,
        backgroundColor: '#F5F5F5',
    },
    selectedYearItem: {
        backgroundColor: '#4A90E2',
    },
    yearText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333333',
    },
    selectedYearText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 80,
    },
    monthItem: {
        width: '30%',
        padding: 15,
        marginVertical: 5,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    selectedMonthItem: {
        backgroundColor: '#4A90E2',
    },
    monthText: {
        fontSize: 14,
        color: '#333333',
    },
    selectedMonthText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default PlatformDatePicker;
