# Resúmenes por correo (Hito 3) — puesta en marcha

El código ya está listo; faltan credenciales y despliegue (nada de esto se puede hacer desde el repo).
**No prometas envíos hasta completar la prueba del paso 6 con tu configuración real.**

## Qué envía
- **Diario:** pendientes abiertos con fecha límite ese día + eventos propios del día, ordenados por hora.
- **Semanal (lunes–domingo):** una sección por día. **El lunes se manda un solo correo** (el semanal, que ya incluye el lunes); nunca el diario además.
- No se envían correos vacíos (queda registrado como `omitido`).
- **Incluye los eventos de Google Calendar** de las cuentas conectadas (menos las «Solo enviar»), junto a los eventos y pendientes de la app, en tu zona horaria; los de todo el día van primero. Usa los secretos `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` que ya tiene `google-calendar`. Si una cuenta falla, el correo sale igual con una nota al pie.
- Muestra además una sección **Vencidos** y el **proyecto** de cada pendiente.
- Alcance: todo lo del espacio compartido del usuario (no se filtra por responsable).

## Piezas
| Pieza | Archivo |
|---|---|
| Lógica pura (zona horaria, reglas, plantilla) | `supabase/functions/_shared/resumen.ts` (probada en `tests/resumen-correo.test.ts`) |
| Edge Function (cron, prueba, baja) | `supabase/functions/resumen-correo/index.ts` |
| Tablas + RLS | `supabase_setup.sql` (`pnp_resumen_prefs`, `pnp_resumen_envios`) |
| Programación | `supabase/resumen_cron.sql` (con placeholders) |
| Preferencias en la app | Ajustes → «Resumen por correo» |

## ¿Por qué el cron corre cada 15 minutos?
El cron solo «toca la puerta»; la función decide por usuario si ya le toca (su hora local, zona, días y pausa). Cada 15 min significa que el correo sale como máximo ~15 min después de la hora elegida, que un fallo se reintenta en el siguiente ciclo y que sirve para cualquier hora/zona sin programar un cron por usuario. Es barato (una consulta de preferencias) y seguro (idempotente). Si prefieres menos ejecuciones, cámbialo a cada hora (`0 * * * *`): el correo saldría hasta ~1 h después de la hora elegida.

## Idempotencia y reintentos
`pnp_resumen_envios` tiene `unique (user_id, tipo, clave)`; la clave es la fecha local (diario) o la fecha del lunes (semanal). El cron corre cada 15 min y es seguro repetirlo: un envío ya `enviado` nunca se reenvía; uno con `error` se reintenta hasta 3 veces; uno `enviando` caduca a los 15 min. Además se manda `Idempotency-Key` al proveedor.

## Pasos
1. **Proveedor de correo (Resend):** crea cuenta, **verifica un dominio** remitente (SPF/DKIM) y crea una API key.
2. **Base de datos:** ejecuta `supabase_setup.sql` (idempotente).
3. **Secretos de la función** (Dashboard → Edge Functions → Secrets, o CLI):
   ```
   supabase secrets set CRON_SECRET=<valor-largo-aleatorio> RESEND_API_KEY=<key> RESUMEN_FROM="Pendientes Pro <resumen@tu-dominio.com>"
   ```
4. **Desplegar** (sin verificación JWT porque la baja y el cron no llevan JWT; cada rama valida lo suyo):
   ```
   supabase functions deploy resumen-correo --no-verify-jwt
   ```
5. **Cron:** habilita `pg_cron` y `pg_net`, edita `supabase/resumen_cron.sql` (`<PROJECT_REF>` y `<CRON_SECRET>`) y ejecútalo en el SQL Editor.
6. **Probar:** en la app → Ajustes → Resumen por correo → guarda preferencias → «Enviar prueba». Revisa bandeja y spam, y que el enlace «Dejar de recibir» funcione. Para el ciclo real, mira `select * from pnp_resumen_envios order by id desc;`.

## Seguridad
- El navegador nunca recibe claves del proveedor; solo guarda preferencias (RLS: cada usuario ve y edita solo las suyas).
- `x-cron-secret` protege el ciclo de envío; la baja usa un token UUID por usuario; la prueba exige JWT válido.
- Los correos llevan `List-Unsubscribe` (baja en un clic).
