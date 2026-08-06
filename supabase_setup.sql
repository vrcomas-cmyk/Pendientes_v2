-- ============================================================================
-- Pendientes Pro — esquema de Supabase (Fase 8.9)
-- ============================================================================
-- Idempotente: usa CREATE TABLE IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY
-- IF EXISTS antes de recrear, así que correrlo de nuevo sobre una base ya
-- provisionada no falla ni duplica nada. Pensado para pegarse completo en el
-- SQL Editor de Supabase.
--
-- Extraído del código real (src/sync.tsx, src/lib/espacio.ts,
-- supabase/functions/google-calendar/index.ts), no inventado — cada tabla y
-- columna de acá tiene un lector/escritor concreto en la app. Ver AUDITORIA.md
-- y CHANGELOG.md Fase 8.9 para el detalle de qué archivo usa qué.
--
-- Todas las tablas de la app usan el prefijo `pnp_` para no chocar con otros
-- proyectos que compartan el mismo proyecto de Supabase (ver README.md).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- pnp_espacios: la unidad de cuenta compartida (sync multi-dispositivo/usuario).
-- NO confundir con el "Espacio" del Personal Workspace (Fase 4, src/types.ts) —
-- ese es solo una agrupación visual de proyectos, vive enteramente en el
-- cliente (localStorage) y no tiene tabla propia. Ver glosario en
-- .claude/skills/workspace-doctrine/SKILL.md.
-- ----------------------------------------------------------------------------
create table if not exists pnp_espacios (
  id         uuid primary key default gen_random_uuid(),
  config     jsonb not null default '{}'::jsonb, -- { columnas: ColumnaKanban[] } — compartido por todo el espacio
  creado     timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- pnp_espacio_miembros: quién pertenece a qué espacio, y con qué rol.
-- 'padre' = creó el espacio (puede invitar/expulsar); 'hija' = se unió por
-- invitación (src/sync.tsx, google-calendar/index.ts).
-- ----------------------------------------------------------------------------
create table if not exists pnp_espacio_miembros (
  user_id    uuid not null references auth.users(id) on delete cascade,
  espacio_id uuid not null references pnp_espacios(id) on delete cascade,
  email      text not null,
  rol        text not null check (rol in ('padre', 'hija')),
  creado     timestamptz not null default now(),
  primary key (user_id, espacio_id)
);
create index if not exists idx_espacio_miembros_espacio on pnp_espacio_miembros(espacio_id);

-- ----------------------------------------------------------------------------
-- pnp_invitaciones: códigos para que una segunda cuenta se una a un espacio
-- como 'hija'. Solo 'padre' puede crearlas (aplicado por RLS, no por la app).
-- ----------------------------------------------------------------------------
create table if not exists pnp_invitaciones (
  id         uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references pnp_espacios(id) on delete cascade,
  codigo     text not null unique default substr(md5(random()::text), 1, 8),
  email      text,
  creado_por uuid not null references auth.users(id) on delete cascade,
  creado     timestamptz not null default now(),
  expira     timestamptz not null default (now() + interval '7 days')
);

-- ----------------------------------------------------------------------------
-- Entidades de dominio: pnp_pendientes / pnp_notas / pnp_proyectos / pnp_eventos.
-- Las cuatro comparten el mismo sobre genérico — el objeto completo del lado
-- del cliente (Pendiente/Nota/Proyecto/EventoCalendario, ver src/types.ts) va
-- en `data` como jsonb; solo `id`/`espacio_id`/`user_id`/`updated_at` son
-- columnas reales que la app consulta directamente (src/sync.tsx). Reconciliar
-- conflictos (last-write-wins + unión de comentarios/adjuntos/subtareas) es
-- responsabilidad del cliente (src/lib/sync-merge.ts), no de esta base.
-- ----------------------------------------------------------------------------
create table if not exists pnp_pendientes (
  id         uuid primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  espacio_id uuid not null references pnp_espacios(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists idx_pendientes_espacio on pnp_pendientes(espacio_id);

create table if not exists pnp_notas (
  id         uuid primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  espacio_id uuid not null references pnp_espacios(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists idx_notas_espacio on pnp_notas(espacio_id);

create table if not exists pnp_proyectos (
  id         uuid primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  espacio_id uuid not null references pnp_espacios(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists idx_proyectos_espacio on pnp_proyectos(espacio_id);

create table if not exists pnp_eventos (
  id         uuid primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  espacio_id uuid not null references pnp_espacios(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists idx_eventos_espacio on pnp_eventos(espacio_id);

-- ----------------------------------------------------------------------------
-- pnp_google_calendar: tokens OAuth de las cuentas de Google conectadas. Solo
-- la Edge Function (supabase/functions/google-calendar) la toca, siempre con
-- la service_role key — nunca se consulta directo desde el cliente. Por eso
-- RLS queda deny-all para authenticated/anon (comentario explícito en el
-- código fuente, google-calendar/index.ts).
-- ----------------------------------------------------------------------------
create table if not exists pnp_google_calendar (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  espacio_id    uuid not null references pnp_espacios(id) on delete cascade,
  refresh_token text not null,
  access_token  text,
  expires_at    timestamptz,
  google_email  text not null,
  calendar_id   text not null default 'primary',
  modo_espejo   text not null default 'todo' check (modo_espejo in ('todo', 'propio')),
  updated_at    timestamptz not null default now(),
  unique (espacio_id, google_email)
);

-- ============================================================================
-- RLS: todas las tablas de dominio son visibles/editables por cualquier
-- miembro del mismo espacio (padre e hija comparten datos), no solo por quien
-- subió la fila — así lo necesita la sincronización multi-cuenta.
-- ============================================================================
alter table pnp_espacios          enable row level security;
alter table pnp_espacio_miembros  enable row level security;
alter table pnp_invitaciones      enable row level security;
alter table pnp_pendientes        enable row level security;
alter table pnp_notas             enable row level security;
alter table pnp_proyectos         enable row level security;
alter table pnp_eventos           enable row level security;
alter table pnp_google_calendar   enable row level security;

-- Helper: ids de espacio a los que pertenece el usuario autenticado.
create or replace function pnp_mis_espacios()
returns setof uuid
language sql stable security definer
set search_path = public
as $$
  select espacio_id from pnp_espacio_miembros where user_id = auth.uid();
$$;

drop policy if exists "miembros ven su espacio" on pnp_espacios;
create policy "miembros ven su espacio" on pnp_espacios
  for select using (id in (select pnp_mis_espacios()));
drop policy if exists "miembros actualizan su espacio" on pnp_espacios;
create policy "miembros actualizan su espacio" on pnp_espacios
  for update using (id in (select pnp_mis_espacios()));

drop policy if exists "miembros ven la membresía de su espacio" on pnp_espacio_miembros;
create policy "miembros ven la membresía de su espacio" on pnp_espacio_miembros
  for select using (espacio_id in (select pnp_mis_espacios()));
drop policy if exists "solo padre gestiona miembros" on pnp_espacio_miembros;
create policy "solo padre gestiona miembros" on pnp_espacio_miembros
  for delete using (
    espacio_id in (select espacio_id from pnp_espacio_miembros where user_id = auth.uid() and rol = 'padre')
  );

drop policy if exists "padre crea invitaciones de su espacio" on pnp_invitaciones;
create policy "padre crea invitaciones de su espacio" on pnp_invitaciones
  for insert with check (
    espacio_id in (select espacio_id from pnp_espacio_miembros where user_id = auth.uid() and rol = 'padre')
  );
drop policy if exists "miembros ven invitaciones de su espacio" on pnp_invitaciones;
create policy "miembros ven invitaciones de su espacio" on pnp_invitaciones
  for select using (espacio_id in (select pnp_mis_espacios()));

drop policy if exists "miembros CRUD pendientes de su espacio" on pnp_pendientes;
create policy "miembros CRUD pendientes de su espacio" on pnp_pendientes
  for all using (espacio_id in (select pnp_mis_espacios())) with check (espacio_id in (select pnp_mis_espacios()));

drop policy if exists "miembros CRUD notas de su espacio" on pnp_notas;
create policy "miembros CRUD notas de su espacio" on pnp_notas
  for all using (espacio_id in (select pnp_mis_espacios())) with check (espacio_id in (select pnp_mis_espacios()));

drop policy if exists "miembros CRUD proyectos de su espacio" on pnp_proyectos;
create policy "miembros CRUD proyectos de su espacio" on pnp_proyectos
  for all using (espacio_id in (select pnp_mis_espacios())) with check (espacio_id in (select pnp_mis_espacios()));

drop policy if exists "miembros CRUD eventos de su espacio" on pnp_eventos;
create policy "miembros CRUD eventos de su espacio" on pnp_eventos
  for all using (espacio_id in (select pnp_mis_espacios())) with check (espacio_id in (select pnp_mis_espacios()));

-- pnp_google_calendar: sin políticas para 'authenticated'/'anon' → deny-all por
-- defecto una vez RLS está activo. Solo la service_role (que ignora RLS) la toca.

-- ============================================================================
-- RPCs
-- ============================================================================

-- Resuelve el espacio del usuario actual: si ya pertenece a uno, lo devuelve;
-- si es la primera vez, crea un espacio nuevo y lo vuelve 'padre'.
create or replace function pnp_espacio_actual()
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  eid uuid;
begin
  select espacio_id into eid from pnp_espacio_miembros where user_id = auth.uid() limit 1;
  if eid is not null then
    return eid;
  end if;

  insert into pnp_espacios default values returning id into eid;
  insert into pnp_espacio_miembros (user_id, espacio_id, email, rol)
    values (auth.uid(), eid, coalesce(auth.jwt() ->> 'email', ''), 'padre');
  return eid;
end;
$$;

-- Canjea un código de invitación: une al usuario actual al espacio de la
-- invitación como 'hija'. No falla si el código no existe o ya expiró — solo
-- no hace nada (la app únicamente revisa `error`, no el resultado).
create or replace function pnp_canjear_invitacion(p_codigo text)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  inv pnp_invitaciones%rowtype;
begin
  select * into inv from pnp_invitaciones where codigo = p_codigo and expira > now();
  if not found then
    return false;
  end if;

  insert into pnp_espacio_miembros (user_id, espacio_id, email, rol)
    values (auth.uid(), inv.espacio_id, coalesce(auth.jwt() ->> 'email', ''), 'hija')
    on conflict (user_id, espacio_id) do nothing;
  delete from pnp_invitaciones where id = inv.id; -- de un solo uso
  return true;
end;
$$;

-- ============================================================================
-- Realtime: la app se suscribe a estas cuatro tablas (evento '*') más UPDATE
-- en pnp_espacios (src/sync.tsx) para reflejar cambios de otros dispositivos
-- sin refrescar. Requiere que la tabla esté en la publicación `supabase_realtime`.
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'pnp_pendientes') then
    alter publication supabase_realtime add table pnp_pendientes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'pnp_notas') then
    alter publication supabase_realtime add table pnp_notas;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'pnp_proyectos') then
    alter publication supabase_realtime add table pnp_proyectos;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'pnp_eventos') then
    alter publication supabase_realtime add table pnp_eventos;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'pnp_espacios') then
    alter publication supabase_realtime add table pnp_espacios;
  end if;
end $$;

-- ============================================================================
-- Storage: bucket de adjuntos (src/lib/adjuntos.ts). Rutas con forma
-- `${userId}/${taskId}/${archivo}` — la política de acceso replica el mismo
-- criterio "miembro del espacio" vía el primer segmento de la ruta siendo un
-- usuario del mismo espacio no es directamente expresable en Storage RLS sin
-- una función; se deja acceso a usuarios autenticados y el filtrado real de
-- "quién ve qué" ocurre a nivel de aplicación (igual que las capturas hoy).
-- ============================================================================
insert into storage.buckets (id, name, public)
  values ('pnp_adjuntos', 'pnp_adjuntos', false)
  on conflict (id) do nothing;

drop policy if exists "usuarios autenticados administran pnp_adjuntos" on storage.objects;
create policy "usuarios autenticados administran pnp_adjuntos" on storage.objects
  for all using (bucket_id = 'pnp_adjuntos' and auth.role() = 'authenticated')
  with check (bucket_id = 'pnp_adjuntos' and auth.role() = 'authenticated');
