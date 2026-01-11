import React from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image 
                    source={require('../../assets/mnesya-logo.png')} 
                    style={styles.logo}
                />
                <Text style={styles.appName}>Mnesya</Text>
            </View>
            
            <View style={styles.titleSection}>
                <Text style={styles.title}>Welcome to Mnesya</Text>
                <Text style={styles.subtitle}>Choose your profile type</Text>
            </View>
            
            <View style={styles.content}>
                <TouchableOpacity 
                    style={styles.userButton}
                    onPress={() => navigation.navigate('UserPairing')} 
                >
                    <View style={styles.buttonContent}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="person" size={50} color="#fff" />
                        </View>
                        <Text style={styles.buttonText}>User</Text>
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.caregiverButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <View style={styles.buttonContent}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="heart" size={50} color="#fff" />
                        </View>
                        <Text style={styles.buttonText}>Caregiver</Text>
                    </View>
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
        paddingTop: 40,
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
    userButton: {
        backgroundColor: '#4A90E2',
        padding: 60,
        borderRadius: 20,
        marginBottom: 20,
        alignSelf: 'center',
        width: '95%',
    },
    caregiverButton: {
        backgroundColor: '#00D66F',
        padding: 60,
        borderRadius: 20,
        alignSelf: 'center',
        width: '95%',
    },
    buttonContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,  // la moitié de width/height = cercle
        backgroundColor: 'rgba(255, 255, 255, 0.3)',  // blanc semi-transparent
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
});

export default WelcomeScreen;

