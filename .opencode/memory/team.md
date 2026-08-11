# Memoria — Team (Orquestador)

> Protocolo: LEE este archivo al empezar y AÑADE tu entrada al final al terminar. Nunca borres historial.

## Contexto
Líder del Equipo de Desarrollo de Pendientes Pro. Ejecuta el loop F0→F8 delegando en especialistas.
Pipeline obligatorio: `npm run lint` → `npm run build` → `npm run test`.

## Pendientes
- (ninguno en curso)

## Historial
### 2026-08-09 — sesión inicial
- Creación del equipo de desarrollo con memoria por agente. Sin sprints aún.

### 2026-08-09 — H1 «Minuta universal: viñetas anidadas → subtareas» | ✓ cerrado
- Sprint completo del loop F0→F8 con H1 de la revisión de producto.
- Entregado: `parsearMinuta`/`subtareaDeLinea` (app-utils), `agregarSubtarea` con extra
  aditivo (store), extracción anidada + Enter indentado (NotesView), CSS `.nota-sub`.
- Verificación: lint ✓ · build ✓ · test 155/155 ✓ (8 tests nuevos en `tests/minuta.test.ts`).
- SW bumped v11→v12; CHANGELOG actualizado. Sin bloqueos; 0 reintentos.
- Siguiente candidato (H2): promoción pendiente↔proyecto y subtarea→pendiente (A2+A3 de la revisión).

### 2026-08-09 — H4 «Confirmación antes de descartar una edición» | ✓ cerrado
- Sprint del loop F0→F8 cerrando el Epic 1 completo (PDS §5.4). Sin bloqueos; 0 reintentos.
- Pipeline verde: lint ✓ · build ✓ · test 185/185 ✓. SW v15→v16; CHANGELOG + backlog actualizados.
- Próximos: EPIC 2 (sidebar/navegación) y EPIC 3 (reducción de "Hoy").

### 2026-08-10 — H5 «Espacios como 5º destino primario, Pendientes a Sistema» | ✓ cerrado
- Primer ticket del Epic 2 (PDS §5.3): navegación primaria = Hoy·Inbox·Proyectos·Notas·Espacios.
- F1: producto decidió 5º destino «Espacios» como vista nueva reusando toda la infra (store,
  `espacioActualId`, NuevoEspacioDialog, filtrado de ProyectosView); modelo de datos intacto.
- F4: `EspaciosView.tsx` + reorden de `VISTAS_PRIMARIAS`/`VISTAS_SISTEMA`, atajos 1-8, Paleta de
  comandos, badge `nAbiertos` reubicado, bloque sidebar Espacios duplicado eliminado.
- Verificación: lint ✓ · build ✓ · test 190/190 ✓ (5 nuevos en `tests/navegacion.test.tsx`);
  QA Playwright real 21/21 (escritorio + móvil, sin errores de consola). SW v16→v17.
- Lecciones: subagente `documentador` devolvió salida vacía en F7 → orquestador ejecutó F7 directo
  (CHANGELOG H5, DECISIONS_LOG entrada 2026-08-10, LOG.md, team.md). Re-lanzar F5 devolvió vacío;
  el 2º intento con más control funcionó.
- Siguiente candidato del Epic 2 (feature 2): colapsar/expandir selector de Espacio activo +
  filtrado de contexto multi-vista; luego feature 3 (Sistema con Ajustes/Datos/Ayuda) y feature 5
  (nombrado unificado Pendientes/Tareas).

### 2026-08-10 — H6 «Selector de Espacio activo en móvil» | ✓ cerrado
- Ejecutado fuera de opencode (Claude Code replicó el loop F0→F8 a pedido del usuario, sin acceso
  al CLI de opencode). Ticket: escritorio ya tenía el selector colapsable (H5); móvil no tenía
  ninguna forma de cambiar `espacioActualId` sin abandonar la vista actual.
- F4: sección colapsable en el menú «⋮» de `src/App.tsx`, mismo formato de etiqueta y conteo de
  proyectos que el dropdown de escritorio; reusa `espacioActualId`/`setEspacioActualId` del
  ui-store sin tocar su firma. Eliminado import muerto `PROYECTO_COLORES` (huérfano de H5).
- F3/F5: `tests/espacio-mobile.test.tsx` nuevo (2 casos, RED→GREEN). Además se encontraron 3
  fallos preexistentes en `tests/espacio-activo.test.tsx` (RED de un ticket ya implementado pero
  con aserciones que no toleraban el icono en el aria-label, p. ej. `/Espacio activo: Trabajo/i`
  vs `"Espacio activo: 🏢 Trabajo"`) — mismo patrón que la lección de H4: error de la propia
  aserción, no un defecto. Corregidas sin tocar la implementación.
- Verificación: lint ✓ · build ✓ · test 207/207 ✓. SW v17→v18; CHANGELOG (H6) y
  PRODUCT_BACKLOG.md («Selector de Espacio activo» → Hecho) actualizados.
