import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Navigate } from "react-router-dom";

export default function DeletionReviews() {
  const { language } = useLanguage();
  const { user, isOwner } = useAuth();
  const isArabic = language === "ar";
  const [reviews, setReviews] = useState<any[]>([]);

  // Only owner can access
  if (!isOwner()) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    fetchReviews();

    // Real-time subscription
    const channel = supabase
      .channel("deletion_reviews_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deletion_reviews",
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("deletion_reviews")
      .select("*")
      .eq("status", "pending")
      .order("requested_at", { ascending: false });

    if (data) {
      setReviews(data);
    }
  };

  const removeFromUI = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  const handleApprove = async (review: any) => {
    const { item_type, item_id, id: reviewId } = review;

    // Delete category or publication
    const { error: deleteError } = await supabase
      .from(item_type === "category" ? "categories" : "publications")
      .delete()
      .eq("id", item_id);

    if (!deleteError) {
      // Update review status
      await supabase
        .from("deletion_reviews")
        .update({ status: "approved" })
        .eq("id", reviewId);

      toast.success(isArabic ? "تمت الموافقة على الحذف" : "Deletion approved");

      // Log activity
      if (user?.id) {
        await supabase.rpc("log_activity", {
          p_user_id: user.id,
          p_action: `${item_type} deletion approved by owner`,
          p_details: { item_id, review_id: reviewId },
        });
      }

      // Instantly remove from UI
      removeFromUI(reviewId);
    } else {
      toast.error(isArabic ? "فشل الحذف" : "Deletion failed");
    }
  };

  const handleReject = async (reviewId: string, itemType: string) => {
    await supabase
      .from("deletion_reviews")
      .update({ status: "rejected" })
      .eq("id", reviewId);

    toast.success(isArabic ? "تم رفض الحذف" : "Deletion rejected");

    // Log activity
    if (user?.id) {
      await supabase.rpc("log_activity", {
        p_user_id: user.id,
        p_action: `${itemType} deletion rejected by owner`,
        p_details: { review_id: reviewId },
      });
    }

    // Instantly remove from UI
    removeFromUI(reviewId);
  };

  const categoryReviews = reviews.filter((r) => r.item_type === "category");
  const publicationReviews = reviews.filter(
    (r) => r.item_type === "publication"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-arabic text-3xl font-bold flex items-center gap-2">
          <AlertCircle className="h-8 w-8 text-yellow-600" />
          {isArabic ? "طلبات الحذف" : "Deletion Reviews"}
        </h1>
        <Badge variant="secondary">
          {reviews.length}{" "}
          {isArabic ? "طلب قيد الانتظار" : "pending requests"}
        </Badge>
      </div>

      {reviews.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {isArabic
              ? "لا توجد طلبات حذف قيد المراجعة"
              : "No pending deletion requests"}
          </CardContent>
        </Card>
      )}

      {categoryReviews.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              {isArabic ? "طلبات حذف الفئات" : "Category Deletion Requests"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div>
                    <p className="font-medium">
                      {isArabic
                        ? review.item_data.name_ar
                        : review.item_data.name_en}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "طلب من" : "Requested by"}:{" "}
                      {review.requested_by_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.requested_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleApprove(review)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {isArabic ? "موافقة" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleReject(review.id, review.item_type)
                      }
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {isArabic ? "رفض" : "Reject"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {publicationReviews.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              {isArabic
                ? "طلبات حذف المقالات"
                : "Publication Deletion Requests"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {publicationReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div>
                    <p className="font-medium">
                      {isArabic
                        ? review.item_data.title_ar
                        : review.item_data.title_en ||
                          review.item_data.title_ar}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "طلب من" : "Requested by"}:{" "}
                      {review.requested_by_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.requested_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleApprove(review)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {isArabic ? "موافقة" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleReject(review.id, review.item_type)
                      }
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {isArabic ? "رفض" : "Reject"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
