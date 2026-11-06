-- INMO FOLLOW AI · Migración 0004 · Priorización determinista y explicable (sin IA, sin APIs externas)
-- La puntuación indica PRIORIDAD DE ATENCIÓN, no probabilidad de conversión.

alter table public.agency_settings
  add column priority_weights jsonb not null default '{}'::jsonb;

-- Pesos por defecto (se pueden sobrescribir por agencia en priority_weights):
-- overdue_task 40 · stalled_negotiation 35 · new_unattended 30 · stalled_interested 25
-- compatible_property 20 · no_next_step 15 · inactive 10

create or replace view public.v_lead_alerts with (security_invoker = true) as
with base as (
  select l.id, l.agency_id, l.full_name, l.stage_key, l.lead_type, l.budget, l.zone,
         l.created_at, l.last_interaction_at,
         s.timezone as tz, s.inactivity_days, s.stalled_interested_days, s.stalled_negotiation_days, s.new_lead_hours,
         s.priority_weights as w,
         floor(extract(epoch from (now() - coalesce(l.last_interaction_at, l.created_at))) / 86400)::int as idle_days
  from public.leads l
  join public.pipeline_stages ps on ps.agency_id = l.agency_id and ps.key = l.stage_key and ps.is_open
  join public.agency_settings s on s.agency_id = l.agency_id
)
-- 1) seguimiento vencido (anterior al inicio de hoy en la zona horaria de la agencia)
select b.id as lead_id, b.agency_id, 'overdue_task'::text as rule,
       coalesce((b.w->>'overdue_task')::int, 40) as weight,
       'Tiene un seguimiento vencido ("' || t.title || '") desde el ' || to_char(t.due_at at time zone b.tz, 'DD/MM/YYYY') || '.' as reason
from base b
join (
  select distinct on (lead_id, agency_id) lead_id, agency_id, title, due_at
  from public.tasks where status = 'pendiente' order by lead_id, agency_id, due_at
) t on t.lead_id = b.id and t.agency_id = b.agency_id
where t.due_at < (date_trunc('day', now() at time zone b.tz) at time zone b.tz)

union all
-- 2) lead nuevo sin atender
select b.id, b.agency_id, 'new_unattended', coalesce((b.w->>'new_unattended')::int, 30),
       'Es un lead nuevo, creado hace ' || floor(extract(epoch from (now() - b.created_at)) / 3600)::int || ' horas, y no consta ninguna interacción.'
from base b
where b.stage_key = 'nuevo' and b.last_interaction_at is null
  and b.created_at < now() - make_interval(hours => b.new_lead_hours)

union all
-- 3) negociación estancada
select b.id, b.agency_id, 'stalled_negotiation', coalesce((b.w->>'stalled_negotiation')::int, 35),
       'Está en negociación y no hay actividad registrada desde hace ' || b.idle_days || ' días.'
from base b
where b.stage_key = 'negociacion' and b.idle_days >= b.stalled_negotiation_days

union all
-- 4) interesado sin actividad
select b.id, b.agency_id, 'stalled_interested', coalesce((b.w->>'stalled_interested')::int, 25),
       'Figura como interesado y no hay actividad registrada desde hace ' || b.idle_days || ' días.'
from base b
where b.stage_key = 'interesado' and b.idle_days >= b.stalled_interested_days

union all
-- 5) inactividad genérica (resto de estados abiertos; no duplica las reglas 2–4)
select b.id, b.agency_id, 'inactive', coalesce((b.w->>'inactive')::int, 10),
       'Lleva ' || b.idle_days || ' días sin interacción registrada.'
from base b
where b.stage_key not in ('interesado', 'negociacion')
  and not (b.stage_key = 'nuevo' and b.last_interaction_at is null)
  and b.idle_days >= b.inactivity_days

union all
-- 6) sin próximo paso
select b.id, b.agency_id, 'no_next_step', coalesce((b.w->>'no_next_step')::int, 15),
       'No tiene ningún seguimiento programado.'
from base b
where not exists (select 1 from public.tasks t where t.lead_id = b.id and t.agency_id = b.agency_id and t.status = 'pendiente')

union all
-- 7) propiedad compatible disponible y aún no asociada (misma zona, precio dentro del presupuesto)
select b.id, b.agency_id, 'compatible_property', coalesce((b.w->>'compatible_property')::int, 20),
       'Tiene presupuesto y zona definidos y hay ' || c.n || ' propiedad(es) disponible(s) compatible(s) sin asociar.'
from base b
cross join lateral (
  select count(*)::int as n
  from public.properties p
  where p.agency_id = b.agency_id and p.status = 'disponible'
    and p.operation = case b.lead_type when 'comprador' then 'venta'::public.property_operation when 'arrendatario' then 'alquiler'::public.property_operation end
    and lower(p.zone) = lower(b.zone) and p.price is not null and p.price <= b.budget
    and not exists (select 1 from public.lead_properties lp where lp.lead_id = b.id and lp.property_id = p.id)
) c
where b.lead_type in ('comprador', 'arrendatario') and b.budget is not null and b.zone is not null and c.n > 0;

create or replace view public.v_lead_priority with (security_invoker = true) as
select a.lead_id, a.agency_id,
       sum(a.weight)::int as score,
       case when sum(a.weight) >= 60 then 'alta' when sum(a.weight) >= 30 then 'media' else 'baja' end as level,
       jsonb_agg(jsonb_build_object('rule', a.rule, 'weight', a.weight, 'reason', a.reason) order by a.weight desc) as reasons
from public.v_lead_alerts a
group by a.lead_id, a.agency_id;
