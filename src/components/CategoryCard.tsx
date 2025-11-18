import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar?: string;
  description_en?: string;
  count?: number;
}

export function CategoryCard({
  name_ar,
  name_en,
  slug,
  description_ar,
  description_en,
  count = 0,
}: CategoryCardProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const name = isArabic ? name_ar : name_en;
  const description = isArabic ? description_ar : description_en;

  return (
    <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300 bg-gradient-card border-2 hover:border-transparent hover:bg-gradient-to-r hover:from-orange-500/10 hover:via-pink-500/10 hover:to-purple-600/10">
      <Link to={`/category/${slug}`} className="block p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-arabic text-2xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
            {name}
          </h3>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="text-xs text-muted-foreground">
          {count} {isArabic ? 'مقالة' : 'articles'}
        </div>
      </Link>
    </Card>
  );
}
