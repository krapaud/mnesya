/**
 * Fullscreen notification screen for elderly users.
 *
 * Shows the reminder message with three action buttons (Done, Remind later, Unable).
 * The bell icon animates to grab attention.
 *
 * On mount, checks the current reminder status:
 * if already DONE or UNABLE, navigates back immediately to prevent duplicate actions.
 *
 * @module ReminderNotificationScreen
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { createBellSwingAnimation, getBellRotation } from '../utils/animations';
import {
    getReminderStatus,
    postponeReminder,
    updateReminderStatus,
} from '../services/reminderService';

type Props = NativeStackScreenProps<RootStackParamList, 'ReminderNotification'>;

const ReminderNotificationScreen: React.FC<Props> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { reminderId, message } = route.params;

    // Build the reminder object from route params
    const reminder = {
        id: reminderId,
        title: t('ReminderNotification.title'),
        message: message || t('ReminderNotification.defaultMessage'),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    // Animation reference using useRef to persist the animated value across renders
    const bellAnimation = useRef(new Animated.Value(0)).current;

    // Starts the bell swing animation when the screen loads
    // useEffect with empty dependency array triggers it once on mount
    useEffect(() => {
        createBellSwingAnimation(bellAnimation).start();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // If the reminder is already DONE or UNABLE, go back immediately
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const current = await getReminderStatus(String(reminderId));
                if (current.status === 'DONE' || current.status === 'UNABLE') {
                    navigation.goBack();
                }
            } catch (_error) {
                // No status yet (404) — reminder is still actionable, do nothing
            }
        };
        checkStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reminderId]);

    const handleReminderAction = async (status: string) => {
        // If postponed, schedule a new notification in 5 minutes
        try {
            if (status === 'Postponed') {
                await postponeReminder(String(reminderId), 5);
            } else {
                await updateReminderStatus(String(reminderId), { status: status.toUpperCase() });
            }
        } catch {}
        // Navigate back to UserHome
        navigation.goBack();
    };

    return (
        <View style={commonStyles.container}>
            {/* Header with app logo and name */}
            <View style={commonStyles.header}>
                <View style={commonStyles.headerSpacer} />
                <View style={commonStyles.headerCenter}>
                    <Image
                        source={require('../../assets/mnesya-logo.png')}
                        style={commonStyles.logo}
                    />
                    <Text style={commonStyles.appName}>Mnesya</Text>
                </View>
                <View style={commonStyles.headerSpacer} />
            </View>

            {/* Reminder content section */}
            <View style={styles.contentContainer}>
                {/*
                 * Animated bell icon with rotation transform from getBellRotation
                 * Creates a swinging effect to catch the user's attention
                 */}
                <Animated.View style={[styles.bellContainer, getBellRotation(bellAnimation)]}>
                    <Ionicons name="notifications-outline" size={80} color="#FFFFFF" />
                </Animated.View>
                <Text style={styles.reminderTimeText}>{reminder.time}</Text>
                <Text style={styles.reminderTitleText}>{reminder.title}</Text>
                {/*
                 * Message text with overflow protection
                 * numberOfLines={4} and ellipsizeMode prevent text overflow issues
                 * Ensures the message stays within bounds even with long text
                 */}
                <Text style={styles.reminderMessage} numberOfLines={4} ellipsizeMode="tail">
                    {reminder.message}
                </Text>

                {/* Three action buttons: Done (green), Remind later (orange), Unable (red) */}
                <TouchableOpacity
                    style={[styles.bgButtonDone, { marginTop: 15 }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleReminderAction('Done');
                    }}
                >
                    <Text style={styles.buttonDoneText}>
                        {t('ReminderNotification.buttons.Done')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.bgButtonPostpone}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleReminderAction('Postponed');
                    }}
                >
                    <Text style={styles.buttonPostponeText}>
                        {t('ReminderNotification.buttons.Remind later')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.bgButtonUnable}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleReminderAction('Unable');
                    }}
                >
                    <Text style={styles.buttonUnableText}>
                        {t('ReminderNotification.buttons.Unable')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // LAYOUT
    contentContainer: {
        width: '100%',
        paddingBottom: 10,
        alignItems: 'center',
        marginTop: 40,
    },

    // TYPOGRAPHY
    reminderTimeText: {
        fontSize: 50,
        fontWeight: 'bold',
    },
    reminderTitleText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    reminderMessage: {
        fontSize: 18,
        alignContent: 'center',
        color: '#666666',
        marginTop: 10,
        textAlign: 'center',
        height: 85,
        lineHeight: 24,
    },
    bgButtonDone: {
        backgroundColor: '#4CAF50',
        padding: 40,
        borderRadius: 10,
        marginBottom: 10,
        alignSelf: 'center',
        width: '100%',
    },
    buttonDoneText: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    bgButtonPostpone: {
        backgroundColor: '#FF9800',
        padding: 40,
        borderRadius: 10,
        marginBottom: 10,
        alignSelf: 'center',
        width: '100%',
    },
    buttonPostponeText: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    bgButtonUnable: {
        backgroundColor: '#F44336',
        padding: 40,
        borderRadius: 10,
        marginBottom: 10,
        alignSelf: 'center',
        width: '100%',
    },
    buttonUnableText: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    bellContainer: {
        backgroundColor: '#4CAF50',
        width: 100,
        height: 100,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 20,
    },
});

export default ReminderNotificationScreen;
