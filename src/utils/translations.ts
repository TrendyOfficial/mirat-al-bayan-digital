import { type Language } from "@/contexts/LanguageContext";
import arTranslations from "@/assets/locales/ar.json";
import enTranslations from "@/assets/locales/en.json";

const translations: Record<Language, any> = {
  ar: arTranslations,
  en: enTranslations,
  // Other languages default to English for now
  bg: enTranslations,
  bn: enTranslations,
  ca: enTranslations,
  cs: enTranslations,
  da: enTranslations,
  de: enTranslations,
  el: enTranslations,
  es: enTranslations,
  et: enTranslations,
  fa: arTranslations, // Persian uses RTL like Arabic
  fi: enTranslations,
  fr: enTranslations,
  gl: enTranslations,
  gu: enTranslations,
  he: arTranslations, // Hebrew uses RTL like Arabic
  hi: enTranslations,
  hu: enTranslations,
  id: enTranslations,
  is: enTranslations,
  it: enTranslations,
  ja: enTranslations,
  km: enTranslations,
  ko: enTranslations,
  lv: enTranslations,
  ne: enTranslations,
  nl: enTranslations,
  pa: enTranslations,
  pl: enTranslations,
  pt: enTranslations,
  ro: enTranslations,
  ru: enTranslations,
  si: enTranslations,
  sl: enTranslations,
  sv: enTranslations,
  ta: enTranslations,
  th: enTranslations,
  tr: enTranslations,
  uk: enTranslations,
  vi: enTranslations,
  zh: enTranslations,
};

export function t(language: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}
