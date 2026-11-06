-- INMO FOLLOW AI · Migración 0001 · Base del SaaS (aditiva, no destructiva)
create extension if not exists pgcrypto;

create type public.user_role as enum ('owner', 'agent');

-- ───────── Tablas ─────────
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  role public.user_role not null default 'agent',
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text check (phone is null or char_length(phone) <= 30),
  created_at timestamptz not null default now()
);
create index profiles_agency_idx on public.profiles(agency_id);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  key text not null,
  label text not null check (char_length(label) between 1 and 60),
  position int not null,
  is_open boolean not null default true,  -- false = cerrado / no interesado
  created_at timestamptz not null default now(),
  unique (agency_id, key),
  unique (agency_id, position) deferrable initially deferred
);

create table public.agency_settings (
  agency_id uuid primary key references public.agencies(id) on delete cascade,
  inactivity_days int not null default 7 check (inactivity_days > 0),
  stalled_interested_days int not null default 10 check (stalled_interested_days > 0),
  stalled_negotiation_days int not null default 5 check (stalled_negotiation_days > 0),
  new_lead_hours int not null default 24 check (new_lead_hours > 0),
  timezone text not null default 'Europe/Madrid',
  updated_at timestamptz not null default now()
);

-- ───────── Funciones auxiliares ─────────
create or replace function public.current_agency_id()
returns uuid language sql stable security definer set search_path = public as $$
  select agency_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_agency_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
$$;

create or replace function public.seed_pipeline_stages(p_agency uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.pipeline_stages (agency_id, key, label, position, is_open) values
    (p_agency, 'nuevo',            'Nuevo',            1, true),
    (p_agency, 'contactado',       'Contactado',       2, true),
    (p_agency, 'interesado',       'Interesado',       3, true),
    (p_agency, 'visita_pendiente', 'Visita pendiente', 4, true),
    (p_agency, 'visita_realizada', 'Visita realizada', 5, true),
    (p_agency, 'negociacion',      'Negociación',      6, true),
    (p_agency, 'cerrado',          'Cerrado',          7, false),
    (p_agency, 'no_interesado',    'No interesado',    8, false)
  on conflict do nothing
$$;
revoke execute on function public.seed_pipeline_stages(uuid) from public, anon, authenticated;

-- Alta de usuario: crea agencia, perfil owner, ajustes y pipeline.
-- Solo se usan nombres del metadata; nunca un agency_id enviado por el cliente.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_agency uuid;
  v_agency_name text := coalesce(nullif(trim(new.raw_user_meta_data->>'agency_name'), ''), 'Mi agencia');
  v_full_name text := coalesce(trim(new.raw_user_meta_data->>'full_name'), '');
begin
  insert into public.agencies (name) values (left(v_agency_name, 120)) returning id into v_agency;
  insert into public.profiles (id, agency_id, role, full_name)
    values (new.id, v_agency, 'owner', left(v_full_name, 120));
  insert into public.agency_settings (agency_id) values (v_agency);
  perform public.seed_pipeline_stages(v_agency);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────── RLS ─────────
alter table public.agencies        enable row level security;
alter table public.profiles        enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.agency_settings enable row level security;

create policy agencies_select on public.agencies for select to authenticated
  using (id = public.current_agency_id());
create policy agencies_update on public.agencies for update to authenticated
  using (id = public.current_agency_id() and public.is_agency_owner())
  with check (id = public.current_agency_id());

create policy profiles_select on public.profiles for select to authenticated
  using (agency_id = public.current_agency_id());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy stages_select on public.pipeline_stages for select to authenticated
  using (agency_id = public.current_agency_id());
create policy stages_write on public.pipeline_stages for all to authenticated
  using (agency_id = public.current_agency_id() and public.is_agency_owner())
  with check (agency_id = public.current_agency_id() and public.is_agency_owner());

create policy settings_select on public.agency_settings for select to authenticated
  using (agency_id = public.current_agency_id());
create policy settings_update on public.agency_settings for update to authenticated
  using (agency_id = public.current_agency_id() and public.is_agency_owner())
  with check (agency_id = public.current_agency_id());

revoke insert, delete on public.agencies from authenticated;
revoke insert, delete on public.agency_settings from authenticated;
