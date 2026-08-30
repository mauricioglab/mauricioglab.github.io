-- =============================================
-- Blog - Tabla + Storage para Supabase
-- Base de datos solo para los posts del blog.
-- =============================================

-- Tabla principal
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  pub_date DATE NOT NULL DEFAULT CURRENT_DATE,
  author TEXT NOT NULL DEFAULT 'MG Lab',
  categories TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  body_markdown TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  draft BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blogs_pub_date ON public.blogs (pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_draft ON public.blogs (draft);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_blogs_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_blogs ON public.blogs;
CREATE TRIGGER trg_update_blogs
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blogs_ts();

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Lectura pública de posts publicados (draft = false)
DROP POLICY IF EXISTS "Public read published blogs" ON public.blogs;
CREATE POLICY "Public read published blogs" ON public.blogs
  FOR SELECT USING (draft = false);

-- Admins pueden leer todo (incluidos borradores)
DROP POLICY IF EXISTS "Admin read all blogs" ON public.blogs;
CREATE POLICY "Admin read all blogs" ON public.blogs
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Solo admins pueden escribir/editar/eliminar
DROP POLICY IF EXISTS "Admin insert blogs" ON public.blogs;
CREATE POLICY "Admin insert blogs" ON public.blogs
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin update blogs" ON public.blogs;
CREATE POLICY "Admin update blogs" ON public.blogs
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin delete blogs" ON public.blogs;
CREATE POLICY "Admin delete blogs" ON public.blogs
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- =============================================
-- Storage: bucket blog-images (lectura pública)
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Lectura pública de las tapas
DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
CREATE POLICY "Public read blog images" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

-- Admins pueden subir/actualizar/eliminar tapas
DROP POLICY IF EXISTS "Admin upload blog images" ON storage.objects;
CREATE POLICY "Admin upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-images'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin update blog images" ON storage.objects;
CREATE POLICY "Admin update blog images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'blog-images'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin delete blog images" ON storage.objects;
CREATE POLICY "Admin delete blog images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blog-images'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );