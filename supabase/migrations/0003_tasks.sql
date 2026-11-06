-- INMO FOLLOW AI · Migración 0003 · Seguimientos (tareas) y vistas de "Tu día comercial"
create type public.task_status as enum ('pendiente','completada','cancelada');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies(id) on delete cascade,
  lead_id uuid not null,
  property_id uuid,
  assigned_to uuid default auth.uid() references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  due_at timestamptz not null,
  status public.task_status not null default 'pendiente',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (lead_id, agency_id) references public.leads(id, agency_id) on delete cascade,
  foreign key (property_id, agency_id) references public.properties(id, agency_id) on delete set null (property_id)
);
create index tasks_pending_idx on public.tasks(agency_id, due_at) where status = 'pendiente';
create index tasks_lead_idx on public.tasks(agency_id, lead_id, status);
create trigger tasks_updated before update on public.tasks for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;
create policy tasks_all on public.tasks for all to authenticated
  using (agency_id = public.current_agency_id()) with check (agency_id = public.current_agency_id());

-- ───────── Zona horaria y límites del día de la agencia ─────────
create or replace function public.agency_tz() returns text language sql stable as $$
  select coalesce((select timezone from public.agency_settings where agency_id = public.current_agency_id()), 'Europe/Madrid')
$$;

create or replace function public.agency_day_bounds()
returns table (day_start timestamptz, day_end timestamptz) language sql stable as $$
  select (date_trunc('day', now() at time zone tz) at time zone tz),
         ((date_trunc('day', now() at time zone tz) + interval '1 day') at time zone tz)
  from (select public.agency_tz() as tz) t
$$;

-- ───────── Operaciones sobre seguimientos (security invoker: aplica RLS) ─────────
create or replace function public.create_task(p_lead uuid, p_title text, p_due date, p_property uuid default null)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  if p_title is null or char_length(trim(p_title)) = 0 then raise exception 'Título obligatorio'; end if;
  insert into public.tasks (lead_id, property_id, title, due_at)
  values (p_lead, p_property, left(trim(p_title), 200), ((p_due + time '09:00') at time zone public.agency_tz()))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.create_task_in_days(p_lead uuid, p_title text, p_days int)
returns uuid language plpgsql as $$
begin
  if p_days < 0 or p_days > 365 then raise exception 'Plazo no válido'; end if;
  return public.create_task(p_lead, p_title, ((now() at time zone public.agency_tz())::date + p_days));
end $$;

create or replace function public.complete_task(p_task uuid)
returns void language plpgsql as $$
declare v_lead uuid; v_title text;
begin
  update public.tasks set status = 'completada', completed_at = now()
  where id = p_task and status = 'pendiente'
  returning lead_id, title into v_lead, v_title;
  if v_lead is null then raise exception 'Seguimiento no encontrado o ya cerrado'; end if;
  insert into public.activities (lead_id, type, content, metadata)
  values (v_lead, 'otro', 'Seguimiento completado: ' || v_title, jsonb_build_object('task_id', p_task));
end $$;

-- Pospone a las 09:00 (hora de la agencia) de dentro de p_days días
create or replace function public.snooze_task(p_task uuid, p_days int)
returns void language plpgsql as $$
begin
  if p_days < 1 or p_days > 30 then raise exception 'Plazo no válido'; end if;
  update public.tasks
  set due_at = ((date_trunc('day', now() at time zone public.agency_tz()) + make_interval(days => p_days) + interval '9 hours') at time zone public.agency_tz())
  where id = p_task and status = 'pendiente';
  if not found then raise exception 'Seguimiento no encontrado o ya cerrado'; end if;
end $$;

-- ───────── Vistas (RLS del usuario que consulta) ─────────
create or replace view public.v_leads_without_next_step with (security_invoker = true) as
select l.id, l.agency_id, l.full_name, l.stage_key, l.last_interaction_at, l.created_at
from public.leads l
join public.pipeline_stages ps on ps.agency_id = l.agency_id and ps.key = l.stage_key and ps.is_open
where not exists (
  select 1 from public.tasks t
  where t.lead_id = l.id and t.agency_id = l.agency_id and t.status = 'pendiente'
);

create or replace view public.v_inactive_leads with (security_invoker = true) as
select l.id, l.agency_id, l.full_name, l.stage_key, l.last_interaction_at, l.created_at,
       floor(extract(epoch from (now() - coalesce(l.last_interaction_at, l.created_at))) / 86400)::int as days_inactive
from public.leads l
join public.pipeline_stages ps on ps.agency_id = l.agency_id and ps.key = l.stage_key and ps.is_open
join public.agency_settings s on s.agency_id = l.agency_id
where coalesce(l.last_interaction_at, l.created_at) < now() - make_interval(days => s.inactivity_days);
