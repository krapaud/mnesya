/**
 * Centralized animation utilities for the application.
 * 
 * Provides reusable animations for bell swings, button presses,
 * and other UI feedback across screens.
 * 
 * @module animations
 */
import { Animated } from 'react-native';

/**
 * Creates a bell swing animation that loops continuously
 * 
 * Provides a gentle swinging motion that draws attention without being too
 * distracting for elderly users. The animation sequence:
 * 1. Rotates to the right (15 degrees)
 * 2. Rotates to the left (-15 degrees)
 * 3. Returns to center (0 degrees)
 * Then loops infinitely.
 * 
 * @param animatedValue - The animated value to control the rotation
 * @returns The configured animation ready to start
 */
export const createBellSwingAnimation = (animatedValue: Animated.Value) => {
    return Animated.loop(
        Animated.sequence([
            // Swing right: Animate to value 1 (which maps to 15deg rotation)
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 200, // 200ms for smooth motion
                useNativeDriver: true, // Better performance on device
            }),
            // Swing left: Animate to value -1 (which maps to -15deg rotation)
            Animated.timing(animatedValue, {
                toValue: -1,
                duration: 200,
                useNativeDriver: true,
            }),
            // Return to center: Reset to 0 (no rotation)
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ])
    );
};

/**
 * Gets the rotation transform for bell animation
 * 
 * Uses interpolate() to convert animation values to style properties.
 * Takes the animated value (-1 to 1) and maps it to rotation degrees (-15° to 15°).
 * 
 * The transform property applies visual transformations in React Native.
 * Combined with useNativeDriver in the animation, runs on the native thread for
 * better performance (60fps instead of choppy JavaScript thread animations).
 * 
 * @param animatedValue - The animated value from createBellSwingAnimation
 * @returns Transform style object that can be spread into a component's style prop
 */
export const getBellRotation = (animatedValue: Animated.Value) => ({
    transform: [{
        rotate: animatedValue.interpolate({
            inputRange: [-1, 1], // Input range from animation sequence
            outputRange: ['-15deg', '15deg'], // Corresponding rotation angles
        }),
    }],
});
