/**
 * Login screen for caregiver accounts.
 *
 * @module LoginScreen
 */
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { validateEmail } from '../utils/validation';
import { useAuth, useFormValidation } from '../hooks';
import { RateLimitModal } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    /** Authentication hook for login operations */
    const { login, loading, error: authError } = useAuth();

    /** Form validation hook managing all field states and validation logic */
    const { values, errors, showErrors, handleChange, validateAll, setError } = useFormValidation({
        email: {
            validate: validateEmail,
        },
        password: {
            validate: () => null, // No complex validation for password on login
        },
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showRateLimitModal, setShowRateLimitModal] = useState(false);

    /**
     * Handles login form submission.
     *
     * Validates fields and calls backend API for authentication.
     */
    const handleLogin = async () => {
        // Validate all fields using the form validation hook
        if (!validateAll()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Call login function from hook
        const success = await login({
            email: values.email.trim(),
            password: values.password,
        });

        if (success) {
            // Success - navigate to dashboard
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.navigate('Dashboard');
        } else {
            // Handle login errors (hook already set loading state)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            if (authError === 'TOO_MANY_REQUESTS') {
                setShowRateLimitModal(true);
            } else {
                // Generic invalid credentials
                setError('email', 'login.errors.invalidCredentials');
                setError('password', 'login.errors.invalidCredentials');
            }
        }
    };

    const timerShowPassRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleShowPassword = () => {
        setShowPassword(true);
        timerShowPassRef.current = setTimeout(() => setShowPassword(false), 1000);
    };

    useEffect(() => {
        return () => {
            if (timerShowPassRef.current) clearTimeout(timerShowPassRef.current);
        };
    }, []);

    return (
        <View style={commonStyles.container}>
            {/* Rate limit modal */}
            <RateLimitModal
                visible={showRateLimitModal}
                onClose={() => setShowRateLimitModal(false)}
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

            {/* Title section */}
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{t('login.title')}</Text>
            </View>

            {/* Login form */}
            <View style={styles.formContainer}>
                {/* Email input field */}
                <Text style={styles.emailLabel}>{t('common.fields.Email')}</Text>
                <View style={[styles.input, showErrors.email && commonStyles.inputError]}>
                    <TextInput
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        autoCorrect={false}
                        placeholder={t('register.placeholders.Enter your Email')}
                        onChangeText={handleChange('email')}
                        value={values.email}
                    />
                </View>
                <Text style={[styles.errorText, { opacity: showErrors.email ? 1 : 0 }]}>
                    {t(errors.email) || t('register.errors.This field is required')}
                </Text>

                {/* Password input field */}
                <Text style={styles.passwordLabel}>{t('common.fields.Password')}</Text>
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
                            name="eye-outline"
                            size={22}
                            color={showPassword ? '#999999' : '#4A90E2'}
                        />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.errorText, { opacity: showErrors.password ? 1 : 0 }]}>
                    {t(errors.password) || t('register.errors.This field is required')}
                </Text>

                {/* Password recovery link */}
                <TouchableOpacity onPress={() => {}}>
                    <Text style={styles.lostPasswordText}>{t('login.buttons.lostPassword')}</Text>
                </TouchableOpacity>
            </View>

            {/* Buttons section - fixed at bottom */}
            <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    style={[commonStyles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={commonStyles.primaryButtonText}>
                        {loading ? t('login.buttons.Logging in...') : t('login.buttons.submit')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('Register');
                    }}
                >
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
        paddingTop: 20,
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 0,
        paddingTop: 10,
    },
    buttonsContainer: {},

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
        marginTop: -50,
        paddingHorizontal: 10,
    },
    passwordLabel: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 5,
        marginTop: 20,
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
        color: '#666666',
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
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputFlex: {
        flex: 1,
    },

    // ========== BUTTONS ==========
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default LoginScreen;
