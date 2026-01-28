/**
 * UserPairingScreen - User account pairing with caregiver
 * Allows users to enter a 6-character alphanumeric pairing code
 * Automatically navigates to PIN setup after code completion
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'UserPairing'>;

const UserPairingScreen: React.FC<Props> = ({ navigation }) => {
    // Pairing code state and configuration
    const [code, setCode] = useState<string>('');
    const CELL_COUNT = 6; // 6-character alphanumeric code (e.g., A7X9K2)
    
    // Auto-blur when code is complete for better keyboard handling
    const ref = useBlurOnFulfill({value: code, cellCount: CELL_COUNT});
    
    // Clear cell on focus for better UX - allows easy correction of typos
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
      value: code,
      setValue: setCode,
    });

    // Auto-navigate to User Home when code is complete (all 6 characters entered)
    useEffect(() => {
      if (code.length === CELL_COUNT) {
        // 500ms delay provides visual feedback before navigation
        setTimeout(() => {
          navigation.navigate('UserDashboard');
        }, 500);
      }
    }, [code, navigation]);

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
                        <View style={[commonStyles.headerCenter, { gap: 10 }]}>
                            <Image 
                                source={require('../../assets/mnesya-logo.png')} 
                                style={commonStyles.logo}
                            />
                            <Text style={commonStyles.appName}>Mnesya</Text>
                        </View>
                        <View style={commonStyles.headerSpacer} />
                    </View>
                    
                    {/* Page title and instructions */}
                    <View style={[commonStyles.titleSection, { marginTop: 30 }]}>
                        <Text style={commonStyles.title}>User Pairing</Text>
                        <Text style={commonStyles.subtitle}>Enter the pairing code</Text>
                    </View>
                    
                    {/* 6-character code input field */}
                    <View style={[commonStyles.content, { marginTop: 40, paddingBottom: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
                      <CodeField
                        ref={ref}
                        {...props}
                        value={code}
                        onChangeText={setCode}
                        cellCount={CELL_COUNT}
                        keyboardType="default"
                        autoFocus={true}
                        textContentType="oneTimeCode"
                        renderCell={({index, symbol, isFocused}) => (
                          <View
                            key={index}
                            style={[styles.cell, isFocused && styles.focusCell]}
                            onLayout={getCellOnLayoutHandler(index)}>
                            <Text style={styles.cellText}>
                              {symbol || (isFocused ? <Cursor /> : null)}
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                    
                    {/* Helpful tip section with icon */}
                    <View style={styles.tipSection}>
                        <Ionicons name='bulb' size={20} color='#4A90E2' />
                        <Text style={styles.tipText}>Tip: Ask your caregiver for the pairing code to link your account.</Text>
                    </View>
                    
                    {/* Navigation back to profile type selection */}
                    <TouchableOpacity onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('Welcome');
                    }}>
                        <Text style={styles.backProfileText}>Back to profile type</Text>
                    </TouchableOpacity>
            </View>
            );
        };

const styles = StyleSheet.create({
    // Screen-specific styles
    backProfileText: {
        color: '#4A90E2',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 10,
    },
    cell: {
      width: 50,
      height: 80,
      lineHeight: 50,
      fontSize: 24,
      borderWidth: 2,
      borderColor: '#E0E0E0',
      borderRadius: 10,
      textAlign: 'center',
      backgroundColor: '#FFF',
      marginHorizontal: 5,
    },
    focusCell: {
      borderColor: '#4A90E2',
    },
    cellText: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: 75,
    },
    tipSection: {
        backgroundColor: '#E3F2FD',
        padding: 20,
        borderRadius: 20,
        marginTop: 1,
        marginBottom: 20,
        alignSelf: 'center',
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    tipText: {
        fontSize: 16,
        flex: 1,
        flexWrap: 'wrap',
    },
});

export default UserPairingScreen;
