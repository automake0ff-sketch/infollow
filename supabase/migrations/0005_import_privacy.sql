-- INMO FOLLOW AI · Migración 0005 · Importación CSV, aceptación de términos y derechos RGPD (borrado)

-- ───────── Claves normalizadas para detectar duplicados al importar ─────────
alter table public.leads
  add column phone_norm text generated always as (nullif(right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 9), '')) stored,
  add column email_norm text generated always as (nullif(lower(btrim(coalesce(email, ''))), '')) stored,
  add column import_batch uuid;
create index leads_agency_phone_idx on public.leads(agency_id, phone_norm) where phone_norm is not null;
create index leads_agency_email_idx on public.leads(agency_id, email_norm) where email_norm is not null;
create index leads_import_idx on public.leads(import_batch) where import_batch is not null;

alter table public.properties add column import_batch uuid;
create index properties_import_idx on public.properties(import_batch) where import_batch is not null;

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies(id) on delete cascade,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  kind text not null check (kind in ('leads', 'properties')),
  filename text check (char_length(filename) <= 200),
  imported int not null default 0,
  skipped int not null default 0,
  failed int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.imports enable row level security;
create policy imports_all on public.imports for all to authenticated
  using (agency_id = public.current_agency_id()) with check (agency_id = public.current_agency_id());

-- ───────── Aceptación de términos (obligatoria en el alta, también si se salta la interfaz) ─────────
alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column terms_version text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_agency uuid;
  v_agency_name text := coalesce(nullif(trim(new.raw_user_meta_data->>'agency_name'), ''), 'Mi agencia');
  v_full_name text := coalesce(trim(new.raw_user_meta_data->>'full_name'), '');
begin
  if coalesce(new.raw_user_meta_data->>'accepted_terms', '') <> 'true' then
    raise exception 'Debes aceptar los términos y la política de privacidad';
  end if;
  insert into public.agencies (name) values (left(v_agency_name, 120)) returning id into v_agency;
  insert into public.profiles (id, agency_id, role, full_name, terms_accepted_at, terms_version)
    values (new.id, v_agency, 'owner', left(v_full_name, 120), now(), coalesce(new.raw_user_meta_data->>'terms_version', '1'));
  insert into public.agency_settings (agency_id) values (v_agency);
  perform public.seed_pipeline_stages(v_agency);
  return new;
end $$;

-- ───────── Derecho de supresión: el propietario elimina su agencia y todos sus datos ─────────
create or replace function public.delete_my_agency(p_confirm text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_agency uuid := public.current_agency_id();
  v_name text;
  v_users uuid[];
begin
  if auth.uid() is null or v_agency is null then raise exception 'No autenticado'; end if;
  if not public.is_agency_owner() then raise exception 'Solo el propietario puede eliminar la agencia'; end if;
  select name into v_name from public.agencies where id = v_agency;
  if p_confirm is distinct from v_name then raise exception 'La confirmación no coincide con el nombre de la agencia'; end if;
  select array_agg(id) into v_users from public.profiles where agency_id = v_agency;
  delete from public.agencies where id = v_agency;            -- cascada: perfiles, leads, propiedades, actividades, tareas…
  delete from auth.users where id = any(v_users);              -- elimina también las cuentas de acceso
end $$;
revoke execute on function public.delete_my_agency(text) from public, anon;
grant execute on function public.delete_my_agency(text) to authenticated;
