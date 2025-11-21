import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage, AVAILABLE_LANGUAGES } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function Preferences() {
  const { language, setLanguage } = useLanguage();
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
                <CardTitle>{isArabic ? 'اللغة' : 'Language'}</CardTitle>
                <CardDescription>
                  {isArabic ? 'اختر لغتك المفضلة' : 'Select your preferred language'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={language === lang.code ? "default" : "outline"}
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => setLanguage(lang.code)}
                    >
                      <div className="flex flex-col items-start flex-1">
                        <span className="font-medium">{lang.nativeName}</span>
                        <span className="text-xs text-muted-foreground">{lang.name}</span>
                      </div>
                      {language === lang.code && <Check className="h-4 w-4 ml-2" />}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
