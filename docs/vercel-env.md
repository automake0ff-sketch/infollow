# Variables de entorno en Vercel

Plantilla lista para pegar: `vercel.env.template`.

## Obligatorias
| Variable | Qué es | Visible en el navegador |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Sí (pública por diseño) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave `anon` / publishable | Sí (segura gracias a RLS) |
| `OPENROUTER_API_KEY` | Clave de OpenRouter | **No** (solo servidor) |

## Recomendadas / opcionales
| Variable | Para qué |
|---|---|
| `OPENROUTER_MODELS` | Modelos en orden de preferencia, separados por comas. Vacío = `openrouter/free` |
| `OPENROUTER_DATA_COLLECTION` | `deny` (por defecto) excluye proveedores que pueden entrenar con tus datos |
| `OPENROUTER_APP_URL` | URL de tu app (atribución) |
| `NEXT_PUBLIC_LEGAL_NAME`, `_TAX_ID`, `_ADDRESS`, `_EMAIL` | Datos del titular en las páginas legales |
| `NEXT_PUBLIC_LEGAL_REVIEWED` | `true` solo tras revisión jurídica |

## No añadir
`SUPABASE_SERVICE_ROLE_KEY` (salta la RLS y nada la usa todavía), Stripe.

## IA gratuita de OpenRouter: límites reales
- 20 peticiones/minuto y **50 al día** (1.000/día si has comprado alguna vez ≥ 10 $ de créditos). El límite es **de toda la cuenta**, no por clave ni por usuario.
- La aplicación impone sus propios límites en backend: por agencia (`agency_settings.ai_daily_limit`, 15/día por defecto) y global (`platform_settings.ai_global_daily_limit`, 45 por defecto). Si compras 10 $ de créditos, súbelo en el SQL editor: `update platform_settings set value = 950 where key = 'ai_global_daily_limit';`
- Con 50 usos/día en total, solo cabe una demo ligera con pocas agencias. Para vender, necesitarás pasar a un modelo de pago (cambiar `OPENROUTER_MODELS` a un ID de pago; no requiere tocar código).
- Los modelos gratuitos aparecen y desaparecen sin aviso y pueden estar saturados en horas punta.
- Privacidad: con `deny`, OpenRouter solo enruta a proveedores que no recopilan prompts; si no hay ninguno gratuito disponible para tu petición, la IA fallará en vez de enviar los datos a un proveedor que sí entrena.

## Pasos
1. Supabase (SQL editor): ejecuta `supabase/migrations/0001…0006` en orden y después los 5 tests de `supabase/tests/` (cada uno termina con un mensaje `… OK`).
2. Vercel: importa `automake0ff-sketch/infollow` (framework Next.js) y pega las variables en Production y Preview.
3. Supabase > Authentication > URL Configuration: Site URL `https://TU-DOMINIO.vercel.app` y Redirect URL `https://TU-DOMINIO.vercel.app/auth/callback` (y `http://localhost:3000/auth/callback` en desarrollo).
4. Supabase > Authentication > SMTP: configura un SMTP propio (el correo por defecto tiene un límite muy bajo).
5. Redespliega tras cambiar variables: solo se aplican a despliegues nuevos.

## Comprobación tras desplegar
Registro (con aceptación de términos) → confirmar email → `/importar` con la plantilla → `/hoy` → ficha de un lead → "Generar con IA" → `/analizador` → Ajustes → Exportar.
