import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, LogOut, LayoutDashboard, Search, BookmarkIcon, ChevronDown, Facebook, Instagram, Send } from 'lucide-react';
import { FaTiktok } from 'react-icons/fa';
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
      <div className="container flex h-14 md:h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <h1 className="font-arabic text-xl md:text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
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

        <div className="flex items-center gap-1 md:gap-2">
          <LanguageSwitcher />
          <DarkModeToggle />
          <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10" asChild>
            <Link to="/search">
              <Search className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="group flex items-center gap-1.5 md:gap-2 rounded-full px-1.5 md:px-2 py-1 h-9 md:h-10 hover:bg-accent transition-colors"
                >
                  <ProfileAvatar 
                    icon={profileIcon}
                    colorOne={colorOne}
                    colorTwo={colorTwo}
                    useGradient={useGradient}
                    size="sm"
                    className="w-8 h-8 flex-shrink-0"
                  />
                  <span className="hidden sm:inline text-sm font-medium max-w-[80px] md:max-w-[120px] truncate">
                    {displayName || user.email}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 transition-transform duration-300 group-data-[state=open]:rotate-180 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-64 rounded-xl border bg-popover shadow-lg p-2 animate-in slide-in-from-top-5 duration-300"
                sideOffset={8}
              >
                {/* User Profile Header */}
                <div className="flex items-center gap-3 px-3 py-3 mb-2">
                  <ProfileAvatar 
                    icon={profileIcon}
                    colorOne={colorOne}
                    colorTwo={colorTwo}
                    useGradient={useGradient}
                    size="md"
                    className="w-10 h-10"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">
                      {displayName || user.email}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-2" />

                {/* Main Navigation */}
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer flex items-center rounded-lg px-3 py-2 hover:bg-accent">
                    <Settings className="h-4 w-4 mr-2" />
                    {isArabic ? 'الإعدادات' : 'Settings'}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to="/bookmarks" className="cursor-pointer flex items-center rounded-lg px-3 py-2 hover:bg-accent">
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                    {isArabic ? 'المفضلات' : 'Bookmarks'}
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

                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer rounded-lg px-3 py-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {isArabic ? 'تسجيل الخروج' : 'Logout'}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                {/* Social Links */}
                <div className="px-3 py-2">
                  <div className="flex gap-3 justify-center">
                    <a
                      href="https://www.facebook.com/share/1BZv4RgGkw/"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Facebook"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                    <a
                      href="https://www.instagram.com/sultansoftheword?igsh=OTV6NDl3d29sYmRw/"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Instagram"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                    <a
                      href="https://www.tiktok.com/@sultansoftheword/"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="TikTok"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaTiktok className="h-4 w-4" />
                    </a>
                    <a
                      href="https://t.me/sultansoftheword/"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Telegram"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Send className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" className="h-9 text-xs md:text-sm md:h-10" asChild>
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
