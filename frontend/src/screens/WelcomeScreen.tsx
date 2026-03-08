/**
 * Welcome screen — lets the user choose between user and caregiver profiles.
 *
 * @module WelcomeScreen
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

// ─── Screen ──────────────────────────────────────────────────────────────────

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    return (
        <View style={commonStyles.container}>
            {/* Header with logo and app name */}
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
            <View style={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}>
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
                            <Ionicons name="person" size={50} color="#FFFFFF" />
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
                            <Ionicons name="heart" size={50} color="#FFFFFF" />
                        </View>
                        <Text style={styles.buttonText}>{t('welcome.caregiverButton')}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // LAYOUT
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 20,
        marginBottom: 20,
    },
    contentContainer: {
        width: '100%',
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
        color: '#666666',
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
