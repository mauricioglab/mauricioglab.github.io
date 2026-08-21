-- Añadir estado de PP1 a alumnos_seguimiento
alter table public.alumnos_seguimiento
  add column if not exists pp1_estado text not null default 'no_cursada',
  add column if not exists pp1_mes_regularizada text;

alter table public.alumnos_seguimiento
  drop constraint if exists alumnos_seguimiento_pp1_estado_check;

alter table public.alumnos_seguimiento
  add constraint alumnos_seguimiento_pp1_estado_check
  check (pp1_estado in ('no_cursada', 'cursada_no_reg', 'regularizada', 'aprobada', 'debe_recursar'));

-- Crear usuario interno para login por defecto (cervantes / cervantes123)
do $$
declare
  v_id uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'cervantes@mauricioglab.local') then
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change, is_sso_user, is_anonymous)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'cervantes@mauricioglab.local', crypt('cervantes123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', false, false);

    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (v_id, v_id, v_id::text, 'email', jsonb_build_object('sub', v_id::text, 'email', 'cervantes@mauricioglab.local'), now(), now(), now());

    insert into public.profiles (id, role, nombre)
    values (v_id, 'admin', 'Cervantes');
  end if;
end $$;
