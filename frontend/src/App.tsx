/**
 * App - Root component of the application
 * 
 * Initializes and wraps the navigation structure with NavigationContainer.
 * Entry point for the entire React Native application.
 * 
 * Key responsibilities:
 * - Loads i18n configuration for multi-language support
 * - Provides navigation context via NavigationContainer
 * - Initializes the main application navigator
 * 
 * @module App
 */
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import "./i18n"; // Initialize internationalization before any component renders
import AppNavigator from './navigation/AppNavigator';

/**
 * Main application component that sets up navigation and i18n.
 * 
 * @returns The root component wrapped in NavigationContainer
 */
const App: React.FC = () => {
    return (
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    );
}

export default App;
