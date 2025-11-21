import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Preferences() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="flex min-h-screen flex-col animate-fade-in">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <h1 className="font-arabic text-4xl font-bold mb-8 animate-slide-up">
            {isArabic ? 'التفضيلات' : 'Preferences'}
          </h1>

          <div className="space-y-6 animate-scale-in">
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'الإعدادات العامة' : 'General Settings'}</CardTitle>
                <CardDescription>
                  {isArabic ? 'قم بتخصيص تجربتك' : 'Customize your experience'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {isArabic ? 'سيتم إضافة المزيد من الخيارات قريباً...' : 'More options coming soon...'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
