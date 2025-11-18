-- Add comment moderation fields
ALTER TABLE public.comments
ADD COLUMN status text DEFAULT 'approved',
ADD COLUMN moderation_reason text,
ADD COLUMN moderated_at timestamp with time zone,
ADD COLUMN moderated_by uuid REFERENCES auth.users(id),
ADD COLUMN parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create comment_likes table
CREATE TABLE public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies for comment_likes
CREATE POLICY "Anyone can view comment likes"
  ON public.comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like comments"
  ON public.comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON public.comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Update comments policies for moderation
CREATE POLICY "Only approved comments are visible to public"
  ON public.comments FOR SELECT
  USING (
    status = 'approved' OR 
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    is_owner(auth.uid())
  );

-- Drop the old public viewing policy
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;

-- Add settings for hero images (left, middle, right)
INSERT INTO public.settings (key, value)
VALUES 
  ('hero_image_left', '{"url": ""}'::jsonb),
  ('hero_image_right', '{"url": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);