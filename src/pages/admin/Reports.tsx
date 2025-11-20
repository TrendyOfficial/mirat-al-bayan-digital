import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface CommentReport {
  id: string;
  comment_id: string;
  reported_by: string;
  reported_by_email: string;
  reason: string;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  comments: {
    content: string;
    username: string;
    user_email: string;
  };
}

const Reports = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData && !isOwner()) {
        navigate("/");
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        return;
      }

      fetchReports();
    };

    checkAccess();
  }, [user, navigate, toast, isOwner]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("comment_reports")
        .select(`
          *,
          comments (
            content,
            username,
            user_email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to load reports.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("comment_reports")
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Report marked as ${status}.`,
      });

      fetchReports();
    } catch (error) {
      console.error("Error updating report:", error);
      toast({
        title: "Error",
        description: "Failed to update report.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("comment_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report deleted successfully.",
      });

      fetchReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "Failed to delete report.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Comment Reports</h1>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No reports found.</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Report from {report.reported_by_email}
                  </CardTitle>
                  <Badge variant={report.status === 'pending' ? 'default' : report.status === 'resolved' ? 'secondary' : 'destructive'}>
                    {report.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Reported Comment:</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">{report.comments.username}:</span>{" "}
                      {report.comments.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Comment by: {report.comments.user_email}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Reason:</h3>
                  <p className="text-sm">{report.reason}</p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                </div>

                {report.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleUpdateStatus(report.id, 'resolved')}
                    >
                      Mark as Resolved
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      Delete Report
                    </Button>
                  </div>
                )}

                {report.status !== 'pending' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    Delete Report
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
