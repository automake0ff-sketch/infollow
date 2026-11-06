-- INMO FOLLOW AI · Migración 0002 · CRM esencial (leads, propiedades, actividades)
create type public.lead_type as enum ('comprador','vendedor','propietario','arrendatario','otro');
create type public.property_operation as enum ('venta','alquiler');
create type public.property_status as enum ('disponible','reservada','vendida','alquilada','retirada');
create type public.activity_type as enum ('nota','llamada','mensaje','email','visita','cambio_estado','otro');

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ───────── leads ─────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies(id) on delete cascade,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  assigned_to uuid default auth.uid() references public.profiles(id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text check (char_length(phone) <= 30),
  email text check (char_length(email) <= 160),
  lead_type public.lead_type not null default 'comprador',
  stage_key text not null default 'nuevo',
  budget numeric(12,2) check (budget is null or budget >= 0),
  zone text check (char_length(zone) <= 120),
  property_type text check (char_length(property_type) <= 60),
  bedrooms int check (bedrooms is null or bedrooms between 0 and 20),
  preferences text check (char_length(preferences) <= 2000),
  notes text check (char_length(notes) <= 4000),
  source text check (char_length(source) <= 80),
  last_interaction_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, agency_id),
  foreign key (agency_id, stage_key) references public.pipeline_stages(agency_id, key)
);
create index leads_agency_stage_idx on public.leads(agency_id, stage_key);
create index leads_agency_last_idx  on public.leads(agency_id, last_interaction_at);
create trigger leads_updated before update on public.leads for each row execute function public.set_updated_at();

-- ───────── properties ─────────
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies(id) on delete cascade,
  reference text not null check (char_length(reference) between 1 and 40),
  property_type text check (char_length(property_type) <= 60),
  operation public.property_operation not null default 'venta',
  price numeric(12,2) check (price is null or price >= 0),
  address text check (char_length(address) <= 200),
  zone text check (char_length(zone) <= 120),
  bedrooms int check (bedrooms is null or bedrooms between 0 and 50),
  bathrooms int check (bathrooms is null or bathrooms between 0 and 50),
  area_m2 numeric(8,2) check (area_m2 is null or area_m2 >= 0),
  description text check (char_length(description) <= 4000),
  features text[] not null default '{}',
  status public.property_status not null default 'disponible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, agency_id),
  unique (agency_id, reference)
);
create trigger properties_updated before update on public.properties for each row execute function public.set_updated_at();

-- ───────── lead_properties (N:M, misma agencia garantizada) ─────────
create table public.lead_properties (
  lead_id uuid not null,
  property_id uuid not null,
  agency_id uuid not null default public.current_agency_id(),
  created_at timestamptz not null default now(),
  primary key (lead_id, property_id),
  foreign key (lead_id, agency_id) references public.leads(id, agency_id) on delete cascade,
  foreign key (property_id, agency_id) references public.properties(id, agency_id) on delete cascade
);

-- ───────── activities (historial único) ─────────
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id(),
  lead_id uuid not null,
  property_id uuid,
  user_id uuid default auth.uid() references public.profiles(id) on delete set null,
  type public.activity_type not null,
  content text check (char_length(content) <= 4000),
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (lead_id, agency_id) references public.leads(id, agency_id) on delete cascade,
  foreign key (property_id, agency_id) references public.properties(id, agency_id) on delete set null (property_id)
);
create index activities_lead_idx on public.activities(agency_id, lead_id, occurred_at desc);

-- "Última interacción" = llamada, mensaje, email o visita (las notas internas no cuentan)
create or replace function public.touch_lead_interaction() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.type in ('llamada','mensaje','email','visita') then
    update public.leads set last_interaction_at = greatest(coalesce(last_interaction_at, new.occurred_at), new.occurred_at)
    where id = new.lead_id and agency_id = new.agency_id;
  end if;
  return new;
end $$;
create trigger activities_touch after insert on public.activities for each row execute function public.touch_lead_interaction();

-- Cambio de estado manual (nunca automático): actualiza el lead y deja rastro en el historial
create or replace function public.change_lead_stage(p_lead uuid, p_stage text)
returns void language plpgsql security invoker set search_path = public as $$
declare v_old text;
begin
  select stage_key into v_old from public.leads where id = p_lead;
  if v_old is null then raise exception 'Lead no encontrado'; end if;
  if v_old = p_stage then return; end if;
  update public.leads set stage_key = p_stage where id = p_lead;
  insert into public.activities (lead_id, type, content, metadata)
    values (p_lead, 'cambio_estado', null, jsonb_build_object('from', v_old, 'to', p_stage));
end $$;

-- ───────── RLS ─────────
alter table public.leads           enable row level security;
alter table public.properties      enable row level security;
alter table public.lead_properties enable row level security;
alter table public.activities      enable row level security;

create policy leads_all on public.leads for all to authenticated
  using (agency_id = public.current_agency_id()) with check (agency_id = public.current_agency_id());
create policy properties_all on public.properties for all to authenticated
  using (agency_id = public.current_agency_id()) with check (agency_id = public.current_agency_id());
create policy lead_properties_all on public.lead_properties for all to authenticated
  using (agency_id = public.current_agency_id()) with check (agency_id = public.current_agency_id());
create policy activities_select on public.activities for select to authenticated
  using (agency_id = public.current_agency_id());
create policy activities_insert on public.activities for insert to authenticated
  with check (agency_id = public.current_agency_id() and user_id = auth.uid());
-- el historial no se edita ni se borra desde el cliente
revoke update, delete on public.activities from authenticated;
