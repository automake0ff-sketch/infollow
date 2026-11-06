-- Prueba de aislamiento entre agencias. Ejecutar en un proyecto de DESARROLLO.
-- Todo se revierte al final (rollback). Si algo falla, lanza una excepción.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local', '{"agency_name":"Agencia A","accepted_terms":"true","full_name":"Ana"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'b@test.local', '{"agency_name":"Agencia B","accepted_terms":"true","full_name":"Beto"}');

do $$ begin
  if (select count(*) from public.pipeline_stages where agency_id in (select agency_id from public.profiles where id in
      ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b1'))) <> 16
  then raise exception 'Pipeline inicial incorrecto'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

do $$ begin
  if (select count(*) from public.agencies) <> 1 then raise exception 'A ve agencias ajenas'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'A ve perfiles ajenos'; end if;
  if (select count(*) from public.pipeline_stages) <> 8 then raise exception 'A ve etapas ajenas'; end if;
  begin
    update public.profiles set role = 'owner' where id = auth.uid();
    raise exception 'A pudo actualizar columna protegida (role)';
  exception when insufficient_privilege then null; end;
  update public.agencies set name = 'hack' where name = 'Agencia B';
  if found then raise exception 'A modificó la agencia B'; end if;
end $$;

rollback;
select 'RLS OK' as resultado;
