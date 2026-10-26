-- Programación del resumen por correo (Hito 3). NO se ejecuta desde la app: pégalo en el SQL Editor
-- de Supabase DESPUÉS de desplegar la función y de definir sus secretos (ver RESUMEN_CORREO_SETUP.md).
--
-- 1) Reemplaza <PROJECT_REF> y <CRON_SECRET> (el MISMO valor que el secreto CRON_SECRET de la función).
-- 2) Requiere las extensiones pg_cron y pg_net (Database → Extensions).
--
-- Corre cada 15 minutos: la función decide por usuario si ya le toca (hora local, zona, días,
-- pausa) y es idempotente, así que ejecutarla de más nunca duplica correos.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('resumen-correo') where exists (select 1 from cron.job where jobname = 'resumen-correo');

select cron.schedule(
  'resumen-correo',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := 'https://fiplfsuhsqibzrpvjvbx.supabase.co/functions/v1/resumen-correo',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body    := '{}'::jsonb
  );
  $$
);