- Siguiente candidato del Epic 2: agrupación «Sistema» en móvil (Ajustes/Datos/Ayuda tras un solo
  punto de entrada) y Panel/Papelera a navegación secundaria.

### 2026-08-10 — H7 «Sincronización de Espacios entre dispositivos» | ✓ cerrado
- Ejecutado fuera de opencode (Claude Code), a pedido del usuario tras una revisión de riesgo de
  pérdida de datos. Hallazgo: `espacios` (Trabajo/Casa/etc.) nunca sincronizaba a Supabase —
  solo `localStorage` — mientras pendientes/notas/proyectos/eventos sí. Un proyecto asignado a un
  espacio sincronizaba, pero el Espacio en sí no llegaba a otro dispositivo: el selector no lo
  listaba ahí y ese proyecto solo aparecía bajo «Todos», nunca filtrable — percibido como pérdida.
- F4: `mergeEspacio` en `sync-merge.ts` (mismo criterio que `mergeProyecto`); `espacios` sumado
  como 5ª colección sincronizada en `sync.tsx` (recalcularPendientes/flush/pull/realtime, idéntico
  patrón a proyectos); `reemplazarTodo` gana 6º parámetro opcional `esp?` (aditivo). Tabla nueva
  `pnp_ctx_espacios` en `supabase_setup.sql` (prefijo `ctx_` para no chocar con `pnp_espacios`, la
  cuenta compartida — ver entrada de decisión en `DECISIONS_LOG.md` 2026-08-10).
  F3/F5: `tests/sync-merge.test.ts` +2 casos para `mergeEspacio`.
- Verificación: lint ✓ · build ✓ · test 209/209 ✓. Sin bump de SW (cambio de sync, no de
  assets/UI). CHANGELOG (H7), DECISIONS_LOG y PRODUCT_BACKLOG.md («Sincronización de Espacios» →
  Hecho) actualizados. Requiere re-correr `supabase_setup.sql` (idempotente) en proyectos ya
  provisionados para que `pnp_ctx_espacios` exista.

### 2026-08-11 — H7b «Fix: migración pendiente de H7 rompía toda la sincronización» | ✓ cerrado
- El usuario reportó no ver registros anteriores. Causa: `pull()`/`flush()` en `sync.tsx`
  trataban `pnp_ctx_espacios` (H7) con el mismo `try` que las 4 tablas críticas — si esa
  tabla nueva no existía aún (migración `supabase_setup.sql` no corrida), su error
  abortaba TODO el pull/flush, así que pendientes/notas/proyectos/eventos tampoco
  sincronizaban. Lección: al agregar una colección nueva a un pipeline de sync ya en
  producción, aislarla en su propio try/catch desde el día uno — un rollout parcial de
  migración (SQL aplicado en un dispositivo/sesión y no en otro) no puede tumbar lo que ya
  funcionaba. Corregido: `pnp_ctx_espacios` ahora vive en su propio try/catch en ambas
  funciones; sin la tabla, Espacios no sincroniza pero el resto sigue intacto.
- Verificación: lint ✓ · build ✓ · test 209/209 ✓ (sin tests nuevos — bug de fontanería de
  red, `sync.tsx` no tiene cobertura unitaria por ser integración con Supabase real).

### 2026-08-11 — Migración H7 aplicada en Supabase real + H7c (supabase_setup.sql al día) | ✓ cerrado
- Aplicada la migración de H7 directo contra el proyecto Supabase real del usuario
  (`fiplfsuhsqibzrpvjvbx`) vía MCP, evitando el bug del SQL Editor del dashboard (inyecta
  `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en medio de funciones plpgsql cuando detecta
  una variable local con nombre parecido a tabla — false positive de su linter, reportado
  por el usuario como `unterminated dollar-quoted string`).
- Hallazgo en el camino: `pnp_ctx_espacios` y su política ya existían (corrida parcial
  previa); solo faltaban 4 tablas en la publicación `supabase_realtime`. Aplicado solo ese
  delta, sin re-ejecutar el resto (idempotente pero innecesario).
- Hallazgo mayor: la función real `pnp_canjear_invitacion` en producción es MÁS avanzada
  que la del repo (valida email, evita doble membresía, marca `aceptada_por`/`aceptada_en`
  en vez de borrar la fila) — de trabajo anterior no reflejado en `supabase_setup.sql`. NO
  se sobrescribió con la versión vieja del repo; en cambio se actualizó el repo (H7c) para
  que el archivo de referencia coincida con lo real. `src/lib/espacio.ts` ya estaba escrito
  contra la versión real, cero cambios de cliente.
- Lección: antes de aplicar una migración "de referencia" contra una base ya viva, comparar
  primero (`list_tables`/`execute_sql` con `pg_get_functiondef`) — el repo puede estar
  desactualizado respecto a lo desplegado, no al revés.