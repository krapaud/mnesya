/**
 * i18n configuration — sets up French/English translations.
 *
 * @module i18n
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';

const resources = {
    fr: {
        translation: fr,
    },
    en: {
        translation: en,
    },
};

// Initialize i18next with React integration
i18n.use(initReactI18next).init({
    resources,
    fallbackLng: 'fr',
    lng: 'fr',
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
