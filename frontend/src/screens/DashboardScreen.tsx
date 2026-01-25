/**
 * DashboardScreen - Main screen for caregivers
 * Displays a list of managed profiles and provides quick actions to create new profiles or reminders
 * Features a centered header with app branding and a scrollable list of profile cards
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { ProfileItem } from '../types/interfaces';
type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
import { fakeProfiles, fakeReminders } from '../data/fakeData';

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
    // Mock data for managed profiles (will be replaced with API data)
    const [profiles, setProfiles] = useState(fakeProfiles);

    return (
        <View style={commonStyles.container}>
            {/* Header with app logo and name */}
            <View style={[commonStyles.header, { justifyContent: 'center' }]}>
                <Image 
                    source={require('../../assets/mnesya-logo.png')} 
                    style={commonStyles.logo}
                />
                <Text style={[commonStyles.appName, { alignItems: 'center' }]}>Mnesya</Text>
            </View>

            {/* Page title */}
            <View style={[commonStyles.titleSection, { marginTop: 20 }]}>
                <Text style={[commonStyles.title, { marginBottom: 1 }]}>Dashboard</Text>
            </View>

            <View style={[commonStyles.content, { flex: 1, marginTop: 40, paddingBottom: 50 }]}>
                {/* Action buttons */}
                <TouchableOpacity 
                    style={commonStyles.primaryButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('CreateProfile');
                        }}>
                    <Text style={[commonStyles.primaryButtonText, { fontSize: 20 }]}>New profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={commonStyles.primaryButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('CreateReminder', {});
                    }}>
                    <Text style={[commonStyles.primaryButtonText, { fontSize: 20 }]}>New reminder</Text>
                </TouchableOpacity>
                
                <Text style={commonStyles.textPrimary}>Managed Profiles</Text>
                
                {/* Scrollable list of profile cards */}
                <ScrollView showsVerticalScrollIndicator={false} style={styles.profilesList}>
                    {profiles.length === 0 ? (
                        <Text style={styles.emptyMessage}>No profiles yet</Text>
                    ) : (
                        profiles.map((profile) => (
                            <View key={profile.id} style={styles.profileCard}>
                                <View style={styles.profileInfo}>
                                    <View>
                                        <Text style={styles.textUser}>{profile.name}</Text>
                                        <Text style={styles.textUserInfo}>{profile.age} years old</Text>
                                    </View>
                                    
                                    {/* View button with arrow icon */}
                                    <TouchableOpacity 
                                        style={styles.viewButton}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            navigation.navigate('UserProfileDetails', { profileId: profile.id });
                                        }}>
                                        <Text style={styles.viewButtonText}>View</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#4A90E2" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Screen-specific styles
    textUser: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    textUserInfo: {
        fontSize: 16,
        color: '#999',
    },
    emptyMessage: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 200,
        fontStyle: 'italic',
    },
    profileCard: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 1,
        marginTop: 10,
    },
    profileInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 5,
    },
    viewButtonText: {
        color: '#4A90E2',
        fontSize: 16,
        marginRight: 5,
    },
    profilesList: {
        flex: 1,
    },
});

export default DashboardScreen;
