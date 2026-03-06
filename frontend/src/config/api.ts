/**
 * API base URL configuration.
 *
 * In development with Expo Go, the IP is automatically detected from the
 * Expo dev server (Constants.expoConfig.hostUri). No manual change needed
 * when switching networks.
 *
 * In production, falls back to the production URL.
 *
 * @module api
 */

import Constants from 'expo-constants';

// ─── Constants ───────────────────────────────────────────────────────────────

const hostUri = Constants.expoConfig?.hostUri;
const localIp = hostUri ? hostUri.split(':')[0] : null;

export const API_BASE_URL = localIp ? `http://${localIp}:8000` : 'https://api.mnesya.app'; // production fallback

export const BACKUP_API_URL = 'https://api.mnesya.app';
