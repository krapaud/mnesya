/**
 * Caregiver account registration screen.
 * 
 * Registration form with validation for name, email, password fields.
 * Provides real-time feedback and navigation to login after success.
 * 
 * @module RegisterScreen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

/**
 * Registration screen component for caregiver account creation.
 * 
 * Renders a multi-field registration form with comprehensive validation.
 * Provides real-time feedback on field validity and enforces password
 * strength requirements.
 * 
 * @param props - Navigation props
 * @returns Registration form screen
 */
const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    /** First name input state */
    const [firstname, setFirstname] = useState<string>('');
    /** Last name input state */
    const [lastname, setLastname] = useState<string>('');
    /** Email address input state */
    const [email, setEmail] = useState<string>('');
    /** Password input state */
    const [password, setPassword] = useState<string>('');
    /** Password confirmation input state */
    const [confirmpassword, setConfirmPassword] = useState<string>('');
    /** Email validation error message */
    const [emailError, setEmailError] = useState<string>('');
    /** Password validation error message */
    const [passwordError, setPasswordError] = useState<string>('');
    /** Password confirmation error message */
    const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
    /** First name validation error message */
    const [firstnameError, setFirstnameError] = useState<string>('');
    /** Last name validation error message */
    const [lastnameError, setLastnameError] = useState<string>('');
    
    /**
     * Validates email address format and length.
     * 
     * Checks for valid email format and ensures length is between 5-255 characters.
     * 
     * @param email - Email address to validate
     * @returns Error message key or null if valid
     */
    const validateEmail = (email: string): string | null => {
        const trimmed = email.trim();
        
        // Check length constraints (5-255 characters)
        if (trimmed.length < 5 || trimmed.length > 255) {
            return t('register.errors.Email must be between 5 and 255 characters');
        }
        
        // Validate email format using regex
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(trimmed)) {
            return t('register.errors.Invalid email');
        }
        
        return null;
    };

    /**
     * Validates password strength and requirements.
     * 
     * Enforces password policy:
     * - Length: 8-20 characters
     * - Must contain at least one digit
     * - Must contain at least one uppercase letter
     * - Must contain at least one lowercase letter
     * - Must contain at least one special character ($@#%*!~&)
     * 
     * @param password - Password to validate
     * @returns Error message key or null if valid
     */
    const validatePassword = (password: string): string | null => {
        const trimmedPassword = password.trim();
        
        // Check length constraints (8-20 characters)
        if (trimmedPassword.length < 8) { 
            return t('register.errors.Password must be at least 8 characters'); 
        }
        if (trimmedPassword.length > 20) { 
            return t('register.errors.Password must be at most 20 characters'); 
        }
        
        // Check for at least one digit
        if (!/\d/.test(trimmedPassword)) {
            return t('register.errors.Password must contain at least one digit');
        }
        
        // Check for at least one uppercase letter
        if (!/[A-Z]/.test(trimmedPassword)) {
            return t('register.errors.Password must contain at least one uppercase letter');
        }
        
        // Check for at least one lowercase letter
        if (!/[a-z]/.test(trimmedPassword)) {
            return t('register.errors.Password must contain at least one lowercase letter');
        }
        
        // Check for at least one special character
        if (!/[$@#%*!~&]/.test(trimmedPassword)) {
            return t('register.errors.Password must contain at least one special character');
        }
        
        return null;
    };

    /**
     * Validates name field (first name or last name).
     * 
     * Ensures name is not empty and does not exceed maximum length.
     * 
     * @param name - Name to validate
     * @returns Error message key or null if valid
     */
    const validateName = (name: string): string | null => {
        const trimmedName = name.trim();
        
        // Check if name is empty
        if (trimmedName.length === 0) {
            return t('register.errors.Name cannot be empty');
        }
        
        // Check maximum length (100 characters)
        if (trimmedName.length > 100) {
            return t('register.errors.Name must be at most 100 characters');
        }

        return null;
    };

    /**
     * Handles registration form submission.
     * 
     * Validates all form fields and navigates to login screen on success.
     * Performs comprehensive validation before submission.
     */
    const handleRegister = () => {
        // Ensure all fields are filled
        if (!firstname || !lastname || !email || !password || !confirmpassword) {
            return t('register.errors.All fields are required');
        }
        
        // Validate email format and length
        if (!validateEmail(email)) {
            const trimmed = email.trim();
            if (trimmed.length < 5 || trimmed.length > 255) {
                return t('register.errors.Email must be between 5 and 255 characters');
        }
            return t('register.errors.Invalid email');
        }
        
        // Verify password confirmation matches
        if (password !== confirmpassword) {
            return t('register.errors.Passwords do not match');
        }
        
        // Provide haptic feedback and navigate to login
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('Login');
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
            
            {/* Scrollable registration form with title */}
            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>{t('register.title')}</Text>
                
                <Text style={styles.firstLabel}>{t('register.fields.First Name')}</Text>
                <View style={styles.input}>
                    <TextInput
                        placeholder={t('register.placeholders.Enter your First Name')}
                        onChangeText={newText => {
                            const cleaned = newText.replace(/\s{2,}/g, ' ');
                            setFirstname(cleaned);
                            const error = validateName(cleaned);
                            setFirstnameError(error || '');
                        }}
                        defaultValue={firstname}
                    />
                </View>
                <Text style={firstname !== '' ? (firstnameError ? styles.errorText : styles.successText) : styles.errorText}>
                    {firstname !== '' ? (firstnameError ? firstnameError : t('register.success.Valid name')) : ''}
                </Text>
                <Text style={styles.label}>{t('register.fields.Last Name')}</Text>
                <View style={styles.input}>
                    <TextInput
                        placeholder={t('register.placeholders.Enter your Last Name')}
                        onChangeText={newText => {
                            const cleaned = newText.replace(/\s{2,}/g, ' ');
                            setLastname(cleaned);
                            const error = validateName(cleaned);
                            setLastnameError(error || '');
                        }}
                        defaultValue={lastname}
                    />
                </View>
                <Text style={lastname !== '' ? (lastnameError ? styles.errorText : styles.successText) : styles.errorText}>
                    {lastname !== '' ? (lastnameError ? lastnameError : t('register.success.Valid name')) : ''}
                </Text>
                <Text style={styles.label}>{t('common.fields.Email')}</Text>
                <View style={styles.input}>
                    <TextInput
                        placeholder={t('register.placeholders.Enter your Email')}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        onChangeText={newText => {
                            setEmail(newText);
                            const error = validateEmail(newText);
                            setEmailError(error || '');
                        }}
                        defaultValue={email}
                    />
                </View>
                <Text style={email.trim() !== '' ? (emailError ? styles.errorText : styles.successText) : styles.errorText}>
                    {email.trim() !== '' ? (emailError ? emailError : t('register.success.Valid email')) : ''}
                </Text>
                <Text style={styles.label}>{t('common.fields.Password')}</Text>
                <View style={styles.input}>
                    <TextInput
                        placeholder={t('register.placeholders.Enter your Password')}
                        secureTextEntry={true}
                        onChangeText={newText => {
                            setPassword(newText);
                            const error = validatePassword(newText);
                            setPasswordError(error || '');
                        }}
                        defaultValue={password}
                    />
                </View>
                <Text style={password.trim() !== '' ? (passwordError ? styles.errorText : styles.successText) : styles.errorText}>
                    {password.trim() !== '' ? (passwordError ? passwordError : t('register.success.Valid password')) : ''}
                </Text>
                <Text style={styles.label}>{t('common.fields.Confirm Password')}</Text>
                <View style={styles.input}>
                    <TextInput
                        placeholder={t('register.placeholders.Confirm your password')}
                        secureTextEntry={true}
                        onChangeText={newText => {
                            setConfirmPassword(newText);
                            const error = (newText !== password) ? t('register.errors.Passwords do not match') : '';
                            setConfirmPasswordError(error);
                        }}
                        defaultValue={confirmpassword}
                    />
                </View>
                {confirmpassword.trim() !== '' ? (
                    confirmPasswordError ? 
                        <Text style={styles.errorText}>{confirmPasswordError}</Text> 
                        : 
                        <Text style={styles.successText}>{t('register.success.Passwords match')}</Text>
                ) : null}
            </ScrollView>
                
            {/* Buttons section - fixed at bottom */}
            <View style={styles.buttonsContainer}>
                {/* Sign up button - navigates to Login after registration */}
                <TouchableOpacity 
                    style={styles.signUpButton}
                    onPress={handleRegister}
                >
                    <Text style={commonStyles.primaryButtonText}>{t('register.buttons.Sign Up')}</Text>
                </TouchableOpacity>
                
                {/* Navigation back to login screen */}
                <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Login');
                }}>
                    <Text style={styles.alreadyHaveAccountText}>{t('register.buttons.Already have an account? Log in')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({  
    // ========== LAYOUT ==========
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 20,
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
    firstLabel: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 10,
        marginTop: 30,
    },
    label: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 5,
        marginTop: 0,
    },
    alreadyHaveAccountText: {
        color: '#4A90E2',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    errorText: {
        color: '#FF0000',
        fontSize: 16,
    },
    successText: {
        color: '#00C853',
        fontSize: 16,
    },

    // ========== FORM ELEMENTS ==========
    input: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 20,
        marginBottom: 10,
        width: '100%',
    },

    // ========== BUTTONS ==========
    signUpButton: {
        backgroundColor: '#4A90E2',
        padding: 20,
        borderRadius: 10,
        marginBottom: 10,
        alignSelf: 'center',
        width: '95%',
    },
});

export default RegisterScreen;
