/**
 * UserProfileDetailScreen - Displays detailed information for a specific elderly user profile
 * Shows profile information (name, age) and active reminders for the selected profile
 * Accessible from Dashboard when clicking on a profile card
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { fakeProfiles, fakeReminders } from '../data/fakeData';
import { PairingCodeModal } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfileDetails'>;


const UserProfileDetailScreen: React.FC<Props> = ({ navigation, route }: Props) => {
    const { t } = useTranslation();
    const { profileId } = route.params;
    
    // Find the profile matching the profileId from route params
    const profile = fakeProfiles.find(p => p.id === profileId);

    // Filter reminders for this specific profile using full name matching
    const profileReminders = fakeReminders.filter(r => r.profileName === `${profile?.firstName} ${profile?.lastName}`);

    // Pairing code modal state
    const [showPairingModal, setShowPairingModal] = useState(false);
    const [pairingCode, setPairingCode] = useState('');

    /**
     * Generates a random 6-character pairing code (alphanumeric).
     * 
     * @returns A random pairing code (e.g., 'A7X9K2')
     */
    const generatePairingCode = (): string => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    };

    /**
     * Handles pairing code generation and modal display.
     */
    const handleGeneratePairingCode = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newCode = generatePairingCode();
        setPairingCode(newCode);
        setShowPairingModal(true);
    };

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
        <View style={styles.titleSection}>
            <Text style={styles.title}>{t('UserProfileDetail.title')}</Text>
        </View>
        <View style={styles.scrollContainer}>
            {/* Profile information card - displays name and age */}
            {profile ? (
                <View style={styles.profileCard}>
                    <View style={styles.profileRow}>
                        <Text style={styles.profileNameValue}>{profile.firstName + ' ' + profile.lastName}</Text>
                    </View>
                    <View style={styles.profileRow}>
                        <Text style={styles.profileDetailValue}>{profile.age} {t('common.units.years old')}</Text>
                    </View>
                </View>
            ) : (
                <Text style={styles.errorMessage}>{t('UserProfileDetail.messages.Profile not found')}</Text>
            )}
            
            {/* Generate pairing code button - allows creating new pairing code for user */}
            <TouchableOpacity 
                style={commonStyles.primaryButton}
                onPress={handleGeneratePairingCode}
            >
                <Text style={[commonStyles.primaryButtonText, { fontSize: 20 }]}>{t('UserProfileDetail.buttons.Generate pairing code')}</Text>
            </TouchableOpacity>
            
            {/* Active reminders section - displays filtered reminders for this profile */}
            <Text style={styles.sectionTitle}>{t('UserProfileDetail.sections.Active Reminders')}</Text>
            <ScrollView>
                {profileReminders.length === 0 ? (
                    <Text style={commonStyles.emptyMessage}>{t('UserProfileDetail.messages.No active reminders')}</Text>
                ) : (
                    profileReminders.map((reminder) => (
                        <View key={reminder.id} style={commonStyles.reminderCard}>
                            <View style={commonStyles.reminderHeader}>
                                <Text style={commonStyles.reminderTitle}>{reminder.title}</Text>
                                <Text style={[commonStyles.statusText, commonStyles[`status${reminder.status}`]]}>
                                    {t(`reminders.status.${reminder.status}`)}
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

        {/* Pairing code modal */}
        <PairingCodeModal
            visible={showPairingModal}
            onClose={() => setShowPairingModal(false)}
            pairingCode={pairingCode}
        />
    </View>
  );
};

export default UserProfileDetailScreen;

const styles = StyleSheet.create({
    // LAYOUT
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 30,
    },
    scrollContainer: {
        flex: 1,
        marginTop: 40,
        paddingBottom: 50,
    },
    
    // TYPOGRAPHY
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2C3E50',
        marginTop: 30,
        marginBottom: 15,
    },
    
    // PROFILE CARD
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
