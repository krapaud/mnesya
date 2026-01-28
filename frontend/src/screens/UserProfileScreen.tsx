import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UserTabsParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { fakeProfiles, fakeReminders } from '../data/fakeData';

type Props = NativeStackScreenProps<UserTabsParamList, 'Profile'>;

const UserProfileScreen: React.FC<Props> = ({ navigation }) => {
    // Temporary simulation using fake data to test the UI flow
    // Will be replaced with real authentication context in Sprint 2
    const currentUser = fakeProfiles.find(p => p.firstName === "Marie");

    return(
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
                        <Text style={commonStyles.subtitle}>Settings</Text>
                    </View>

                    <View style={commonStyles.content}>
                        {/* User information card */}
                        <View style={{ backgroundColor: '#f5f5f5', padding: 20, borderRadius: 10, marginBottom: 20 }}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
                                {currentUser?.firstName} {currentUser?.lastName}
                            </Text>
                            <Text style={{ fontSize: 18, color: '#666' }}>
                                {currentUser?.age} years old
                            </Text>
                        </View>

                        {/* Logout button */}
                        <TouchableOpacity 
                            style={[commonStyles.primaryButton, { backgroundColor: '#F44336' }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                navigation.getParent()?.navigate('Welcome');
                            }}
                        >
                            <Text style={commonStyles.primaryButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
        </View>
    )
};

export default UserProfileScreen;