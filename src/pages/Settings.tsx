import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Key, User, ArrowLeft, Settings as SettingsIcon, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IconPicker } from "@/components/IconPicker";
import { ColorPicker } from "@/components/ColorPicker";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  
  const [fullName, setFullName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteEmail, setDeleteEmail] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile customization state
  const [profileIcon, setProfileIcon] = useState("user");
  const [colorOne, setColorOne] = useState("#3b82f6");
  const [colorTwo, setColorTwo] = useState("#ec4899");
  const [useGradient, setUseGradient] = useState(true);
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();
    
    if (data) {
      setFullName(data.full_name || '');
      setProfileIcon(data.profile_icon || 'user');
      setColorOne(data.profile_color_one || '#3b82f6');
      setColorTwo(data.profile_color_two || '#ec4899');
      setUseGradient(data.use_gradient ?? true);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: fullName,
        profile_icon: profileIcon,
        profile_color_one: colorOne,
        profile_color_two: colorTwo,
        use_gradient: useGradient
      })
      .eq('id', user?.id);

    if (error) {
      toast.error(isArabic ? 'فشل التحديث' : 'Update failed', {
        description: error.message,
      });
    } else {
      toast.success(isArabic ? 'تم تحديث الملف الشخصي' : 'Profile updated successfully');
      
      // Log activity
      await supabase.rpc('log_activity', {
        p_user_id: user?.id,
        p_action: 'Profile updated',
        p_details: { full_name: fullName }
      });
    }
    setIsLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast.error(isArabic ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error(isArabic ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    // First verify old password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: oldPassword,
    });

    if (signInError) {
      toast.error(isArabic ? 'كلمة المرور القديمة غير صحيحة' : 'Old password is incorrect');
      setIsLoading(false);
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error(isArabic ? 'فشل تغيير كلمة المرور' : 'Password change failed', {
        description: error.message,
      });
    } else {
      toast.success(isArabic ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Log activity
      await supabase.rpc('log_activity', {
        p_user_id: user?.id,
        p_action: 'Password changed',
        p_details: {}
      });
    }
    setIsLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteEmail !== user?.email) {
      toast.error(isArabic ? 'البريد الإلكتروني غير متطابق' : 'Email does not match');
      return;
    }

    setIsLoading(true);

    // First remove all roles for this user
    const { error: roleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    if (roleError) {
      console.error('Failed to remove roles:', roleError);
    }

    // Log the account deletion before deleting
    if (user?.id) {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_action: 'User deleted their account',
        p_details: { email: user.email },
      });
    }

    // Delete profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', user?.id);

    // Sign out
    await signOut();
    
    toast.success(isArabic ? 'تم حذف الحساب بنجاح' : 'Account deleted successfully');
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-arabic text-3xl font-bold">
              {isArabic ? 'الإعدادات' : 'Settings'}
            </h1>
          </div>

          <div className="flex gap-6">
            {/* Sidebar Navigation */}
            <aside className="w-64 space-y-1 sticky top-24 h-fit">
              <h2 className="text-xs uppercase font-semibold text-muted-foreground mb-4 px-3">
                {isArabic ? 'الإعدادات' : 'SETTINGS'}
              </h2>
              <button
                onClick={() => scrollToSection('profile')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                  activeSection === 'profile' 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                )}
              >
                <Palette className="h-4 w-4" />
                <span>{isArabic ? 'المظهر' : 'Appearance'}</span>
              </button>
              <button
                onClick={() => scrollToSection('account')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                  activeSection === 'account' 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                )}
              >
                <User className="h-4 w-4" />
                <span>{isArabic ? 'الحساب' : 'Account'}</span>
              </button>
              <button
                onClick={() => scrollToSection('password')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                  activeSection === 'password' 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                )}
              >
                <Key className="h-4 w-4" />
                <span>{isArabic ? 'كلمة المرور' : 'Password'}</span>
              </button>
              <button
                onClick={() => scrollToSection('delete')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                  activeSection === 'delete' 
                    ? "bg-destructive/10 text-destructive" 
                    : "hover:bg-muted text-destructive"
                )}
              >
                <Trash2 className="h-4 w-4" />
                <span>{isArabic ? 'حذف الحساب' : 'Delete Account'}</span>
              </button>
            </aside>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Profile Customization */}
              <Card id="profile">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    {isArabic ? 'تخصيص المظهر' : 'Customize Appearance'}
                  </CardTitle>
                  <CardDescription>
                    {isArabic ? 'خصص أيقونتك وألوان ملفك الشخصي' : 'Customize your profile icon and colors'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Preview */}
                  <div className="flex flex-col items-center gap-4 p-6 bg-muted/50 rounded-lg">
                    <ProfileAvatar
                      icon={profileIcon}
                      colorOne={colorOne}
                      colorTwo={colorTwo}
                      useGradient={useGradient}
                      size="xl"
                    />
                    <p className="text-lg font-semibold">{fullName || user?.email}</p>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="displayName">{isArabic ? 'الاسم الكامل' : 'Full Name'}</Label>
                      <Input
                        id="displayName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      />
                    </div>

                    {/* Color Pickers */}
                    <div className="space-y-4">
                      <ColorPicker
                        color={colorOne}
                        onColorChange={setColorOne}
                        label={isArabic ? 'اللون الأول' : 'Profile color one'}
                      />
                      <ColorPicker
                        color={colorTwo}
                        onColorChange={setColorTwo}
                        label={isArabic ? 'اللون الثاني' : 'Profile color two'}
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={useGradient}
                          onCheckedChange={setUseGradient}
                        />
                        <Label>{isArabic ? 'استخدام تدرج الألوان' : 'Use gradient'}</Label>
                      </div>
                    </div>

                    {/* Icon Picker */}
                    <div className="space-y-2">
                      <Label>{isArabic ? 'اختر أيقونة' : 'User icon'}</Label>
                      <IconPicker
                        selectedIcon={profileIcon}
                        onSelectIcon={setProfileIcon}
                      />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card id="account">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {isArabic ? 'معلومات الحساب' : 'Account Information'}
                  </CardTitle>
                  <CardDescription>
                    {isArabic ? 'عرض معلومات حسابك' : 'View your account information'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="email">{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card id="password">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
              </CardTitle>
              <CardDescription>
                {isArabic ? 'تحديث كلمة المرور الخاصة بك' : 'Update your password'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">{isArabic ? 'كلمة المرور القديمة' : 'Old Password'}</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{isArabic ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

              {/* Delete Account */}
              <Card id="delete" className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                {isArabic ? 'حذف الحساب' : 'Delete Account'}
              </CardTitle>
              <CardDescription>
                {isArabic ? 'حذف حسابك بشكل دائم' : 'Permanently delete your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                {isArabic ? 'حذف الحساب' : 'Delete Account'}
              </Button>
            </CardContent>
          </Card>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isArabic ? 'هل أنت متأكد؟' : 'Are you sure?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isArabic 
                    ? 'سيتم حذف حسابك وجميع بياناتك بشكل دائم. أدخل بريدك الإلكتروني للتأكيد.'
                    : 'This will permanently delete your account and all associated data. Enter your email to confirm.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="deleteEmail">{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input
                  id="deleteEmail"
                  type="email"
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  placeholder={user?.email}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isLoading}
                >
                  {isArabic ? 'حذف' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
