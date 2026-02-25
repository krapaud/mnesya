/**
 * Screen where the user enters a pairing code to link with a caregiver.
 *
 * @module UserPairingScreen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/index';
import { commonStyles } from '../styles/commonStyles';
import { verifyPairingCode } from '../services/pairingService';
import { saveUserInfo, saveToken } from '../services/tokenService';

type Props = NativeStackScreenProps<RootStackParamList, 'UserPairing'>;

const UserPairingScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    // Pairing code state and configuration
    const [code, setCode] = useState<string>('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const CELL_COUNT = 6; // 6-character alphanumeric code (e.g., A7X9K2)
    
    // Auto-blur when code is complete for better keyboard handling
    const ref = useBlurOnFulfill({value: code, cellCount: CELL_COUNT});
    
    const handleCodeChange = (newCode: string) => {
      setCode(newCode);
      setError(null);
    };

    // Clear cell on focus for better UX - allows easy correction of typos
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
      value: code,
      setValue: handleCodeChange,
    });

    const handleVerifyCode = async () => {
      try {
        setIsVerifying(true);
        setError(null);
        
        const response = await verifyPairingCode(code);
        
        // Save JWT token for authenticated requests
        await saveToken(response.access_token);
        
        // Save user info for app usage
        await saveUserInfo({
          user_id: response.user_id,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          caregiver_id: response.caregiver_id
        });
        
        navigation.navigate('UserDashboard');
      } catch (_err) {
        setError(t('UserPairing.error.invalid_code'));
      } finally {
        setIsVerifying(false);
      }
    };

    // Auto-navigate to User Home when code is complete (all 6 characters entered)
    useEffect(() => {
      if (code.length === CELL_COUNT) {
        // 500ms delay provides visual feedback before navigation
        const timer = setTimeout(() => {
          handleVerifyCode();
        }, 500);

        return () => {
          clearTimeout(timer);
        };
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    
                    {/* Page title */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>{t('UserPairing.title')}</Text>
                    </View>
                    
                    {/* Instructions - positioned just above code input */}
                    <Text style={styles.subtitle}>{t('UserPairing.subtitle')}</Text>
                    
                    {/* 6-character code input field */}
                    <View style={styles.codeContainer}>
                      <CodeField
                        ref={ref}
                        {...props}
                        value={code}
                        onChangeText={handleCodeChange}
                        cellCount={CELL_COUNT}
                        keyboardType="default"
                        autoFocus={true}
                        textContentType="oneTimeCode"
                        renderCell={({index, symbol, isFocused}) => (
                          <View
                            key={index}
                            style={[styles.cell, isFocused && styles.focusCell, error && styles.errorCell]}
                            onLayout={getCellOnLayoutHandler(index)}>
                            <Text style={styles.cellText}>
                              {symbol || (isFocused ? <Cursor /> : null)}
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                    
                    {/* Error message display */}
                    {error && (
                      <Text style={styles.errorText}>{error}</Text>
                    )}

                    {isVerifying && (
                      <ActivityIndicator size='large' color='#4A90E2' />
                    )}
                    
                    {/* Helpful tip section with icon */}
                    <View style={styles.tipSection}>
                        <Ionicons name='bulb' size={20} color='#4A90E2' />
                        <Text style={styles.tipText}>{t('UserPairing.tipText')}</Text>
                    </View>
                    
                    {/* Navigation back to profile type selection */}
                    <TouchableOpacity onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        navigation.navigate('Welcome');
                    }}>
                        <Text style={styles.backProfileText}>{t('UserPairing.buttons.Back to profile type')}</Text>
                    </TouchableOpacity>
            </View>
            );
        };

const styles = StyleSheet.create({
    // LAYOUT
    titleSection: {
        width: '100%',
        paddingLeft: 10,
        marginTop: 30,
        marginBottom: 20,
    },
    codeContainer: {
        width: '100%',
        paddingBottom: 50,
        marginTop: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // TYPOGRAPHY
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666666',
        paddingLeft: 10,
        marginBottom: 15,
    },
    
    // SCREEN-SPECIFIC
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
      backgroundColor: '#FFFFFF',
      marginHorizontal: 5,
    },
    focusCell: {
      borderColor: '#4A90E2',
    },
    errorCell: {
      borderColor: '#FF0000',
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
        marginTop: 30,
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
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
    },
});

export default UserPairingScreen;
