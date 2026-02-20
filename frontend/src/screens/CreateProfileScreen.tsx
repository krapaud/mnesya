/**
 * CreateProfileScreen - Form for creating new user profiles.
 * 
 * Allows caregivers to register elderly users by entering their personal information
 * including first name, last name, and date of birth. Utilizes a cross-platform
 * date picker for birthday selection.
 * 
 * @module CreateProfileScreen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { PlatformDatePicker } from '../components';
import { validateName, cleanText } from '../utils/validation';
import { useFormValidation } from '../hooks';
import { createProfile } from '../services/profileService';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateProfile'>;

/**
 * Screen component for creating a new user profile.
 * 
 * Provides a form with input fields for first name, last name, and birthday.
 * Includes validation and navigation back to dashboard upon successful creation.
 * 
 * @param props - Navigation props
 * @returns Profile creation form screen
 */
const CreateProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    
    /** Form validation hook managing firstname and lastname validation */
    const { values, errors, showErrors, handleChange, validateAll } = useFormValidation({
        firstname: { validate: validateName },
        lastname: { validate: validateName }
    });
    
    /** User's birthday date state */
    const [birthday, setBirthday] = useState<Date>(new Date());
    /** Controls date picker visibility */
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    /** Loading state during profile creation */
    const [isCreating, setIsCreating] = useState<boolean>(false);

    /**
     * Formats a date to DD/MM/YYYY string format for display.
     * 
     * @param date - Date object to format
     * @returns Formatted date string
     */
    const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    /**
     * Formats a date to YYYY-MM-DD string format for backend API.
     * 
     * @param date - Date object to format
     * @returns ISO formatted date string
     */
    const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    /**
     * Handles profile creation form submission.
     * 
     * Validates form fields, formats data, and calls backend API to create profile.
     * Navigates to dashboard on success.
     */
    const handleCreateProfile = async () => {
        // Validate form fields
        if (!validateAll()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        try {
            setIsCreating(true);
            
            // Create profile via API
            await createProfile({
                first_name: values.firstname.trim(),
                last_name: values.lastname.trim(),
                birthday: formatDateForAPI(birthday)
            });

            // Success - navigate back to dashboard
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.navigate('Dashboard');
        } catch (error) {
            // Handle error
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error('Failed to create profile:', error);
        } finally {
            setIsCreating(false);
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
                
                {/* Scrollable registration form */}
                <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.title}>{t('CreateProfile.title')}</Text>
                    
                    {/* First name input field */}
                    <Text style={styles.firstLabel}>{t('CreateProfile.fields.First Name')}</Text>
                    <View style={[styles.input, showErrors.firstname && commonStyles.inputError]}>
                        <TextInput
                            autoCapitalize="sentences"
                            autoCorrect={false}
                            placeholder={t('CreateProfile.placeholders.Enter the profile First Name')}
                            onChangeText={(text) => handleChange('firstname')(cleanText(text))}
                            value={values.firstname}
                        />
                    </View>
                    <Text style={[styles.errorText, {opacity: showErrors.firstname ? 1 : 0}]}>
                        {t(errors.firstname) || t('register.errors.This field is required')}
                    </Text>
                    
                    {/* Last name input field */}
                    <Text style={styles.label}>{t('CreateProfile.fields.Last Name')}</Text>
                    <View style={[styles.input, showErrors.lastname && commonStyles.inputError]}>
                        <TextInput
                            autoCapitalize="sentences"
                            autoCorrect={false}
                            placeholder={t('CreateProfile.placeholders.Enter the profile Last Name')}
                            onChangeText={(text) => handleChange('lastname')(cleanText(text))}
                            value={values.lastname}
                        />
                    </View>
                    <Text style={[styles.errorText, {opacity: showErrors.lastname ? 1 : 0}]}>
                        {t(errors.lastname) || t('register.errors.This field is required')}
                    </Text>
                    
                    {/* Birthday date picker */}
                    <Text style={styles.label}>{t('CreateProfile.fields.Birthday')}</Text>
                    <TouchableOpacity 
                        style={styles.input}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text>{formatDate(birthday)}</Text>
                    </TouchableOpacity>
                    
                    {/* Cross-platform date picker component */}
                    <PlatformDatePicker
                        value={birthday}
                        onChange={setBirthday}
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        displayFormat={formatDate}
                        allowPastDates={true}
                    />
                </ScrollView>
                
                {/* Buttons section - fixed at bottom */}
                <View style={styles.buttonsContainer}>
                    {/* Create button - creates profile and navigates to Dashboard */}
                    {!showDatePicker && (
                        <TouchableOpacity 
                            style={[commonStyles.primaryButton, isCreating && styles.buttonDisabled]}
                            onPress={handleCreateProfile}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={commonStyles.primaryButtonText}>
                                    {t('CreateProfile.buttons.Create profile')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
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
        paddingTop: 40,
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
        marginBottom: 10,
        marginTop: 5,
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
    // ========== BUTTONS ==========
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default CreateProfileScreen;
