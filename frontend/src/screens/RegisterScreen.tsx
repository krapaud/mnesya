/**
 * RegisterScreen - Caregiver account registration
 * Allows new caregivers to create an account with personal information
 * Uses ScrollView to handle keyboard and form length
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    // Form state management - 5 required fields for account registration
    const [firstname, setFirstname] = useState<string>('');
    const [lastname, setLastname] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmpassword, setConfirmPassword] = useState<string>('');
    
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
                <Text style={commonStyles.title}>Create an account</Text>
            </View>
            
            {/* Scrollable registration form */}
            <ScrollView showsVerticalScrollIndicator={false}>
            <View style={commonStyles.content}>
                <Text style={commonStyles.label}>First Name</Text>
                <View style={commonStyles.formsButton}>
                    <TextInput
                        placeholder='Enter your First Name'
                        onChangeText={newText => setFirstname(newText)}
                        defaultValue={firstname}
                    />
                </View>
                <Text style={commonStyles.label}>Last Name</Text>
                <View style={commonStyles.formsButton}>
                    <TextInput
                        placeholder='Enter your Last Name'
                        onChangeText={newText => setLastname(newText)}
                        defaultValue={lastname}
                    />
                </View>
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
                <Text style={commonStyles.label}>Confirm Password</Text>
                <View style={commonStyles.formsButton}>
                    <TextInput
                        placeholder='Confirm your Password'
                        secureTextEntry={true}
                        onChangeText={newText => setConfirmPassword(newText)}
                        defaultValue={confirmpassword}
                    />
                </View>
                
                {/* Sign up button - navigates to Login after registration */}
                <TouchableOpacity 
                    style={[commonStyles.primaryButton, { width: '95%' }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('Login');
                    }}
                >
                    <Text style={commonStyles.primaryButtonText}>Sign Up</Text>
                </TouchableOpacity>
                
                {/* Navigation back to login screen */}
                <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Login');
                }}>
                    <Text style={styles.alreadyHaveAccountText}>Already have an account? Log in</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    // Screen-specific styles
    alreadyHaveAccountText: {
        color: '#4A90E2',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default RegisterScreen;
