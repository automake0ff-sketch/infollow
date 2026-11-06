-- Términos, importación (claves de duplicado), IA (límites en backend) y borrado de agencia (requiere 0001-0006).
-- Solo DESARROLLO. Todo se revierte.
begin;
do $$ begin
  begin insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000f1','f@t','{"agency_name":"X"}');
        raise exception 'se permitió registro sin aceptar términos';
  exception when raise_exception then if sqlerrm like 'se permitió%' then raise; end if; end;
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1','a@t','{"agency_name":"Agencia A","accepted_terms":"true"}'),
  ('00000000-0000-0000-0000-0000000000b1','b@t','{"agency_name":"Agencia B","accepted_terms":"true"}'),
  ('00000000-0000-0000-0000-0000000000c1','c@t','{"agency_name":"Temporal","accepted_terms":"true"}');
-- c1 pasa a ser agente de la agencia A
delete from public.agencies where name = 'Temporal';
insert into public.profiles (id, agency_id, role, terms_accepted_at)
  select '00000000-0000-0000-0000-0000000000c1', agency_id, 'agent', now() from public.profiles where id = '00000000-0000-0000-0000-0000000000a1';
update public.agency_settings set ai_daily_limit = 2 where agency_id = (select agency_id from public.profiles where id = '00000000-0000-0000-0000-0000000000a1');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a1"}',true);

do $$ declare r1 uuid; r2 uuid; lead uuid; msg uuid; n int; begin
  -- claves normalizadas para duplicados
  insert into public.leads (full_name, phone, email) values ('Ana', '+34 600-123 456', ' ANA@Mail.com ') returning id into lead;
  if (select phone_norm from public.leads where id = lead) <> '600123456' then raise exception 'phone_norm'; end if;
  if (select email_norm from public.leads where id = lead) <> 'ana@mail.com' then raise exception 'email_norm'; end if;

  -- el propietario no puede subirse el cupo de IA
  begin update public.agency_settings set ai_daily_limit = 100000; raise exception 'subió su cupo de IA';
  exception when insufficient_privilege then null; end;
  update public.agency_settings set inactivity_days = 9;  -- columnas permitidas sí

  -- IA: el cliente no puede escribir en ai_usage
  begin insert into public.ai_usage (agency_id, feature) values (public.current_agency_id(), 'x'); raise exception 'insertó ai_usage';
  exception when insufficient_privilege then null; end;

  -- límite por agencia (2/día)
  r1 := public.ai_reserve('mensaje');
  r2 := public.ai_reserve('mensaje');
  begin perform public.ai_reserve('mensaje'); raise exception 'superó el límite diario';
  exception when raise_exception then if sqlerrm <> 'LIMITE_IA' then raise; end if; end;
  -- un error del proveedor libera el uso
  perform public.ai_finish(r2, 'error', 'modelo-x');
  perform public.ai_reserve('mensaje');
  select used into n from public.ai_quota(); if n <> 2 then raise exception 'ai_quota used=%', n; end if;

  -- un agente de la misma agencia no puede alterar el uso de otro usuario
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000c1"}',true);
  perform public.ai_finish(r1, 'error');
  if (select status from public.ai_usage where id = r1) <> 'reservado' then raise exception 'c1 alteró el uso de a1'; end if;
  perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a1"}',true);

  -- mensaje marcado como enviado
  insert into public.ai_messages (lead_id, scenario, content, status) values (lead, 'primer_contacto', 'Hola Ana', 'generado') returning id into msg;
  perform public.mark_message_sent(msg);
  if (select status from public.ai_messages where id = msg) <> 'enviado' then raise exception 'no enviado'; end if;
  if (select count(*) from public.activities where lead_id = lead and type = 'mensaje') <> 1 then raise exception 'sin actividad de mensaje'; end if;
  if (select last_interaction_at from public.leads where id = lead) is null then raise exception 'sin última interacción'; end if;
  begin perform public.mark_message_sent(msg); raise exception 'doble envío';
  exception when raise_exception then if sqlerrm = 'doble envío' then raise; end if; end;
end $$;

-- límite global de plataforma
reset role;
update public.platform_settings set value = 1 where key = 'ai_global_daily_limit';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000b1"}',true);
do $$ begin
  begin perform public.ai_reserve('mensaje'); raise exception 'superó el límite global';
  exception when raise_exception then if sqlerrm <> 'LIMITE_GLOBAL_IA' then raise; end if; end;
  if exists (select 1 from public.platform_settings) then raise exception 'cliente lee platform_settings'; end if;
end $$;

-- borrado de agencia (RGPD)
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000c1"}',true);
do $$ begin
  begin perform public.delete_my_agency('Agencia A'); raise exception 'un agente borró la agencia';
  exception when raise_exception then if sqlerrm like 'un agente%' then raise; end if; end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a1"}',true);
do $$ begin
  begin perform public.delete_my_agency('otro nombre'); raise exception 'borró con confirmación incorrecta';
  exception when raise_exception then if sqlerrm like 'borró%' then raise; end if; end;
  perform public.delete_my_agency('Agencia A');
end $$;
reset role;
do $$ begin
  if exists (select 1 from public.agencies where name = 'Agencia A') then raise exception 'agencia no borrada'; end if;
  if exists (select 1 from public.leads where full_name = 'Ana') then raise exception 'leads no borrados'; end if;
  if exists (select 1 from auth.users where id in ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1')) then raise exception 'cuentas no borradas'; end if;
  if not exists (select 1 from public.agencies where name = 'Agencia B') then raise exception 'se borró otra agencia'; end if;
end $$;

rollback;
select 'PRIVACIDAD E IA OK' as resultado;
