import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, LogOut, LayoutDashboard, Search, BookmarkIcon, ChevronDown } from 'lucide-react';
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
  const [displayName, setDisplayName] = useState<string | null>(null);
  const isArabic = language === 'ar';

  useEffect(() => {
    if (!user) return;

    checkAdminStatus();
    fetchProfile();

    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{
        profile_icon?: string;
        profile_color_one?: string;
        profile_color_two?: string;
        use_gradient?: boolean;
        full_name?: string | null;
      }>).detail;

      if (detail) {
        if (detail.profile_icon) setProfileIcon(detail.profile_icon);
        if (detail.profile_color_one) setColorOne(detail.profile_color_one);
        if (detail.profile_color_two) setColorTwo(detail.profile_color_two);
        if (typeof detail.use_gradient === 'boolean') setUseGradient(detail.use_gradient);
        if (detail.full_name !== undefined) setDisplayName(detail.full_name);
      } else {
        fetchProfile();
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdated);

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
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
    if (!user) return;

    setDisplayName(user.email || null);

    const { data } = await supabase
      .from('profiles')
      .select('profile_icon, profile_color_one, profile_color_two, use_gradient, full_name')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) {
      setProfileIcon(data.profile_icon || 'user');
      setColorOne(data.profile_color_one || '#3b82f6');
      setColorTwo(data.profile_color_two || '#ec4899');
      setUseGradient(data.use_gradient ?? true);
      setDisplayName(data.full_name || user.email || null);
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
                <Button
                  variant="ghost"
                  className="group flex items-center gap-2 rounded-full px-2 py-1 h-10 hover:bg-accent transition-colors"
                >
                  <ProfileAvatar 
                    icon={profileIcon}
                    colorOne={colorOne}
                    colorTwo={colorTwo}
                    useGradient={useGradient}
                    size="sm"
                    className="w-8 h-8"
                  />
                  <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                    {displayName || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-64 rounded-xl border bg-popover shadow-lg p-2 animate-in slide-in-from-top-2 duration-200"
              >
                <DropdownMenuItem asChild>
                  <Link to="/bookmarks" className="cursor-pointer flex items-center rounded-lg px-3 py-2 hover:bg-accent">
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                    {isArabic ? 'المفضلات' : 'Bookmarks'}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer flex items-center rounded-lg px-3 py-2 hover:bg-accent">
                    <Settings className="h-4 w-4 mr-2" />
                    {isArabic ? 'الإعدادات' : 'Settings'}
                  </Link>
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer flex items-center rounded-lg px-3 py-2 hover:bg-accent">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      {isArabic ? 'لوحة التحكم' : 'Dashboard'}
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer rounded-lg px-3 py-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive">
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
