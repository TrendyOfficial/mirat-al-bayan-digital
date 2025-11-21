import { createContext, useContext, useState, useEffect } from "react";

export type Language = 
  | 'ar' | 'bg' | 'bn' | 'ca' | 'cs' | 'da' | 'de' | 'el' | 'en' 
  | 'es' | 'et' | 'fa' | 'fi' | 'fr' | 'gl' | 'gu' | 'he' | 'hi' 
  | 'hu' | 'id' | 'is' | 'it' | 'ja' | 'km' | 'ko' | 'lv' | 'ne' 
  | 'nl' | 'pa' | 'pl' | 'pt' | 'ro' | 'ru' | 'si' | 'sl' | 'sv' 
  | 'ta' | 'th' | 'tr' | 'uk' | 'vi' | 'zh';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  countryCode: string;
  isRTL?: boolean;
}

export const AVAILABLE_LANGUAGES: LanguageInfo[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', countryCode: 'SA', isRTL: true },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', countryCode: 'BG' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', countryCode: 'BD' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', countryCode: 'AD' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', countryCode: 'CZ' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', countryCode: 'DK' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', countryCode: 'DE' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', countryCode: 'GR' },
  { code: 'en', name: 'English', nativeName: 'English', countryCode: 'US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', countryCode: 'ES' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', countryCode: 'EE' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', countryCode: 'IR', isRTL: true },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', countryCode: 'FI' },
  { code: 'fr', name: 'French', nativeName: 'Français', countryCode: 'FR' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', countryCode: 'ES' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', countryCode: 'IN' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', countryCode: 'IL', isRTL: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', countryCode: 'IN' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', countryCode: 'HU' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', countryCode: 'ID' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', countryCode: 'IS' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', countryCode: 'IT' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', countryCode: 'JP' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', countryCode: 'KH' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', countryCode: 'KR' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', countryCode: 'LV' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', countryCode: 'NP' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', countryCode: 'NL' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', countryCode: 'IN' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', countryCode: 'PL' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', countryCode: 'BR' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', countryCode: 'RO' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', countryCode: 'RU' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', countryCode: 'LK' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', countryCode: 'SI' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', countryCode: 'SE' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', countryCode: 'LK' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', countryCode: 'TH' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', countryCode: 'TR' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', countryCode: 'UA' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', countryCode: 'VN' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', countryCode: 'CN' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  quickSwitchLanguages: [Language, Language];
  setQuickSwitchLanguages: (langs: [Language, Language]) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'ar';
  });
  
  const [quickSwitchLanguages, setQuickSwitchLanguagesState] = useState<[Language, Language]>(() => {
    const saved = localStorage.getItem('quick-switch-languages');
    return saved ? JSON.parse(saved) : ['ar', 'en'];
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('app-language', language);
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setQuickSwitchLanguages = (langs: [Language, Language]) => {
    setQuickSwitchLanguagesState(langs);
    localStorage.setItem('quick-switch-languages', JSON.stringify(langs));
  };

  const toggleLanguage = () => {
    const currentIndex = quickSwitchLanguages.indexOf(language);
    const nextIndex = currentIndex === 0 ? 1 : 0;
    setLanguage(quickSwitchLanguages[nextIndex]);
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      toggleLanguage, 
      isRTL,
      quickSwitchLanguages,
      setQuickSwitchLanguages
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
