/**
 * DashboardScreen - Main screen for caregivers
 * Displays a list of managed profiles and provides quick actions to create new profiles or reminders
 * Features a centered header with app branding and a scrollable list of profile cards
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, CaregiverTabsParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { useUserProfiles } from '../hooks';
import { calculateAge } from '../utils/dateUtils';

type Props = CompositeScreenProps<
    BottomTabScreenProps<CaregiverTabsParamList, 'Home'>,
    NativeStackScreenProps<RootStackParamList>
>;

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    // Load user profiles from API
    const { userData, loading, error, reload } = useUserProfiles();

    // Reload profiles when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            reload();
        }, [reload])
    );

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

            {/* Page title */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>{t('dashboard.title')}</Text>
            </View>

            <View style={styles.scrollContainer}>
                {/* Action buttons */}
                <TouchableOpacity 
                    style={commonStyles.primaryButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('CreateProfile');
                        }}>
                    <Text style={[commonStyles.primaryButtonText, { fontSize: 20 }]}>{t('dashboard.buttons.New profile')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={commonStyles.primaryButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('CreateReminder', {});
                    }}>
                    <Text style={[commonStyles.primaryButtonText, { fontSize: 20 }]}>{t('common.buttons.New reminder')}</Text>
                </TouchableOpacity>
                
                <Text style={styles.sectionTitle}>{t('dashboard.profilesListTitle')}</Text>
                
                {/* Loading state */}
                {loading && (
                    <View style={commonStyles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4A90E2" />
                        <Text style={commonStyles.loadingText}>{t('common.messages.loading')}</Text>
                    </View>
                )}

                {/* Error state */}
                {error && !loading && (
                    <View style={commonStyles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
                        <Text style={commonStyles.errorText}>{t(error)}</Text>
                    </View>
                )}
                
                {/* 
                 * Scrollable list of profile cards
                 * Each card displays user name, age, and a view button to access profile details
                 */}
                {!loading && !error && (
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.profilesList}>
                        {!userData || userData.length === 0 ? (
                            <Text style={styles.emptyMessage}>{t('dashboard.messages.No profiles yet')}</Text>
                        ) : (
                            userData.map((profile) => (
                                <View key={profile.id} style={styles.profileCard}>
                                    <View style={styles.profileInfo}>
                                        <View>
                                            <Text style={styles.textUser}>{profile.first_name + ' ' + profile.last_name}</Text>
                                            <Text style={styles.textUserInfo}>{calculateAge(profile.birthday)} {t('common.units.years old')}</Text>
                                        </View>
                                        
                                        {/* View button with arrow icon */}
                                        <TouchableOpacity 
                                            style={styles.viewButton}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                navigation.navigate('UserProfileDetails', { profileId: String(profile.id) });
                                            }}>
                                            <Text style={styles.viewButtonText}>{t('dashboard.buttons.View')}</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#4A90E2" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // LAYOUT
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 30,
        marginBottom: 0,
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
        marginBottom: 1,
    },
    sectionTitle: {
        fontSize: 20,
        marginTop: 20,
        fontWeight: 'bold',
    },
    
    // PROFILE CARDS
    textUser: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    textUserInfo: {
        fontSize: 16,
        color: '#666',
    },
    emptyMessage: {
        fontSize: 16,
        color: '#666',
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
        minHeight: 44,
        minWidth: 44,
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
