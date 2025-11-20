import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Turnstile } from "@/components/Turnstile";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const resetSchema = z.object({
    email: z.string().email("Invalid email address").max(255),
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      resetSchema.parse({ email: resetEmail });
      setIsLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast.error(isArabic ? "خطأ في إرسال رابط الاستعادة" : "Failed to send reset link", {
          description: error.message,
        });
      } else {
        setEmailSent(true);
        toast.success(isArabic ? "تم إرسال رابط إعادة التعيين" : "Reset link sent to your email");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(isArabic ? "خطأ في التحقق" : "Validation error", {
          description: error.errors[0].message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      toast.error(isArabic ? "يرجى إكمال التحقق الأمني" : "Please complete security verification");
      return;
    }
    
    try {
      loginSchema.parse(loginData);
      setIsLoading(true);

      const { error } = await signIn(loginData.email, loginData.password);

      if (error) {
        toast.error(isArabic ? "خطأ في تسجيل الدخول" : "Login failed", {
          description: error.message,
        });
      } else {
        toast.success(isArabic ? "تم تسجيل الدخول بنجاح" : "Login successful");
        
        // Log activity
        const { data: { user: loggedUser } } = await supabase.auth.getUser();
        if (loggedUser) {
          await supabase.rpc('log_activity', {
            p_user_id: loggedUser.id,
            p_action: 'User logged in',
            p_details: {}
          });
        }
        
        navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(isArabic ? "خطأ في التحقق" : "Validation error", {
          description: error.errors[0].message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      toast.error(isArabic ? "يرجى إكمال التحقق الأمني" : "Please complete security verification");
      return;
    }

    try {
      signupSchema.parse(signupData);
      setIsLoading(true);

      const { error } = await signUp(
        signupData.email,
        signupData.password,
        signupData.fullName
      );

      if (error) {
        toast.error(isArabic ? "خطأ في التسجيل" : "Signup failed", {
          description: error.message,
        });
      } else {
        // Log activity
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          await supabase.rpc('log_activity', {
            p_user_id: newUser.id,
            p_action: 'User signed up',
            p_details: { email: signupData.email }
          });
        }
        
        // Check if email confirmation is enabled
        const { data: authConfig } = await supabase.auth.getSession();
        setEmailSent(true);
        toast.success(
          isArabic
            ? "تم التسجيل! تحقق من بريدك الإلكتروني"
            : "Signup successful! Check your email for verification"
        );
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(isArabic ? "خطأ في التحقق" : "Validation error", {
          description: error.errors[0].message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-arabic text-3xl text-primary">
            {isArabic ? 'مرآة البيان' : 'Miratl Bayan'}
          </CardTitle>
          <CardDescription>
            {isArabic ? 'مجلة أدبية عربية حديثة' : 'Modern Arabic Literature Magazine'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </TabsTrigger>
              <TabsTrigger value="signup">
                {isArabic ? 'إنشاء حساب' : 'Sign Up'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">
                    {isArabic ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">
                    {isArabic ? 'كلمة المرور' : 'Password'}
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    required
                  />
                </div>
                <Turnstile 
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                />
                <Button type="submit" className="w-full" disabled={isLoading || !turnstileToken}>
                  {isLoading
                    ? (isArabic ? 'جاري التحميل...' : 'Loading...')
                    : (isArabic ? 'تسجيل الدخول' : 'Login')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">
                    {isArabic ? 'الاسم الكامل' : 'Full Name'}
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupData.fullName}
                    onChange={(e) =>
                      setSignupData({ ...signupData, fullName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">
                    {isArabic ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData({ ...signupData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">
                    {isArabic ? 'كلمة المرور' : 'Password'}
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">
                    {isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) =>
                      setSignupData({ ...signupData, confirmPassword: e.target.value })
                    }
                    required
                  />
                </div>
                <Turnstile 
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                />
                <Button type="submit" className="w-full" disabled={isLoading || !turnstileToken}>
                  {isLoading
                    ? (isArabic ? 'جاري التحميل...' : 'Loading...')
                    : (isArabic ? 'إنشاء حساب' : 'Sign Up')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
