# Migraciones de Supabase

Cada cambio de esquema es **un archivo numerado**, para subirlas **una por una y en orden**:

```
01_google_calendar_escritura.sql
02_siguiente_cambio.sql
03_...
```

## Reglas
1. **Un cambio por archivo**, con el siguiente número (`NN_nombre_corto.sql`, dos dígitos, snake_case).
2. **Idempotente** (`if not exists`, `drop … if exists`): ejecutarla dos veces no rompe nada.
3. Encabezado con: qué hace, si es seguro/aditivo, de qué migración depende y qué debe hacerse antes o después (por ejemplo, desplegar una función).
4. **Nunca se edita una migración ya aplicada**; si hay que corregirla, se crea una nueva.
5. Cada cambio también se refleja en `supabase_setup.sql` (la foto completa para instalar desde cero) y se anota en el `CHANGELOG.md`.
6. Una Edge Function que dependa de una migración se despliega **después** de aplicarla.

## Cómo aplicarlas
Supabase → **SQL Editor → New query** → pegar el contenido del archivo → **Run**. Luego marcar la fila de la tabla de abajo.
(Los nombres `NN_` no siguen el formato de timestamp de la CLI de Supabase: están pensados para ejecución manual en orden.)

## Estado
| # | Archivo | Qué hace | Aplicada |
|---|---------|----------|----------|
| 01 | `01_google_calendar_escritura.sql` | Columna `escritura`: cuentas de Google conectadas solo para ver | ☐ pendiente |

## Línea base (anterior a esta convención)
Todo lo anterior vive en `supabase_setup.sql` y ya está aplicado en el proyecto `fiplfsuhsqibzrpvjvbx` (verificado el 2026-10-26): tablas `pnp_*` (incluidas rocas y resúmenes por correo), columnas `direccion` y `google_sub` de `pnp_google_calendar`, políticas RLS, realtime y el cron `resumen-correo`.
`supabase/resumen_cron.sql` es configuración con secretos del cron, no una migración: se edita y ejecuta a mano.
