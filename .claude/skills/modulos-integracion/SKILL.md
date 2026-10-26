---
name: modulos-integracion
description: Mapa de módulos de Pendientes Pro y reglas para integrarlos sin mezclarlos — qué es cada módulo, cómo se relacionan (nota→pendiente→proyecto→roca, agenda lateral), dónde vive cada capa (lib pura / store / sync / vista) y cómo añadir uno nuevo manteniendo la interacción fluida. Úsala al crear o modificar cualquier módulo, panel, vista o relación entre entidades de este proyecto.
---

# Módulos de Pendientes Pro: integrados, pero separados

Complementa a `workspace-doctrine` (que fija el *qué no romper*). Esta skill fija el *cómo se conectan los módulos* para que el usuario vea contexto sin cambiar de pantalla.

## Principio rector
**Un dato, una fuente de verdad, muchas perspectivas.** Un módulo nunca copia lo de otro: guarda una *referencia* (`origenNota`, `proyectoId`, `pendienteId`…) y lo muestra en su vista. Pregunta de validación: *¿esto reduce clics, ventanas y tiempo para organizar el día?*

## Mapa de módulos
| Módulo | Entidad / datos | Vista(s) | Lógica pura | Notas de integración |
|---|---|---|---|---|
| Captura rápida | crea `Pendiente`/`Nota`/`EventoCalendario` | barra superior en `App.tsx` (`/`) | `lib/captura.ts`, `parsearLinea` (`lib/app-utils.ts`) | Enter=pendiente, Shift+Enter=nota, Ctrl+Enter=evento, Alt+Enter=salto de línea. 1.ª línea=título. |
| Notas | `Nota` | `views/NotesView.tsx` | `parsearMinuta` | «Extraer viñetas» y «Selección → pendientes» crean `Pendiente` con `origenNota` (no copian texto). |
| Pendientes (incluye la antigua bandeja Inbox = filtro «Sin fecha») | `Pendiente` | Lista/Tablero/Calendario en `views/PendientesView.tsx` | `lib/app-utils.ts`, `lib/columnas.ts` | Núcleo. Todo lo demás lo referencia. |
| Proyectos (pestaña de «Planear» junto a Metas y rocas y Espacios) | `Proyecto` (+`metodo`, `sprint`, `estancamientoDias`) | `views/ProyectosView.tsx`, `components/MetodoProyecto.tsx` | `lib/proyectos.ts` | Tablero/Lista/Scrum/Gantt son *perspectivas* de los mismos pendientes. |
| Agenda | `EventoCalendario` + pendientes con fecha/hora + eventos Google | `views/CalendarioView.tsx` y **panel lateral derecho** `components/PanelAgenda.tsx` | `lib/agenda.ts` (conflictos, dedupe), `lib/googleSync.ts` | Google solo si el usuario marca «Enviar a Google Calendar». |
| Rocas | `Roca` con `actividades[]` embebidas | pestaña «Rocas» de «Planear» → `views/RocasView.tsx` | `lib/rocas.ts` | Bitácora = registro, no tareas. `pendienteId` opcional. |
| Metas | `Meta` | `views/MetasView.tsx` | `progresoMeta` (store) | Agrupa proyectos. |
| Contactos / Equipo | `Contacto` | `ContactosView`, `EquipoView` | — | Referenciados por `responsableId`/`solicitanteId`. |
| Espacios | `Espacio` (contexto de vida) | `EspaciosView`, selector en sidebar | `enEspacio` | **Todo módulo que liste pendientes debe respetar `espacioActualId`.** No confundir con el «espacio» de sync. |
| Resumen por correo | `pnp_resumen_prefs/envios` | Ajustes → `ResumenCorreoSeccion` | `supabase/functions/_shared/resumen.ts` | Envía el backend (cron). Ver `RESUMEN_CORREO_SETUP.md`. |
| Sync / Google | Supabase + Edge Functions | `sync.tsx`, `CuentasGoogleDialog` | `lib/sync-merge.ts` | Ver reglas abajo. |

