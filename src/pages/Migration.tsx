import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Upload, Cloud, FileDown, FileUp, Bookmark, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

type MigrationStep = "choose" | "download" | "upload";

export default function Migration() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isArabic = language === 'ar';
  const [step, setStep] = useState<MigrationStep>("choose");
  const [progress, setProgress] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCounts();
  }, [user, navigate]);

  const fetchCounts = async () => {
    // Fetch bookmarks count
    const { count: bookmarks } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id);
    
    setBookmarksCount(bookmarks || 0);
  };

  const handleDownloadData = async () => {
    setIsLoading(true);
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      // Fetch bookmarks
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select(`
          *,
          publication:publications(*)
        `)
        .eq('user_id', user?.id);

      const exportData = {
        account: {
          profile: {
            icon: profile?.profile_icon || "user",
            colorA: profile?.profile_color_one || "#3b82f6",
            colorB: profile?.profile_color_two || "#ec4899",
            useGradient: profile?.use_gradient ?? true,
            fullName: profile?.full_name || "",
          },
        },
        bookmarks: bookmarks?.reduce((acc: any, bookmark: any) => {
          acc[bookmark.publication_id] = {
            id: bookmark.publication_id,
            title_ar: bookmark.publication?.title_ar,
            title_en: bookmark.publication?.title_en,
            slug: bookmark.publication?.slug,
            updatedAt: new Date(bookmark.created_at).getTime(),
          };
          return acc;
        }, {}) || {},
        exportDate: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `miratl-bayan-backup-${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(isArabic ? 'تم تنزيل البيانات بنجاح' : 'Data downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(isArabic ? 'فشل تنزيل البيانات' : 'Failed to download data');
    }
    setIsLoading(false);
  };

  const handleUploadData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Update profile
      if (data.account?.profile) {
        await supabase
          .from('profiles')
          .update({
            profile_icon: data.account.profile.icon,
            profile_color_one: data.account.profile.colorA,
            profile_color_two: data.account.profile.colorB,
            use_gradient: data.account.profile.useGradient,
            full_name: data.account.profile.fullName,
          })
          .eq('id', user?.id);
      }

      // Restore bookmarks
      if (data.bookmarks) {
        const bookmarkIds = Object.keys(data.bookmarks);
        for (const pubId of bookmarkIds) {
          await supabase
            .from('bookmarks')
            .upsert({
              user_id: user?.id,
              publication_id: pubId,
            }, {
              onConflict: 'user_id,publication_id',
            });
        }
      }

      toast.success(isArabic ? 'تم استعادة البيانات بنجاح' : 'Data restored successfully');
      navigate('/settings');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(isArabic ? 'فشل استعادة البيانات' : 'Failed to restore data');
    }
    setIsLoading(false);
  };

  const currentStep = step === "choose" ? 1 : 2;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">{currentStep}/2</span>
          </div>
          <Progress value={(currentStep / 2) * 100} className="h-1" />
        </div>

        {step === "choose" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isArabic ? 'نقل بياناتك' : 'Migrate your data'}
              </h1>
              <p className="text-muted-foreground">
                {isArabic 
                  ? 'إذا كنت ترغب في نقل أو نسخ بياناتك احتياطيًا، يمكنك القيام بذلك باستخدام الخيارات أدناه. سيسمح لك ذلك بالاحتفاظ ببياناتك عند التبديل بين الخوادم الخلفية.'
                  : 'If you wish to migrate or backup your data, you can do so using the options below. This will allow you to keep your data when you switch backend servers.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Direct Migration - Disabled for now */}
              <Card className="relative p-6 opacity-50 cursor-not-allowed border-border/50">
                <Cloud className="h-12 w-12 mb-4 text-primary" />
                <div className="mb-2">
                  <span className="text-xs uppercase text-primary font-semibold">
                    {isArabic ? 'الأسهل والأسرع' : 'EASIEST AND FASTEST'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {isArabic ? 'النقل المباشر' : 'Direct migration'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isArabic 
                    ? 'سينقل هذا بياناتك مباشرة إلى الخادم الجديد. هذا هو الخيار الأسرع.'
                    : 'This will directly migrate your data to the new server. This is the fastest option.'}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  {isArabic 
                    ? 'يتيح لك هذا الخيار الاحتفاظ بعبارة المرور الخاصة بك!'
                    : 'This option allows you to keep your passphrase the same!'}
                </p>
              </Card>

              {/* Download Data */}
              <Card 
                className="relative p-6 hover:shadow-lg transition-all cursor-pointer border-border hover:border-primary/50"
                onClick={() => setStep("download")}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <FileDown className="h-8 w-8" />
                  </div>
                </div>
                <div className="mb-2">
                  <span className="text-xs uppercase text-muted-foreground font-semibold">
                    {isArabic ? 'أكثر تقنية' : 'MORE TECHNICAL'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {isArabic ? 'تنزيل البيانات' : 'Download data'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isArabic 
                    ? 'سيؤدي هذا إلى تنزيل بياناتك على جهازك. يمكنك بعد ذلك تحميلها إلى الخادم الجديد أو الاحتفاظ بها للحفظ الآمن.'
                    : 'This will download your data to your device. You can then upload it to the new server or just keep it for safekeeping.'}
                </p>
                <Button className="w-full" variant="outline">
                  {isArabic ? 'تنزيل البيانات' : 'Download data'} →
                </Button>
              </Card>

              {/* Upload Data */}
              <Card 
                className="relative p-6 hover:shadow-lg transition-all cursor-pointer border-border hover:border-primary/50"
                onClick={() => setStep("upload")}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <FileUp className="h-8 w-8" />
                  </div>
                </div>
                <div className="mb-2">
                  <span className="text-xs uppercase text-muted-foreground font-semibold">
                    {isArabic ? 'استعادة من نسخة احتياطية' : 'RESTORE FROM BACKUP'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {isArabic ? 'رفع البيانات' : 'Upload Data'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isArabic 
                    ? 'قم برفع ملف البيانات المصدَّرة مسبقًا لاستعادة الإشارات المرجعية والتقدم في هذا الحساب.'
                    : 'Upload your previously exported data file to restore your bookmarks and progress on this account.'}
                </p>
                <Button className="w-full" variant="outline">
                  {isArabic ? 'رفع البيانات' : 'Upload Data'} →
                </Button>
              </Card>
            </div>

            <div className="flex justify-between items-center pt-4">
              <span className="text-sm text-muted-foreground uppercase">
                {isArabic ? 'أو' : 'OR'}
              </span>
              <span className="text-sm text-muted-foreground uppercase">
                {isArabic ? 'أو' : 'OR'}
              </span>
            </div>
          </div>
        )}

        {step === "download" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isArabic ? 'تنزيل البيانات' : 'Download data'}
              </h1>
              <p className="text-muted-foreground">
                {isArabic 
                  ? 'سيؤدي هذا إلى تنزيل بياناتك على جهازك. يمكنك بعد ذلك تحميلها إلى الخادم الجديد أو الاحتفاظ بها للحفظ الآمن.'
                  : 'This will download your data to your device. You can then upload it to the new server or just keep it for safekeeping.'}
              </p>
            </div>

            <Card className="p-6 bg-muted/30">
              <h3 className="font-semibold mb-4">
                {isArabic ? 'يتضمن التنزيل:' : 'Download includes:'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Bookmark className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {isArabic ? 'الوسائط المحفوظة' : 'Bookmarked media'}
                    </p>
                    <p className="text-2xl font-bold">{bookmarksCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {isArabic ? 'تقدم المشاهدة' : 'Watch progress'}
                    </p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep("choose")}
                disabled={isLoading}
              >
                {isArabic ? 'رجوع' : 'Go back'}
              </Button>
              <Button
                className="flex-1"
                onClick={handleDownloadData}
                disabled={isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                {isArabic ? 'تنزيل البيانات' : 'Download data'}
              </Button>
            </div>
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isArabic ? 'رفع البيانات' : 'Upload data'}
              </h1>
              <p className="text-muted-foreground">
                {isArabic 
                  ? 'قم برفع ملف البيانات المصدَّرة مسبقًا لاستعادة الإشارات المرجعية والتقدم في هذا الحساب.'
                  : 'Upload your previously exported data file to restore your bookmarks and progress on this account.'}
              </p>
            </div>

            <Card className="p-12 border-2 border-dashed text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {isArabic ? 'اختر الملف الذي تريد رفعه:' : 'Select the file you want to upload:'}
              </p>
              <Input
                type="file"
                accept=".json"
                onChange={handleUploadData}
                disabled={isLoading}
                className="max-w-sm mx-auto"
              />
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep("choose")}
                disabled={isLoading}
              >
                {isArabic ? 'رجوع' : 'Go back'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}