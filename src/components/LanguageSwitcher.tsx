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
      <Globe className={`h-5 w-5 transition-transform duration-300 ${isAnimating ? 'rotate-180 scale-110' : ''}`} style={{ color: 'var(--type-logo)' }} />
      <span className={`absolute -bottom-1 -right-1 text-[10px] font-bold px-1 rounded bg-primary text-primary-foreground transition-all duration-300 ${isAnimating ? 'scale-125' : ''}`}>
        {otherLanguage.toUpperCase()}
      </span>
    </button>
  );
}
