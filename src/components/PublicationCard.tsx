import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

interface PublicationCardProps {
  id: string;
  title_ar: string;
  title_en?: string;
  excerpt_ar?: string;
  excerpt_en?: string;
  featured_image_url?: string;
  slug: string;
  category_name_ar: string;
  category_name_en: string;
  category_slug: string;
  author_name_ar: string;
  author_name_en: string;
  published_at: string;
  views?: number;
}

export function PublicationCard({
  title_ar,
  title_en,
  excerpt_ar,
  excerpt_en,
  featured_image_url,
  slug,
  category_name_ar,
  category_name_en,
  category_slug,
  author_name_ar,
  author_name_en,
  published_at,
  views = 0,
}: PublicationCardProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const title = isArabic ? title_ar : (title_en || title_ar);
  const excerpt = isArabic ? excerpt_ar : (excerpt_en || excerpt_ar);
  const categoryName = isArabic ? category_name_ar : category_name_en;
  const authorName = isArabic ? author_name_ar : author_name_en;

  return (
    <Card className="group overflow-hidden hover:shadow-card transition-all duration-300 animate-fade-in">
      <Link to={`/publication/${slug}`}>
        {featured_image_url && (
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={featured_image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link to={`/category/${category_slug}`}>
              <Badge variant="secondary">{categoryName}</Badge>
            </Link>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              {views}
            </span>
          </div>
          
          <h3 className="font-arabic text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          
          {excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {excerpt}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{authorName}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(published_at), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
