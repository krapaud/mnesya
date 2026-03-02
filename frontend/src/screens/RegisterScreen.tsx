/**
 * Caregiver account registration screen.
 *
 * Registration form with validation for name, email, password fields.
 * Provides real-time feedback and navigation to login after success.
 *
 * @module RegisterScreen
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import {
    validateEmail,
    validatePassword,
    validateName,
    validatePasswordMatch,
    cleanText,
} from '../utils/validation';
import { useAuth, useFormValidation } from '../hooks';
import { ConfirmationModal } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const { register, loading, error: authError } = useAuth();

    const { values, errors, showErrors, handleChange, validateAll, setError } = useFormValidation({
        firstname: {
            validate: validateName,
        },
        lastname: {
            validate: validateName,
        },
        email: {
            validate: validateEmail,
        },
        password: {
            validate: validatePassword,
        },
        confirmpassword: {
            validate: (value) => validatePasswordMatch(values.password, value),
        },
    });
    // States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    //Refs
    const timerPassRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleShowPassword = () => {
        setShowPassword(true);
        timerPassRef.current = setTimeout(() => setShowPassword(false), 1000);
    };
    const timerConfPassRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleShowConfirmPassword = () => {
        setShowConfirmPassword(true);
        timerConfPassRef.current = setTimeout(() => setShowConfirmPassword(false), 1000);
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerPassRef.current) clearTimeout(timerPassRef.current);
            if (timerConfPassRef.current) clearTimeout(timerConfPassRef.current);
        };
    }, []);

    /**
     * Handles registration form submission.
     *
     * Validates all form fields and navigates to login screen on success.
     * Performs comprehensive validation before submission.
     */
    const handleRegister = async () => {
        // Validate all fields using the form validation hook
        if (!validateAll()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Call registration function from hook
        const success = await register({
            first_name: values.firstname.trim(),
            last_name: values.lastname.trim(),
            email: values.email.trim(),
            password: values.password,
        });

        if (success) {
            // Provide success feedback and navigate to login
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSuccessModal(true);
        } else {
            // Handle registration errors (hook already set loading state)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            // If error contains email-related messages, highlight email field
            if (authError?.includes('Email already registered') || authError?.includes('email')) {
                setError('email', t('register.errors.Please use a different email'));
            } else if (authError) {
                setError('email', authError);
            }
        }
    };

    return (
        <View style={commonStyles.container}>
            {/* Success modal after account creation */}
            <ConfirmationModal
                visible={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigation.navigate('Login');
                }}
                onConfirm={() => {
                    setShowSuccessModal(false);
                    navigation.navigate('Login');
                }}
                title={t('register.success.Account created')}
                message={t('register.success.Please log in')}
                icon="checkmark-circle-outline"
                iconColor="#4CAF50"
                confirmText="OK"
                confirmColor="#4A90E2"
                showCancelButton={false}
            />

            {/* Header with back button and logo */}
            <View style={commonStyles.header}>
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.goBack();
                    }}
                >
                    <View style={commonStyles.ArrowIconCircle}>
                        <Ionicons name="arrow-back" size={24} color="#4A90E2" />
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
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>{t('register.title')}</Text>

                {/* First name input field */}
                <Text style={styles.firstLabel}>{t('register.fields.First Name')}</Text>
                <View style={[styles.input, showErrors.firstname && commonStyles.inputError]}>
                    <TextInput
                        autoCorrect={false}
                        placeholder={t('register.placeholders.Enter your First Name')}
                        onChangeText={(text) => handleChange('firstname')(cleanText(text))}
                        value={values.firstname}
                    />
                </View>
                <Text style={[styles.errorText, { opacity: showErrors.firstname ? 1 : 0 }]}>
                    {t(errors.firstname) || t('register.errors.This field is required')}
                </Text>

                {/* Last name input field */}
                <Text style={styles.label}>{t('register.fields.Last Name')}</Text>
                <View style={[styles.input, showErrors.lastname && commonStyles.inputError]}>
                    <TextInput
                        autoCorrect={false}
                        placeholder={t('register.placeholders.Enter your Last Name')}
                        onChangeText={(text) => handleChange('lastname')(cleanText(text))}
                        value={values.lastname}
                    />
                </View>
                <Text style={[styles.errorText, { opacity: showErrors.lastname ? 1 : 0 }]}>
                    {t(errors.lastname) || t('register.errors.This field is required')}
                </Text>

                {/* Email input field */}
                <Text style={styles.label}>{t('common.fields.Email')}</Text>
                <View style={[styles.input, showErrors.email && commonStyles.inputError]}>
                    <TextInput
                        placeholder={t('register.placeholders.Enter your Email')}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        onChangeText={handleChange('email')}
                        value={values.email}
                    />
                </View>
                <Text style={[styles.errorText, { opacity: showErrors.email ? 1 : 0 }]}>
                    {t(errors.email) || t('register.errors.This field is required')}
                </Text>

                {/* Password input field */}
                <Text style={styles.label}>{t('common.fields.Password')}</Text>
                <View
                    style={[
                        styles.input,
                        styles.inputRow,
                        showErrors.password && commonStyles.inputError,
                    ]}
                >
                    <TextInput
                        style={styles.inputFlex}
                        placeholder={t('register.placeholders.Enter your Password')}
                        secureTextEntry={!showPassword}
                        onChangeText={handleChange('password')}
                        value={values.password}
                    />
                    <TouchableOpacity onPress={handleShowPassword}>
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color="#999999"
                        />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.errorText, { opacity: showErrors.password ? 1 : 0 }]}>
                    {t(errors.password) || t('register.errors.This field is required')}
                </Text>

                {/* Password confirmation input field */}
                <Text style={styles.label}>{t('common.fields.Confirm Password')}</Text>
                <View
                    style={[
                        styles.input,
                        styles.inputRow,
                        showErrors.confirmpassword && commonStyles.inputError,
                    ]}
                >
                    <TextInput
                        style={styles.inputFlex}
                        placeholder={t('register.placeholders.Confirm your password')}
                        secureTextEntry={!showConfirmPassword}
                        onChangeText={handleChange('confirmpassword')}
                        value={values.confirmpassword}
                    />
                    <TouchableOpacity onPress={handleShowConfirmPassword}>
                        <Ionicons
                            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color="#999999"
                        />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.errorText, { opacity: showErrors.confirmpassword ? 1 : 0 }]}>
                    {t(errors.confirmpassword) || t('register.errors.This field is required')}
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
                        {loading
                            ? t('register.buttons.Signing up...')
                            : t('register.buttons.Sign Up')}
                    </Text>
                </TouchableOpacity>

                {/* Navigation back to login screen */}
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('Login');
                    }}
                >
                    <Text style={styles.alreadyHaveAccountText}>
                        {t('register.buttons.Already have an account? Log in')}
                    </Text>
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
        marginTop: 15,
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
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputFlex: {
        flex: 1,
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
        opacity: 0.5,
    },
});

export default RegisterScreen;
