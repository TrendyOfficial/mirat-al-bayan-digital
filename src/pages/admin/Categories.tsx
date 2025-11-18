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

  const [categories, setCategories] = useState<any[]>([]);
  const [deletionReviews, setDeletionReviews] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<any>(null);
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    slug: "",
  });

  useEffect(() => {
    const checkAccess = async () => {
      if (isOwner()) {
        setCanAccess(true);
        return;
      }
      const isAdmin = await hasRole("admin");
      const isEditor = await hasRole("editor");
      setCanAccess(isAdmin || isEditor);
    };
    checkAccess();
  }, [user]);

  useEffect(() => {
    if (canAccess) {
      fetchCategories();
      fetchDeletionReviews();
    }
  }, [canAccess]);

  if (canAccess === null) {
    return (
      <div className="p-6 text-center">
        {isArabic ? "جاري التحميل..." : "Loading..."}
      </div>
    );
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

  const handleSubmit = async (e: any) => {
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

        await supabase.rpc("log_activity", {
          p_user_id: user?.id,
          p_action: "Category updated",
          p_details: { category_id: currentCategory.id, ...formData },
        });
      }
    } else {
      const { error } = await supabase.from("categories").insert([formData]);

      if (error) {
        toast.error(isArabic ? "فشل الإضافة" : "Add failed");
      } else {
        toast.success(isArabic ? "تمت الإضافة" : "Added successfully");

        await supabase.rpc("log_activity", {
          p_user_id: user?.id,
          p_action: "Category created",
          p_details: formData,
        });
      }
    }

    setIsDialogOpen(false);
    resetForm();
    fetchCategories();
  };

  const handleRequestDelete = async (category: any) => {
    if (isOwner()) {
      // OWNER CAN DELETE INSTANT
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (!error) {
        // Also delete any pending deletion reviews
        await supabase
          .from('deletion_reviews')
          .delete()
          .match({ item_type: 'category', item_id: category.id });

        toast.success(isArabic ? "تم الحذف فوراً" : "Deleted instantly");

        await supabase.rpc("log_activity", {
          p_user_id: user?.id,
          p_action: "Owner deleted category instantly",
          p_details: { category_id: category.id, category },
        });

        fetchCategories();
      }
      return;
    }

    // EDITORS & ADMINS → SUBMIT REVIEW
    const { error } = await supabase.from("deletion_reviews").insert([
      {
        item_type: "category",
        item_id: category.id,
        item_data: category,
        requested_by: user?.id,
        requested_by_email: user?.email,
        status: "pending",
      },
    ]);

    if (error) {
      toast.error(isArabic ? "فشل الطلب" : "Request failed");
    } else {
      toast.success(
        isArabic
          ? "تم إرسال الطلب للمالك"
          : "Deletion request sent to owner"
      );

      await supabase.rpc("log_activity", {
        p_user_id: user?.id,
        p_action: "Deletion review created",
        p_details: { category_id: category.id },
      });

      fetchDeletionReviews();
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
    await supabase.from("categories").delete().eq("id", categoryId);

    await supabase
      .from("deletion_reviews")
      .update({ status: "approved" })
      .eq("id", reviewId);

    toast.success(isArabic ? "تمت الموافقة" : "Approved");

    await supabase.rpc("log_activity", {
      p_user_id: user?.id,
      p_action: "Owner approved category deletion",
      p_details: { categoryId, reviewId },
    });

    fetchCategories();
    fetchDeletionReviews();
  };

  const handleRejectDelete = async (reviewId: string) => {
    await supabase
      .from("deletion_reviews")
      .update({ status: "rejected" })
      .eq("id", reviewId);

    toast.success(isArabic ? "تم الرفض" : "Rejected");

    await supabase.rpc("log_activity", {
      p_user_id: user?.id,
      p_action: "Owner rejected category deletion",
      p_details: { reviewId },
    });

    fetchDeletionReviews();
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
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
                  <Label>{isArabic ? "الاسم بالعربية" : "Arabic Name"}</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) =>
                      setFormData({ ...formData, name_ar: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{isArabic ? "الاسم بالإنجليزية" : "English Name"}</Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) =>
                      setFormData({ ...formData, name_en: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isArabic ? "الرابط" : "Slug"}</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {isArabic ? "الوصف بالعربية" : "Arabic Description"}
                </Label>
                <Textarea
                  value={formData.description_ar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description_ar: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {isArabic ? "الوصف بالإنجليزية" : "English Description"}
                </Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description_en: e.target.value,
                    })
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

      {/* OWNER ONLY — PENDING DELETION REQUESTS */}
      {isOwner() && deletionReviews.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              {isArabic ? "طلبات الحذف" : "Pending Deletion Requests"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deletionReviews.map((review) => (
              <div
                key={review.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{review.item_data.name_ar}</p>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? "طلب من" : "Requested by"}{" "}
                    {review.requested_by_email}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      handleApproveDelete(review.id, review.item_id)
                    }
                  >
                    {isArabic ? "موافقة" : "Approve"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectDelete(review.id)}
                  >
                    {isArabic ? "رفض" : "Reject"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* CATEGORY TABLE */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isArabic ? "الاسم بالعربية" : "Arabic"}</TableHead>
              <TableHead>{isArabic ? "الاسم بالإنجليزية" : "English"}</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>{isArabic ? "حالة" : "Status"}</TableHead>
              <TableHead>{isArabic ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {categories.map((category) => {
              const reviewPending = deletionReviews.some(
                (r) => r.item_id === category.id
              );

              return (
                <TableRow key={category.id}>
                  <TableCell>{category.name_ar}</TableCell>
                  <TableCell>{category.name_en}</TableCell>
                  <TableCell>
                    <Badge>{category.slug}</Badge>
                  </TableCell>

                  {/* Status Column */}
                  <TableCell>
                    {reviewPending ? (
                      <Badge variant="destructive">
                        {isArabic
                          ? "قيد المراجعة لدى المالك"
                          : "Pending owner review"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {isArabic ? "نشط" : "Active"}
                      </Badge>
                    )}
                  </TableCell>

                  {/* ACTIONS */}
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
                        disabled={reviewPending}
                        onClick={() => handleRequestDelete(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
