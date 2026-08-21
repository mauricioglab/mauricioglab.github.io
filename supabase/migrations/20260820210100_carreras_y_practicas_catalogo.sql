-- Catálogo de carreras y de las prácticas (etapas) que tiene cada una.
-- Reemplaza los valores fijos hardcodeados de "practica" (P1/P2/P3/TutoriasPost)
-- por un catálogo administrable, ya que cada carrera define su propio set.

create table if not exists public.carreras (
  id text primary key,
  nombre text not null,
  activa boolean not null default true
);

create table if not exists public.practicas (
  id text primary key,
  carrera_id text not null references public.carreras(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  orden int not null default 0,
  activa boolean not null default true,
  unique (carrera_id, codigo)
);

alter table public.carreras enable row level security;
alter table public.practicas enable row level security;

drop policy if exists "Public read carreras" on public.carreras;
create policy "Public read carreras" on public.carreras for select using (true);
drop policy if exists "Staff write carreras" on public.carreras;
create policy "Staff write carreras" on public.carreras for all
  using (auth.uid() in (select profiles.id from profiles where profiles.role in ('profesor_practica','director','admin')))
  with check (auth.uid() in (select profiles.id from profiles where profiles.role in ('profesor_practica','director','admin')));

drop policy if exists "Public read practicas" on public.practicas;
create policy "Public read practicas" on public.practicas for select using (true);
drop policy if exists "Staff write practicas" on public.practicas;
create policy "Staff write practicas" on public.practicas for all
  using (auth.uid() in (select profiles.id from profiles where profiles.role in ('profesor_practica','director','admin')))
  with check (auth.uid() in (select profiles.id from profiles where profiles.role in ('profesor_practica','director','admin')));

-- Seed: carrera existente (todos los grupos/planilla actuales pertenecen a esta)
insert into public.carreras (id, nombre) values
  ('analista-sistemas', 'Tecnicatura Superior en Análisis de Sistemas')
on conflict (id) do nothing;

insert into public.practicas (id, carrera_id, codigo, nombre, orden) values
  ('analista-sistemas:P1', 'analista-sistemas', 'P1', 'PP1 (3er sem)', 1),
  ('analista-sistemas:P2', 'analista-sistemas', 'P2', 'PP2 (5to sem)', 2),
  ('analista-sistemas:P3', 'analista-sistemas', 'P3', 'PP3 (6to sem)', 3),
  ('analista-sistemas:TutoriasPost', 'analista-sistemas', 'TutoriasPost', 'Tutorías Post', 4)
on conflict (id) do nothing;

-- Seed: carrera nueva, sin grupos todavía
insert into public.carreras (id, nombre) values
  ('ciencia-datos-ia', 'Tecnicatura Superior en Ciencia de Datos e IA')
on conflict (id) do nothing;

insert into public.practicas (id, carrera_id, codigo, nombre, orden) values
  ('ciencia-datos-ia:P1', 'ciencia-datos-ia', 'P1', 'PP1', 1),
  ('ciencia-datos-ia:P2', 'ciencia-datos-ia', 'P2', 'PP2', 2)
on conflict (id) do nothing;
