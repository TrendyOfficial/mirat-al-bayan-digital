import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PublicationCard } from "@/components/PublicationCard";
import { Loader2, ArrowLeft, Bookmark } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

interface Publication {
  id: string;
  title_en: string | null;
  title_ar: string;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  featured_image_url: string | null;
  slug: string;
  published_at: string | null;
  categories: {
    name_en: string;
    name_ar: string;
    slug: string;
  } | null;
  authors: {
    name_en: string;
    name_ar: string;
  } | null;
}

export default function Bookmarks() {
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

  const loadBookmarks = async () => {
    if (!user) return;

    setIsLoading(true);

    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select(`
        publication_id,
        publications (
          id,
          title_en,
          title_ar,
          excerpt_en,
          excerpt_ar,
          featured_image_url,
          slug,
          published_at,
          categories (
            name_en,
            name_ar,
            slug
          ),
          authors (
            name_en,
            name_ar
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bookmarks:', error);
    } else if (bookmarks) {
      const pubs = bookmarks
        .map((b: any) => b.publications)
        .filter(Boolean) as Publication[];
      setPublications(pubs);
    }

    setIsLoading(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Bookmark className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">
                  {isArabic ? 'مفضلاتي' : 'My Bookmarks'}
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground">
              {publications.length} {isArabic ? 'مقال' : 'articles'}
            </p>
          </div>

          {publications.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-lg">
              <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground text-xl font-medium mb-2">
                {isArabic ? 'لا توجد مفضلات بعد' : 'No bookmarks yet'}
              </p>
              <p className="text-muted-foreground text-sm">
                {isArabic 
                  ? 'احفظ المقالات المفضلة لديك للوصول إليها بسرعة لاحقاً'
                  : 'Save your favorite articles for quick access later'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {publications.map((publication) => (
                <PublicationCard
                  key={publication.id}
                  id={publication.id}
                  title_ar={publication.title_ar}
                  title_en={publication.title_en}
                  excerpt_ar={publication.excerpt_ar}
                  excerpt_en={publication.excerpt_en}
                  featured_image_url={publication.featured_image_url}
                  slug={publication.slug}
                  published_at={publication.published_at || ''}
                  category_name_ar={publication.categories?.name_ar || ''}
                  category_name_en={publication.categories?.name_en || ''}
                  category_slug={publication.categories?.slug || ''}
                  author_name_ar={publication.authors?.name_ar || ''}
                  author_name_en={publication.authors?.name_en || ''}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
