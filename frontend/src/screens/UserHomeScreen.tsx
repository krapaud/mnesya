/**
 * UserHomeScreen - Main screen for elderly users to view their reminders
 * 
 * Displays upcoming reminders in a simple, accessible way following elderly-friendly
 * design principles with large text and high contrast.
 * 
 * Currently uses fake data for testing. Backend API integration planned for Sprint 2.
 * Each reminder card shows the title, date, and time with a bell icon to view details.
 * 
 * @component
 * @param {Props} navigation - Navigation object for screen transitions
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UserTabsParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { fakeReminders } from '../data/fakeData';
import { getUserInfo } from '../services/tokenService';
import { useRefresh } from '../contexts/RefreshContext';

type Props = NativeStackScreenProps<UserTabsParamList, 'Refresh'>;

const UserHomeScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const { refreshTrigger, isRefreshing, setIsRefreshing } = useRefresh();

    const [showAlert, setShowAlert] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userReminders, setUserReminders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * Loads user data and filters reminders.
     * Re-runs when refreshTrigger changes (when user taps refresh button).
     * Ensures loading indicator displays for minimum 1 second for better UX.
     */
    useEffect(() => {
        const loadUserData = async () => {
            const startTime = Date.now();
            
            const user = await getUserInfo();
            setCurrentUser(user);
            
            if (user?.first_name && user?.last_name) {
                const filtered = fakeReminders.filter(
                    r => r.profileName === `${user.first_name} ${user.last_name}`
                );
                setUserReminders(filtered);
            }
            
            // Ensure minimum 1 second display time for loading indicator
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 1000 - elapsedTime);
            
            setTimeout(() => {
                setLoading(false);
                setIsRefreshing(false);
            }, remainingTime);
        };
        
        loadUserData();
    }, [refreshTrigger]);

    /**
     * Checks if a reminder is available (date/time has passed)
     * @param date - Format "DD/MM/YYYY"
     * @param time - Format "HH:MM"
     * @returns true if reminder time has passed, false otherwise
     */
    const isReminderAvailable = (date: string, time: string): boolean => {
        const [day, month, year] = date.split('/').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        const reminderDateTime = new Date(year, month - 1, day, hours, minutes);
        return reminderDateTime <= new Date();
    };

    return (
        <View style={commonStyles.container}>
            {/* Header with logo */}
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

            {/* 
             * Personalized greeting using the user's first name
             * Helps elderly users feel comfortable with the app
             */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>{t('UserHome.greeting')} {currentUser?.first_name} !</Text>
                <Text style={styles.subtitle}>{t('UserHome.subtitle')}</Text>
            </View>
            <ScrollView>
                {/* 
                 * Reminder list with empty state handling
                 * Each reminder displayed as a card with tap feedback for accessibility
                 */}
                {userReminders.length === 0 ? (
                    <Text style={commonStyles.emptyMessage}>{t('UserHome.messages.noReminders')}</Text>
                ) : (
                    userReminders.map((reminder) => (
                        <View key={reminder.id} style={commonStyles.reminderCard}>
                            <View style={commonStyles.reminderHeader}>
                                <Text style={commonStyles.reminderTitle}>{reminder.title}</Text>
                                {/* 
                                 * Bell icon - always visible
                                 * Shows alert if reminder not yet available, navigates otherwise
                                 */}
                                <TouchableOpacity 
                                    style={styles.bellIcon}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        
                                        if (isReminderAvailable(reminder.date, reminder.time)) {
                                            navigation.getParent()?.navigate('ReminderNotification', { reminderId: reminder.id });
                                        } else {
                                            setShowAlert(true);
                                        }
                                    }}
                                >
                                    <Ionicons name="notifications-outline" size={24} color="#4A90E2" />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={commonStyles.reminderDetails}>
                                <View style={commonStyles.detailRow}>
                                    <Ionicons name="calendar-outline" size={16} color="#666" />
                                    <Text style={commonStyles.detailText}>{reminder.date}</Text>
                                </View>
                                <View style={commonStyles.detailRow}>
                                    <Ionicons name="time-outline" size={16} color="#666" />
                                    <Text style={commonStyles.detailText}>{reminder.time}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
            <Modal
                transparent={true}
                visible={showAlert}
                animationType="fade"
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>{t('UserHome.messages.notAvailableTitle')}</Text>
                        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>{t('UserHome.messages.notAvailableMessage')}</Text>
                        <TouchableOpacity 
                            style={{ backgroundColor: '#4A90E2', padding: 18, borderRadius: 5 }}
                            onPress={() => setShowAlert(false)}
                        >
                            <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>{t('UserHome.messages.ok')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Refresh loading overlay */}
            {isRefreshing && (
                <View style={styles.refreshOverlay}>
                    <View style={styles.refreshIndicator}>
                        <ActivityIndicator size="large" color="#4A90E2" />
                        <Text style={styles.refreshText}>{t('common.messages.loading')}</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

export default UserHomeScreen;

const styles = StyleSheet.create({
    // LAYOUT
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 30,
        marginBottom: 20,
    },
    
    // TYPOGRAPHY
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 40,
    },
    bellIcon: {
        minHeight: 44,
        minWidth: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Refresh overlay styles
    refreshOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshIndicator: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    refreshText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
});
