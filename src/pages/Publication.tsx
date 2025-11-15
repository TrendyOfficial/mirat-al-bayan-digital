import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Calendar, Share2, Facebook, Twitter, Mail } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import DOMPurify from "dompurify";

export default function Publication() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [publication, setPublication] = useState<any>(null);
  const [views, setViews] = useState(0);

  useEffect(() => {
    fetchPublication();
    trackView();
  }, [slug]);

  const fetchPublication = async () => {
    const { data } = await supabase
      .from('publications')
      .select(`
        *,
        author:authors(*),
        category:categories(*)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (data) {
      setPublication(data);

      // Get view count
      const { count } = await supabase
        .from('publication_views')
        .select('*', { count: 'exact', head: true })
        .eq('publication_id', data.id);

      setViews(count || 0);
    }
  };

  const trackView = async () => {
    const { data: pub } = await supabase
      .from('publications')
      .select('id')
      .eq('slug', slug)
      .single();

    if (pub) {
      // Generate a session ID from browser fingerprint
      const sessionId = sessionStorage.getItem('view_session') || 
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!sessionStorage.getItem('view_session')) {
        sessionStorage.setItem('view_session', sessionId);
      }

      // Try to insert view, will fail silently if already viewed in this session
      const { error } = await supabase.from('publication_views').insert({
        publication_id: pub.id,
        session_id: sessionId,
      });
      
      // Refresh view count if insert was successful
      if (!error) {
        fetchPublication();
      }
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = publication ? (isArabic ? publication.title_ar : publication.title_en || publication.title_ar) : '';

    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success(isArabic ? 'تم نسخ الرابط' : 'Link copied');
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (!publication) {
    return <div>Loading...</div>;
  }

  const title = isArabic ? publication.title_ar : (publication.title_en || publication.title_ar);
  const content = isArabic ? publication.content_ar : (publication.content_en || publication.content_ar);
  const categoryName = isArabic ? publication.category.name_ar : publication.category.name_en;
  const authorName = isArabic ? publication.author.name_ar : publication.author.name_en;
  const authorBio = isArabic ? publication.author.bio_ar : (publication.author.bio_en || publication.author.bio_ar);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <article className="py-12">
          <div className="container max-w-4xl">
            {publication.featured_image_url && (
              <div className="aspect-[21/9] overflow-hidden rounded-lg mb-8">
                <img
                  src={publication.featured_image_url}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="mb-6">
              <Link to={`/category/${publication.category.slug}`}>
                <Badge variant="secondary" className="mb-4">
                  {categoryName}
                </Badge>
              </Link>
              
              <h1 className="font-arabic text-4xl md:text-5xl font-bold mb-4">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(publication.published_at), 'MMMM dd, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {views} {isArabic ? 'مشاهدة' : 'views'}
                </span>
                <span>{authorName}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
                  <Facebook className="h-4 w-4 mr-2" />
                  {isArabic ? 'شارك' : 'Share'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                  <Twitter className="h-4 w-4 mr-2" />
                  {isArabic ? 'غرد' : 'Tweet'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare('copy')}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {isArabic ? 'نسخ الرابط' : 'Copy Link'}
                </Button>
              </div>
            </div>

            <div className="prose prose-lg max-w-none mb-12 font-arabic leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.replace(/\n/g, '<br />')) }} />
            </div>

            {authorBio && (
              <div className="border-t pt-8">
                <h3 className="text-xl font-bold mb-4">
                  {isArabic ? 'عن الكاتب' : 'About the Author'}
                </h3>
                <div className="flex gap-4">
                  {publication.author.image_url && (
                    <img
                      src={publication.author.image_url}
                      alt={authorName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-bold text-lg mb-2">{authorName}</h4>
                    <p className="text-muted-foreground">{authorBio}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
