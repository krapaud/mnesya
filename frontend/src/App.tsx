/**
 * App - Root component of the application
 * Wraps the navigation structure with NavigationContainer
 * Entry point for the entire React Native application
 */
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from './navigation/AppNavigator';

const App: React.FC = () => {
    return (
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    );
}

export default App;
