import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { CodeField, Cursor } from 'react-native-confirmation-code-field';
import { Ionicons } from '@expo/vector-icons';

const UserSetPINScreen = ({ navigation, route }) => {
    const { userName } = route.params
    const [firstPin, setFirstPin] = useState('');
    const [secondPin, setSecondPin] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [value, setValue] = useState('');

    useEffect(() => {
        if (value.length === 4) {
            if (isConfirming) {
                handleSecondPinComplete(value);
            } else {
                handleFirstPinComplete(value);
            }
        }
    }, [value]);

    const handleFirstPinComplete = (code) => {
        setFirstPin(code);
        setIsConfirming(true);
        setValue('');
    };

    const handleSecondPinComplete = (code) => {
        if (firstPin === code) {
            setSecondPin(code);
            Alert.alert(
                'Success',
                'Your PIN has been created successfully',
                [
                    {
                    text: 'OK',
                    onPress: () => {
                        navigation.navigate('UserEnterPIN');
                    }
                    }
                ]
                );
        } else {
            Alert.alert('Error', 'PINs do not match. Please try again.');
            setIsConfirming(false);
            setFirstPin('');
            setValue('');
        }
    };

    return (
        <View style={styles.container}>
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
            <View style={styles.titleSection}>
                <Text style={styles.title}>Hello {userName}</Text>
                <Text style={styles.subtitle}>
                    {isConfirming ? 'Confirm your PIN code' : 'Create your PIN code'}
                </Text>
            </View>
            
            <View style={styles.content}>
                <CodeField
                    value={value}
                    onChangeText={setValue}
                    cellCount={4}
                    keyboardType="number-pad"
                    autoFocus={true}
                    renderCell={({ index, symbol, isFocused }) => (
                        <Text 
                          key={index}
                          style={[
                            styles.cell,
                            { backgroundColor: symbol ? '#90EE90' : '#D3D3D3' }
                          ]}
                        >
                          {' '}
                        </Text>
                    )}
                />
            </View>
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
    },
    content: {
        width: '100%',
        marginTop: 40,
        paddingBottom: 50,
        alignItems: 'center',
    },
    titleSection: {
        width: '100%',
        paddingLeft: '30%',
        marginTop: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
    cell: {
        width: 20,
        height: 20,
        margin: 15,
        borderRadius: 25,
        backgroundColor: '#D3D3D3',
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
});

export default UserSetPINScreen;
