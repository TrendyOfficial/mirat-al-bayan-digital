import { type Language } from "@/contexts/LanguageContext";
import arTranslations from "@/assets/locales/ar.json";
import enTranslations from "@/assets/locales/en.json";
import esTranslations from "@/assets/locales/es.json";
import frTranslations from "@/assets/locales/fr.json";
import deTranslations from "@/assets/locales/de.json";
import trTranslations from "@/assets/locales/tr.json";
import nlTranslations from "@/assets/locales/nl.json";
import ptTranslations from "@/assets/locales/pt.json";
import itTranslations from "@/assets/locales/it.json";
import ruTranslations from "@/assets/locales/ru.json";
import jaTranslations from "@/assets/locales/ja.json";
import zhTranslations from "@/assets/locales/zh.json";
import koTranslations from "@/assets/locales/ko.json";

const translations: Record<Language, any> = {
  ar: arTranslations,
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
  de: deTranslations,
  tr: trTranslations,
  nl: nlTranslations,
  pt: ptTranslations,
  it: itTranslations,
  ru: ruTranslations,
  ja: jaTranslations,
  zh: zhTranslations,
  ko: koTranslations,
  // Other languages default to English or Arabic for now
  bg: enTranslations,
  bn: enTranslations,
  ca: enTranslations,
  cs: enTranslations,
  da: enTranslations,
  el: enTranslations,
  et: enTranslations,
  fa: arTranslations, // Persian uses RTL like Arabic
  fi: enTranslations,
  gl: enTranslations,
  gu: enTranslations,
  he: arTranslations, // Hebrew uses RTL like Arabic
  hi: enTranslations,
  hu: enTranslations,
  id: enTranslations,
  is: enTranslations,
  km: enTranslations,
  lv: enTranslations,
  ne: enTranslations,
  pa: enTranslations,
  pl: enTranslations,
  ro: enTranslations,
  si: enTranslations,
  sl: enTranslations,
  sv: enTranslations,
  ta: enTranslations,
  th: enTranslations,
  uk: ruTranslations, // Ukrainian can use Russian translations
  vi: enTranslations,
};

export function t(language: Language, key: string): string {
  const keys = key.split('.')
  let value: any = translations[language]
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k]
    } else {
      return key // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key
}
