/**
 * LoginScreen - Caregiver authentication screen
 * Allows caregivers to log in with email and password
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    // Form state management
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    
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
                <Text style={commonStyles.title}>Caregiver Login</Text>
            </View>
            
            {/* Login form */}
            <View style={commonStyles.content}>
                <Text style={commonStyles.label}>Email</Text>
                <View style={commonStyles.formsButton}>
                    <TextInput
                        placeholder='Enter your Email'
                        onChangeText={newText => setEmail(newText)}
                        defaultValue={email}
                    />
                </View>
                <Text style={commonStyles.label}>Password</Text>
                <View style={commonStyles.formsButton}>
                    <TextInput
                        placeholder='Enter your Password'
                        secureTextEntry={true}
                        onChangeText={newText => setPassword(newText)}
                        defaultValue={password}
                    />
                </View>
                
                {/* Login button - navigates to Dashboard */}
                <TouchableOpacity 
                    style={[commonStyles.primaryButton, { marginTop: 60, width: '95%' }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('Dashboard');
                    }}
                >
                    <Text style={commonStyles.primaryButtonText}>Log in</Text>
                </TouchableOpacity>
                
                {/* Password recovery link */}
                <TouchableOpacity onPress={() => {}}>
                    <Text style={styles.lostPasswordText}>Lost password?</Text>
                </TouchableOpacity>
                
                {/* Navigation to registration screen */}
                <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Register');
                }}>
                    <Text style={styles.createAccountText}>Create an account</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Screen-specific styles
    createAccountText: {
        color: '#4A90E2',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 10,
    },
    lostPasswordText: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default LoginScreen;
