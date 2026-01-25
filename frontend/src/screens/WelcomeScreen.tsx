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

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
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
            <View style={[commonStyles.titleSection, { marginTop: 30 }]}>
                <Text style={commonStyles.title}>Welcome to Mnesya</Text>
                <Text style={styles.subtitle}>Choose your profile type</Text>
            </View>
            
            {/* Profile type selection buttons */}
            <View style={[commonStyles.content, { marginTop: 40, paddingBottom: 50 }]}>
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
                        <Text style={styles.buttonText}>User</Text>
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
                        <Text style={styles.buttonText}>Caregiver</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};



const styles = StyleSheet.create({
    // Screen-specific styles
    subtitle: {
        fontSize: 18,
        color: '#999',
        marginBottom: 40,
    },
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

