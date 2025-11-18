import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FolderPlus, Trash2, Edit, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Categories() {
  const { language } = useLanguage();
  const { user, isOwner, hasRole } = useAuth();
  const isArabic = language === "ar";
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (isOwner()) {
        setCanAccess(true);
        return;
      }
      const isAdmin = await hasRole('admin');
      const isEditor = await hasRole('editor');
      setCanAccess(isAdmin || isEditor);
    };
    checkAccess();
  }, [user]);

  if (canAccess === null) {
    return <div className="p-6 text-center">{isArabic ? "جاري التحميل..." : "Loading..."}</div>;
  }

  if (!canAccess) {
    return (
      <div className="p-6 text-center text-red-500 font-bold">
        {isArabic
          ? "ليس لديك إذن للوصول إلى هذه الصفحة"
          : "You do not have permission to access this page"}
      </div>
    );
  }

  const [categories, setCategories] = useState<any[]>([]);
  const [deletionReviews, setDeletionReviews] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    slug: "",
  });

  useEffect(() => {
    fetchCategories();
    fetchDeletionReviews();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCategories(data);
  };

  const fetchDeletionReviews = async () => {
    const { data } = await supabase
      .from("deletion_reviews")
      .select("*")
      .eq("item_type", "category")
      .eq("status", "pending")
      .order("requested_at", { ascending: false });

    if (data) setDeletionReviews(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && currentCategory) {
      const { error } = await supabase
        .from("categories")
        .update(formData)
        .eq("id", currentCategory.id);

      if (error) {
        toast.error(isArabic ? "فشل التحديث" : "Update failed");
      } else {
        toast.success(isArabic ? "تم التحديث بنجاح" : "Updated successfully");
        if (user?.id) {
          await supabase.rpc("log_activity", {
            p_user_id: user.id,
            p_action: "Category updated",
            p_details: { category_id: currentCategory.id, ...formData },
          });
        }
      }
    } else {
      const { error } = await supabase.from("categories").insert([formData]);

      if (error) {
        toast.error(isArabic ? "فشل الإضافة" : "Failed to add");
      } else {
        toast.success(isArabic ? "تمت الإضافة بنجاح" : "Added successfully");
        if (user?.id) {
          await supabase.rpc("log_activity", {
            p_user_id: user.id,
            p_action: "Category created",
            p_details: formData,
          });
        }
      }
    }

    setIsDialogOpen(false);
    resetForm();
    fetchCategories();
  };

  const handleRequestDelete = async (category: any) => {
    const ownerCheck = isOwner();

    if (ownerCheck) {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (error) {
        toast.error(isArabic ? "فشل الحذف" : "Delete failed");
      } else {
        toast.success(isArabic ? "تم الحذف بنجاح" : "Deleted successfully");
        if (user?.id) {
          await supabase.rpc("log_activity", {
            p_user_id: user.id,
            p_action: "Category deleted instantly by owner",
            p_details: {
              category_id: category.id,
              category_name_ar: category.name_ar,
              category_name_en: category.name_en,
            },
          });
        }
        fetchCategories();
      }
    } else {
      const { error } = await supabase.from("deletion_reviews").insert([
        {
          item_type: "category",
          item_id: category.id,
          item_data: category,
          requested_by: user?.id,
          requested_by_email: user?.email,
        },
      ]);

      if (error) {
        toast.error(isArabic ? "فشل الطلب" : "Request failed");
      } else {
        toast.success(
          isArabic
            ? "تم إرسال الطلب للمراجعة للمالك"
            : "Deletion request sent to owner for review"
        );
        if (user?.id) {
          await supabase.rpc("log_activity", {
            p_user_id: user.id,
            p_action: "Category deletion requested (pending owner approval)",
            p_details: {
              category_id: category.id,
              category_name_ar: category.name_ar,
              category_name_en: category.name_en,
            },
          });
        }
        fetchDeletionReviews();
      }
    }
  };

  const handleEdit = (category: any) => {
    setCurrentCategory(category);
    setFormData(category);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name_ar: "",
      name_en: "",
      description_ar: "",
      description_en: "",
      slug: "",
    });
    setCurrentCategory(null);
    setIsEditMode(false);
  };

  const handleApproveDelete = async (reviewId: string, categoryId: string) => {
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (!deleteError) {
      await supabase
        .from("deletion_reviews")
        .update({ status: "approved" })
        .eq("id", reviewId);

      toast.success(
        isArabic ? "تمت الموافقة على الحذف" : "Deletion approved by owner"
      );
      if (user?.id) {
        await supabase.rpc("log_activity", {
          p_user_id: user.id,
          p_action: "Category deletion approved by owner",
          p_details: { category_id: categoryId, review_id: reviewId },
        });
      }
      fetchCategories();
      fetchDeletionReviews();
    } else {
      toast.error(isArabic ? "فشل الحذف" : "Deletion failed");
    }
  };

  const handleRejectDelete = async (reviewId: string) => {
    await supabase
      .from("deletion_reviews")
      .update({ status: "rejected" })
      .eq("id", reviewId);

    toast.success(isArabic ? "تم رفض الحذف" : "Deletion rejected by owner");
    if (user?.id) {
      await supabase.rpc("log_activity", {
        p_user_id: user.id,
        p_action: "Category deletion rejected by owner",
        p_details: { review_id: reviewId },
      });
    }
    fetchDeletionReviews();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-arabic text-3xl font-bold">
          {isArabic ? "إدارة الفئات" : "Categories Management"}
        </h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <FolderPlus className="h-4 w-4 mr-2" />
              {isArabic ? "إضافة فئة" : "Add Category"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode
                  ? isArabic
                    ? "تعديل الفئة"
                    : "Edit Category"
                  : isArabic
                  ? "إضافة فئة جديدة"
                  : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_ar">
                    {isArabic ? "الاسم بالعربية" : "Arabic Name"}
                  </Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) =>
                      setFormData({ ...formData, name_ar: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">
                    {isArabic ? "الاسم بالإنجليزية" : "English Name"}
                  </Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) =>
                      setFormData({ ...formData, name_en: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">{isArabic ? "الرابط" : "Slug"}</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_ar">
                  {isArabic ? "الوصف بالعربية" : "Arabic Description"}
                </Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, description_ar: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_en">
                  {isArabic ? "الوصف بالإنجليزية" : "English Description"}
                </Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) =>
                    setFormData({ ...formData, description_en: e.target.value })
                  }
                />
              </div>

              <Button type="submit" className="w-full">
                {isEditMode
                  ? isArabic
                    ? "تحديث"
                    : "Update"
                  : isArabic
                  ? "إضافة"
                  : "Add"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isOwner() && deletionReviews.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              {isArabic
                ? "طلبات الحذف قيد المراجعة"
                : "Pending Deletion Requests"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deletionReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{review.item_data.name_ar}</p>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "طلب من" : "Requested by"}:{" "}
                      {review.requested_by_email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleApproveDelete(review.id, review.item_id)
                      }
                    >
                      {isArabic ? "موافقة" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectDelete(review.id)}
                    >
                      {isArabic ? "رفض" : "Reject"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isArabic ? "الاسم بالعربية" : "Arabic Name"}</TableHead>
              <TableHead>{isArabic ? "الاسم بالإنجليزية" : "English Name"}</TableHead>
              <TableHead>{isArabic ? "الرابط" : "Slug"}</TableHead>
              <TableHead>{isArabic ? "الإجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name_ar}</TableCell>
                <TableCell>{category.name_en}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{category.slug}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRequestDelete(category)}
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
