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
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { PlatformDatePicker } from '../components';

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
        /** User's first name input state */
        const [firstname, setFirstname] = useState<string>('');
        /** User's last name input state */
        const [lastname, setLastname] = useState<string>('');
        /** User's birthday date state */
        const [birthday, setBirthday] = useState<Date>(new Date());
        /** Controls date picker visibility */
        const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

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
                    <Text style={commonStyles.title}>{t('CreateProfile.title')}</Text>
                </View>
                
                {/* Scrollable registration form */}
                <ScrollView>
                <View style={commonStyles.content}>
                    <Text style={commonStyles.label}>{t('CreateProfile.fields.First Name')}</Text>
                    <View style={commonStyles.formsButton}>
                        <TextInput
                            placeholder={t('CreateProfile.placeholders.Enter the profile First Name')}
                            onChangeText={newText => setFirstname(newText)}
                            defaultValue={firstname}
                        />
                    </View>
                    <Text style={commonStyles.label}>{t('CreateProfile.fields.Last Name')}</Text>
                    <View style={commonStyles.formsButton}>
                        <TextInput
                            placeholder={t('CreateProfile.placeholders.Enter the profile Last Name')}
                            onChangeText={newText => setLastname(newText)}
                            defaultValue={lastname}
                        />
                    </View>
                     <Text style={commonStyles.label}>{t('CreateProfile.fields.Birthday')}</Text>
                    <TouchableOpacity 
                        style={commonStyles.formsButton}
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
                    />
                    {/* Create button - navigates back to Dashboard after profile creation */}
                    {!showDatePicker && (
                    <TouchableOpacity 
                        style={commonStyles.primaryButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('Dashboard');
                        }}>
                        <Text style={commonStyles.primaryButtonText}>{t('CreateProfile.buttons.Create profile')}</Text>
                    </TouchableOpacity>
                    )}
                </View>
                </ScrollView>
            </View>
        );
    };

const styles = StyleSheet.create({
    // Screen-specific styles only
});

export default CreateProfileScreen;
