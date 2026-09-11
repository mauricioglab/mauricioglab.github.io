-- =============================================
-- Zona Lab (recursos) - Tabla para Supabase
-- Recursos para alumnos: link + frase -> articulo.
-- Replica el patron de blogs (RLS admin + lectura publica).
-- =============================================

CREATE TABLE IF NOT EXISTS public.recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'web',
  source_title TEXT NOT NULL DEFAULT '',
  video_id TEXT,
  description TEXT NOT NULL DEFAULT '',
  body_markdown TEXT NOT NULL DEFAULT '',
  categories TEXT[] NOT NULL DEFAULT '{}',
  cover_url TEXT,
  draft BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recursos_created_at ON public.recursos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recursos_draft ON public.recursos (draft);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_recursos_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_recursos ON public.recursos;
CREATE TRIGGER trg_update_recursos
  BEFORE UPDATE ON public.recursos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_recursos_ts();

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.recursos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published recursos" ON public.recursos;
CREATE POLICY "Public read published recursos" ON public.recursos
  FOR SELECT USING (draft = false);

DROP POLICY IF EXISTS "Admin read all recursos" ON public.recursos;
CREATE POLICY "Admin read all recursos" ON public.recursos
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin insert recursos" ON public.recursos;
CREATE POLICY "Admin insert recursos" ON public.recursos
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin update recursos" ON public.recursos;
CREATE POLICY "Admin update recursos" ON public.recursos
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admin delete recursos" ON public.recursos;
CREATE POLICY "Admin delete recursos" ON public.recursos
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );