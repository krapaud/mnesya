/**
 * ReminderNotificationScreen - Fullscreen notification for elderly users
 * 
 * Displays reminder details with three clear action buttons.
 * The bell icon animates to grab attention, and all buttons are large and easy to tap.
 * 
 * Key features:
 * - Animated bell icon using React Native Animated API
 * - Three action buttons: Done (green), Remind later (orange), Unable (red)
 * - Text overflow handling with numberOfLines to prevent layout issues
 * - Haptic feedback on all interactions for better accessibility
 * 
 * Animation utilities centralized in utils/animations.ts for reusability.
 * 
 * @component
 * @param {Props} navigation - Navigation object for screen transitions
 * @param {Props} route - Route params containing reminderId
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { fakeReminders } from '../data/fakeData';
import { createBellSwingAnimation, getBellRotation } from '../utils/animations';

type Props = NativeStackScreenProps<RootStackParamList, 'ReminderNotification'>;

const ReminderNotificationScreen: React.FC<Props> = ({ navigation, route }) => {
    const { reminderId } = route.params;
    const reminder = fakeReminders.find(r => r.id === reminderId);
    // Animation reference using useRef to persist the animated value across renders
    const bellAnimation = useRef(new Animated.Value(0)).current;

    // Starts the bell swing animation when the screen loads
    // useEffect with empty dependency array triggers it once on mount
    useEffect(() => {
        createBellSwingAnimation(bellAnimation).start();
    }, []);

    /**
     * Handles reminder action and updates status
     * @param status - The new status: 'Done', 'Postponed', or 'Unable'
     */
    const handleReminderAction = (status: string) => {
        // Log the action for testing (will be API call in Sprint 3)
        console.log(`Reminder ${reminderId} status changed to: ${status}`);
        
        // TODO Sprint 3: Call API to update reminder status
        // await updateReminderStatus(reminderId, status);
        
        // Navigate back to UserHome
        navigation.goBack();
    };

    return (
        <View style={commonStyles.container}>
            {/* Header with app logo and name */}
            <View style={[commonStyles.header, { justifyContent: 'center', paddingTop: 40 }]}>
                <Image 
                    source={require('../../assets/mnesya-logo.png')} 
                    style={commonStyles.logo}
                />
                <Text style={commonStyles.appName}>Mnesya</Text>
            </View>

            {/* Reminder content section */}
            <View style={[commonStyles.content, { alignItems: 'center', marginTop: 40 }]}>
                {reminder ? (
                    <>
                        {/* 
                         * Animated bell icon with rotation transform from getBellRotation
                         * Creates a swinging effect to catch the user's attention
                         */}
                        <Animated.View style={[
                            styles.bellContainer,
                            getBellRotation(bellAnimation),
                        ]}>
                            <Ionicons name="notifications-outline" size={80} color="#FFFFFF" />
                        </Animated.View>
                        <Text style={styles.reminderTimeText}>{reminder.time}</Text>
                        <Text style={styles.reminderTitleText}>{reminder.title}</Text>
                        {/* 
                         * Message text with overflow protection
                         * numberOfLines={4} and ellipsizeMode prevent text overflow issues
                         * Ensures the message stays within bounds even with long text
                         */}
                        <Text 
                            style={styles.reminderMessage}
                            numberOfLines={4}
                            ellipsizeMode="tail"
                        >
                            {reminder.message}
                        </Text>

                        {/* 
                         * Three action buttons for elderly-friendly interaction:
                         * - Done (green): Task completed successfully
                         * - Remind later (orange): Need more time, will try again
                         * - Unable (red): Cannot complete the task
                         * 
                         * Color coding makes the meaning clear without reading
                         * All buttons include haptic feedback for better user experience
                         * Sprint 3 will add API calls to update reminder status
                         */}
                        <TouchableOpacity 
                            style={[styles.bgButtonDone, { marginTop: 15}]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleReminderAction('Done');
                            }}
                        >
                            <Text style={styles.buttonDoneText}>Done</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.bgButtonPostpone}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleReminderAction('Postponed');
                            }}
                        >
                            <Text style={styles.buttonPostponeText}>Remind later</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.bgButtonUnable}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleReminderAction('Unable');
                            }}
                        >
                            <Text style={styles.buttonUnableText}>Unable</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <Text style={commonStyles.emptyMessage}>Reminder not found</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Screen-specific styles
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
        color: '#999',
        marginTop: 10,
        textAlign: 'center',
        height: 100,
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