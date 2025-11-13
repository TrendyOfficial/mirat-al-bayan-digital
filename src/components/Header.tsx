import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, User, LogOut } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const isArabic = language === 'ar';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <h1 className="font-arabic text-2xl font-bold text-primary">
            {isArabic ? 'مرآة البيان' : 'Miratl Bayan'}
          </h1>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className="relative text-sm font-medium transition-colors group"
          >
            <span className="relative z-10">{isArabic ? 'الرئيسية' : 'Home'}</span>
            <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-secondary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link 
            to="/category/poetry" 
            className="relative text-sm font-medium transition-colors group"
          >
            <span className="relative z-10">{isArabic ? 'قصائد' : 'Poetry'}</span>
            <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-secondary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link 
            to="/category/critical-studies" 
            className="relative text-sm font-medium transition-colors group"
          >
            <span className="relative z-10">{isArabic ? 'دراسات نقدية' : 'Studies'}</span>
            <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-secondary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link 
            to="/category/stories-novels" 
            className="relative text-sm font-medium transition-colors group"
          >
            <span className="relative z-10">{isArabic ? 'قصص' : 'Stories'}</span>
            <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-secondary transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" asChild>
            <Link to="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/admin">
                    {isArabic ? 'لوحة التحكم' : 'Dashboard'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {isArabic ? 'تسجيل الخروج' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/auth">
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
