import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Facebook, Twitter, Instagram } from "lucide-react";

export function Footer() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-arabic text-xl font-bold text-primary mb-4">
              {isArabic ? 'مرآة البيان' : 'Miratl Bayan'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? 'مجلة أدبية عربية حديثة تحتفي بالشعر والدراسات النقدية والقصص'
                : 'A modern Arabic literature magazine celebrating poetry, studies, and stories'}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{isArabic ? 'روابط سريعة' : 'Quick Links'}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">{isArabic ? 'الرئيسية' : 'Home'}</Link></li>
              <li><Link to="/search" className="hover:text-primary transition-colors">{isArabic ? 'بحث' : 'Search'}</Link></li>
              <li><Link to="/category/poetry" className="hover:text-primary transition-colors">{isArabic ? 'قصائد' : 'Poetry'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{isArabic ? 'الفئات' : 'Categories'}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/category/critical-studies" className="hover:text-primary transition-colors">{isArabic ? 'دراسات نقدية' : 'Critical Studies'}</Link></li>
              <li><Link to="/category/stories-novels" className="hover:text-primary transition-colors">{isArabic ? 'قصص وروايات' : 'Stories & Novels'}</Link></li>
              <li><Link to="/category/cultural-news" className="hover:text-primary transition-colors">{isArabic ? 'أخبار ثقافية' : 'Cultural News'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{isArabic ? 'تابعنا' : 'Follow Us'}</h4>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/share/1BZv4RgGkw/" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/sultansoftheword?igsh=OTV6NDl3d29sYmRw" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 {isArabic ? 'مرآة البيان. جميع الحقوق محفوظة.' : 'Miratl Bayan. All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );
}
