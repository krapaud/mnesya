/**
 * Module-level navigation reference that allows non-React code (e.g. the Axios
 * interceptor in api.ts) to imperatively navigate without prop-drilling or
 * context.  The ref is attached to the NavigationContainer in App.tsx.
 *
 * @module navigationService
 */
import { createRef } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../types/index';

export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();
