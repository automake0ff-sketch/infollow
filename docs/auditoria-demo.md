# Auditoría y preparación para demo (actualizada tras importación, legal e IA)

## Veredicto
**Listo para demos privadas y acompañadas con datos propios del agente, una vez ejecutadas las migraciones en un Supabase real, configurada la clave de OpenRouter y comprobado el flujo en navegador. Todavía no para vender abiertamente.**

## Verificado de verdad
- `npm run build`, `npm run lint`, `tsc` y 27 tests de aplicación (importación, plantillas, cliente de IA, minimización de datos, prompts).
- 6 migraciones y 5 tests SQL en PostgreSQL 16 local con `auth` emulado: aislamiento entre agencias, CRM, seguimientos, priorización, términos obligatorios, límites de IA por agencia y globales, borrado de agencia, permisos por rol.
- Fallos reales encontrados y corregidos al probar: (1) el alta de usuarios fallaba por un `ON CONFLICT`; (2) **el propietario podía subirse su propio cupo de IA** (ahora solo puede editar las columnas permitidas); (3) importes con separador de miles ("250.000 €") se leían como 250 en la salida de la IA.
- Servidor en marcha: páginas legales públicas; `/importar`, `/analizador`, `/api/export` y plantillas exigen sesión.
- Privacidad en IA: solo nombre de pila, sin teléfono/email/apellidos; teléfonos y emails en texto libre se ocultan; `data_collection: deny` por defecto; las conversaciones pegadas no se guardan.

## NO verificado
- Ejecución contra un Supabase real (auth, PostgREST, correos).
- Llamadas reales a OpenRouter: desde este entorno no hay acceso a su API. El cliente se probó con respuestas simuladas; la calidad real de los modelos gratuitos y su disponibilidad con `data_collection: deny` hay que comprobarlas con tu clave.
- La importación completa a través de la interfaz (se probó el análisis, mapeo y validación; la inserción por lotes contra Supabase real no).
- Uso en navegador y móvil. Rendimiento con volumen.

## Riesgos y bloqueadores restantes
1. **Capacidad de la IA gratuita**: 50 peticiones/día en toda la cuenta de OpenRouter (1.000 con ≥ 10 $ de créditos comprados una vez). Sirve para demos ligeras, no para una base de clientes. Cambiar a un modelo de pago es solo configuración.
2. **Calidad de la IA gratuita**: modelos que rotan y pueden degradar o desaparecer sin aviso; la salida estructurada del analizador puede fallar más a menudo (en ese caso no consume cupo).
3. **Textos legales sin revisar**: son un modelo con campos `[PENDIENTE]` (titular, región de alojamiento, plazos de copias, precio y condiciones). Requieren revisión de un profesional antes de operar. Además, la política de privacidad debe reflejar el estado real de OpenRouter y sus proveedores.
4. **Sin prueba gratuita ni cobro** (Etapa 7).
5. **Correo de Supabase por defecto**: configurar SMTP propio.
6. Sin invitación de usuarios a una agencia; sin eliminar leads/propiedades individualmente; sin paginación más allá de 100; sin visitas (Etapa 6); sin captcha en el alta.

## Siguiente paso recomendado
1. Ejecutar migraciones y tests en Supabase, desplegar con las variables de `vercel.env.template` y recorrer el flujo en móvil y ordenador.
2. Hacer 3–5 demos acompañadas con datos propios del agente (ver `docs/validacion-demo.md`).
3. Con la señal de interés: revisión jurídica, Etapa 7 (prueba y cobro) y modelo de IA de pago.
