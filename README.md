# INMO FOLLOW AI

Copiloto comercial inmobiliario (SaaS). Next.js 16 + Supabase (Postgres, Auth, RLS) + Zod + OpenRouter (IA).

## Puesta en marcha
1. `npm install`
2. `cp .env.example .env.local` y rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (proyecto **de desarrollo**).
3. En el SQL editor de Supabase ejecuta, en orden: `supabase/migrations/0001_base.sql` y `0002_crm.sql`.
4. Ejecuta `supabase/tests/rls_isolation.sql`, `crm_isolation.sql` y `tasks_logic.sql`, `priority_rules.sql` y `privacy_ai.sql`: deben devolver `RLS OK`, `CRM RLS OK`, `TAREAS OK`, `PRIORIDAD OK` y `PRIVACIDAD E IA OK`. Tests de la aplicación: `npm test`.
5. Auth > URL Configuration: añade `http://localhost:3000/auth/callback` a los redirects permitidos.
6. `npm run dev`

## Estado por etapas
- [x] Etapa 1 · Base: auth, agencias, perfiles, RLS, pipeline configurable
- [x] Etapa 2 · CRM: leads, propiedades, relación lead↔propiedad, pipeline, historial de actividades
- [x] Etapa 3 · Seguimientos y "Tu día comercial" (vencidos, hoy, sin próximo paso, inactivos, próximas; falta la sección de visitas, Etapa 6)
- [x] Etapa 4 · Priorización por reglas explicables (migración `0004_priority.sql`, páginas Hoy, Atención y Ajustes)
- [x] Etapa 5 · Copiloto IA con OpenRouter: asistente en la ficha, generador de mensajes (editable, estados generado/editado/marcado como enviado), analizador de conversaciones, límites en backend
- [x] Importación CSV de contactos y propiedades (con deshacer), páginas legales, exportación y borrado de datos (RGPD)
- [ ] Etapa 6 · Visitas
- [ ] Etapa 7 · Suscripciones y límites
- [ ] Etapa 8 · Calidad

## Verificado hasta ahora
`npm run build`, `npm run lint` y `npm test` (27 tests) pasan. Las 6 migraciones y los 5 tests SQL pasan en un PostgreSQL 16 local con el esquema `auth` emulado. **No se han ejecutado contra un Supabase real, ni contra OpenRouter real, ni probado en navegador.**

## Despliegue y auditoría
- Variables de entorno para Vercel: `docs/vercel-env.md` y `vercel.env.template`.
- Estado de preparación para demo: `docs/auditoria-demo.md`.

## Validación comercial
Ver `docs/validacion-demo.md`.

## Seguridad
- `agency_id` se rellena en base de datos con la identidad autenticada; nunca se envía desde el frontend.
- Claves de servicio, IA y Stripe solo en variables de entorno del servidor.
