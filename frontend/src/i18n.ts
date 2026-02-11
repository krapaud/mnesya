/**
 * Internationalization configuration for the application.
 * 
 * Configures i18next for French/English bilingual support.
 * Default language is French, with fallback to French.
 * 
 * @module i18n
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
