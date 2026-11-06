-- Seguimientos: lógica y aislamiento (requiere 0001-0003). Solo DESARROLLO. Todo se revierte.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local', '{"agency_name":"Agencia A"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'b@test.local', '{"agency_name":"Agencia B"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
insert into public.leads (id, full_name) values ('00000000-0000-0000-0000-00000000bb01', 'Lead de B');
select public.create_task('00000000-0000-0000-0000-00000000bb01', 'Tarea de B', current_date + 1);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into public.leads (id, full_name, created_at) values
  ('00000000-0000-0000-0000-00000000aa01', 'Lead A1', now() - interval '30 days'),
  ('00000000-0000-0000-0000-00000000aa02', 'Lead A2', now());

do $$ declare t uuid; n int; begin
  -- sin tareas: ambos leads sin próximo paso; solo A1 inactivo (30 días > 7)
  select count(*) into n from public.v_leads_without_next_step; if n <> 2 then raise exception 'sin próximo paso = %', n; end if;
  select count(*) into n from public.v_inactive_leads;          if n <> 1 then raise exception 'inactivos = %', n; end if;

  -- crear tarea: A1 deja de estar "sin próximo paso"
  t := public.create_task('00000000-0000-0000-0000-00000000aa01', 'Llamar', current_date + 2);
  select count(*) into n from public.v_leads_without_next_step; if n <> 1 then raise exception 'tras crear tarea = %', n; end if;

  -- no se ve ni se completa la tarea de B
  select count(*) into n from public.tasks; if n <> 1 then raise exception 'A ve tareas ajenas (%)', n; end if;

  -- posponer
  perform public.snooze_task(t, 3);
  if (select due_at from public.tasks where id = t) < now() + interval '2 days' then raise exception 'snooze no aplicó'; end if;

  -- completar deja rastro y reabre "sin próximo paso"
  perform public.complete_task(t);
  if (select status from public.tasks where id = t) <> 'completada' then raise exception 'no completada'; end if;
  if (select count(*) from public.activities where lead_id = '00000000-0000-0000-0000-00000000aa01' and metadata ? 'task_id') <> 1
    then raise exception 'sin rastro de completado'; end if;
  select count(*) into n from public.v_leads_without_next_step; if n <> 2 then raise exception 'tras completar = %', n; end if;

  -- no puede completar de nuevo
  begin perform public.complete_task(t); raise exception 'completó dos veces';
  exception when raise_exception then if sqlerrm = 'completó dos veces' then raise; end if; end;
end $$;

rollback;
select 'TAREAS OK' as resultado;
