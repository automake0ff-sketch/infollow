-- Reglas de priorización (requiere 0001-0004). Solo DESARROLLO. Todo se revierte.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local', '{"agency_name":"Agencia A","accepted_terms":"true"}');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

insert into public.leads (id, full_name, stage_key, created_at, last_interaction_at, budget, zone, lead_type) values
  ('00000000-0000-0000-0000-00000000aa01', 'Nuevo viejo',  'nuevo',       now() - interval '3 days',  null,                       null,   null,    'comprador'),
  ('00000000-0000-0000-0000-00000000aa02', 'Negociación',  'negociacion', now() - interval '30 days', now() - interval '9 days', null,   null,    'comprador'),
  ('00000000-0000-0000-0000-00000000aa03', 'Interesado',   'interesado',  now() - interval '30 days', now() - interval '12 days', 200000, 'Triana', 'comprador'),
  ('00000000-0000-0000-0000-00000000aa04', 'Cerrado',      'cerrado',     now() - interval '60 days', null,                       null,   null,    'comprador'),
  ('00000000-0000-0000-0000-00000000aa05', 'Reciente',     'contactado',  now(),                      now(),                      null,   null,    'comprador');
insert into public.properties (reference, zone, price, operation) values ('T-1', 'triana', 180000, 'venta');
select public.create_task('00000000-0000-0000-0000-00000000aa05', 'Futuro', current_date + 3);

do $$ declare n int; r jsonb; begin
  -- nuevo sin atender: new_unattended (30) + no_next_step (15)
  select score into n from public.v_lead_priority where lead_id = '00000000-0000-0000-0000-00000000aa01';
  if n <> 45 then raise exception 'nuevo: score %', n; end if;
  -- negociación estancada 35 + sin próximo paso 15
  select score into n from public.v_lead_priority where lead_id = '00000000-0000-0000-0000-00000000aa02';
  if n <> 50 then raise exception 'negociación: score %', n; end if;
  -- interesado 25 + sin próximo paso 15 + propiedad compatible 20 = 60 => alta
  select score into n from public.v_lead_priority where lead_id = '00000000-0000-0000-0000-00000000aa03';
  if n <> 60 then raise exception 'interesado: score %', n; end if;
  if (select level from public.v_lead_priority where lead_id = '00000000-0000-0000-0000-00000000aa03') <> 'alta' then raise exception 'nivel'; end if;
  -- cerrado nunca genera alertas; reciente con tarea futura tampoco
  if exists (select 1 from public.v_lead_priority where lead_id in ('00000000-0000-0000-0000-00000000aa04','00000000-0000-0000-0000-00000000aa05'))
    then raise exception 'cerrado/reciente con alertas'; end if;
  -- cada alerta explica el motivo
  select reasons into r from public.v_lead_priority where lead_id = '00000000-0000-0000-0000-00000000aa03';
  if jsonb_array_length(r) <> 3 then raise exception 'motivos %', r; end if;

  -- tarea vencida (insertada directamente con fecha pasada)
  insert into public.tasks (lead_id, title, due_at) values ('00000000-0000-0000-0000-00000000aa05', 'Vencida', now() - interval '3 days');
  if not exists (select 1 from public.v_lead_alerts where lead_id = '00000000-0000-0000-0000-00000000aa05' and rule = 'overdue_task')
    then raise exception 'overdue no detectada'; end if;

  -- pesos configurables
  update public.agency_settings set priority_weights = '{"overdue_task": 70}';
  if (select weight from public.v_lead_alerts where lead_id = '00000000-0000-0000-0000-00000000aa05' and rule = 'overdue_task') <> 70
    then raise exception 'peso configurable no aplicado'; end if;
end $$;

rollback;
select 'PRIORIDAD OK' as resultado;
