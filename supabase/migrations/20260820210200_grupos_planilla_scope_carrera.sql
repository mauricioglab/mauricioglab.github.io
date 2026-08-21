-- Escopar grupos y planilla por carrera, y habilitar el traslado reversible
-- P3 <-> TutoriasPost (practica_origen). Reemplaza los CHECK fijos de "practica"
-- por una FK compuesta contra el catálogo public.practicas, y el CHECK fijo de
-- "encuentro" (E1..E7) por un formato libre En para permitir cantidad variable.

-- grupos: carrera + soporte de traslado temporal
alter table public.grupos add column if not exists carrera_id text references public.carreras(id);
update public.grupos set carrera_id = 'analista-sistemas' where carrera_id is null;
alter table public.grupos alter column carrera_id set default 'analista-sistemas';
alter table public.grupos alter column carrera_id set not null;

alter table public.grupos add column if not exists practica_origen text;

-- planilla: carrera
alter table public.planilla add column if not exists carrera_id text references public.carreras(id);
update public.planilla set carrera_id = 'analista-sistemas' where carrera_id is null;
alter table public.planilla alter column carrera_id set default 'analista-sistemas';
alter table public.planilla alter column carrera_id set not null;

-- planilla: UNIQUE (practica, encuentro) -> (carrera_id, practica, encuentro)
alter table public.planilla drop constraint if exists planilla_practica_encuentro_key;
alter table public.planilla add constraint planilla_carrera_practica_encuentro_key
  unique (carrera_id, practica, encuentro);

-- planilla: relajar el CHECK fijo de encuentro (E1-E7) -> formato libre En
alter table public.planilla drop constraint if exists planilla_encuentro_check;
alter table public.planilla add constraint planilla_encuentro_format_check
  check (encuentro ~ '^E[0-9]+$');

-- Reemplazar los CHECK fijos de practica por FK compuesta contra el catálogo
alter table public.planilla drop constraint if exists planilla_practica_check;
alter table public.grupos drop constraint if exists grupos_practica_check;

-- Nota: practicas ya tiene UNIQUE (carrera_id, codigo) desde su creación
-- (migración 20260820210100), que es lo que esta FK compuesta necesita.

alter table public.planilla add constraint planilla_carrera_practica_fk
  foreign key (carrera_id, practica) references public.practicas (carrera_id, codigo);
alter table public.grupos add constraint grupos_carrera_practica_fk
  foreign key (carrera_id, practica) references public.practicas (carrera_id, codigo);

-- practica_origen: solo restringimos formato (la validación de que pertenezca
-- a la misma carrera queda en la app, para no acoplar la FK a una condición
-- compuesta con NULL permitido)
alter table public.grupos drop constraint if exists grupos_practica_origen_format_check;
alter table public.grupos add constraint grupos_practica_origen_format_check
  check (practica_origen is null or practica_origen ~ '^[A-Za-z0-9]+$');
