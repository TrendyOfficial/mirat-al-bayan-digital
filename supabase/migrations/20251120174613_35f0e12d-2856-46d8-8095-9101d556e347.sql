-- Create comment reports table
CREATE TABLE public.comment_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  reported_by_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_reports
CREATE POLICY "Users can report comments"
ON public.comment_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Admins and owner can view reports"
ON public.comment_reports
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Admins and owner can update reports"
ON public.comment_reports
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Admins and owner can delete reports"
ON public.comment_reports
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, publication_id)
);

-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.bookmarks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
ON public.bookmarks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
ON public.bookmarks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create publication likes table
CREATE TABLE public.publication_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, publication_id)
);

-- Enable RLS
ALTER TABLE public.publication_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for publication_likes
CREATE POLICY "Anyone can view publication likes"
ON public.publication_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can create publication likes"
ON public.publication_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own publication likes"
ON public.publication_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);