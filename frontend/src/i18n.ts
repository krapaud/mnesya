/**
 * i18n Configuration - Internationalization setup for the application
 * 
 * Configures i18next to provide multi-language support throughout the app.
 * Currently supports French (fr) and English (en) translations.
 * 
 * Configuration:
 * - Default language: French (fr)
 * - Fallback language: French (fr) - used when requested language is unavailable
 * - Available languages: French, English
 * - Interpolation: Disabled escapeValue as React already handles XSS protection
 * 
 * Usage:
 * Import this file in App.tsx to initialize i18n on app startup.
 * Use the `useTranslation` hook in components to access translations.
 * 
 * @module i18n
 * @see {@link https://www.i18next.com/} for i18next documentation
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

/**
 * Translation resources organized by language code.
 * Each language contains a 'translation' namespace with all app strings.
 */
const resources = {
  fr: {
    translation: fr,
  },
  en: {
    translation: en,
  }
};

// Initialize i18next with React integration
i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "fr",
    lng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
