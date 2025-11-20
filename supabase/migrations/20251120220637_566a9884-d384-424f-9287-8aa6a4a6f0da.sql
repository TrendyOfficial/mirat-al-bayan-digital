-- Add profile customization fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_icon TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS profile_color_one TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS profile_color_two TEXT DEFAULT '#ec4899',
ADD COLUMN IF NOT EXISTS use_gradient BOOLEAN DEFAULT true;