/**
 * CreateReminderScreen - Caregiver reminders creation
 * Allows caregivers to create reminders for profiles
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { Picker } from '@react-native-picker/picker';
import { commonStyles } from '../styles/commonStyles';
import { fakeProfiles } from '../data/fakeData';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateReminder'>;

const CreateReminderScreen: React.FC<Props> = ({ navigation }) => {
    // Form state for reminder creation
    const [reminderTitle, setReminderTitle] = useState<string>('');
    const [reminderMessage, setReminderMessage] = useState<string>('');
    const [reminderDate, setReminderDate] = useState<Date>(new Date());
    
    // Picker visibility state - ensures mutual exclusion (only one picker shown at a time)
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
    const [showProfilePicker, setShowProfilePicker] = useState<boolean>(false);
    const [selectedProfile, setSelectedProfile] = useState<string>('');

    const selectedProfileData = fakeProfiles.find(p => p.id === Number(selectedProfile));

    const getReminderPicker = (event: DateTimePickerEvent, selectedDate?: Date): void => {
        if (selectedDate) {
            setReminderDate(selectedDate);
        }
    };

    const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatTime = (date: Date): string => {
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${hour}:${minute}`;
    }

    /**
     * Opens the date picker and closes the time picker
     * Ensures mutual exclusion between pickers to prevent UI overlap
     */
    const openDatePicker = () => {
        setShowDatePicker(true);
        setShowTimePicker(false);
    };

    /**
     * Opens the time picker and closes the date picker
     * Ensures mutual exclusion between pickers to prevent UI overlap
     */
    const openTimePicker = () => {
        setShowTimePicker(true);
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
                <Text style={commonStyles.title}>Create Reminder</Text>
            </View>
            {/* Content */}
            <ScrollView style={commonStyles.content}>
                <Text style={commonStyles.label}>For Profile</Text>
                <TouchableOpacity 
                    style={[commonStyles.formsButton, { marginBottom: 0 }]}
                    onPress={() => setShowProfilePicker(true)}
                >
                    <View style={styles.profilePicker}>
                        <Text>{selectedProfileData ? `${selectedProfileData.firstName} ${selectedProfileData.lastName}` : 'Select a profile'}</Text>
                        <Ionicons name="chevron-down" size={20} color="#999" />
                    </View>
                </TouchableOpacity>
                {!showProfilePicker && (
                    <>
                    <Text style={commonStyles.label}>Reminder Title</Text>
                <View style={commonStyles.formsButton}>
                    <TextInput
                        placeholder='Ex. : Take Medication'
                        onChangeText={newText => setReminderTitle(newText)}
                        defaultValue={reminderTitle}
                    />
                </View>
                <Text style={commonStyles.label}>Message</Text>
                <View style={[commonStyles.formsButton, styles.messageInput]}>
                    <TextInput multiline={true}
                        numberOfLines={4}
                        placeholder='Enter the description about your reminder'
                        onChangeText={newText => setReminderMessage(newText)}
                        defaultValue={reminderMessage}
                    />
                </View>
                <Text style={styles.text}>
                    Be careful not to enter sensitive confidential information.</Text>
                <View style={commonStyles.pickerContainer}>
                <View style={commonStyles.pickerColumn}>
                    <Text style={commonStyles.label}>Date</Text>
                <TouchableOpacity 
                    style={commonStyles.formsButton}
                    onPress={openDatePicker}
                >
                    <View style={commonStyles.pickerRow}>
                        <Text>{formatDate(reminderDate)}</Text>
                        <Ionicons name="calendar-outline" size={20} color="#999" />
                    </View>
                </TouchableOpacity>
                </View>
                <View style={commonStyles.pickerColumn}>
                    <Text style={commonStyles.label}>Time</Text>
                <TouchableOpacity 
                    style={commonStyles.formsButton}
                    onPress={openTimePicker}
                >
                    <View style={commonStyles.pickerRow}>
                        <Text>{formatTime(reminderDate)}</Text>
                        <Ionicons name="time-outline" size={20} color="#999" />
                    </View>
                </TouchableOpacity>
                        </View>
                    </View>
                        </>
                    )}
                        {showDatePicker && (
                        <View style={commonStyles.datePickerContainer}>
                            <DateTimePicker
                                value={reminderDate}
                                mode="date"
                                display="spinner"
                                onChange={getReminderPicker}
                                style={{ transform: [{ scaleY: 1 }] }}
                            />
                            <TouchableOpacity
                                style={commonStyles.validateButton}
                                onPress={() => setShowDatePicker(false)}
                                >
                                <Text style={commonStyles.validateButtonText}>Validate</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {showTimePicker && (
                            <View style={commonStyles.timePickerContainer}>
                                <DateTimePicker
                                    value={reminderDate}
                                    mode="time"
                                    display="spinner"
                                    onChange={getReminderPicker}
                                />
                                <TouchableOpacity
                                    style={commonStyles.validateButton}
                                    onPress={() => setShowTimePicker(false)}
                                >
                                    <Text style={commonStyles.validateButtonText}>Validate</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    {showProfilePicker && (
                        <View style={styles.profilePickerContainer}>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={selectedProfile}
                                    onValueChange={(itemValue) => setSelectedProfile(itemValue)}
                                >
                                    <Picker.Item label="Select a profile" value="" />
                                    {fakeProfiles.map((profile) => (
                                        <Picker.Item 
                                            key={profile.id} 
                                            label={profile.firstName + ' ' + profile.lastName} 
                                            value={profile.id} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                            <TouchableOpacity
                                style={commonStyles.validateButton}
                                onPress={() => setShowProfilePicker(false)}
                            >
                                <Text style={commonStyles.validateButtonText}>Validate</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {/* Create button - navigates back to Dashboard after profile creation */}
                    {!showDatePicker && !showTimePicker && !showProfilePicker && (
                    <TouchableOpacity 
                        style={commonStyles.primaryButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('Dashboard');
                        }}>
                        <Text style={commonStyles.primaryButtonText}>Save Reminder</Text>
                    </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
    );
};

const styles = StyleSheet.create({
    // Screen-specific styles
    profilePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    messageInput: {
        height: 80,
    },
    profilePickerContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
    },
    pickerWrapper: {
        width: '100%',
        height: 150,
        overflow: 'hidden',
    },
    text: {
        fontSize: 12,
        width: '100%',
        justifyContent: 'flex-start',
        color: '#FF0000',
    },
});

export default CreateReminderScreen;
