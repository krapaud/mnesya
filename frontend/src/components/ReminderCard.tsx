/**
 * Card showing a single reminder with its current status and a delete button.
 *
 * @module ReminderCard
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useReminderStatus } from '../hooks';
import { commonStyles } from '../styles/commonStyles';
import type { ReminderData } from '../types/interfaces';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReminderCardProps {
    reminder: ReminderData;
    onDelete: (id: string) => void;
    reloadTrigger?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onDelete, reloadTrigger }) => {
    const { t } = useTranslation();
    const { reminderStatus } = useReminderStatus(reminder.id, undefined, reloadTrigger);

    return (
        <View style={commonStyles.reminderCard}>
            <View style={commonStyles.reminderHeader}>
                <Text style={commonStyles.reminderTitle}>{reminder.title}</Text>
                <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => onDelete(reminder.id)}
                >
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
            </View>
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                }}
            >
                <View style={commonStyles.reminderDetails}>
                    <View style={commonStyles.detailRow}>
                        <Ionicons name="person-outline" size={16} color="#666666" />
                        <Text style={commonStyles.detailText}>
                            {reminder.user_first_name && reminder.user_last_name
                                ? `${reminder.user_first_name} ${reminder.user_last_name}`
                                : reminder.user_id}
                        </Text>
                    </View>
                    <View style={commonStyles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#666666" />
                        <Text style={commonStyles.detailText}>
                            {new Date(reminder.scheduled_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>
                </View>
                {reminderStatus && (
                    <Text
                        style={[
                            commonStyles.statusText,
                            {
                                DONE: commonStyles.statusDone,
                                PENDING: commonStyles.statusPending,
                                POSTPONED: commonStyles.statusPostponed,
                                UNABLE: commonStyles.statusUnable,
                                MISSED: commonStyles.statusMissed,
                            }[reminderStatus.status] ?? commonStyles.statusPending,
                        ]}
                    >
                        {t(
                            `reminders.status.${reminderStatus.status.charAt(0).toUpperCase() + reminderStatus.status.slice(1).toLowerCase()}`
                        )}
                    </Text>
                )}
            </View>
        </View>
    );
};

export default ReminderCard;
