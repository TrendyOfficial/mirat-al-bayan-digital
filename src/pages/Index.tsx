import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PublicationCard } from "@/components/PublicationCard";
import { CategoryCard } from "@/components/CategoryCard";
import { Lightbar } from "@/components/Lightbar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [featuredPublication, setFeaturedPublication] = useState<any>(null);
  const [recentPublications, setRecentPublications] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [heroImage, setHeroImage] = useState("");
  const [heroImageLeft, setHeroImageLeft] = useState("");
  const [heroImageRight, setHeroImageRight] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchHeroImage();
  }, []);

  const fetchHeroImage = async () => {
    const { data: middle } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "hero_image")
      .single();

    const { data: left } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "hero_image_left")
      .single();

    const { data: right } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "hero_image_right")
      .single();

    if (middle?.value) {
      setHeroImage((middle.value as any).url || "");
    }
    if (left?.value) {
      setHeroImageLeft((left.value as any).url || "");
    }
    if (right?.value) {
      setHeroImageRight((right.value as any).url || "");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch featured publication
      const { data: featured } = await supabase
        .from('publications')
        .select(`
          *,
          author:authors(name_ar, name_en),
          category:categories(name_ar, name_en, slug)
        `)
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

      if (featured) {
        setFeaturedPublication(featured);
      }

      // Fetch recent publications
      const { data: recent } = await supabase
        .from('publications')
        .select(`
          *,
          author:authors(name_ar, name_en),
          category:categories(name_ar, name_en, slug)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(6);

      if (recent) {
        setRecentPublications(recent);
      }

      // Fetch categories with article counts
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name_ar');

      if (cats) {
        // Get publication counts for each category
        const categoriesWithCounts = await Promise.all(
          cats.map(async (cat) => {
            const { count } = await supabase
              .from('publications')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', cat.id)
              .eq('status', 'published');
            
            return { ...cat, count: count || 0 };
          })
        );
        setCategories(categoriesWithCounts);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col page-enter">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section with animated gradient and lightbar */}
        <section className="relative bg-gradient-lovable text-white py-32 overflow-hidden">
          <div className="absolute inset-0 hero-gradient-animated"></div>
          
          {/* Lightbar with floating particles */}
          <Lightbar />
          
          <div className="container relative z-10 mt-24">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-arabic text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                {isArabic ? 'مرحباً بكم في مرآة البيان' : 'Welcome to Miratl Bayan'}
              </h1>
              <p className="text-lg md:text-xl mb-8 text-white/90 animate-slide-up">
                {isArabic
                  ? 'مجلة أدبية عربية حديثة تحتفي بالشعر والدراسات النقدية والقصص'
                  : 'A modern Arabic literature magazine celebrating poetry, critical studies, and stories'}
              </p>
              <Button size="lg" className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-90 text-white border-0 glow-primary" asChild>
                <Link to="/search">
                  {isArabic ? 'استكشف المقالات' : 'Explore Articles'}
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Hero Images Section - 3 images with dividers */}
        {(heroImage || heroImageLeft || heroImageRight) && (
          <section className="py-16 bg-background">
            <div className="container">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* Left Image */}
                {heroImageLeft && (
                  <>
                    <div className="flex justify-center">
                      <img
                        src={heroImageLeft}
                        alt="Magazine Cover Left"
                        className="w-full max-w-[300px] h-auto max-h-[400px] object-contain rounded-lg shadow-lg"
                      />
                    </div>
                    <div className="hidden md:block w-px bg-border mx-auto h-full min-h-[400px]"></div>
                  </>
                )}
                
                {/* Middle Image - Larger */}
                {heroImage && (
                  <div className="flex justify-center md:col-span-1">
                    <img
                      src={heroImage}
                      alt="Hero Magazine Cover"
                      className="w-full max-w-[500px] h-auto max-h-[600px] object-contain rounded-lg shadow-elegant"
                    />
                  </div>
                )}
                
                {/* Right Image */}
                {heroImageRight && (
                  <>
                    <div className="hidden md:block w-px bg-border mx-auto h-full min-h-[400px]"></div>
                    <div className="flex justify-center">
                      <img
                        src={heroImageRight}
                        alt="Magazine Cover Right"
                        className="w-full max-w-[300px] h-auto max-h-[400px] object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Featured Publication */}
        {featuredPublication && (
          <section className="py-16 bg-muted/30">
            <div className="container">
              <h2 className="font-arabic text-3xl font-bold mb-8 text-center">
                {isArabic ? 'مقالة مميزة' : 'Featured Article'}
              </h2>
              <div className="max-w-4xl mx-auto">
                <PublicationCard
                  id={featuredPublication.id}
                  title_ar={featuredPublication.title_ar}
                  title_en={featuredPublication.title_en}
                  excerpt_ar={featuredPublication.excerpt_ar}
                  excerpt_en={featuredPublication.excerpt_en}
                  featured_image_url={featuredPublication.featured_image_url}
                  slug={featuredPublication.slug}
                  category_name_ar={featuredPublication.category?.name_ar}
                  category_name_en={featuredPublication.category?.name_en}
                  category_slug={featuredPublication.category?.slug}
                  author_name_ar={featuredPublication.author?.name_ar}
                  author_name_en={featuredPublication.author?.name_en}
                  published_at={featuredPublication.published_at}
                />
              </div>
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="py-16 bg-background">
          <div className="container">
            <h2 className="font-arabic text-3xl font-bold mb-8 text-center">
              {isArabic ? 'الفئات' : 'Categories'}
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    name_ar={category.name_ar}
                    name_en={category.name_en}
                    slug={category.slug}
                    description_ar={category.description_ar}
                    description_en={category.description_en}
                    count={category.count}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Publications */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <h2 className="font-arabic text-3xl font-bold mb-8 text-center">
              {isArabic ? 'أحدث المقالات' : 'Recent Articles'}
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-80 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentPublications.map((pub) => (
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
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
