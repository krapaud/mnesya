/**
 * i18n configuration — sets up French/English translations.
 *
 * @module i18n
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import fr from './locales/fr.json';
import en from './locales/en.json';

// ─── Constants ───────────────────────────────────────────────────────────────

const resources = {
    fr: {
        translation: fr,
    },
    en: {
        translation: en,
    },
};

const SUPPORTED_LANGUAGES = Object.keys(resources);

const deviceLanguage =
    RNLocalize.findBestLanguageTag(SUPPORTED_LANGUAGES)?.languageTag ?? 'fr';

// Initialize i18next with React integration
i18n.use(initReactI18next).init({
    resources,
    fallbackLng: 'fr',
    lng: deviceLanguage,
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
