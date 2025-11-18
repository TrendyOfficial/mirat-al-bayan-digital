import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Publications() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [publications, setPublications] = useState<any[]>([]);

  useEffect(() => {
    fetchPublications();

    // Real-time subscription for deletion reviews
    const channel = supabase
      .channel("deletion_reviews_publications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deletion_reviews",
          filter: "item_type=eq.publication",
        },
        () => {
          fetchPublications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPublications = async () => {
    const { data } = await supabase
      .from('publications')
      .select(`
        *,
        author:authors(name_ar, name_en),
        category:categories(name_ar, name_en)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setPublications(data);
    }
  };

  const handleDelete = async (id: string, publication: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user is owner
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const isOwner = authUser?.email === 'alaa2001218@gmail.com';

    if (isOwner) {
      // Owner can delete instantly
      if (!confirm(isArabic ? 'هل تريد حذف هذا المقال?' : 'Delete this publication?')) {
        return;
      }

      const { error } = await supabase
        .from('publications')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error(isArabic ? 'خطأ في الحذف' : 'Delete failed');
      } else {
        // Also delete any pending deletion reviews
        await supabase
          .from('deletion_reviews')
          .delete()
          .match({ item_type: 'publication', item_id: id });

        toast.success(isArabic ? 'تم الحذف بنجاح' : 'Deleted successfully');
        await supabase.rpc('log_activity', {
          p_user_id: user.id,
          p_action: 'Publication deleted instantly by owner',
          p_details: { publication_id: id, title: publication.title_ar }
        });
        fetchPublications();
      }
    } else {
      // Admin/Editor must request deletion
      const { error } = await supabase
        .from('deletion_reviews')
        .insert([{
          item_type: 'publication',
          item_id: id,
          item_data: publication,
          requested_by: user.id,
          requested_by_email: user.email
        }]);

      if (error) {
        toast.error(isArabic ? 'فشل الطلب' : 'Request failed');
      } else {
        toast.success(isArabic ? 'تم إرسال طلب الحذف للمالك' : 'Deletion request sent to owner');
        await supabase.rpc('log_activity', {
          p_user_id: user.id,
          p_action: 'Publication deletion requested',
          p_details: { publication_id: id, title: publication.title_ar }
        });
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-arabic text-3xl font-bold">
          {isArabic ? 'إدارة المقالات' : 'Manage Publications'}
        </h1>
        <Button asChild>
          <Link to="/admin/publications/new">
            <Plus className="h-4 w-4 mr-2" />
            {isArabic ? 'مقال جديد' : 'New Publication'}
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isArabic ? 'العنوان' : 'Title'}</TableHead>
              <TableHead>{isArabic ? 'الكاتب' : 'Author'}</TableHead>
              <TableHead>{isArabic ? 'الفئة' : 'Category'}</TableHead>
              <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
              <TableHead className="text-right">{isArabic ? 'الإجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publications.map((pub) => (
              <TableRow key={pub.id}>
                <TableCell className="font-medium">
                  {isArabic ? pub.title_ar : (pub.title_en || pub.title_ar)}
                </TableCell>
                <TableCell>
                  {isArabic ? pub.author?.name_ar : pub.author?.name_en}
                </TableCell>
                <TableCell>
                  {isArabic ? pub.category?.name_ar : pub.category?.name_en}
                </TableCell>
                <TableCell>
                  <Badge variant={pub.status === 'published' ? 'default' : 'secondary'}>
                    {pub.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {pub.published_at ? format(new Date(pub.published_at), 'MMM dd, yyyy') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {pub.status === 'published' && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/publication/${pub.slug}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/admin/publications/edit/${pub.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(pub.id, pub)}
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

      {publications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {isArabic ? 'لا توجد مقالات بعد' : 'No publications yet'}
        </div>
      )}
    </div>
  );
}
