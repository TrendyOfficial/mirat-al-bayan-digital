import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Authors() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [authors, setAuthors] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    bio_en: "",
    bio_ar: "",
    image_url: "",
  });

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    const { data } = await supabase
      .from('authors')
      .select('*')
      .order('name_ar');

    if (data) {
      setAuthors(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('authors')
      .insert([formData]);

    if (error) {
      toast.error(isArabic ? 'خطأ في الإضافة' : 'Failed to add', {
        description: error.message,
      });
    } else {
      toast.success(isArabic ? 'تمت الإضافة بنجاح' : 'Added successfully');
      setIsDialogOpen(false);
      setFormData({ name_en: "", name_ar: "", bio_en: "", bio_ar: "", image_url: "" });
      fetchAuthors();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isArabic ? 'هل تريد حذف هذا الكاتب?' : 'Delete this author?')) {
      return;
    }

    const { error } = await supabase
      .from('authors')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(isArabic ? 'خطأ في الحذف' : 'Delete failed', {
        description: error.message,
      });
    } else {
      toast.success(isArabic ? 'تم الحذف بنجاح' : 'Deleted successfully');
      fetchAuthors();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-arabic text-3xl font-bold">
          {isArabic ? 'إدارة الكتّاب' : 'Manage Authors'}
        </h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? 'كاتب جديد' : 'New Author'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isArabic ? 'إضافة كاتب جديد' : 'Add New Author'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_ar">{isArabic ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">{isArabic ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio_ar">{isArabic ? 'السيرة الذاتية (عربي)' : 'Bio (Arabic)'}</Label>
                <Textarea
                  id="bio_ar"
                  value={formData.bio_ar}
                  onChange={(e) => setFormData({ ...formData, bio_ar: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio_en">{isArabic ? 'السيرة الذاتية (إنجليزي)' : 'Bio (English)'}</Label>
                <Textarea
                  id="bio_en"
                  value={formData.bio_en}
                  onChange={(e) => setFormData({ ...formData, bio_en: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image_url">{isArabic ? 'صورة الكاتب (رابط)' : 'Author Image (URL)'}</Label>
                <Input
                  id="image_url"
                  type="url"
                  placeholder={isArabic ? 'https://example.com/author.jpg' : 'https://example.com/author.jpg'}
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {isArabic ? 'أدخل رابط صورة الكاتب (JPG, PNG) - اختياري' : 'Enter author image URL (JPG, PNG) - optional'}
                </p>
              </div>

              <Button type="submit" className="w-full">
                {isArabic ? 'إضافة' : 'Add'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isArabic ? 'الاسم' : 'Name'}</TableHead>
              <TableHead>{isArabic ? 'السيرة' : 'Bio'}</TableHead>
              <TableHead className="text-right">{isArabic ? 'الإجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authors.map((author) => (
              <TableRow key={author.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {author.image_url && (
                      <img
                        src={author.image_url}
                        alt={author.name_ar}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div>{isArabic ? author.name_ar : author.name_en}</div>
                      <div className="text-sm text-muted-foreground">
                        {isArabic ? author.name_en : author.name_ar}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {isArabic ? author.bio_ar : author.bio_en}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(author.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
