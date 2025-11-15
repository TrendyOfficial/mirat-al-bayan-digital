import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="relative"
      aria-label="Toggle language"
    >
      <Globe className="h-5 w-5" />
      <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-background/90 px-0.5 rounded">
        {language.toUpperCase()}
      </span>
    </Button>
  );
}
