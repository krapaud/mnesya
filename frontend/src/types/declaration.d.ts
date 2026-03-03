/**
 * Module type declarations for packages that do not ship their own TypeScript types.
 */
declare module '@expo/vector-icons';
declare module 'react-native-confirmation-code-field';

/**
 * atob is globally available in React Native (Hermes engine) but not included
 * in the ES2020 TypeScript lib used by this project.
 */
declare function atob(data: string): string;
