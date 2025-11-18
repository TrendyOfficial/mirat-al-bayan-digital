import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, Save, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DOMPurify from "dompurify";

interface Comment {
  id: string;
  publication_id: string;
  user_id: string;
  username: string;
  user_email: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface CommentsProps {
  publicationId: string;
}

export function Comments({ publicationId }: CommentsProps) {
  const { user, hasRole, isOwner } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
    fetchComments();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `publication_id=eq.${publicationId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [publicationId]);

  const checkAdminStatus = async () => {
    if (user) {
      const admin = await hasRole('admin');
      setIsAdmin(admin);
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('publication_id', publicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('comments')
        .insert({
          publication_id: publicationId,
          user_id: user.id,
          username: profile?.full_name || 'Anonymous',
          user_email: user.email || '',
          content: DOMPurify.sanitize(newComment.trim())
        });

      if (error) throw error;

      setNewComment("");
      toast.success("Comment posted successfully!");
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: DOMPurify.sanitize(editContent.trim()),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;

      setEditingId(null);
      setEditContent("");
      toast.success("Comment updated successfully!");
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error("Failed to update comment");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success("Comment deleted successfully!");
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error("Failed to delete comment");
    }
  };

  const canDeleteComment = (comment: Comment) => {
    if (!user) return false;
    return comment.user_id === user.id || isAdmin || isOwner();
  };

  const canEditComment = (comment: Comment) => {
    if (!user) return false;
    return comment.user_id === user.id;
  };

  return (
    <div className="border-t pt-8 mt-8">
      <h3 className="font-arabic text-2xl font-bold mb-6">
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="mb-4 min-h-[100px]"
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      ) : (
        <Card className="p-6 mb-8 text-center">
          <p className="text-muted-foreground mb-4">
            You must be signed in to comment.
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </Card>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center text-muted-foreground py-8">
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-semibold">{comment.username}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  {comment.updated_at !== comment.created_at && (
                    <span className="text-muted-foreground text-xs ml-2">(edited)</span>
                  )}
                </div>
                
                {user && (
                  <div className="flex gap-2">
                    {canEditComment(comment) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(comment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteComment(comment) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(comment.id)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
