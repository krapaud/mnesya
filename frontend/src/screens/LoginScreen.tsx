/**
 * Caregiver authentication screen.
 * 
 * Provides email and password login form for caregiver accounts.
 * Includes navigation to registration screen and password recovery.
 * 
 * Features:
 * - Email and password input fields
 * - Form validation (to be implemented in Sprint 3)
 * - Navigation to registration
 * - Password recovery link (placeholder)
 * 
 * @module LoginScreen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { validateEmail } from '../utils/validation';
import { useAuth } from '../hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Login screen component for caregiver authentication.
 * 
 * Renders a login form with email and password inputs. Currently navigates
 * directly to dashboard (authentication to be implemented in Sprint 3).
 * 
 * @param props - Navigation props
 * @returns Login form screen
 */
const LoginScreen: React.FC<Props> = ({ navigation }) => {
    /** Translation function for internationalization */
    const { t } = useTranslation();
    
    /** Authentication hook for login operations */
    const { login, loading } = useAuth();
    
    /** Email input state */
    const [email, setEmail] = useState<string>('');
    /** Password input state */
    const [password, setPassword] = useState<string>('');
    /** Email validation error message */
    const [emailError, setEmailError] = useState<string>('');
    /** Password validation error message */
    const [passwordError, setPasswordError] = useState<string>('');
    /** Visual error indicator for email field */
    const [showEmailError, setShowEmailError] = useState<boolean>(false);
    /** Visual error indicator for password field */
    const [showPasswordError, setShowPasswordError] = useState<boolean>(false);

    /**
     * Handles login form submission.
     * 
     * Validates fields and calls backend API for authentication.
     */
    const handleLogin = async () => {
        // Reset all visual error indicators
        setShowEmailError(false);
        setShowPasswordError(false);

        let hasError = false;

        // Validate email
        const emailValidation = validateEmail(email);
        if (!email.trim() || emailValidation) {
            setEmailError(emailValidation ? t(emailValidation) : t('register.errors.This field is required'));
            setShowEmailError(true);
            hasError = true;
        }
        
        // Validate password
        if (!password) {
            setPasswordError(t('register.errors.This field is required'));
            setShowPasswordError(true);
            hasError = true;
        }

        // If there are errors, vibrate and stop
        if (hasError) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Call login function from hook
        const success = await login({
            email: email.trim(),
            password: password
        });
        
        if (success) {
            // Success - navigate to dashboard
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.navigate('Dashboard');
        } else {
            // Handle login errors (hook already set loading state)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            
            // Show error on email field (invalid credentials)
            setShowEmailError(true);
            setShowPasswordError(true);
        }
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
            
            {/* Title section */}
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{t('login.title')}</Text>
            </View>
            
            {/* Login form */}
            <View style={styles.formContainer}>
                {/* Email input field */}
                <Text style={styles.emailLabel}>{t('common.fields.Email')}</Text>
                <View style={[styles.input, showEmailError && styles.inputError]}>
                    <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder={t('register.placeholders.Enter your Email')}
                        onChangeText={newText => {
                            setShowEmailError(false);
                            setEmail(newText);
                            const error = validateEmail(newText);
                            setEmailError(error ? t(error) : '');
                        }}
                        value={email}
                    />
                </View>
                <Text style={[styles.errorText, {opacity: showEmailError ? 1 : 0}]}>
                    {emailError || t('register.errors.This field is required')}
                </Text>
                
                {/* Password input field */}
                <Text style={styles.passwordLabel}>{t('common.fields.Password')}</Text>
                <View style={[styles.input, showPasswordError && styles.inputError]}>
                    <TextInput
                        placeholder={t('register.placeholders.Enter your Password')}
                        secureTextEntry={true}
                        onChangeText={newText => {
                            setShowPasswordError(false);
                            setPassword(newText);
                        }}
                        value={password}
                    />
                </View>
                <Text style={[styles.errorText, {opacity: showPasswordError ? 1 : 0}]}>
                    {passwordError || t('register.errors.This field is required')}
                </Text>
                
                {/* Password recovery link */}
                <TouchableOpacity onPress={() => {}}>
                    <Text style={styles.lostPasswordText}>{t('login.buttons.lostPassword')}</Text>
                </TouchableOpacity>
            </View>
            
            {/* Buttons section - fixed at bottom */}
            <View style={styles.buttonsContainer}>
                <TouchableOpacity 
                    style={[commonStyles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={commonStyles.primaryButtonText}>
                        {loading ? t('login.buttons.Logging in...') : t('login.buttons.submit')}
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Register');
                }}>
                    <Text style={styles.createAccountText}>{t('login.buttons.createAccount')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // ========== LAYOUT ==========
    titleContainer: {
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingTop: 30,
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 0,
        paddingTop: 10,
    },
    buttonsContainer: {
        paddingBottom: 40,
    },

    // ========== TYPOGRAPHY ==========
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    emailLabel: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 5,
        marginTop: -180,
        paddingHorizontal: 10,
    },
    passwordLabel: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 5,
        marginTop: 50,
        paddingHorizontal: 10,
    },
    createAccountText: {
        color: '#4A90E2',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 10,
    },
    lostPasswordText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'left',
        paddingHorizontal: 10,
    },
    errorText: {
        color: '#FF0000',
        fontSize: 12,
        textAlign: 'right',
        marginTop: -5,
        marginBottom: 5,
        minHeight: 16,
        lineHeight: 16,
        paddingRight: 10,
    },

    // ========== FORM ELEMENTS ==========
    input: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 20,
        marginBottom: 10,
        width: '100%',
    },
    inputError: {
        borderWidth: 2,
        borderColor: '#FF0000',
    },

    // ========== BUTTONS ==========
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default LoginScreen;
