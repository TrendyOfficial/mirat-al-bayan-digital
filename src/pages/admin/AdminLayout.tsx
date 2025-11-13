import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  Home, 
  UserCog 
} from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const isArabic = language === 'ar';

  const navItems = [
    { icon: LayoutDashboard, label: isArabic ? 'الرئيسية' : 'Dashboard', path: '/admin' },
    { icon: FileText, label: isArabic ? 'المقالات' : 'Publications', path: '/admin/publications' },
    { icon: Users, label: isArabic ? 'الكتّاب' : 'Authors', path: '/admin/authors' },
    { icon: FolderOpen, label: isArabic ? 'الفئات' : 'Categories', path: '/admin/categories' },
    { icon: BarChart3, label: isArabic ? 'التحليلات' : 'Analytics', path: '/admin/analytics' },
    { icon: UserCog, label: isArabic ? 'المستخدمون' : 'Users', path: '/admin/users' },
    { icon: Settings, label: isArabic ? 'الإعدادات' : 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link to="/" className="font-arabic text-xl font-bold text-primary">
            {isArabic ? 'مرآة البيان' : 'Miratl Bayan'}
          </Link>
        </div>
        
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              {isArabic ? 'العودة للموقع' : 'Back to Site'}
            </Link>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => signOut()}>
            {isArabic ? 'تسجيل الخروج' : 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="flex h-16 items-center justify-end border-b px-6 gap-4">
          <LanguageSwitcher />
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
