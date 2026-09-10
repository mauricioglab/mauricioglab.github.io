-- =============================================
-- Disertaciones - Tabla + Storage para Supabase
-- Portfolio de charlas / disertaciones dadas.
-- Replica el patrón de blogs (RLS admin + lectura pública).
-- =============================================

-- Tabla principal
CREATE TABLE IF NOT EXISTS public.disertaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_name TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Mauricio Gonzalez',
  categories TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  bullets TEXT[] NOT NULL DEFAULT '{}',
  cover_url TEXT,
  certificate_url TEXT,
  slides_urls TEXT[] NOT NULL DEFAULT '{}',
  draft BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disertaciones_event_date ON public.disertaciones (event_date DESC);
CREATE INDEX IF NOT EXISTS idx_disertaciones_draft ON public.disertaciones (draft);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_disertaciones_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_disertaciones ON public.disertaciones;
CREATE TRIGGER trg_update_disertaciones
  BEFORE UPDATE ON public.disertaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_disertaciones_ts();

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.disertaciones ENABLE ROW LEVEL SECURITY;

-- Lectura pública de disertaciones publicadas (draft = false)
DROP POLICY IF EXISTS "Public read published disertaciones" ON public.disertaciones;
CREATE POLICY "Public read published disertaciones" ON public.disertaciones
  FOR SELECT USING (draft = false);

-- Admins pueden leer todo (incluidos borradores)
DROP POLICY IF EXISTS "Admin read all disertaciones" ON public.disertaciones;
CREATE POLICY "Admin read all disertaciones" ON public.disertaciones
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Solo admins pueden escribir/editar/eliminar
DROP POLICY IF EXISTS "Admin insert disertaciones" ON public.disertaciones;
CREATE POLICY "Admin insert disertaciones" ON public.disertaciones
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin update disertaciones" ON public.disertaciones;
CREATE POLICY "Admin update disertaciones" ON public.disertaciones
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin delete disertaciones" ON public.disertaciones;
CREATE POLICY "Admin delete disertaciones" ON public.disertaciones
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- =============================================
-- Storage: bucket disertaciones-files (lectura pública)
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('disertaciones-files', 'disertaciones-files', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Lectura pública de los archivos
DROP POLICY IF EXISTS "Public read disertaciones files" ON storage.objects;
CREATE POLICY "Public read disertaciones files" ON storage.objects
  FOR SELECT USING (bucket_id = 'disertaciones-files');

-- Admins pueden subir/actualizar/eliminar archivos
DROP POLICY IF EXISTS "Admin upload disertaciones files" ON storage.objects;
CREATE POLICY "Admin upload disertaciones files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'disertaciones-files'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin update disertaciones files" ON storage.objects;
CREATE POLICY "Admin update disertaciones files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'disertaciones-files'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin delete disertaciones files" ON storage.objects;
CREATE POLICY "Admin delete disertaciones files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'disertaciones-files'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
