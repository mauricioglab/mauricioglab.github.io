-- Scope evaluaciones by practice so promoted groups keep old encounters as history
-- and the new practice starts empty.
ALTER TABLE public.evaluaciones ADD COLUMN practica text;

-- Backfill from the group's current practice (best available signal for existing data)
UPDATE public.evaluaciones e
SET practica = g.practica
FROM public.grupos g
WHERE g.id = e.grupo_id AND e.practica IS NULL;

ALTER TABLE public.evaluaciones ALTER COLUMN practica SET DEFAULT 'P2';
UPDATE public.evaluaciones SET practica = 'P2' WHERE practica IS NULL;
ALTER TABLE public.evaluaciones ALTER COLUMN practica SET NOT NULL;

-- A group may now have the same encuentro in different practices (history + current)
ALTER TABLE public.evaluaciones DROP CONSTRAINT evaluaciones_grupo_id_encuentro_meta_id_key;
ALTER TABLE public.evaluaciones ADD CONSTRAINT evaluaciones_grupo_practica_encuentro_key UNIQUE (grupo_id, practica, encuentro_meta_id);
