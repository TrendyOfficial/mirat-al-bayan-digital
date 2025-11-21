import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

export function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleLanguage();
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="relative rounded-full border-2 border-transparent bg-pill-background bg-opacity-50 hover:bg-opacity-100 transition-all duration-75 hover:scale-110 hover:bg-pill-backgroundHover active:scale-125 h-10 w-10"
      aria-label="Toggle language"
    >
      <Globe className={`h-5 w-5 transition-transform duration-400 ${isAnimating ? 'scale-0 rotate-180' : 'scale-100 rotate-0'}`} />
      <span className={`absolute -bottom-1 -right-1 text-[10px] font-bold transition-all duration-400 ${isAnimating ? 'scale-0' : 'scale-100'}`}>
        {language.toUpperCase()}
      </span>
    </Button>
  );
}
