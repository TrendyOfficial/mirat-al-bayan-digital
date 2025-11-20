import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, LogOut, LayoutDashboard, Search, BookmarkIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DarkModeToggle } from './DarkModeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ProfileAvatar } from './ProfileAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const Header = () => {
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileIcon, setProfileIcon] = useState("user");
  const [colorOne, setColorOne] = useState("#3b82f6");
  const [colorTwo, setColorTwo] = useState("#ec4899");
  const [useGradient, setUseGradient] = useState(true);
  const isArabic = language === 'ar';

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchProfile();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .single();
    
    setIsAdmin(data?.role === 'admin');
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('profile_icon, profile_color_one, profile_color_two, use_gradient')
      .eq('id', user?.id)
      .maybeSingle();
    
    if (data) {
      setProfileIcon(data.profile_icon || 'user');
      setColorOne(data.profile_color_one || '#3b82f6');
      setColorTwo(data.profile_color_two || '#ec4899');
      setUseGradient(data.use_gradient ?? true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <h1 className="font-arabic text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
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
          <DarkModeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link to="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full p-0">
                  <ProfileAvatar 
                    icon={profileIcon}
                    colorOne={colorOne}
                    colorTwo={colorTwo}
                    useGradient={useGradient}
                    size="sm"
                  />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/bookmarks" className="cursor-pointer flex items-center">
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                    {isArabic ? 'المفضلات' : 'Bookmarks'}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    {isArabic ? 'الإعدادات' : 'Settings'}
                  </Link>
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer flex items-center">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      {isArabic ? 'لوحة التحكم' : 'Dashboard'}
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
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
};
