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
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UserTabsParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { fakeProfiles, fakeReminders } from '../data/fakeData';

type Props = NativeStackScreenProps<UserTabsParamList, 'Home'>;

// Temporary simulation using fake data to test the UI flow
// Will be replaced with real authentication context in Sprint 2
const currentUser = fakeProfiles.find(p => p.firstName === "Marie");
const userReminders = fakeReminders.filter(r => r.profileName === `${currentUser?.firstName} ${currentUser?.lastName}`);

const UserHomeScreen: React.FC<Props> = ({ navigation }) => {

    const [showAlert, setShowAlert] = useState(false);

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
            {/* 
             * Header section with logo and app name
             * Positioned at the top with extra padding for better visibility
             */}
            <View style={[commonStyles.header, { justifyContent: 'flex-start', paddingTop: 40 }]}>
            <Image 
                source={require('../../assets/mnesya-logo.png')} 
                style={commonStyles.logo}
            />
            <Text style={commonStyles.appName}>Mnesya</Text>
        </View>
        
            {/* 
             * Personalized greeting using the user's first name
             * Helps elderly users feel comfortable with the app
             */}
            <View style={[commonStyles.titleSection, { marginTop: 30 }]}>
                <Text style={commonStyles.title}>Hello {currentUser?.firstName} !</Text>
                <Text style={commonStyles.subtitle}>Your reminders</Text>
            </View>
            <ScrollView>
                {/* 
                 * Reminder list with empty state handling
                 * Each reminder displayed as a card with tap feedback for accessibility
                 */}
                {userReminders.length === 0 ? (
                    <Text style={commonStyles.emptyMessage}>No active reminders</Text>
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
                        <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>Not Available</Text>
                        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>Please wait, this is an upcoming reminder</Text>
                        <TouchableOpacity 
                            style={{ backgroundColor: '#4A90E2', padding: 10, borderRadius: 5 }}
                            onPress={() => setShowAlert(false)}
                        >
                            <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default UserHomeScreen;
