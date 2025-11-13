import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function PublicationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isArabic = language === 'ar';
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [authors, setAuthors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title_ar: "",
    title_en: "",
    slug: "",
    excerpt_ar: "",
    excerpt_en: "",
    content_ar: "",
    content_en: "",
    featured_image_url: "",
    author_id: "",
    category_id: "",
    status: "draft",
    is_featured: false,
  });

  useEffect(() => {
    fetchAuthorsAndCategories();
    if (isEditing) {
      fetchPublication();
    }
  }, [id]);

  const fetchAuthorsAndCategories = async () => {
    const [authorsData, categoriesData] = await Promise.all([
      supabase.from('authors').select('*').order('name_ar'),
      supabase.from('categories').select('*').order('name_ar'),
    ]);

    if (authorsData.data) setAuthors(authorsData.data);
    if (categoriesData.data) setCategories(categoriesData.data);
  };

  const fetchPublication = async () => {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setFormData(data);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string, field: 'title_ar' | 'title_en') => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const publicationData = {
        ...formData,
        created_by: user?.id,
        published_at: formData.status === 'published' ? new Date().toISOString() : null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('publications')
          .update(publicationData)
          .eq('id', id);

        if (error) throw error;
        toast.success(isArabic ? 'تم التحديث بنجاح' : 'Updated successfully');
      } else {
        const { error } = await supabase
          .from('publications')
          .insert([publicationData]);

        if (error) throw error;
        toast.success(isArabic ? 'تمت الإضافة بنجاح' : 'Created successfully');
      }

      navigate('/admin/publications');
    } catch (error: any) {
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/publications')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-arabic text-3xl font-bold">
          {isEditing
            ? (isArabic ? 'تعديل المقال' : 'Edit Publication')
            : (isArabic ? 'مقال جديد' : 'New Publication')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title_ar">{isArabic ? 'العنوان (عربي) *' : 'Title (Arabic) *'}</Label>
            <Input
              id="title_ar"
              value={formData.title_ar}
              onChange={(e) => handleTitleChange(e.target.value, 'title_ar')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title_en">{isArabic ? 'العنوان (إنجليزي)' : 'Title (English)'}</Label>
            <Input
              id="title_en"
              value={formData.title_en || ''}
              onChange={(e) => handleTitleChange(e.target.value, 'title_en')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">{isArabic ? 'الرابط (Slug)' : 'Slug'}</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="author_id">{isArabic ? 'الكاتب *' : 'Author *'}</Label>
            <Select value={formData.author_id} onValueChange={(value) => setFormData({ ...formData, author_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder={isArabic ? 'اختر كاتب' : 'Select author'} />
              </SelectTrigger>
              <SelectContent>
                {authors.map((author) => (
                  <SelectItem key={author.id} value={author.id}>
                    {isArabic ? author.name_ar : author.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">{isArabic ? 'الفئة *' : 'Category *'}</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder={isArabic ? 'اختر فئة' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {isArabic ? category.name_ar : category.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="featured_image_url">{isArabic ? 'رابط الصورة المميزة' : 'Featured Image URL'}</Label>
          <Input
            id="featured_image_url"
            type="url"
            value={formData.featured_image_url || ''}
            onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt_ar">{isArabic ? 'المقتطف (عربي)' : 'Excerpt (Arabic)'}</Label>
          <Textarea
            id="excerpt_ar"
            value={formData.excerpt_ar || ''}
            onChange={(e) => setFormData({ ...formData, excerpt_ar: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt_en">{isArabic ? 'المقتطف (إنجليزي)' : 'Excerpt (English)'}</Label>
          <Textarea
            id="excerpt_en"
            value={formData.excerpt_en || ''}
            onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content_ar">{isArabic ? 'المحتوى (عربي) *' : 'Content (Arabic) *'}</Label>
          <Textarea
            id="content_ar"
            value={formData.content_ar}
            onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
            rows={12}
            required
            className="font-arabic"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content_en">{isArabic ? 'المحتوى (إنجليزي)' : 'Content (English)'}</Label>
          <Textarea
            id="content_en"
            value={formData.content_en || ''}
            onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
            rows={12}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">{isArabic ? 'الحالة' : 'Status'}</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{isArabic ? 'مسودة' : 'Draft'}</SelectItem>
                <SelectItem value="published">{isArabic ? 'منشور' : 'Published'}</SelectItem>
                <SelectItem value="archived">{isArabic ? 'مؤرشف' : 'Archived'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
            <Label htmlFor="is_featured">{isArabic ? 'مقال مميز' : 'Featured Publication'}</Label>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
              : (isArabic ? 'حفظ' : 'Save')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/publications')}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </form>
    </div>
  );
}
