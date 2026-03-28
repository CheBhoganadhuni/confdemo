-- Blog posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  university_id uuid REFERENCES public.universities(id),
  slug varchar UNIQUE NOT NULL,
  title varchar(150) NOT NULL,
  body text NOT NULL,
  cover_image_url text,
  tags text[] DEFAULT '{}',
  visibility varchar DEFAULT 'university' 
    CHECK (visibility IN ('global','university')),
  moderation_status varchar DEFAULT 'pending'
    CHECK (moderation_status IN ('approved','rejected','pending')),
  moderation_reason text,
  upvote_count int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Upvotes
CREATE TABLE public.blog_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX idx_blog_posts_univ ON public.blog_posts(university_id);
CREATE INDEX idx_blog_posts_created ON public.blog_posts(created_at DESC);
CREATE INDEX idx_blog_posts_visibility ON public.blog_posts(visibility, moderation_status, is_published);
CREATE INDEX idx_blog_upvotes_post ON public.blog_upvotes(post_id);
CREATE INDEX idx_blog_upvotes_user ON public.blog_upvotes(user_id);

-- Last blog timestamp on users (no cron needed)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_blog_at timestamptz;

-- Supabase Storage bucket for blog cover images
-- Run this or create manually in Supabase dashboard → Storage → New bucket
-- Name: blog-images, Public: true, File size limit: 5MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images', 
  'blog-images', 
  true, 
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload
CREATE POLICY "authenticated users can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Public read
CREATE POLICY "public can read blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Authors can delete their own images
CREATE POLICY "authors can delete own blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]);