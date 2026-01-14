/**
 * App - Root component of the application
 * Wraps the navigation structure with NavigationContainer
 * Entry point for the entire React Native application
 */
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from './navigation/AppNavigator';

const App = () => {
    return (
        // NavigationContainer manages navigation state and links navigation tree
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    );
}

export default App;
