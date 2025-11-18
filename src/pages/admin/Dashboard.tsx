import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroImageUpload } from "@/components/HeroImageUpload";
import { HeroImageManager } from "@/components/HeroImageManager";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, Eye, FolderOpen } from "lucide-react";

export default function Dashboard() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [stats, setStats] = useState({
    publications: 0,
    authors: 0,
    totalViews: 0,
    categories: 0,
  });
  const [heroImage, setHeroImage] = useState("");

  useEffect(() => {
    fetchStats();
    fetchHeroImage();
  }, []);

  const fetchHeroImage = async () => {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "hero_image")
      .single();

    if (data?.value) {
      setHeroImage((data.value as any).url || "");
    }
  };

  const fetchStats = async () => {
    const [pubCount, authorCount, viewCount, catCount] = await Promise.all([
      supabase.from('publications').select('*', { count: 'exact', head: true }),
      supabase.from('authors').select('*', { count: 'exact', head: true }),
      supabase.from('publication_views').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      publications: pubCount.count || 0,
      authors: authorCount.count || 0,
      totalViews: viewCount.count || 0,
      categories: catCount.count || 0,
    });
  };

  const statCards = [
    {
      title: isArabic ? 'المقالات' : 'Publications',
      value: stats.publications,
      icon: FileText,
      link: '/admin/publications',
    },
    {
      title: isArabic ? 'الكتّاب' : 'Authors',
      value: stats.authors,
      icon: Users,
      link: '/admin/authors',
    },
    {
      title: isArabic ? 'المشاهدات' : 'Total Views',
      value: stats.totalViews,
      icon: Eye,
      link: '/admin/analytics',
    },
      {
        title: isArabic ? 'الفئات' : 'Categories',
        value: stats.categories,
        icon: FolderOpen,
        link: '/admin/categories',
      },
    ];

    const handleImageUpdate = (url: string) => {
      setHeroImage(url);
    };

    return (
    <div>
      <h1 className="font-arabic text-3xl font-bold mb-8">
        {isArabic ? 'لوحة التحكم' : 'Dashboard'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="hover:shadow-card transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <HeroImageUpload
        currentImage={heroImage}
        onImageUpdate={handleImageUpdate}
        language={language}
      />
      
      {/* Hero Images Manager */}
      <div className="mt-8">
        <HeroImageManager onImagesUpdated={fetchStats} />
      </div>
    </div>
  );
}