## Capas (separar para poder integrar)
1. **Tipos** `src/types.ts` — solo campos *opcionales* nuevos.
2. **Lógica pura** `src/lib/*.ts` (o `_shared` para el servidor) — sin React, sin red; aquí van las reglas y se prueban con Vitest.
3. **Estado** `src/store.tsx` — CRUD + persistencia local (`useDebouncedStorage`); borrado = soft-delete (`borrado`).
4. **Sync** `src/sync.tsx` + `supabase_setup.sql` — una tabla `pnp_ctx_*` con sobre `{id,user_id,espacio_id,data,updated_at}`; copiar el patrón de Contacto/Roca (try/catch si falta la tabla, circuito de seguridad de ausencias, **nunca** interpretar una lectura fallida como borrado).
5. **Vista** `src/views/*` / `src/components/*` — solo presenta y llama al store; sin reglas de negocio.

## Reglas de interacción fluida
- **Contexto lateral antes que navegación.** Lo que se consulta constantemente (agenda) vive en un panel persistente; lo que se *edita a fondo* abre un modal/peek, no una página nueva. Panel lateral = solo `xl+`, ocultable, estado en `localStorage` (`pn_panel_agenda`). En móvil es una hoja inferior (`HojaInferior` + `PanelAgenda variante="hoja"`) abierta desde el botón de calendario del encabezado.
- **Peek antes que navegar:** desde cualquier lista, abrir el elemento con `abrirPeek(id)` (ui-store) en lugar de cambiar de vista.
- **Un módulo no importa la vista de otro.** Se comunican por store, `ui-store` (navegación/estado de UI) o eventos de ventana (`pn-modo-vista`).
- **Mismo filtro en todos lados:** espacio activo (`enEspacio`), `activo()` para pendientes, `borrado`/`archivado` excluidos.
- **Origen visible:** todo dato externo muestra su origen (🔒 Google, «Evento», «Pendiente») y su estado/error; nunca datos viejos como actuales.
- **Confirmar, no adivinar:** sin IA que clasifique o escriba sin confirmación; los conflictos se informan y el usuario decide.

## Checklist para añadir o cambiar un módulo
1. ¿Es una entidad nueva o una perspectiva de una existente? (preferir perspectiva)
2. Campos opcionales en `types.ts`; nada renombrado ni borrado.
3. Reglas en `lib/` con pruebas; vista delgada.
4. ¿Debe verse junto a otros módulos? → panel/peek, no ruta nueva. ¿Respeta el Espacio activo?
5. Si sincroniza o cambia el esquema: migración numerada en `supabase/migrations/NN_nombre.sql` (una por cambio, idempotente; ver su README), reflejada en `supabase_setup.sql`, y wiring completo en `sync.tsx` (dirty, delete, pull, sospechoso, ausencias, merge).
6. `npm run lint && npm run build && npm run test`; CHANGELOG; subir `CACHE` en `public/sw.js` si el usuario lo ve; `graphify update .`.

## Trampas conocidas
- Pendiente con fecha pero sin hora = `08:00` y ≤5 min (marcador): usa `esHoraPorDefecto` antes de tratarlo como bloque real (conflictos, panel).
- Si un módulo repite lo que ya muestra el panel de agenda, ocúltalo con `useAgendaLateral().visible`.
- Bloques que se solapan en un calendario: `asignarColumnas`, nunca apilados.
- `normalizar` asigna hora 08:00 a pendientes con fecha: «tiene hora» no implica «agendado a propósito».
- Los tests de navegación buscan botones por nombre (`/^Hoy/`): al añadir botones, evita nombres accesibles que colisionen.
- Los scripts de edición con heredocs rompen `\n`/`\r`: usa la herramienta Edit o escapes explícitos.
- `fechaRelativa` y similares deben usar fecha **local**, nunca `toISOString()` (UTC).
