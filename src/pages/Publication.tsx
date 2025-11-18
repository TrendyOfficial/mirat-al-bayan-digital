import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Calendar, Share2, Facebook, Twitter, Mail, Home, ChevronRight, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { PublicationCard } from "@/components/PublicationCard";
import { Comments } from "@/components/Comments";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

export default function Publication() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [publication, setPublication] = useState<any>(null);
  const [views, setViews] = useState(0);
  const [relatedPublications, setRelatedPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchPublication();
    trackView();
  }, [slug]);

  const fetchPublication = async () => {
    setLoading(true);
    try {
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

        // Fetch related publications from same category
        const { data: related } = await supabase
          .from('publications')
          .select(`
            *,
            author:authors(name_ar, name_en),
            category:categories(name_ar, name_en, slug)
          `)
          .eq('status', 'published')
          .eq('category_id', data.category_id)
          .neq('id', data.id)
          .order('published_at', { ascending: false })
          .limit(3);

        if (related) {
          setRelatedPublications(related);
        }
      }
    } finally {
      setLoading(false);
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

  const handleDownloadPdf = async () => {
    if (!publication) return;

    setDownloadingPdf(true);
    try {
      const title = isArabic ? publication.title_ar : publication.title_en || publication.title_ar;
      const content = isArabic ? publication.content_ar : publication.content_en || publication.content_ar;

      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: {
          title,
          content,
          language: isArabic ? 'ar' : 'en'
        }
      });

      if (error) {
        console.error('PDF generation error:', error);
        toast.error(isArabic ? 'فشل في إنشاء PDF' : 'Failed to generate PDF');
        return;
      }

      // Create a blob from the HTML and trigger download
      const htmlContent = data.html;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(isArabic ? 'تم تنزيل الملف' : 'File downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(isArabic ? 'فشل في تنزيل الملف' : 'Failed to download file');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container">
            <Skeleton className="h-8 w-64 mb-6" />
            <Skeleton className="h-96 w-full mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!publication) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container text-center">
            <h1 className="text-2xl font-bold mb-4">{isArabic ? 'المقالة غير موجودة' : 'Publication not found'}</h1>
            <Button asChild>
              <Link to="/">{isArabic ? 'العودة للرئيسية' : 'Go to Home'}</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const title = isArabic ? publication.title_ar : (publication.title_en || publication.title_ar);
  const content = isArabic ? publication.content_ar : (publication.content_en || publication.content_ar);
  const categoryName = isArabic ? publication.category.name_ar : publication.category.name_en;
  const authorName = isArabic ? publication.author.name_ar : publication.author.name_en;
  const authorBio = isArabic ? publication.author.bio_ar : (publication.author.bio_en || publication.author.bio_ar);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        {/* Breadcrumb Navigation */}
        <div className="container max-w-4xl mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">
                    <Home className="h-4 w-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/category/${publication.category.slug}`}>
                    {categoryName}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <article className="container max-w-4xl">
          {publication.featured_image_url && (
            <div className="aspect-[21/9] overflow-hidden rounded-lg mb-8">
              <img
                src={publication.featured_image_url}
                alt={title}
                className="w-full h-full object-contain bg-muted"
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingPdf 
                    ? (isArabic ? 'جاري التحميل...' : 'Downloading...') 
                    : (isArabic ? 'تحميل PDF' : 'Download PDF')
                  }
                </Button>
              </div>
            </div>

          <div className="prose prose-lg max-w-none dark:prose-invert mb-12 font-arabic leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.replace(/\n/g, '<br />')) }} />
          </div>

          {/* Author Bio */}
          <div className="border-t pt-8 mt-8">
            <h3 className="font-arabic text-xl font-bold mb-4">
              {isArabic ? 'عن الكاتب' : 'About the Author'}
            </h3>
            <div className="flex items-start gap-4">
              {publication.author.image_url && (
                <img
                  src={publication.author.image_url}
                  alt={authorName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold mb-2">{authorName}</p>
                {authorBio && <p className="text-sm text-muted-foreground">{authorBio}</p>}
              </div>
            </div>
          </div>

          {/* Author Face Image & Related Publications */}
          <div className="grid md:grid-cols-3 gap-8 border-t pt-8 mt-8">
            <div className="md:col-span-2">
              {publication.author_face_image_url && (
                <div className="mb-8">
                  <h3 className="font-arabic text-xl font-bold mb-4">
                    {isArabic ? 'صورة الشخصية' : 'Featured Person'}
                  </h3>
                  <img
                    src={publication.author_face_image_url}
                    alt={isArabic ? 'صورة الشخصية' : 'Featured Person'}
                    className="w-48 h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Related Publications */}
            {relatedPublications.length > 0 && (
              <div className="md:col-span-1">
                <h3 className="font-arabic text-xl font-bold mb-4">
                  {isArabic ? 'مقالات ذات صلة' : 'Related Articles'}
                </h3>
                <div className="space-y-4">
                  {relatedPublications.map((pub) => (
                    <PublicationCard
                      key={pub.id}
                      id={pub.id}
                      title_ar={pub.title_ar}
                      title_en={pub.title_en}
                      excerpt_ar={pub.excerpt_ar}
                      excerpt_en={pub.excerpt_en}
                      featured_image_url={pub.featured_image_url}
                      slug={pub.slug}
                      category_name_ar={pub.category?.name_ar}
                      category_name_en={pub.category?.name_en}
                      category_slug={pub.category?.slug}
                      author_name_ar={pub.author?.name_ar}
                      author_name_en={pub.author?.name_en}
                      published_at={pub.published_at}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <Comments publicationId={publication.id} />
        </article>
      </main>

      <Footer />
    </div>
  );
}
