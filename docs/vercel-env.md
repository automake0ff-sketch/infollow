# Variables de entorno en Vercel

## Obligatorias hoy (2)
| Variable | Valor | Visible en el navegador |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Sí (es pública por diseño) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave `anon` / publishable | Sí (segura gracias a RLS) |

Usa un proyecto Supabase **de demo, separado del de producción futura**.

## No añadir
La clave `service_role` salta la RLS: no la añadas hasta que un código servidor la necesite (Stripe, Etapa 7) y nunca con prefijo `NEXT_PUBLIC_`.

## Pasos
1. Supabase: ejecuta en el SQL editor `supabase/migrations/0001…0004` en orden, y después los 4 tests de `supabase/tests/` (cada uno termina con un mensaje `… OK`).
2. Vercel: importa el repo `automake0ff-sketch/infollow`, framework Next.js, y pega las 2 variables en Production y Preview.
3. Supabase > Authentication > URL Configuration:
   - Site URL: `https://TU-DOMINIO.vercel.app`
   - Redirect URLs: `https://TU-DOMINIO.vercel.app/auth/callback` (y `http://localhost:3000/auth/callback` para desarrollo).
4. Supabase > Authentication > SMTP: configura un SMTP propio. El correo por defecto de Supabase tiene un límite muy bajo y bloqueará las demos con varios registros.
5. Tras cambiar variables, redespliega: Vercel solo las aplica a despliegues nuevos.

## Comprobación tras desplegar
Registrar usuario → confirmar email → entrar en `/hoy` → crear lead → programar seguimiento → ver `/atencion`.
