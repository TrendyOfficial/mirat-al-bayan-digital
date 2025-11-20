import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, Save, X, Heart, Reply, ShieldCheck } from "lucide-react";
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
  status: string;
  parent_comment_id: string | null;
  moderation_reason: string | null;
}

interface CommentLike {
  user_id: string;
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [commentLikes, setCommentLikes] = useState<Record<string, CommentLike[]>>({});
  const [moderateId, setModerateId] = useState<string | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);

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
      
      // Fetch likes for all comments
      if (data && data.length > 0) {
        const commentIds = data.map(c => c.id);
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id, user_id')
          .in('comment_id', commentIds);
        
        if (likes) {
          const likesMap: Record<string, CommentLike[]> = {};
          likes.forEach(like => {
            if (!likesMap[like.comment_id]) {
              likesMap[like.comment_id] = [];
            }
            likesMap[like.comment_id].push({ user_id: like.user_id });
          });
          setCommentLikes(likesMap);
        }
      }
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
      setShowCommentForm(false);
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

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast.error("You must be signed in to like comments");
      return;
    }

    const hasLiked = commentLikes[commentId]?.some(like => like.user_id === user.id);

    try {
      if (hasLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: user.id });

        if (error) throw error;
      }
      
      fetchComments();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Failed to update like");
    }
  };

  const handleReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

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
          content: DOMPurify.sanitize(replyContent.trim()),
          parent_comment_id: parentId
        });

      if (error) throw error;

      setReplyContent("");
      setReplyingTo(null);
      toast.success("Reply posted successfully!");
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModerate = async (commentId: string, newStatus: 'approved' | 'rejected') => {
    if (!user || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          status: newStatus,
          moderation_reason: moderationReason || null,
          moderated_at: new Date().toISOString(),
          moderated_by: user.id
        })
        .eq('id', commentId);

      if (error) throw error;

      toast.success(`Comment ${newStatus} successfully!`);
      setModerateId(null);
      setModerationReason("");
      fetchComments();
    } catch (error) {
      console.error('Error moderating comment:', error);
      toast.error("Failed to moderate comment");
    }
  };

  const handleReport = async (commentId: string, reason: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comment_reports')
        .insert({
          comment_id: commentId,
          reported_by: user.id,
          reported_by_email: user.email || '',
          reason,
        });

      if (error) throw error;

      toast.success("Report submitted. Thank you for reporting.");
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast.error("Failed to submit report");
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
        showCommentForm ? (
          <form onSubmit={handleSubmit} className="mb-8">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="mb-4 min-h-[100px]"
              disabled={isSubmitting}
            />
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setShowCommentForm(false);
                  setNewComment("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="mb-8">
            <Button onClick={() => setShowCommentForm(true)}>
              Write a Comment
            </Button>
          </div>
        )
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
      ) : comments.filter(c => !c.parent_comment_id).length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.filter(c => !c.parent_comment_id).map((comment) => {
            const replies = comments.filter(c => c.parent_comment_id === comment.id);
            const likes = commentLikes[comment.id] || [];
            const hasLiked = user ? likes.some(like => like.user_id === user.id) : false;

            return (
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
                    {comment.status !== 'approved' && (
                      <span className={`text-xs ml-2 px-2 py-1 rounded ${
                        comment.status === 'rejected' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {comment.status}
                      </span>
                    )}
                  </div>
                  
                  {user && (
                    <div className="flex gap-2">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setModerateId(comment.id)}
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}
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
                  <>
                    <p className="text-foreground whitespace-pre-wrap mb-3">
                      {comment.content}
                    </p>
                    {comment.moderation_reason && (
                      <p className="text-sm text-muted-foreground italic mb-3">
                        Moderation reason: {comment.moderation_reason}
                      </p>
                    )}
                  </>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-4 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(comment.id)}
                    className={hasLiked ? 'text-red-500' : ''}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${hasLiked ? 'fill-current' : ''}`} />
                    {likes.length}
                  </Button>
                  {user && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                  )}
                  {user && user.id !== comment.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const reason = prompt("Please provide a reason for reporting this comment:");
                        if (reason && reason.trim()) {
                          handleReport(comment.id, reason.trim());
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Report
                    </Button>
                  )}
                </div>

                {/* Reply form */}
                {replyingTo === comment.id && (
                  <div className="mt-4 space-y-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleReply(comment.id)}
                        disabled={isSubmitting || !replyContent.trim()}
                      >
                        Post Reply
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Display replies */}
                {replies.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {replies.map((reply) => (
                      <Card key={reply.id} className="ml-4 p-3 bg-muted/30">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <span className="font-semibold text-sm">{reply.username}</span>
                            <span className="text-muted-foreground text-xs ml-2">
                              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {user && canDeleteComment(reply) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(reply.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
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

      {/* Moderation Dialog */}
      <AlertDialog open={!!moderateId} onOpenChange={() => setModerateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Moderate Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Choose an action for this comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Moderation reason (optional)"
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => moderateId && handleModerate(moderateId, 'approved')}
              className="bg-green-500 hover:bg-green-600"
            >
              Approve
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => moderateId && handleModerate(moderateId, 'rejected')}
              className="bg-red-500 hover:bg-red-600"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
