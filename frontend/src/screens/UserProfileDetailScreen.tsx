/**
 * UserProfileDetailScreen - Displays detailed information for a specific elderly user profile
 * Shows profile information (name, age) and active reminders for the selected profile
 * Accessible from Dashboard when clicking on a profile card
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
type Props = NativeStackScreenProps<RootStackParamList, 'UserProfileDetails'>;
import { ProfileItem } from '../types/interfaces';
import { fakeProfiles, fakeReminders } from '../data/fakeData';


const UserProfileDetailScreen: React.FC<Props> = ({ navigation, route }: Props) => {
    const { profileId } = route.params;
    
    // Find the profile matching the profileId
    const profile = fakeProfiles.find(p => p.id === profileId);

    // Filter reminders for this specific profile
    const profileReminders = fakeReminders.filter(r => r.profileName === profile?.name);

    return (
	<View style={commonStyles.container}>
        {/* Header with back button and logo */}
        <View style={commonStyles.header}>
            <TouchableOpacity onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
            }}>
                <View style={commonStyles.ArrowIconCircle}>
                    <Ionicons name="arrow-back" size={24} color='#4A90E2'
                />
                </View>
            </TouchableOpacity>
            <View style={commonStyles.headerCenter}>
                <Image 
                    source={require('../../assets/mnesya-logo.png')} 
                    style={commonStyles.logo}
                />
                <Text style={commonStyles.appName}>Mnesya</Text>
            </View>
            <View style={commonStyles.headerSpacer} />
        </View>
        {/* Page title */}
        <View style={commonStyles.titleSection}>
            <Text style={commonStyles.title}>Profile Details</Text>
        </View>
        <View style={[commonStyles.content, { flex: 1, marginTop: 40, paddingBottom: 50 }]}>
            {/* Profile information card - displays name and age */}
            {profile ? (
                <View style={styles.profileCard}>
                    <View style={styles.profileRow}>
                        <Text style={styles.profileNameValue}>{profile.name}</Text>
                    </View>
                    <View style={styles.profileRow}>
                        <Text style={styles.profileDetailValue}>{profile.age} years old</Text>
                    </View>
                </View>
            ) : (
                <Text style={styles.errorMessage}>Profile not found</Text>
            )}
            
            {/* Generate pairing code button - allows creating new pairing code for user */}
            <TouchableOpacity 
                style={commonStyles.primaryButton}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('CreateProfile');
                    }}>
                <Text style={[commonStyles.primaryButtonText, { fontSize: 20 }]}>Generate pairing code</Text>
            </TouchableOpacity>
            
            {/* Active reminders section - displays filtered reminders for this profile */}
            <Text style={commonStyles.textPrimary}>Active Reminders</Text>
            <ScrollView>
                {profileReminders.length === 0 ? (
                    <Text style={commonStyles.emptyMessage}>No active reminders</Text>
                ) : (
                    profileReminders.map((reminder) => (
                        <View key={reminder.id} style={commonStyles.reminderCard}>
                            <View style={commonStyles.reminderHeader}>
                                <Text style={commonStyles.reminderTitle}>{reminder.title}</Text>
                                <Text style={[commonStyles.statusText, commonStyles[`status${reminder.status}`]]}>
                                    {reminder.status}
                                </Text>
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
        </View>
    </View>
  );
};

export default UserProfileDetailScreen;

const styles = StyleSheet.create({
    profileCard: {
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    profileNameValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileDetailValue: {
        fontSize: 18,
    },
    errorMessage: {
        fontSize: 16,
        color: 'red',
    },
});
