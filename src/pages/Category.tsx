import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PublicationCard } from "@/components/PublicationCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Category() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [category, setCategory] = useState<any>(null);
  const [publications, setPublications] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchData();
  }, [slug, sortBy]);

  const fetchData = async () => {
    // Fetch category
    const { data: cat } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (cat) {
      setCategory(cat);

      // Fetch publications
      let query = supabase
        .from('publications')
        .select(`
          *,
          author:authors(name_ar, name_en),
          category:categories(name_ar, name_en, slug)
        `)
        .eq('status', 'published')
        .eq('category_id', cat.id);

      if (sortBy === "newest") {
        query = query.order('published_at', { ascending: false });
      } else if (sortBy === "oldest") {
        query = query.order('published_at', { ascending: true });
      }

      const { data: pubs } = await query;
      if (pubs) {
        setPublications(pubs);
      }
    }
  };

  if (!category) {
    return <div>Loading...</div>;
  }

  const categoryName = isArabic ? category.name_ar : category.name_en;
  const categoryDescription = isArabic ? category.description_ar : category.description_en;

  return (
    <div className="flex min-h-screen flex-col page-enter">
      <Header />
      
      <main className="flex-1">
        <section className="bg-gradient-hero text-white py-16 animate-slide-in-top">
          <div className="container">
            <h1 className="font-arabic text-4xl md:text-5xl font-bold mb-4 animate-slide-up">
              {categoryName}
            </h1>
            {categoryDescription && (
              <p className="text-lg text-white/90 max-w-2xl animate-fade-in">
                {categoryDescription}
              </p>
            )}
          </div>
        </section>

        <section className="py-12">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                {publications.length} {isArabic ? 'مقالة' : 'articles'}
              </h2>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    {isArabic ? 'الأحدث' : 'Newest'}
                  </SelectItem>
                  <SelectItem value="oldest">
                    {isArabic ? 'الأقدم' : 'Oldest'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publications.map((pub) => (
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
        </section>
      </main>

      <Footer />
    </div>
  );
}
