/**
 * Reusable animation helpers.
 *
 * @module animations
 */
import { Animated } from 'react-native';

/** Swinging bell animation that loops forever. */
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

/** Returns the rotation transform style for the bell animation. */
export const getBellRotation = (animatedValue: Animated.Value) => ({
    transform: [
        {
            rotate: animatedValue.interpolate({
                inputRange: [-1, 1], // Input range from animation sequence
                outputRange: ['-15deg', '15deg'], // Corresponding rotation angles
            }),
        },
    ],
});

/** Pulse animation that loops forever (opacity 1 → 0.4 → 1). */
export const createPulseAnimation = (animatedValue: Animated.Value) => {
    return Animated.loop(
        Animated.sequence([
            Animated.timing(animatedValue, {
                toValue: 0.4,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ])
    );
};

/** Returns the opacity style for the pulse animation. */
export const getPulseScale = (animatedValue: Animated.Value) => ({
    opacity: animatedValue,
});
