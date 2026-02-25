/**
 * API base URL — change the export at the bottom to switch environments.
 *
 * @module api
 */

// Development configurations for different locations
// Update ip_address to your current machine IP (found with: ipconfig getifaddr en0)

// Location 1: Home
const API_BASE_URL_HOME = 'http://192.168.1.233:8000';

// Location 2: Office
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const API_BASE_URL_OFFICE = 'http://10.6.2.140:8000';

// Location 3: Localhost (Testing locally)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const API_BASE_URL_LOCAL = 'http://127.0.0.1:8000';

// Location 4: VPS (Production)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const API_BASE_URL_VPS = 'https://api.mnesya.app';

// Active configuration - change this based on your current location
export const API_BASE_URL = API_BASE_URL_HOME;

// Fallback configuration
export const BACKUP_API_URL = 'http://localhost:8000';
