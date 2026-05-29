import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh.json'
import en from './locales/en.json'

// Initialize i18next with standard React bindings
i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en }
    },
    lng: 'zh', // Chinese is set as the default locale
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false // React already escapes string entities
    }
  })

export default i18n
