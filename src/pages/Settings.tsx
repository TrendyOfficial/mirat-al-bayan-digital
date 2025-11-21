import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage, AVAILABLE_LANGUAGES, type Language } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Key, User, ArrowLeft, Settings as SettingsIcon, Palette, Edit2, LogOut, Globe } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IconPicker } from "@/components/IconPicker";
import { ColorPicker } from "@/components/ColorPicker";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const passwordStrengthLabelEn = ["Too short", "Weak", "Medium", "Strong"] as const;
const passwordStrengthLabelAr = ["قصيرة جداً", "ضعيفة", "متوسطة", "قوية"] as const;

const getPasswordStrength = (password: string): number => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /\W/.test(password)) score++;
  if (score >= 3) return 3;
  if (score === 2) return 2;
  if (score === 1) return 1;
  return 0;
};

export default function Settings() {
  const { language, setLanguage, quickSwitchLanguages, setQuickSwitchLanguages } = useLanguage();
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
  const [activeSection, setActiveSection] = useState("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
    if (sectionId !== 'all') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleUpdateProfile = async () => {
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
      setIsEditDialogOpen(false);

      window.dispatchEvent(
        new CustomEvent('profile-updated', {
          detail: {
            profile_icon: profileIcon,
            profile_color_one: colorOne,
            profile_color_two: colorTwo,
            use_gradient: useGradient,
            full_name: fullName,
          },
        })
      );
      
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
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 mt-14 md:mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:h-10 md:w-10"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <h1 className="font-arabic text-2xl md:text-3xl font-bold">
              {isArabic ? 'الإعدادات' : 'Settings'}
            </h1>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 md:space-y-1 md:sticky md:top-24 md:h-fit">
              <h2 className="hidden md:block text-xs uppercase font-semibold text-muted-foreground mb-4 px-3">
                {isArabic ? 'الإعدادات' : 'SETTINGS'}
              </h2>
              <div className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto pb-2 md:pb-0">
                <button
                  onClick={() => scrollToSection('all')}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap md:w-full text-left",
                    activeSection === 'all' 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  )}
                >
                  <SettingsIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{isArabic ? 'الكل' : 'All'}</span>
                </button>
                <button
                  onClick={() => scrollToSection('account')}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap md:w-full text-left",
                    activeSection === 'account' 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  )}
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{isArabic ? 'الحساب' : 'Account'}</span>
                </button>
                <button
                  onClick={() => scrollToSection('password')}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap md:w-full text-left",
                    activeSection === 'password' 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  )}
                >
                  <Key className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{isArabic ? 'كلمة المرور' : 'Password'}</span>
                </button>
                <button
                  onClick={() => scrollToSection('preferences')}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap md:w-full text-left",
                    activeSection === 'preferences' 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  )}
                >
                  <Palette className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{isArabic ? 'التفضيلات' : 'Preferences'}</span>
                </button>
                <button
                  onClick={() => scrollToSection('actions')}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap md:w-full text-left",
                    activeSection === 'actions' 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  )}
                >
                  <SettingsIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{isArabic ? 'الإجراءات' : 'Actions'}</span>
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 space-y-4 md:space-y-6" style={{ display: activeSection === 'all' ? 'flex' : 'block', flexDirection: 'column', overflow: activeSection !== 'all' ? 'hidden' : 'auto', maxHeight: activeSection !== 'all' ? '100vh' : 'none' }}>
              {/* Profile Card */}
              {(activeSection === 'all' || activeSection === 'account') && (
                <Card id="account" className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">{isArabic ? 'الحساب' : 'Account'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-6 p-4 md:p-6 bg-muted/30 rounded-lg border">
                      <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                        <div className="relative">
                          <ProfileAvatar
                            icon={profileIcon}
                            colorOne={colorOne}
                            colorTwo={colorTwo}
                            useGradient={useGradient}
                            size="xl"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-8 text-xs gap-1"
                            onClick={() => setIsEditDialogOpen(true)}
                          >
                            <Edit2 className="h-3 w-3" />
                            {isArabic ? 'تعديل' : 'Edit'}
                          </Button>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{isArabic ? 'الاسم الكامل' : 'Nickname'}</p>
                          <p className="text-lg font-semibold">{fullName || user?.email}</p>
                          <Button
                            variant="destructive"
                            className="mt-4"
                            onClick={async () => {
                              await signOut();
                              navigate('/');
                            }}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            {isArabic ? 'تسجيل الخروج' : 'Log out'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
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
              )}

              {/* Preferences */}
              {(activeSection === 'all' || activeSection === 'preferences') && (
                <Card id="preferences">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {isArabic ? 'التفضيلات' : 'Preferences'}
                    </CardTitle>
                    <CardDescription>
                      {isArabic ? 'خصص تجربتك' : 'Customize your experience'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {isArabic ? 'لغة التطبيق' : 'Application Language'}
                        </label>
                        <p className="text-sm text-muted-foreground mb-2">
                          {isArabic 
                            ? 'اللغة المطبقة على التطبيق بالكامل' 
                            : 'Language applied to the entire application'}
                        </p>
                        <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <ScrollArea className="h-[280px]">
                              {AVAILABLE_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">
                                      {String.fromCodePoint(...lang.countryCode.split('').map(c => 127397 + c.charCodeAt(0)))}
                                    </span>
                                    <span>{lang.name} — {lang.nativeName}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="my-4 border-t" />

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {isArabic ? 'التبديل السريع للغة' : 'Quick Switch Languages'}
                        </label>
                        <p className="text-sm text-muted-foreground mb-2">
                          {isArabic 
                            ? 'اختر لغتين للتبديل السريع بينهما' 
                            : 'Choose two languages to quickly switch between'}
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-2 block">
                              {isArabic ? 'اللغة الأولى' : 'First Language'}
                            </label>
                            <Select 
                              value={quickSwitchLanguages[0]} 
                              onValueChange={(value) => setQuickSwitchLanguages([value as Language, quickSwitchLanguages[1]])}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                <ScrollArea className="h-[280px]">
                                  {AVAILABLE_LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                          {String.fromCodePoint(...lang.countryCode.split('').map(c => 127397 + c.charCodeAt(0)))}
                                        </span>
                                        <span>{lang.name} — {lang.nativeName}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground mb-2 block">
                              {isArabic ? 'اللغة الثانية' : 'Second Language'}
                            </label>
                            <Select 
                              value={quickSwitchLanguages[1]} 
                              onValueChange={(value) => setQuickSwitchLanguages([quickSwitchLanguages[0], value as Language])}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                <ScrollArea className="h-[280px]">
                                  {AVAILABLE_LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                          {String.fromCodePoint(...lang.countryCode.split('').map(c => 127397 + c.charCodeAt(0)))}
                                        </span>
                                        <span>{lang.name} — {lang.nativeName}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Change Password */}
              {(activeSection === 'all' || activeSection === 'password') && (
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
                   {newPassword && (
                     <div className="animate-fade-in text-xs text-muted-foreground">
                       <div className="mt-1 flex gap-1">
                         {Array.from({ length: 3 }).map((_, index) => {
                           const strength = getPasswordStrength(newPassword);
                           const isActive = strength > index;
                           const colorClass =
                             strength <= 1
                               ? "bg-destructive"
                               : strength === 2
                                 ? "bg-secondary"
                                 : "bg-primary";
                           return (
                             <div
                               key={index}
                               className={cn(
                                 "h-1 flex-1 rounded-full bg-muted transition-colors",
                                 isActive && colorClass
                               )}
                             />
                           );
                         })}
                       </div>
                       <span className="mt-1 block">
                         {isArabic
                           ? passwordStrengthLabelAr[getPasswordStrength(newPassword)]
                           : passwordStrengthLabelEn[getPasswordStrength(newPassword)]}
                       </span>
                     </div>
                   )}
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
              )}

              {/* Actions */}
              {(activeSection === 'all' || activeSection === 'actions') && (
                <Card id="actions">
                  <CardHeader>
                    <CardTitle>{isArabic ? 'الإجراءات' : 'Actions'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Account Migration */}
                      <Card className="p-6 bg-muted/30 hover:bg-muted/50 transition-colors">
                        <h3 className="font-semibold mb-2">
                          {isArabic ? 'نقل الحساب' : 'Account migration'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {isArabic 
                            ? 'انقل حسابك إلى خادم جديد أو قم بتنزيل بياناتك.'
                            : 'Migrate your account to a new server or download your data.'}
                        </p>
                        <Button 
                          onClick={() => navigate('/migration')}
                          className="w-full"
                          variant="outline"
                        >
                          {isArabic ? 'نقل الحساب' : 'Migrate account'}
                        </Button>
                      </Card>

                      {/* End All Sessions */}
                      <Card className="p-6 bg-muted/30 hover:bg-muted/50 transition-colors">
                        <h3 className="font-semibold mb-2">
                          {isArabic ? 'إنهاء جميع الجلسات' : 'End All Sessions'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {isArabic 
                            ? 'سيؤدي هذا إلى تسجيل خروجك من جميع الأجهزة المرتبطة بحسابك.'
                            : 'This will sign you out from all devices linked to your account.'}
                        </p>
                        <Button 
                          onClick={async () => {
                            await supabase.auth.signOut({ scope: 'global' });
                            toast.success(isArabic ? 'تم إنهاء جميع الجلسات' : 'All sessions ended');
                            navigate('/');
                          }}
                          className="w-full"
                          variant="outline"
                        >
                          {isArabic ? 'إنهاء جميع الجلسات' : 'Log Out of All Devices'}
                        </Button>
                      </Card>

                      {/* Delete Account */}
                      <Card className="p-6 bg-destructive/10 hover:bg-destructive/20 transition-colors border-destructive/50">
                        <h3 className="font-semibold mb-2 text-destructive">
                          {isArabic ? 'حذف الحساب' : 'Delete account'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {isArabic 
                            ? 'هذا الإجراء لا رجعة فيه. سيتم حذف جميع البيانات ولا يمكن استردادها.'
                            : 'This action is irreversible. All data will be deleted and nothing can be recovered.'}
                        </p>
                        <Button 
                          onClick={() => setShowDeleteDialog(true)}
                          className="w-full"
                          variant="destructive"
                        >
                          {isArabic ? 'حذف الحساب' : 'Delete account'}
                        </Button>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

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

          {/* Edit Profile Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {isArabic ? 'تعديل صورة الملف الشخصي' : 'Edit profile picture'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="flex justify-center">
                  <ProfileAvatar
                    icon={profileIcon}
                    colorOne={colorOne}
                    colorTwo={colorTwo}
                    useGradient={useGradient}
                    size="xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dialogDisplayName">{isArabic ? 'الاسم الكامل' : 'Full Name'}</Label>
                  <Input
                    id="dialogDisplayName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  />
                </div>

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

                <div className="space-y-2">
                  <Label>{isArabic ? 'اختر أيقونة' : 'User icon'}</Label>
                  <IconPicker
                    selectedIcon={profileIcon}
                    onSelectIcon={setProfileIcon}
                  />
                </div>

                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isLoading} 
                  className="w-full"
                >
                  {isArabic ? 'إنهاء التعديل' : 'Finish editing'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
