import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './Lang/en.json';
import ruTranslations from './Lang/ru.json';
import uzTranslations from './Lang/uz.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslations },
            ru: { translation: ruTranslations },
            uz: { translation: uzTranslations },
        },
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
