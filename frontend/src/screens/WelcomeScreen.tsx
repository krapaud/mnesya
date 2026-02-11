/**
 * WelcomeScreen - Initial profile type selection screen
 * Allows users to choose between User or Caregiver profile
 * Entry point of the application flow
 */
import React from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    return (
        <View style={commonStyles.container}>
            {/* Header with logo and app name */}
            <View style={[commonStyles.header, { justifyContent: 'flex-start', paddingTop: 40 }]}>
                <Image 
                    source={require('../../assets/mnesya-logo.png')} 
                    style={commonStyles.logo}
                />
                <Text style={commonStyles.appName}>Mnesya</Text>
            </View>
            
            {/* Welcome title and instructions */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>{t('welcome.title')}</Text>
                <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
            </View>
            
            {/* 
             * Profile type selection buttons
             * Two large, clearly labeled buttons for User and Caregiver flows
             * Includes haptic feedback for better user experience
             */}
            <View style={styles.contentContainer}>
                {/* User profile button - navigates to pairing screen */}
                <TouchableOpacity 
                    style={styles.userButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('UserPairing');
                    }}
                >
                    <View style={styles.buttonContent}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="person" size={50} color="#fff" />
                        </View>
                        <Text style={styles.buttonText}>{t('welcome.userButton')}</Text>
                    </View>
                </TouchableOpacity>
                
                {/* Caregiver profile button - navigates to login screen */}
                <TouchableOpacity
                    style={styles.caregiverButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('Login');
                    }}
                >
                    <View style={styles.buttonContent}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="heart" size={50} color="#fff" />
                        </View>
                        <Text style={styles.buttonText}>{t('welcome.caregiverButton')}</Text>
                    </View>
                </TouchableOpacity>
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
        marginBottom: 20,
    },
    contentContainer: {
        width: '100%',
        paddingBottom: 50,
        marginTop: 40,
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
    
    // BUTTONS
    userButton: {
        backgroundColor: '#4A90E2',
        padding: 60,
        borderRadius: 20,
        marginBottom: 20,
        alignSelf: 'center',
        width: '95%',
    },
    caregiverButton: {
        backgroundColor: '#00D66F',
        padding: 60,
        borderRadius: 20,
        alignSelf: 'center',
        width: '95%',
    },
    buttonContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
});

export default WelcomeScreen;

