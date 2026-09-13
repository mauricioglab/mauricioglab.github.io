-- =============================================
-- Puente Blog <-> Zona Lab: columna topicos
-- Temas compartidos que conectan posts del blog y
-- recursos de la Zona Lab por similitud temática.
-- =============================================

ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS topicos TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.recursos ADD COLUMN IF NOT EXISTS topicos TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_blogs_topicos ON public.blogs USING GIN (topicos);
CREATE INDEX IF NOT EXISTS idx_recursos_topicos ON public.recursos USING GIN (topicos);