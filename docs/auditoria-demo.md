# Auditoría y preparación para demo (6 nov 2026)

## Veredicto
**Listo para demos privadas y acompañadas con datos propios del agente, una vez ejecutadas las migraciones en un Supabase real y comprobado el flujo en navegador. No listo para ofrecerlo al mercado de forma abierta.**

## Verificado de verdad
- `npm run build` y `npm run lint`: sin errores.
- 4 migraciones y 4 tests SQL (aislamiento entre agencias, CRM, seguimientos, priorización) ejecutados en PostgreSQL 16 local con `auth` emulado. Esto destapó un fallo que habría impedido todo registro (`ON CONFLICT` con restricción diferible), ya corregido.
- Auditoría de permisos: un agente no puede cambiar ajustes, renombrar la agencia, borrar etapas, cambiar su agencia ni ejecutar la función interna de alta; `anon` no ve datos.
- Servidor en ejecución: rutas públicas 200, rutas privadas redirigen a `/login`, cabeceras de seguridad presentes.
- Dependencias de producción: 0 vulnerabilidades (`npm audit --omit=dev`). Las 8 moderadas son de herramientas de desarrollo (eslint).
- Sin secretos en el repositorio.

## NO verificado
- Ejecución contra un Supabase real (auth real, PostgREST, correos de confirmación).
- Uso en navegador y en móvil. Nadie ha visto aún las pantallas.
- Rendimiento con volumen de datos.

## Bloqueadores para mostrarlo al mercado
1. **Sin IA.** La propuesta ("asistente comercial con IA") aún no existe: hoy es CRM + seguimiento + priorización por reglas. Hay que decidirlo: construir la Etapa 5 o vender explícitamente lo que hay.
2. **Sin importación de contactos.** Un agente no va a teclear su cartera en una demo. Una importación CSV es probablemente lo que más condiciona que cargue datos reales.
3. **RGPD incompleto.** Faltan política de privacidad, términos, exportación y borrado de datos. Se guardan datos personales de terceros.
4. **Sin prueba gratuita ni cobro.** No se puede cerrar una venta (Etapa 7).
5. **Correo de Supabase por defecto**: límite muy bajo; configurar SMTP propio antes de demos con varios registros.

## Huecos funcionales (no bloquean una demo guiada)
- No se puede eliminar un lead ni una propiedad; no se editan ni cancelan seguimientos (solo completar o posponer).
- No hay invitaciones: el modelo admite varios usuarios por agencia, pero la interfaz no permite añadirlos.
- Sin visitas (Etapa 6): falta la regla "visita sin seguimiento".
- Listados limitados a 100 elementos, sin paginación.
- Sin límite de registros ni captcha en el alta.
- Las reglas de priorización usan las claves de las 8 etapas iniciales; una etapa nueva creada por el propietario no tiene reglas propias.

## Siguiente paso recomendado
1. Ejecutar migraciones y tests en Supabase y probar el flujo completo en móvil y ordenador.
2. Añadir importación CSV y páginas legales mínimas.
3. Decidir sobre la IA (Etapa 5) y la prueba gratuita (Etapa 7) antes de salir al mercado.
