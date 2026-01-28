/**
 * CreateProfileScreen - Form to create a new user profile
 * Allows caregivers to register elderly users with their personal information
 * Includes fields for first name, last name, and birthday
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent} from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateProfile'>;

const CreateProfileScreen: React.FC<Props> = ({ navigation }) => {
        const [firstname, setFirstname] = useState<string>('');
        const [lastname, setLastname] = useState<string>('');
        const [birthday, setBirthday] = useState<Date>(new Date());
        const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

        // Handles date selection from the DateTimePicker component
        const getBirthdayPicker = (event: DateTimePickerEvent, selectedDate?: Date): void => {
            if (selectedDate) {
                setBirthday(selectedDate);
            }
        };

        // Formats date to DD/MM/YYYY for display
        const formatDate = (date: Date): string => {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };
        
        const closeDatePicker = () => {
            setShowDatePicker(false);
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
                    <Text style={commonStyles.title}>New Profile</Text>
                </View>
                
                {/* Scrollable registration form */}
                <ScrollView>
                <View style={commonStyles.content}>
                    <Text style={commonStyles.label}>First Name</Text>
                    <View style={commonStyles.formsButton}>
                        <TextInput
                            placeholder='Enter the profile First Name'
                            onChangeText={newText => setFirstname(newText)}
                            defaultValue={firstname}
                        />
                    </View>
                    <Text style={commonStyles.label}>Last Name</Text>
                    <View style={commonStyles.formsButton}>
                        <TextInput
                            placeholder='Enter the profile Last Name'
                            onChangeText={newText => setLastname(newText)}
                            defaultValue={lastname}
                        />
                    </View>
                     <Text style={commonStyles.label}>Birthday</Text>
                    <TouchableOpacity 
                        style={commonStyles.formsButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text>{formatDate(birthday)}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <View style={commonStyles.datePickerContainer}>
                            <DateTimePicker
                                value={birthday}
                                mode="date"
                                display="spinner"
                                onChange={getBirthdayPicker}
                            />
                            <TouchableOpacity
                                style={commonStyles.validateButton}
                                onPress={() => setShowDatePicker(false)}
                                >
                                <Text style={commonStyles.validateButtonText}>Validate</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {/* Create button - navigates back to Dashboard after profile creation */}
                    {!showDatePicker && (
                    <TouchableOpacity 
                        style={commonStyles.primaryButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('Dashboard');
                        }}>
                        <Text style={commonStyles.primaryButtonText}>Create profile</Text>
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
