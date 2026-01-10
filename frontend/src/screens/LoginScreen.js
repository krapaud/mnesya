// Login Screen
import React, {useState} from 'react';
import { View, Text, TextInput, StyleSheet, Button } from 'react-native';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Caregiver Login</Text>
            <TextInput
                placeholder='Enter your Email'
                onChangeText={newText => setEmail(newText)}
                defaultValue={email}
            />
            <TextInput
                placeholder='Enter your Password'
                secureTextEntry={true}
                onChangeText={newText => setPassword(newText)}
                defaultValue={password}
            />
            <Button
                title='Log in'
                onPress={() => navigation.navigate('Dashboard')}
            />
            <Button
                title='Create an account'
                onPress={() => navigation.navigate('Register')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {

    },
    subtitle: {
        
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
