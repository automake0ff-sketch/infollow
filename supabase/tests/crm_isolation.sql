-- Aislamiento del CRM entre agencias (requiere 0001 y 0002). Solo en proyecto de DESARROLLO. Todo se revierte.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local', '{"agency_name":"Agencia A","accepted_terms":"true"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'b@test.local', '{"agency_name":"Agencia B","accepted_terms":"true"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
insert into public.leads (id, full_name) values ('00000000-0000-0000-0000-00000000bb01', 'Lead de B');
insert into public.properties (id, reference) values ('00000000-0000-0000-0000-00000000bb02', 'B-001');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into public.leads (id, full_name) values ('00000000-0000-0000-0000-00000000aa01', 'Lead de A');
insert into public.properties (id, reference) values ('00000000-0000-0000-0000-00000000aa02', 'A-001');

do $$ declare n int; begin
  select count(*) into n from public.leads;      if n <> 1 then raise exception 'A ve leads ajenos (%)', n; end if;
  select count(*) into n from public.properties; if n <> 1 then raise exception 'A ve propiedades ajenas (%)', n; end if;

  -- no puede asociar su lead con una propiedad de B
  begin
    insert into public.lead_properties (lead_id, property_id) values
      ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-00000000bb02');
    raise exception 'A asoció una propiedad de B';
  exception when foreign_key_violation then null; end;

  -- no puede insertar actividad en un lead de B
  begin
    insert into public.activities (lead_id, type, content) values ('00000000-0000-0000-0000-00000000bb01', 'nota', 'x');
    raise exception 'A escribió en un lead de B';
  exception when foreign_key_violation or insufficient_privilege or check_violation then null; end;

  -- no puede crear un lead en la agencia de B
  begin
    insert into public.leads (agency_id, full_name)
      select agency_id, 'intruso' from public.profiles where id = auth.uid(); -- su propia agencia: permitido
    insert into public.leads (agency_id, full_name) values (gen_random_uuid(), 'intruso2');
    raise exception 'A creó un lead en otra agencia';
  exception when insufficient_privilege or foreign_key_violation then null; end;

  -- actividad propia + última interacción
  insert into public.activities (lead_id, type, content) values ('00000000-0000-0000-0000-00000000aa01', 'llamada', 'ok');
  if (select last_interaction_at from public.leads where id = '00000000-0000-0000-0000-00000000aa01') is null
    then raise exception 'last_interaction_at no se actualizó'; end if;

  -- cambio de estado deja rastro
  perform public.change_lead_stage('00000000-0000-0000-0000-00000000aa01', 'interesado');
  if (select count(*) from public.activities where type = 'cambio_estado') <> 1 then raise exception 'Sin rastro de cambio de estado'; end if;
end $$;

rollback;
select 'CRM RLS OK' as resultado;
