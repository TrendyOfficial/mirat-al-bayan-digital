-- Add hero image setting to settings table
INSERT INTO public.settings (key, value)
VALUES ('hero_image', '{"url": "", "type": "url"}'::jsonb)
ON CONFLICT (key) DO NOTHING;