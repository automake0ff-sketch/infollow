# INMO FOLLOW AI

Copiloto comercial inmobiliario (SaaS). Next.js 16 + Supabase (Postgres, Auth, RLS) + Zod.

## Puesta en marcha
1. `npm install`
2. `cp .env.example .env.local` y rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (proyecto **de desarrollo**).
3. En el SQL editor de Supabase ejecuta, en orden: `supabase/migrations/0001_base.sql` y `0002_crm.sql`.
4. Ejecuta `supabase/tests/rls_isolation.sql`, `crm_isolation.sql` y `tasks_logic.sql`: deben devolver `RLS OK`, `CRM RLS OK` y `TAREAS OK`.
5. Auth > URL Configuration: añade `http://localhost:3000/auth/callback` a los redirects permitidos.
6. `npm run dev`

## Estado por etapas
- [x] Etapa 1 · Base: auth, agencias, perfiles, RLS, pipeline configurable
- [x] Etapa 2 · CRM: leads, propiedades, relación lead↔propiedad, pipeline, historial de actividades
- [x] Etapa 3 · Seguimientos y "Tu día comercial" (vencidos, hoy, sin próximo paso, inactivos, próximas; falta la sección de visitas, Etapa 6)
- [ ] Etapa 4 · Priorización por reglas
- [ ] Etapa 5 · Copiloto IA
- [ ] Etapa 6 · Visitas
- [ ] Etapa 7 · Suscripciones y límites
- [ ] Etapa 8 · Calidad

## Verificado hasta ahora
`npm run build` y `npm run lint` pasan. Las migraciones SQL y los tests RLS **no se han ejecutado todavía contra un Supabase real**.

## Validación comercial
Ver `docs/validacion-demo.md`.

## Seguridad
- `agency_id` se rellena en base de datos con la identidad autenticada; nunca se envía desde el frontend.
- Claves de servicio, IA y Stripe solo en variables de entorno del servidor.
