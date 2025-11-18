import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, Save, X, Heart, Reply, ShieldCheck, ShieldX } from "lucide-react";
import DOMPurify from "dompurify";

interface CommentItemProps {
  comment: any;
  user: any;
  isAdmin: boolean;
  canEdit: boolean;
  canDelete: boolean;
  likesCount: number;
  hasLiked: boolean;
  replies: any[];
  onEdit: () => void;
  onDelete: () => void;
  onLike: () => void;
  onReply: () => void;
  onModerate: (status: 'approved' | 'rejected', reason?: string) => void;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isReplying: boolean;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: () => void;
  onCancelReply: () => void;
}

export function CommentItem({
  comment,
  user,
  isAdmin,
  canEdit,
  canDelete,
  likesCount,
  hasLiked,
  replies,
  onEdit,
  onDelete,
  onLike,
  onReply,
  onModerate,
  isEditing,
  editContent,
  setEditContent,
  onSaveEdit,
  onCancelEdit,
  isReplying,
  replyContent,
  setReplyContent,
  onSubmitReply,
  onCancelReply,
}: CommentItemProps) {
  const [moderateReason, setModerateReason] = useState("");
  const [showModeration, setShowModeration] = useState(false);

  return (
    <Card className={`p-4 ${comment.parent_comment_id ? 'ml-8 mt-2' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
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
            {isAdmin && !showModeration && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModeration(!showModeration)}
              >
                <ShieldCheck className="h-4 w-4" />
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {showModeration && isAdmin && (
        <div className="mb-4 p-3 bg-muted rounded-lg space-y-2">
          <Textarea
            placeholder="Moderation reason (optional)"
            value={moderateReason}
            onChange={(e) => setModerateReason(e.target.value)}
            className="min-h-[60px]"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                onModerate('approved', moderateReason);
                setShowModeration(false);
              }}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                onModerate('rejected', moderateReason);
                setShowModeration(false);
              }}
            >
              <ShieldX className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowModeration(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSaveEdit}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}>
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
          onClick={onLike}
          className={hasLiked ? 'text-red-500' : ''}
        >
          <Heart className={`h-4 w-4 mr-1 ${hasLiked ? 'fill-current' : ''}`} />
          {likesCount}
        </Button>
        {user && !comment.parent_comment_id && (
          <Button variant="ghost" size="sm" onClick={onReply}>
            <Reply className="h-4 w-4 mr-1" />
            Reply
          </Button>
        )}
      </div>

      {/* Reply form */}
      {isReplying && (
        <div className="mt-4 space-y-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSubmitReply}>
              Post Reply
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelReply}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Display replies */}
      {replies.length > 0 && (
        <div className="mt-4 space-y-2">
          {replies.map((reply) => (
            <div key={reply.id} className="ml-4 pl-4 border-l-2 border-muted">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className="font-semibold text-sm">{reply.username}</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}