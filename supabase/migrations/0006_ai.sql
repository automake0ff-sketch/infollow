-- INMO FOLLOW AI · Migración 0006 · IA: control de uso en backend e historial de salidas
-- Proveedor: OpenRouter (modelos gratuitos). Límite global compartido por la cuenta de OpenRouter.

alter table public.agency_settings
  add column ai_daily_limit int not null default 15 check (ai_daily_limit >= 0);

-- Configuración de plataforma (sin acceso desde el cliente; se edita en el SQL editor)
create table public.platform_settings (key text primary key, value int not null);
alter table public.platform_settings enable row level security;   -- sin políticas: nadie del cliente accede
insert into public.platform_settings (key, value) values ('ai_global_daily_limit', 45);  -- 50/día sin créditos; 1000 con ≥10 $ comprados

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  feature text not null check (char_length(feature) <= 40),
  status text not null default 'reservado' check (status in ('reservado', 'ok', 'error')),
  model text check (char_length(model) <= 120),
  created_at timestamptz not null default now()
);
create index ai_usage_agency_day_idx on public.ai_usage(agency_id, created_at);
create index ai_usage_day_idx on public.ai_usage(created_at);
alter table public.ai_usage enable row level security;
create policy ai_usage_select on public.ai_usage for select to authenticated using (agency_id = public.current_agency_id());
revoke insert, update, delete on public.ai_usage from authenticated;  -- solo las funciones de abajo escriben

-- Reserva un uso ANTES de llamar al modelo. Los límites se aplican aquí, en backend.
create or replace function public.ai_reserve(p_feature text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_agency uuid := public.current_agency_id();
  v_tz text; v_limit int; v_global int; v_used int; v_total int; v_id uuid;
  v_day_start timestamptz;
begin
  if auth.uid() is null or v_agency is null then raise exception 'No autenticado'; end if;
  select timezone, ai_daily_limit into v_tz, v_limit from public.agency_settings where agency_id = v_agency;
  v_day_start := date_trunc('day', now() at time zone v_tz) at time zone v_tz;
  -- serializa las reservas de una agencia para que dos peticiones simultáneas no superen el límite
  perform pg_advisory_xact_lock(hashtext('ai_reserve:' || v_agency::text));
  select count(*) into v_used from public.ai_usage where agency_id = v_agency and created_at >= v_day_start and status in ('reservado', 'ok');
  if v_used >= v_limit then raise exception 'LIMITE_IA'; end if;
  select value into v_global from public.platform_settings where key = 'ai_global_daily_limit';
  select count(*) into v_total from public.ai_usage where created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  if v_total >= coalesce(v_global, 45) then raise exception 'LIMITE_GLOBAL_IA'; end if;
  insert into public.ai_usage (agency_id, user_id, feature) values (v_agency, auth.uid(), left(p_feature, 40)) returning id into v_id;
  return v_id;
end $$;

create or replace function public.ai_finish(p_id uuid, p_status text, p_model text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('ok', 'error') then raise exception 'Estado no válido'; end if;
  update public.ai_usage set status = p_status, model = left(p_model, 120)
  where id = p_id and user_id = auth.uid() and status = 'reservado';
end $$;

create or replace function public.ai_quota()
returns table (used int, daily_limit int) language sql stable as $$
  select (select count(*)::int from public.ai_usage u
          where u.created_at >= (date_trunc('day', now() at time zone public.agency_tz()) at time zone public.agency_tz())
            and u.status in ('reservado', 'ok')),
         (select ai_daily_limit from public.agency_settings)
$$;

revoke execute on function public.ai_reserve(text), public.ai_finish(uuid, text, text) from public, anon;
grant execute on function public.ai_reserve(text), public.ai_finish(uuid, text, text) to authenticated;

-- ───────── Salidas de IA por lead (mensajes y análisis) ─────────
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies(id) on delete cascade,
  lead_id uuid not null,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  kind text not null default 'mensaje' check (kind in ('mensaje', 'resumen', 'preparar_llamada', 'info_faltante')),
  scenario text check (char_length(scenario) <= 60),
  tone text check (char_length(tone) <= 40),
  content text not null check (char_length(content) between 1 and 6000),
  original_content text,
  status text not null default 'generado' check (status in ('generado', 'editado', 'enviado')),
  model text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  foreign key (lead_id, agency_id) references public.leads(id, agency_id) on delete cascade
);
create index ai_messages_lead_idx on public.ai_messages(agency_id, lead_id, created_at desc);
alter table public.ai_messages enable row level security;
create policy ai_messages_select on public.ai_messages for select to authenticated using (agency_id = public.current_agency_id());
create policy ai_messages_insert on public.ai_messages for insert to authenticated
  with check (agency_id = public.current_agency_id() and created_by = auth.uid());
create policy ai_messages_update on public.ai_messages for update to authenticated
  using (agency_id = public.current_agency_id()) with check (agency_id = public.current_agency_id());
create policy ai_messages_delete on public.ai_messages for delete to authenticated using (agency_id = public.current_agency_id());

-- "Marcado como enviado por el agente": la app no envía nada; solo deja constancia de lo que el agente declara.
create or replace function public.mark_message_sent(p_message uuid)
returns void language plpgsql as $$
declare v_lead uuid; v_content text;
begin
  update public.ai_messages set status = 'enviado', sent_at = now()
  where id = p_message and kind = 'mensaje' and status <> 'enviado'
  returning lead_id, content into v_lead, v_content;
  if v_lead is null then raise exception 'Mensaje no encontrado o ya marcado como enviado'; end if;
  insert into public.activities (lead_id, type, content, metadata)
  values (v_lead, 'mensaje', 'Mensaje marcado como enviado por el agente: ' || left(v_content, 500), jsonb_build_object('ai_message_id', p_message));
end $$;

-- ───────── Protección de límites: el propietario NO puede subirse su propio cupo de IA ─────────
-- (la política de UPDATE de agency_settings permite al propietario editar la fila; se limita por columnas)
revoke update on public.agency_settings from authenticated;
grant update (inactivity_days, stalled_interested_days, stalled_negotiation_days, new_lead_hours, timezone, priority_weights, updated_at)
  on public.agency_settings to authenticated;

-- Los mensajes de IA solo permiten editar texto, estado y fecha de envío desde el cliente
revoke update on public.ai_messages from authenticated;
grant update (content, status, sent_at) on public.ai_messages to authenticated;
