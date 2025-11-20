import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PublicationCard } from "@/components/PublicationCard";
import { Loader2 } from "lucide-react";

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
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">
        {isArabic ? 'مفضلاتي' : 'My Bookmarks'}
      </h1>

      {publications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {isArabic ? 'لا توجد مفضلات بعد' : 'No bookmarks yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}
