// frontend/src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(HttpBackend) // Load translations from /locales
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // Pass i18n to react-i18next
    .init({
        fallbackLng: 'en', // Default language
        debug: false,
        interpolation: {
            escapeValue: false, // React already escapes values
        },
        backend: {
            loadPath: '/locales/{{lng}}/translation.json', // Path to translation files
        },
        detection: {
            order: ['localStorage', 'navigator'], // Check localStorage first, then browser language
            caches: ['localStorage'], // Cache the language in localStorage
        },
    });

export default i18n;
