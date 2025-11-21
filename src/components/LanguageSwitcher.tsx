import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

export function LanguageSwitcher() {
  const { language, toggleLanguage, quickSwitchLanguages } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleLanguage();
    setTimeout(() => setIsAnimating(false), 400);
  };

  // Get the other language in the quick switch pair
  const otherLanguage = quickSwitchLanguages.find(lang => lang !== language) || 'en';

  return (
    <button
      onClick={handleToggle}
      aria-label="Switch language"
      className="rounded-full border-2 border-transparent transition-[background-color,transform,border-color] duration-75 hover:scale-110 active:scale-125 h-10 w-10 relative group flex items-center justify-center"
      style={{
        backgroundColor: 'var(--pill-background)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--pill-backgroundHover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--pill-background)';
      }}
    >
      <Globe className="h-5 w-5" style={{ color: 'var(--type-logo)' }} />
      <span 
        className={`absolute bottom-0 right-0 text-[10px] font-bold transition-all duration-300 ${isAnimating ? 'scale-110' : ''}`} 
        style={{ color: 'white' }}
      >
        {language.toUpperCase()}
      </span>
    </button>
  );
}
