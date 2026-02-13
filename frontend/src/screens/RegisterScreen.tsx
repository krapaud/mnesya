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
import { validateEmail, validatePassword, validateName, validatePasswordMatch } from '../utils/validation';
import { useAuth } from '../hooks';


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
    /** Translation function for internationalization */
    const { t } = useTranslation();
    
    /** Authentication hook for registration operations */
    const { register, loading, error: authError } = useAuth();
    
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
    /** Visual error indicator for first name field */
    const [showFirstnameError, setShowFirstnameError] = useState<boolean>(false);
    /** Visual error indicator for last name field */
    const [showLastnameError, setShowLastnameError] = useState<boolean>(false);
    /** Visual error indicator for email field */
    const [showEmailError, setShowEmailError] = useState<boolean>(false);
    /** Visual error indicator for password field */
    const [showPasswordError, setShowPasswordError] = useState<boolean>(false);
    /** Visual error indicator for confirm password field */
    const [showConfirmPasswordError, setShowConfirmPasswordError] = useState<boolean>(false);

    /**
     * Handles registration form submission.
     * 
     * Validates all form fields and navigates to login screen on success.
     * Performs comprehensive validation before submission.
     */
    const handleRegister = async () => {
        // Reset all visual error indicators
        setShowFirstnameError(false);
        setShowLastnameError(false);
        setShowEmailError(false);
        setShowPasswordError(false);
        setShowConfirmPasswordError(false);

        let hasError = false;

        // Validate all fields directly
        const firstnameValidation = validateName(firstname);
        const lastnameValidation = validateName(lastname);
        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password);
        const confirmPasswordValidation = validatePasswordMatch(password, confirmpassword);

        // Check firstname
        if (!firstname.trim() || firstnameValidation) {
            setFirstnameError(firstnameValidation ? t(firstnameValidation) : t('register.errors.This field is required'));
            setShowFirstnameError(true);
            hasError = true;
        }
        
        // Check lastname
        if (!lastname.trim() || lastnameValidation) {
            setLastnameError(lastnameValidation ? t(lastnameValidation) : t('register.errors.This field is required'));
            setShowLastnameError(true);
            hasError = true;
        }
        
        // Check email
        if (!email.trim() || emailValidation) {
            setEmailError(emailValidation ? t(emailValidation) : t('register.errors.This field is required'));
            setShowEmailError(true);
            hasError = true;
        }
        
        // Check password
        if (!password || passwordValidation) {
            setPasswordError(passwordValidation ? t(passwordValidation) : t('register.errors.This field is required'));
            setShowPasswordError(true);
            hasError = true;
        }
        
        // Check confirm password
        if (!confirmpassword || confirmPasswordValidation) {
            setConfirmPasswordError(confirmPasswordValidation ? t(confirmPasswordValidation) : t('register.errors.This field is required'));
            setShowConfirmPasswordError(true);
            hasError = true;
        }

        // If there are any errors, vibrate and stop
        if (hasError) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Call registration function from hook
        const success = await register({
            first_name: firstname.trim(),
            last_name: lastname.trim(),
            email: email.trim(),
            password: password
        });
        
        if (success) {
            // Provide success feedback and navigate to login
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.navigate('Login');
        } else {
            // Handle registration errors (hook already set loading state)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            
            // If error contains email-related messages, highlight email field
            if (authError?.includes('Email already registered') || authError?.includes('email')) {
                setEmailError(t('register.errors.Please use a different email'));
                setShowEmailError(true);
            } else if (authError) {
                setEmailError(authError);
                setShowEmailError(true);
            }
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
            
            {/* Scrollable registration form with title */}
            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>{t('register.title')}</Text>
                
                {/* First name input field */}
                <Text style={styles.firstLabel}>{t('register.fields.First Name')}</Text>
                <View style={[styles.input, showFirstnameError && styles.inputError]}>
                    <TextInput
                        autoCorrect={false}
                        placeholder={t('register.placeholders.Enter your First Name')}
                        onChangeText={newText => {
                            setShowFirstnameError(false);
                            const cleaned = newText.replace(/\s{2,}/g, ' ');
                            setFirstname(cleaned);
                            const error = validateName(cleaned);
                            setFirstnameError(error ? t(error) : '');
                        }}
                        value={firstname}
                    />
                </View>
                <Text style={[styles.errorText, {opacity: showFirstnameError ? 1 : 0}]}>
                    {firstnameError || t('register.errors.This field is required')}
                </Text>
                
                {/* Last name input field */}
                <Text style={styles.label}>{t('register.fields.Last Name')}</Text>
                <View style={[styles.input, showLastnameError && styles.inputError]}>
                    <TextInput
                        autoCorrect={false}
                        placeholder={t('register.placeholders.Enter your Last Name')}
                        onChangeText={newText => {
                            setShowLastnameError(false);
                            const cleaned = newText.replace(/\s{2,}/g, ' ');
                            setLastname(cleaned);
                            const error = validateName(cleaned);
                            setLastnameError(error ? t(error) : '');
                        }}
                        value={lastname}
                    />
                </View>
                <Text style={[styles.errorText, {opacity: showLastnameError ? 1 : 0}]}>
                    {lastnameError || t('register.errors.This field is required')}
                </Text>
                
                {/* Email input field */}
                <Text style={styles.label}>{t('common.fields.Email')}</Text>
                <View style={[styles.input, showEmailError && styles.inputError]}>
                    <TextInput
                        placeholder={t('register.placeholders.Enter your Email')}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
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
                <Text style={styles.label}>{t('common.fields.Password')}</Text>
                <View style={[styles.input, showPasswordError && styles.inputError]}>
                    <TextInput
                        placeholder={t('register.placeholders.Enter your Password')}
                        secureTextEntry={true}
                        onChangeText={newText => {
                            setShowPasswordError(false);
                            setPassword(newText);
                            const error = validatePassword(newText);
                            setPasswordError(error ? t(error) : '');
                        }}
                        value={password}
                    />
                </View>
                <Text style={[styles.errorText, {opacity: showPasswordError ? 1 : 0}]}>
                    {passwordError || t('register.errors.This field is required')}
                </Text>
                
                {/* Password confirmation input field */}
                <Text style={styles.label}>{t('common.fields.Confirm Password')}</Text>
                <View style={[styles.input, showConfirmPasswordError && styles.inputError]}>
                    <TextInput
                        placeholder={t('register.placeholders.Confirm your password')}
                        secureTextEntry={true}
                        onChangeText={newText => {
                            setShowConfirmPasswordError(false);
                            setConfirmPassword(newText);
                            const error = validatePasswordMatch(password, newText);
                            setConfirmPasswordError(error ? t(error) : '');
                        }}
                        value={confirmpassword}
                    />
                </View>
                <Text style={[styles.errorText, {opacity: showConfirmPasswordError ? 1 : 0}]}>
                    {confirmPasswordError || t('register.errors.This field is required')}
                </Text>
            </ScrollView>
                
            {/* Buttons section - fixed at bottom */}
            <View style={styles.buttonsContainer}>
                {/* Sign up button - navigates to Login after registration */}
                <TouchableOpacity 
                    style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    <Text style={commonStyles.primaryButtonText}>
                        {loading ? t('register.buttons.Signing up...') : t('register.buttons.Sign Up')}
                    </Text>
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
        marginBottom: 7,
        width: '100%',
    },
    inputError: {
        borderWidth: 2,
        borderColor: '#FF0000',
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
    signUpButtonDisabled: {
        backgroundColor: '#F5F5F5',
        padding: 20,
        borderRadius: 10,
        marginBottom: 10,
        alignSelf: 'center',
        width: '95%',
        opacity: 0.5,
    },
});

export default RegisterScreen;
