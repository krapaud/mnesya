/**
 * RecurrencePicker — selects days of the week for recurring reminders.
 *
 * Premium-gated: tapping any day when the plan is free opens the PremiumModal.
 *
 * @module RecurrencePicker
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import PremiumModal from './PremiumModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecurrencePickerProps {
    /** Currently selected day indices (0 = Monday … 6 = Sunday). */
    selectedDays: number[];
    /** Called when the user toggles a day. */
    onChange: (days: number[]) => void;
    /** Whether the user has a premium plan. */
    isPremium: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const RecurrencePicker: React.FC<RecurrencePickerProps> = ({
    selectedDays,
    onChange,
    isPremium,
}) => {
    const { t } = useTranslation();
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const dayKeys = t('recurrence.days', { returnObjects: true }) as string[];

    const handlePress = (index: number) => {
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        const next = selectedDays.includes(index)
            ? selectedDays.filter((d) => d !== index)
            : [...selectedDays, index].sort((a, b) => a - b);
        onChange(next);
    };

    return (
        <View>
            <Text style={styles.label}>{t('recurrence.label')}</Text>
            <View style={styles.row}>
                {dayKeys.map((day, index) => {
                    const isSelected = selectedDays.includes(index);
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayButton,
                                isSelected && styles.dayButtonSelected,
                                !isPremium && styles.dayButtonLocked,
                            ]}
                            onPress={() => handlePress(index)}
                            accessibilityLabel={day}
                            accessibilityState={{ selected: isSelected }}
                        >
                            <Text
                                style={[
                                    styles.dayText,
                                    isSelected && styles.dayTextSelected,
                                    !isPremium && styles.dayTextLocked,
                                ]}
                            >
                                {day}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            {!isPremium && (
                <Text style={styles.lockedHint}>{t('recurrence.premiumHint')}</Text>
            )}
            <PremiumModal
                visible={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                feature="recurrence"
            />
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    label: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 10,
        marginTop: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    dayButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayButtonSelected: {
        backgroundColor: '#4A90E2',
    },
    dayButtonLocked: {
        opacity: 0.45,
    },
    dayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333333',
    },
    dayTextSelected: {
        color: '#FFFFFF',
    },
    dayTextLocked: {
        color: '#999999',
    },
    lockedHint: {
        fontSize: 12,
        color: '#999999',
        fontStyle: 'italic',
        marginBottom: 8,
    },
});

export default RecurrencePicker;
