/**
 * Activity log modal component for the caregiver dashboard.
 *
 * Displays user interactions (DONE, POSTPONED, UNABLE, MISSED) across all
 * reminders managed by the caregiver over the last 48 hours.
 *
 * @module ActivityLogModal
 */

import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { commonStyles } from '../styles/commonStyles';
import type { ActivityLogEntry } from '../types/interfaces';

// ─── Status configuration ───────────────────────────────────────────────────

type StatusKey = 'DONE' | 'POSTPONED' | 'UNABLE' | 'MISSED';

const STATUS_CONFIG: Record<
    StatusKey,
    { icon: keyof typeof Ionicons.glyphMap; color: string; labelKey: string }
> = {
    DONE: {
        icon: 'checkmark-circle',
        color: '#4CAF50',
        labelKey: 'dashboard.activityLog.statusDone',
    },
    POSTPONED: {
        icon: 'time-outline',
        color: '#2196F3',
        labelKey: 'dashboard.activityLog.statusPostponed',
    },
    UNABLE: {
        icon: 'close-circle',
        color: '#F44336',
        labelKey: 'dashboard.activityLog.statusUnable',
    },
    MISSED: {
        icon: 'alert-circle-outline',
        color: '#E53935',
        labelKey: 'dashboard.activityLog.statusMissed',
    },
};

// ─── Helper ─────────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string to "dd/mm/yyyy hh:mm" — locale-independent.
 */
const formatDate = (iso: string): string => {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// ─── Sub-component: single log entry ────────────────────────────────────────

interface LogEntryProps {
    entry: ActivityLogEntry;
}

const LogEntryRow: React.FC<LogEntryProps> = ({ entry }) => {
    const { t } = useTranslation();

    const config = STATUS_CONFIG[entry.status as StatusKey] ?? STATUS_CONFIG['MISSED'];

    return (
        <View style={styles.entryRow}>
            <Ionicons name={config.icon} size={26} color={config.color} style={styles.entryIcon} />
            <View style={styles.entryContent}>
                <Text style={styles.entryTitle} numberOfLines={1}>
                    {entry.reminder_title}
                </Text>
                <Text style={styles.entryMeta}>
                    {entry.user_first_name} {entry.user_last_name}
                    {'  ·  '}
                    <Text style={[styles.entryStatus, { color: config.color }]}>
                        {t(config.labelKey)}
                    </Text>
                </Text>
                <Text style={styles.entryDate}>{formatDate(entry.occurred_at)}</Text>
            </View>
        </View>
    );
};

// ─── Main component ──────────────────────────────────────────────────────────

interface ActivityLogModalProps {
    /** Controls modal visibility */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Activity log entries */
    entries: ActivityLogEntry[] | null;
    /** Whether the data is being loaded */
    loading: boolean;
    /** Error i18n key, or null */
    error: string | null;
}

/**
 * Modal that lists recent user interactions managed by the caregiver.
 *
 * Shows a scrollable list of DONE / POSTPONED / UNABLE / MISSED statuses with
 * coloured icons, the reminder title, the user's name and the timestamp.
 * Displays a spinner while loading and a message when the list is empty.
 */
const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
    visible,
    onClose,
    entries,
    loading,
    error,
}) => {
    const { t } = useTranslation();

    const [showScrollFade, setShowScrollFade] = useState(true);
    const [isScrollable, setIsScrollable] = useState(false);
    const scrollContainerHeight = useRef(0);

    const handleContentSizeChange = (_: number, contentHeight: number) => {
        setIsScrollable(contentHeight > scrollContainerHeight.current);
    };

    const handleScroll = (event: { nativeEvent: { contentOffset: { y: number }; layoutMeasurement: { height: number }; contentSize: { height: number } } }) => {
        const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
        const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 10;
        setShowScrollFade(!isAtBottom);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centeredState}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centeredState}>
                    <Ionicons name="alert-circle-outline" size={40} color="#9E9E9E" />
                    <Text style={styles.emptyText}>{t(error)}</Text>
                </View>
            );
        }

        if (!entries || entries.length === 0) {
            return (
                <View style={styles.centeredState}>
                    <Ionicons name="time-outline" size={40} color="#9E9E9E" />
                    <Text style={styles.emptyText}>{t('dashboard.activityLog.empty')}</Text>
                </View>
            );
        }

        return (
            <View style={styles.listWrapper}>
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    onContentSizeChange={handleContentSizeChange}
                    onLayout={(e) => { scrollContainerHeight.current = e.nativeEvent.layout.height; }}
                    scrollEventThrottle={16}
                >
                    {entries.map((entry) => (
                        <LogEntryRow key={entry.status_id} entry={entry} />
                    ))}
                </ScrollView>
                {showScrollFade && isScrollable && (
                    <View style={styles.scrollFade} pointerEvents="none">
                        <Ionicons name="chevron-down" size={24} color="#4A90E2" />
                    </View>
                )}
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={commonStyles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>{t('dashboard.activityLog.title')}</Text>
                    </View>
                    <Text style={styles.subtitle}>{t('dashboard.activityLog.subtitle')}</Text>

                    {/* Content */}
                    <View style={styles.contentArea}>{renderContent()}</View>

                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>{t('common.buttons.Close')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 24,
        width: '92%',
        maxHeight: '80%',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
    },
    subtitle: {
        fontSize: 13,
        color: '#888888',
        marginBottom: 16,
        textAlign: 'center',
    },
    contentArea: {
        width: '100%',
        minHeight: 80,
        maxHeight: 380,
    },
    centeredState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: '#9E9E9E',
        textAlign: 'center',
    },
    listWrapper: {
        width: '100%',
        position: 'relative',
    },
    list: {
        width: '100%',
    },
    scrollFade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    listContent: {
        paddingBottom: 4,
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    entryIcon: {
        marginTop: 2,
        marginRight: 12,
    },
    entryContent: {
        flex: 1,
    },
    entryTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333333',
    },
    entryMeta: {
        fontSize: 13,
        color: '#666666',
        marginTop: 2,
    },
    entryStatus: {
        fontWeight: '600',
    },
    entryDate: {
        fontSize: 12,
        color: '#AAAAAA',
        marginTop: 2,
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 40,
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ActivityLogModal;
