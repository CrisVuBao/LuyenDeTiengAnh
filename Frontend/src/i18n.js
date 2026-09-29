import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import viTranslation from './locales/vi.json';
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

const savedLang = (typeof window !== 'undefined' && localStorage.getItem('app_language')) || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: viTranslation },
      en: { translation: enTranslation },
      zh: { translation: zhTranslation }
    },
    lng: savedLang,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
