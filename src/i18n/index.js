import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import sv from './locales/sv.json'
import en from './locales/en.json'
import fi from './locales/fi.json'

const saved = localStorage.getItem('aland_lang') || 'sv'

i18n
  .use(initReactI18next)
  .init({
    resources: { sv: { translation: sv }, en: { translation: en }, fi: { translation: fi } },
    lng: saved,
    fallbackLng: 'sv',
    interpolation: { escapeValue: false },
  })

i18n.on('languageChanged', (lng) => localStorage.setItem('aland_lang', lng))

export default i18n
