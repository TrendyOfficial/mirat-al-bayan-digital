import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsAnimating(true);
    setIsDark(newMode);
    
    // Add transition class to body
    document.documentElement.style.transition = "background-color 0.5s ease, color 0.5s ease";
    
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    // Remove animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
      document.documentElement.style.transition = "";
    }, 600);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      aria-label="Toggle dark mode"
      className="rounded-full border-2 border-transparent bg-pill-background bg-opacity-50 hover:bg-opacity-100 transition-all duration-75 hover:scale-110 hover:bg-pill-backgroundHover active:scale-125 h-10 w-10"
    >
      {isDark ? (
        <Sun className={`h-5 w-5 ${isAnimating ? 'animate-spin-slow' : ''}`} />
      ) : (
        <Moon className={`h-5 w-5 ${isAnimating ? 'animate-spin-slow' : ''}`} />
      )}
    </Button>
  );
}
