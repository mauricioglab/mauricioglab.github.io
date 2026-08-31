-- Marcar alumnos que vienen de años anteriores
alter table public.integrantes
  add column if not exists anios_anteriores boolean not null default false;
