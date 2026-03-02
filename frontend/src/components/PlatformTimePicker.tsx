/**
 * Modal time picker with scrollable hour and minute columns.
 *
 * @module PlatformTimePicker
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
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

const PlatformTimePicker: React.FC<PlatformTimePickerProps> = ({
    value,
    onChange,
    visible,
    onClose,
    displayFormat: _displayFormat,
}) => {
    const { t } = useTranslation();
    const [selectedHour, setSelectedHour] = useState(value.getHours());
    const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());

    const hourScrollRef = useRef<ScrollView>(null);
    const minuteScrollRef = useRef<ScrollView>(null);

    const ITEM_HEIGHT = 50;
    const _VISIBLE_ITEMS = 3;
    const LOOP_COUNT = 5; // Number of times to repeat the array for infinite scroll effect

    /**
     * Base arrays for hours and minutes.
     */
    const baseHours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
    const baseMinutes = useMemo(() => [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], []);

    /**
     * Creates looped arrays for infinite scrolling with unique identifiers.
     */
    const hours = useMemo(
        () =>
            Array(LOOP_COUNT)
                .fill(null)
                .flatMap((_, loopIndex) =>
                    baseHours.map((h) => ({ value: h, id: `${loopIndex}-${h}` }))
                ),
        [LOOP_COUNT, baseHours]
    );

    const minutes = useMemo(
        () =>
            Array(LOOP_COUNT)
                .fill(null)
                .flatMap((_, loopIndex) =>
                    baseMinutes.map((m) => ({ value: m, id: `${loopIndex}-${m}` }))
                ),
        [LOOP_COUNT, baseMinutes]
    );

    /**
     * Gets the middle index offset for centering the loop.
     */
    const getMiddleOffset = (arrayLength: number) => Math.floor(LOOP_COUNT / 2) * arrayLength;

    /**
     * Centers the scroll views on initial values.
     */
    useEffect(() => {
        if (visible) {
            setTimeout(() => {
                const hourOffset = getMiddleOffset(baseHours.length) + selectedHour;
                hourScrollRef.current?.scrollTo({
                    y: hourOffset * ITEM_HEIGHT,
                    animated: false,
                });
                const minuteIndex = baseMinutes.findIndex((m) => m === selectedMinute);
                const minuteOffset = getMiddleOffset(baseMinutes.length) + minuteIndex;
                minuteScrollRef.current?.scrollTo({
                    y: minuteOffset * ITEM_HEIGHT,
                    animated: false,
                });
            }, 10);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const isToday = (): boolean => {
        const today = new Date();
        return value.toDateString() === today.toDateString();
    };

    const isPastTime = (hour: number, minute: number): boolean => {
        // If not today, all times are valid
        if (!isToday()) return false;

        // Get current time
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Compare: time is past if hour is less, or same hour but minute is less
        if (hour < currentHour) return true;
        if (hour === currentHour && minute < currentMinute) return true;

        return false;
    };

    /**
     * Handles hour scroll and updates selection based on position.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleHourScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        if (index >= 0 && index < hours.length) {
            setSelectedHour(hours[index].value);
        }
    };

    /**
     * Handles minute scroll and updates selection based on position.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMinuteScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        if (index >= 0 && index < minutes.length) {
            setSelectedMinute(minutes[index].value);
        }
    };

    /**
     * Recenters hour scroll when scrolling ends (for infinite scroll effect).
     */
    const handleHourScrollEnd = () => {
        const hourIndex = getMiddleOffset(baseHours.length) + selectedHour;
        hourScrollRef.current?.scrollTo({
            y: hourIndex * ITEM_HEIGHT,
            animated: false,
        });
    };

    /**
     * Recenters minute scroll when scrolling ends (for infinite scroll effect).
     */
    const handleMinuteScrollEnd = () => {
        const minuteIndex = baseMinutes.findIndex((m) => m === selectedMinute);
        const minuteOffset = getMiddleOffset(baseMinutes.length) + minuteIndex;
        minuteScrollRef.current?.scrollTo({
            y: minuteOffset * ITEM_HEIGHT,
            animated: false,
        });
    };

    /**
     * Validates and closes with selected time.
     * Prevents validation if the selected time is in the past.
     */
    const handleValidate = () => {
        // Block validation if time is in the past
        if (isPastTime(selectedHour, selectedMinute)) {
            return; // Do nothing, keep picker open
        }

        const newDateTime = new Date(value);
        newDateTime.setHours(selectedHour, selectedMinute, 0, 0);
        onChange(newDateTime);
        onClose();
    };

    if (!visible) {
        return null;
    }

    // Check if selected time is in the past
    const isTimeInPast = isPastTime(selectedHour, selectedMinute);

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={commonStyles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{t('common.pickersText.Select Time')}</Text>

                    {/* Digital clock picker */}
                    <View style={styles.pickerContainer}>
                        {/* Hours column */}
                        <View style={styles.column}>
                            <ScrollView
                                ref={hourScrollRef}
                                showsVerticalScrollIndicator={false}
                                style={styles.scrollColumn}
                                contentContainerStyle={styles.scrollContent}
                                onScroll={handleHourScroll}
                                onMomentumScrollEnd={handleHourScrollEnd}
                                scrollEventThrottle={16}
                                snapToInterval={ITEM_HEIGHT}
                                decelerationRate="fast"
                            >
                                <View style={styles.spacer} />
                                {hours.map((hour) => (
                                    <View key={hour.id} style={styles.timeValue}>
                                        <Text
                                            style={[
                                                styles.timeValueText,
                                                selectedHour === hour.value &&
                                                    styles.selectedValueText,
                                                isPastTime(hour.value, 55) && styles.pastTimeText,
                                            ]}
                                        >
                                            {hour.value.toString().padStart(2, '0')}
                                        </Text>
                                    </View>
                                ))}
                                <View style={styles.spacer} />
                            </ScrollView>
                            {/* Selection overlay */}
                            <View style={styles.selectionOverlay} pointerEvents="none">
                                <View style={styles.overlayTop} />
                                <View style={styles.selectionBox} />
                                <View style={styles.overlayBottom} />
                            </View>
                        </View>

                        {/* Separator */}
                        <Text style={styles.separator}>:</Text>

                        {/* Minutes column */}
                        <View style={styles.column}>
                            <ScrollView
                                ref={minuteScrollRef}
                                showsVerticalScrollIndicator={false}
                                style={styles.scrollColumn}
                                contentContainerStyle={styles.scrollContent}
                                onScroll={handleMinuteScroll}
                                onMomentumScrollEnd={handleMinuteScrollEnd}
                                scrollEventThrottle={16}
                                snapToInterval={ITEM_HEIGHT}
                                decelerationRate="fast"
                            >
                                <View style={styles.spacer} />
                                {minutes.map((minute) => (
                                    <View key={minute.id} style={styles.timeValue}>
                                        <Text
                                            style={[
                                                styles.timeValueText,
                                                selectedMinute === minute.value &&
                                                    styles.selectedValueText,
                                                isPastTime(selectedHour, minute.value) &&
                                                    styles.pastTimeText,
                                            ]}
                                        >
                                            {minute.value.toString().padStart(2, '0')}
                                        </Text>
                                    </View>
                                ))}
                                <View style={styles.spacer} />
                            </ScrollView>
                            {/* Selection overlay */}
                            <View style={styles.selectionOverlay} pointerEvents="none">
                                <View style={styles.overlayTop} />
                                <View style={styles.selectionBox} />
                                <View style={styles.overlayBottom} />
                            </View>
                        </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>
                                {t('common.buttons.Cancel')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.validateButton,
                                isTimeInPast && styles.validateButtonDisabled,
                            ]}
                            onPress={handleValidate}
                            disabled={isTimeInPast}
                        >
                            <Text style={styles.validateButtonText}>
                                {t('common.buttons.Validate')}
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
        padding: 20,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 150,
        marginBottom: 20,
    },
    column: {
        flex: 1,
        height: '100%',
        position: 'relative',
    },
    scrollColumn: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 0,
    },
    spacer: {
        height: 50,
    },
    separator: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4A90E2',
        marginHorizontal: 15,
    },
    timeValue: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeValueText: {
        fontSize: 24,
        color: '#999999',
        fontWeight: '400',
    },
    selectedValueText: {
        color: '#000000',
        fontWeight: '600',
        fontSize: 28,
    },
    pastTimeText: {
        color: '#999999',
        opacity: 0.4,
    },
    selectionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    overlayTop: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    selectionBox: {
        height: 50,
        backgroundColor: 'transparent',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E0E0E0',
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        padding: 15,
        backgroundColor: '#E0E0E0',
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    validateButton: {
        flex: 1,
        padding: 15,
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        alignItems: 'center',
    },
    validateButtonDisabled: {
        backgroundColor: '#E0E0E0',
        opacity: 0.6,
    },
    validateButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default PlatformTimePicker;
