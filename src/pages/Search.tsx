import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PublicationCard } from "@/components/PublicationCard";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Search as SearchIcon } from "lucide-react";

export default function Search() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);

    const { data } = await supabase
      .from('publications')
      .select(`
        *,
        author:authors(name_ar, name_en),
        category:categories(name_ar, name_en, slug)
      `)
      .eq('status', 'published')
      .or(`title_ar.ilike.%${searchQuery}%,title_en.ilike.%${searchQuery}%,content_ar.ilike.%${searchQuery}%,content_en.ilike.%${searchQuery}%`)
      .order('published_at', { ascending: false });

    if (data) {
      setResults(data);
    }

    setIsSearching(false);
  };

  return (
    <div className="flex min-h-screen flex-col page-enter">
      <Header />
      
      <main className="flex-1">
        <section className="py-12">
          <div className="container max-w-4xl">
            <h1 className="font-arabic text-4xl font-bold mb-8 text-center animate-slide-up">
              {isArabic ? 'بحث' : 'Search'}
            </h1>

            <div className="relative mb-12 animate-scale-in">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={isArabic ? 'ابحث عن مقالات...' : 'Search for articles...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 transition-all duration-100 hover:scale-[1.02]"
              />
            </div>

            {isSearching ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-muted-foreground">
                  {isArabic ? 'جاري البحث...' : 'Searching...'}
                </p>
              </div>
            ) : (
              <>
                {searchQuery && (
                  <p className="text-muted-foreground mb-6">
                    {results.length} {isArabic ? 'نتيجة' : 'results found'}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((pub) => (
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

                {!searchQuery && (
                  <div className="text-center py-12">
                    <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {isArabic ? 'ابدأ بكتابة للبحث' : 'Start typing to search'}
                    </p>
                  </div>
                )}

                {searchQuery && results.length === 0 && !isSearching && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {isArabic ? 'لم يتم العثور على نتائج' : 'No results found'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
