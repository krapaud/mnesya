// Login Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                <Text style={styles.title}>Caregiver Login</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.formsButton}>
                    <TextInput
                        placeholder='Enter your Email'
                        onChangeText={newText => setEmail(newText)}
                        defaultValue={email}
                    />
                </View>
                <Text style={styles.label}>Password</Text>
                <View style={styles.formsButton}>
                    <TextInput
                        placeholder='Enter your Password'
                        secureTextEntry={true}
                        onChangeText={newText => setPassword(newText)}
                        defaultValue={password}
                    />
                </View>
                <TouchableOpacity 
                    style={styles.loginButton}
                    onPress={() => navigation.navigate('Dashboard')}
                >
                    <Text style={styles.loginButtonText}>Log in</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {}}>
                    <Text style={styles.lostPasswordText}>Lost password?</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.createAccountText}>Create an account</Text>
                </TouchableOpacity>
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
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
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
    formsButton: {
        backgroundColor: '#F5F5F5',
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        alignSelf: 'flex-start',
        width: '100%',
    },
    loginButton: {
        backgroundColor: '#4A90E2',
        padding: 20,
        borderRadius: 20,
        marginTop: 60,
        marginBottom: 20,
        alignSelf: 'center',
        width: '95%',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    createAccountText: {
        color: '#4A90E2',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 10,
    },
    lostPasswordText: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        marginTop: 10,
    },
});

export default LoginScreen;
