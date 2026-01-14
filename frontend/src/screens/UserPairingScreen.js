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

const UserPairingScreen = ({ navigation }) => {
    // Pairing code state and configuration
    const [code, setCode] = useState('');
    const CELL_COUNT = 6; // 6-character alphanumeric code (e.g., A7X9K2)
    
    // Auto-blur when code is complete
    const ref = useBlurOnFulfill({value: code, cellCount: CELL_COUNT});
    
    // Clear cell on focus for better UX
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
      value: code,
      setValue: setCode,
    });

    // Auto-navigate to User Home when code is complete
    useEffect(() => {
      if (code.length === CELL_COUNT) {
        // 500ms delay for visual feedback
        setTimeout(() => {
          navigation.navigate('UserHome', { userName: 'Mika'});
        }, 500);
      }
    }, [code]);

    return (
        <View style={styles.container}>
                    {/* Header with back button and logo */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <View style={styles.ArrowIconCircle}>
                                <Ionicons name="arrow-back" size={24} color='#4A90E2'
                            />
                            </View>
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Image 
                                source={require('../../assets/mnesya-logo.png')} 
                                style={styles.logo}
                            />
                            <Text style={styles.appName}>Mnesya</Text>
                        </View>
                        <View style={{ width: 30 }} />
                    </View>
                    
                    {/* Page title and instructions */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>User Pairing</Text>
                        <Text style={styles.subtitle}>Enter the pairing code</Text>
                    </View>
                    
                    {/* 6-character code input field */}
                    <View style={styles.content}>
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
                    <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
                        <Text style={styles.backProfileText}>Back to profile type</Text>
                    </TouchableOpacity>
            </View>
            );
        };

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        backgroundColor: '#fff',
        padding: 20,
    },
    header: {
        width: '100%',
        justifyContent: 'space-between',
        paddingTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logo: {
        width: 50,
        height: 50,
        marginRight: 10,
        paddingLeft: 10,
    },
    appName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#999',
        marginBottom: 40,
    },
    content: {
        width: '100%',
        marginTop: 40,
        paddingBottom: 50,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ArrowIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 40,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
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
