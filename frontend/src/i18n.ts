/**
 * i18n configuration — sets up French/English translations.
 * 
 * @module i18n
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

const resources = {
  fr: {
    translation: fr,
  },
  en: {
    translation: en,
  }
};

// Detect device locale — keep only the language part (e.g. 'fr-FR' → 'fr')
const deviceLocale = Localization.getLocales?.()[0]?.languageCode ?? 'fr';
const detectedLang = ['fr', 'en'].includes(deviceLocale) ? deviceLocale : 'fr';

// Initialize i18next with React integration
i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "fr",
    lng: detectedLang,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
