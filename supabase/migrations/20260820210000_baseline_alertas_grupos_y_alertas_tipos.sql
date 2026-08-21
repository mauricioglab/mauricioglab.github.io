-- Ponerse al día: columnas/tablas que ya existen en producción (aplicadas ad hoc)
-- pero nunca quedaron registradas en el historial de migraciones.

alter table public.grupos add column if not exists alertas text[] not null default '{}';

create table if not exists public.alertas_tipos (
  id text primary key,
  nombre text not null,
  color text,
  icono text
);

alter table public.alertas_tipos enable row level security;

drop policy if exists "Public read alertas_tipos" on public.alertas_tipos;
create policy "Public read alertas_tipos" on public.alertas_tipos for select using (true);

drop policy if exists "Staff write alertas_tipos" on public.alertas_tipos;
create policy "Staff write alertas_tipos" on public.alertas_tipos for all
  using (auth.uid() in (select profiles.id from profiles where profiles.role in ('profesor_practica','director','admin')))
  with check (auth.uid() in (select profiles.id from profiles where profiles.role in ('profesor_practica','director','admin')));
