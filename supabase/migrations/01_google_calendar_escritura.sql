-- 01 — Permisos mínimos por cuenta de Google Calendar.
-- Qué hace: agrega `escritura` a pnp_google_calendar. false = la cuenta se conectó solo para VER
--           (permiso calendar.events.readonly) y la app nunca escribe en ella.
-- Seguro: aditivo e idempotente; las cuentas existentes quedan en true (ya tenían permiso de escritura).
-- Depende de: ninguna migración previa (la tabla ya existe en supabase_setup.sql).
-- Orden: ejecutar ANTES de desplegar la función google-calendar que lee/escribe `escritura`:
--        supabase functions deploy google-calendar

alter table public.pnp_google_calendar
  add column if not exists escritura boolean not null default true;

comment on column public.pnp_google_calendar.escritura is
  'false = conectada solo con permiso de lectura (calendar.events.readonly); la app no escribe en ella.';
