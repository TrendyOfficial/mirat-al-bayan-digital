import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, FileText, Users, FolderOpen, BarChart3, Settings, Home, UserCog, AlertCircle } from "lucide-react";
export default function AdminLayout() {
  const location = useLocation();
  const {
    language
  } = useLanguage();
  const {
    signOut,
    hasRole,
    isOwner
  } = useAuth();
  const isArabic = language === 'ar';
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwnerUser, setIsOwnerUser] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState(0);
  
  useEffect(() => {
    const checkRoles = async () => {
      const adminStatus = await hasRole('admin');
      const ownerStatus = isOwner();
      setIsAdmin(adminStatus);
      setIsOwnerUser(ownerStatus);
      
      if (ownerStatus) {
        fetchPendingDeletions();
        
        // Real-time subscription
        const channel = supabase
          .channel("deletion_notifications")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "deletion_reviews",
            },
            () => {
              fetchPendingDeletions();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };
    checkRoles();
  }, [hasRole, isOwner]);

  const fetchPendingDeletions = async () => {
    const { count } = await supabase
      .from("deletion_reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    setPendingDeletions(count || 0);
  };

  const allNavItems = [{
    icon: LayoutDashboard,
    label: isArabic ? 'الرئيسية' : 'Dashboard',
    path: '/admin',
    allowedRoles: ['admin', 'editor', 'author']
  }, {
    icon: FileText,
    label: isArabic ? 'المقالات' : 'Publications',
    path: '/admin/publications',
    allowedRoles: ['admin', 'editor', 'author']
  }, {
    icon: Users,
    label: isArabic ? 'الكتّاب' : 'Authors',
    path: '/admin/authors',
    allowedRoles: ['admin', 'editor', 'author']
  }, {
    icon: FolderOpen,
    label: isArabic ? 'الفئات' : 'Categories',
    path: '/admin/categories',
    allowedRoles: ['admin', 'editor'],
    ownerOnly: false
  }, {
    icon: BarChart3,
    label: isArabic ? 'سجل النشاطات' : 'Activity Logs',
    path: '/admin/logs',
    allowedRoles: [],
    ownerOnly: true
  }, {
    icon: UserCog,
    label: isArabic ? 'المستخدمون' : 'Users',
    path: '/admin/users',
    allowedRoles: ['admin'],
    ownerOnly: false
  }, {
    icon: AlertCircle,
    label: isArabic ? 'طلبات الحذف' : 'Deletion Reviews',
    path: '/admin/deletion-reviews',
    allowedRoles: [],
    ownerOnly: true,
    badge: pendingDeletions > 0 ? pendingDeletions : null
  }];

  // Filter navigation items
  const navItems = allNavItems.filter(item => {
    // Owner can see everything
    if (isOwnerUser) return true;
    
    // Check if owner-only
    if (item.ownerOnly) return false;
    
    // Check specific paths
    if (item.path === '/admin/users') {
      return isAdmin;
    }
    if (item.path === '/admin/logs') {
      return false; // Only owner can see logs
    }
    
    return true;
  });
  return <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link to="/" className="font-arabic text-xl font-bold text-primary">
            {isArabic ? 'مرآة البيان' : 'Miratl Bayan'}
          </Link>
        </div>
        
        <nav className="space-y-1 p-4">
          {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return <Link key={item.path} to={item.path}>
                <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start relative">
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                  {item.badge && (
                    <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center p-0 rounded-full">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>;
        })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Button variant="outline" className="w-full" asChild>
            
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
    </div>;
}