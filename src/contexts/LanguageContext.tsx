import { createContext, useContext, useState, useEffect } from "react";

type Language = 'en' | 'ar';

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
