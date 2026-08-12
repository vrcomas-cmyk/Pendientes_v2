# Changelog

Todos los cambios notables de **Pendientes Pro** se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y el versionado
[SemVer](https://semver.org/lang/es/). El cache del Service Worker (`public/sw.js`) se
incrementa por hito funcional-visible al usuario (no así en refactor internos).

## [0.1.0-pre.1] — 2026-08-05 — Fase 1: Base técnica

Primera pre-release. Refactor interno sin cambios visibles para el usuario pero que
sienta las bases para las siguientes fases. El cache del Service Worker sube a `v7`.

### Añadido
- `CHANGELOG.md` y `vitest.config.ts` + `tests/setup.ts`.
- Dependencias de testeo (vitest, jsdom, `@testing-library/*`, `@vitest/coverage-v8`).
- Suite inicial: 93 tests para `src/lib/app-utils.ts` (parsers, recurrencias, fechas
  flexibles, hora, `googleCalendarUrl`, `normalizar`, `defaultsHorario`) y
  `src/lib/sync-merge.ts` (merge pendiente/nota/proyecto/evento, unión determinista de
  comentarios/adjuntos/subtareas/etiquetas, reconciliación con lag de replicación,
  idempotencia). Smoke test del store valida el contrato `AppCtx`.
- `tsconfig.app.json` reconoce `vitest/globals`.

### Cambiado
- `tsconfig.app.json` activa `strict`, `strictNullChecks`, `noImplicitAny` y
  `forceConsistentCasingInFileNames`. El código defensivo existente cumple sin
  correcciones de lógica.

### Eliminado
- Dead code: `src/hooks/use-toast.ts`, `src/components/ui/toast.tsx`,
  `src/components/ui/toaster.tsx`, `src/components/ui/sonner.tsx`,
  `src/assets/react.svg`, `src/assets/vite.svg` (la app usa `sonner` directamente).
- 17 componentes shadcn no usados: `accordion`, `aspect-ratio`, `avatar`, `breadcrumb`,
  `carousel`, `collapsible`, `form`, `hover-card`, `menubar`, `navigation-menu`,
  `radio-group`, `scroll-area`, `slider`, `table`, `toggle`, `toggle-group`, `drawer`.
- 17 deps no usadas: `@radix-ui/react-{accordion,aspect-ratio,avatar,collapsible,
  hover-card,menubar,navigation-menu,radio-group,scroll-area,slider,toast,toggle,
  toggle-group}`, `embla-carousel-react`, `react-day-picker`, `react-hook-form`,
  `@hookform/resolvers`, `react-resizable-panels`, `vaul`, `zod`.
- Conserva `alert`, `card`, `popover`, `progress`, `separator`, `sheet`, `skeleton`,
  `switch`, `tabs`, `tooltip` (se usarán en fases 3-5).

### Refactor
- Unificación de `TaskDetail` (`ListView`) y `PendientePeek` en
  `src/components/PendienteCuerpo.tsx` con props `permitirAgregarSubtarea`,
  `destacarOrigenNota`, `mostrarCreado`. Elimina ~150 LOC duplicados.
- Unificación de `KanbanView` (`OtherViews`) y `TableroProyecto` (`ProyectosView`) en
  `src/components/KanbanDnd.tsx` con props `pendientes`, `defaultsAlAgregar`,
  `minColW`. Elimina ~150 LOC duplicados.
- Nuevo alias `subtareasFaltantes` en `src/types.ts` (re-exporta
  `subtareasPendientes`) para que el header del Peake mantenga fast-refresh.
- El tablero de un proyecto ahora usa `<KanbanDnd>` y gana menú contextual + Peek al
  click (antes sólo tenía `TaskRow` sin menú).

## [Unreleased]

### H12 — Fix crítico: circuito de seguridad contra purga masiva por lectura remota vacía (2026-08-12)

Incidente real reportado por el usuario: ~60 pendientes sincronizados desaparecieron por
completo, tanto de Supabase como del dispositivo local. Causa raíz en dos partes:

1. **Esquema real desalineado**: `espacio_id` en `pnp_pendientes`/`pnp_notas`/
   `pnp_proyectos`/`pnp_eventos` era `nullable` en la base real de producción (aunque el
   repo ya declaraba `not null`). 4 filas quedaron con `espacio_id = NULL` — invisibles
   para siempre bajo las políticas RLS actuales, que nunca matchean `NULL`. Reparadas
   (backfill al `espacio_id` de su dueño) y la columna alineada a `NOT NULL` en las 4
   tablas vía Supabase MCP, cerrando la vía de entrada del problema.
2. **`pull()` sin distinguir "borrado real" de "lectura fallida"**: cuando la lectura
   remota volvió casi vacía (por el problema de (1) u otra causa), `src/sync.tsx` trató
   cada pendiente ausente como borrado remoto tras 2 ausencias consecutivas y lo purgó
   también en local — sin ninguna señal de que ~60 ausencias simultáneas de ítems ya
   sincronizados es estadísticamente un fallo de lectura, no 60 borrados reales.

- **Añadido** `src/lib/sync-merge.ts`: `ausenciasSospechosas(local, remoteIds, last,
  umbral=5)` — cuenta cuántos ids ya conocidos (`last[id] !== undefined`) faltan de golpe
  en la lectura remota; `true` si supera el umbral.
- **Cambiado** `src/sync.tsx`: `pull()` calcula `sospechoso*` por colección ANTES de
  contar ausencias. Si es sospechoso: no avanza el reloj de ausencias esa vuelta, protege
  todos los ítems de esa colección de purga, y avisa con un toast — en vez de purgar en
  silencio. Ausencias normales (1-2 ítems, borrado real del usuario) no se ven afectadas.
- 233/233 tests (+4 en `tests/sync-merge.test.ts`, `ausenciasSospechosas`).
- Sin bump de Service Worker: fix interno de sincronización, sin cambio visible en la UI.

### H11 — Espacio "General" real y seleccionable (2026-08-12)

Hallazgo de una revisión pedida por el usuario ("que ningún registro se pierda"): el sync con
Supabase resultó sólido (aislamiento H7b intacto, ventana de gracia + 2 ausencias consecutivas
antes de aceptar un borrado remoto), pero se encontró un riesgo real de *visibilidad*, no de
pérdida de datos. `Pendiente`/`Nota` no tienen `espacioId` propio — lo heredan vía
`proyectoId → proyecto.espacioId`. Un pendiente sin proyecto (todo lo que entra por Inbox o
captura rápida) o un proyecto sin `espacioId` ("Espacio General" implícito) quedaban ocultos
por diseño en Hoy e Inbox en cuanto el usuario activaba un Espacio real, sin ningún aviso — la
causa más probable de la sensación de "se me perdieron pendientes".

- **Añadido** `src/types.ts`: `ESPACIO_GENERAL_ID`/`ESPACIO_GENERAL_ICONO`/`ESPACIO_GENERAL_NOMBRE`
  — id reservado (`'general'`), no es una fila de `espacios` (no se crea, no se sincroniza, no
  se puede borrar), pero es un valor real y seleccionable de `espacioActualId`.
- **Cambiado** `src/lib/app-utils.ts`: `enEspacio()`/`enEspacioProyecto()` tratan
  `ESPACIO_GENERAL_ID` como "todo lo que no tiene Espacio real" (pendiente sin `proyectoId`,
  proyecto sin `espacioId`, o `proyectoId` huérfano — se trata como General en vez de ocultarse).
- **Cambiado** `src/App.tsx`: selector de Espacio activo (escritorio y menú "⋮" móvil) suma la
  entrada "🗂️ General" entre "Todos" y los espacios reales; nueva `labelEspacioActivo()`
  compartida entre ambos selectores (elimina 4 duplicados del cálculo inline de la etiqueta).
- **Cambiado** `src/views/ProyectosView.tsx`: el filtro por espacio pasa a usar
  `enEspacioProyecto()` (antes comparaba `p.espacioId === espacioActualId` directo, sin
  contemplar General); crear un proyecto estando en General ya no le asigna `espacioId`.
- **Cambiado** `src/views/EspaciosView.tsx`: tarjeta "🗂️ General" junto a "Todos", con su propio
  conteo de proyectos activos sin espacio.
- 229/229 tests (10 nuevos: 7 unitarios en `tests/enEspacio.test.ts` para
  `enEspacio`/`enEspacioProyecto`, 3 de UI en `tests/espacio-general.test.tsx`). SW `v20→v21`
  (nueva opción visible en dos selectores + una vista).

### H10 — Epic 2 completo: nombrado consistente entre plataformas (2026-08-11)

Cierra el último ítem del EPIC 2. `VISTAS_SISTEMA` traía un campo `corto` (pensado para
mostrarse en móvil, igual que ya hacen los 5 destinos primarios) inconsistente con su
`label` de escritorio en un caso: `pendientes` tenía `label: 'Pendientes'` pero
`corto: 'Tareas'` — dos nombres distintos para la misma vista. En la práctica `corto` de
`VISTAS_SISTEMA` no se renderiza en ningún lado hoy (el menú "⋮" móvil y el menú "Sistema"
de escritorio usan texto propio, ya "Pendientes" en ambos), así que el cambio es
preventivo: si `corto` llega a usarse (tooltip, overflow de la barra móvil, etc.), ya no
puede mostrar un nombre distinto al de escritorio.

- **Cambiado** `src/App.tsx`: `VISTAS_SISTEMA` → `{ id: 'pendientes', corto: 'Tareas' }`
  pasa a `corto: 'Pendientes'`, igual que su `label`. `dashboard`/`papelera` ya coincidían.
- Sin test dedicado: es una corrección de dato interno sin efecto observable en el DOM hoy
  (verificado por lectura de código — el resto de la UI ya decía "Pendientes" en todos
  lados). Pipeline verificado igual: `npm run lint`, `npm run build`, `npm run test`
  (219/219, sin regresiones).
- Sin bump de Service Worker: no hay cambio visible en la UI actual.
- **EPIC 2 — Reestructuración del sidebar y navegación primaria: completo.** Los 5 ítems
  del backlog (Navegación primaria de 5 ítems, Selector de Espacio activo, Agrupación
  "Sistema", Panel/Papelera a navegación secundaria, Nombrado consistente) quedan `Hecho`.

### H9 — Epic 2: Panel y Papelera a navegación secundaria (2026-08-11)

En escritorio, "Panel" y "Papelera" eran filas permanentes en el sidebar bajo el
encabezado "Sistema", igual que "Pendientes" — ocupando espacio fijo pese a ser consulta
ocasional (PDS §5.3). Ahora viven dentro del menú "Sistema" (el `DropdownMenu` de H8),
dejando en el sidebar solo "Pendientes" como destino de contenido directo. Móvil ya las
tenía detrás del menú "⋮" desde H5, así que no necesitó cambios.

- **Cambiado** `src/App.tsx`: la fila permanente del sidebar de escritorio bajo "Sistema"
  ahora filtra `VISTAS_SISTEMA` a solo `pendientes`; "Panel" y "Papelera" se agregan como
  ítems al tope del menú "Sistema" existente. `VISTAS_SISTEMA` (el array completo) no
  cambia — los atajos numéricos `7`/`8` y la Paleta de Comandos siguen igual.
- **Añadido** `tests/sistema-secundaria.test.tsx` (nuevo, 4 casos): el sidebar ya no tiene
  filas "Panel"/"Papelera" (solo "Pendientes" directo); el menú "Sistema" abre ambas; los
  atajos `7`/`8` siguen funcionando.
- Verificado con `npm run lint`, `npm run build`, `npm run test` (219/219).
- Service Worker: bump a `v20` (cambio visible al usuario).

### H8 — Epic 2: Agrupación "Sistema" — un solo punto de entrada para Ajustes/Datos/Ayuda (2026-08-11)

Escritorio tenía TRES accesos sueltos compitiendo por espacio permanente en el sidebar:
el botón "Ajustes", un bloque completo de 5 acciones de exportar/importar, y el ícono de
Ayuda en el header. Ahora viven detrás de un único menú "Sistema" en el sidebar. Móvil ya
agrupaba Ajustes/Datos en el menú "⋮"; se sumó Ayuda ahí también, quitándolo del ícono
suelto del header.

- **Cambiado** `src/App.tsx`: sidebar de escritorio — el botón "Ajustes" y el bloque de
  exportar/importar (`Exportar JSON/CSV`, `Más formatos…`, `Importar JSON/CSV`) se
  reemplazan por un único `DropdownMenu` "Sistema" con Ajustes, Ayuda y atajos, y las 7
  acciones de datos. Eliminado el ícono de Ayuda del header de escritorio. Menú "⋮" móvil:
  nuevo ítem "Ayuda y atajos" junto a "Ajustes"; eliminado el ícono suelto del header móvil.
  El atajo de teclado `?` no cambia — sigue abriendo la ayuda directo, sin pasar por el menú.
- **Añadido** `tests/sistema-agrupado.test.tsx` (nuevo, 6 casos): el sidebar expone un solo
  punto de entrada "Sistema" (no botones sueltos de Ajustes/Exportar/Ayuda); el menú abre
  Ajustes, abre Ayuda, y expone las acciones de exportar/importar; el atajo `?` sigue
  funcionando; el header móvil ya no tiene el ícono de Ayuda suelto.
- **Corregido** `tests/espacio-activo.test.tsx`: una aserción preexistente buscaba el texto
  "Sistema" con `getByText` asumiendo una sola coincidencia — con el nuevo botón "Sistema"
  del sidebar ahora hay dos nodos con ese texto (el encabezado de sección y el botón). Se
  filtra al `<div>` del encabezado, que es al que la prueba se refería originalmente.
- Verificado con `npm run lint`, `npm run build`, `npm run test` (215/215).
- Service Worker: bump a `v19` (cambio visible al usuario).

### H7c — `supabase_setup.sql` actualizado a la función real desplegada (2026-08-11)

Al aplicar la migración de H7 vía Supabase se descubrió que la base real ya tenía una
versión de `pnp_canjear_invitacion` más robusta que la del repo — de trabajo anterior no
reflejado en `supabase_setup.sql`. El archivo del repo quedaba desactualizado respecto a
producción: quien lo corriera de cero (o lo usara como referencia) habría desplegado una
función peor que la vigente. `src/lib/espacio.ts` ya estaba escrito contra la versión real
(solo revisa `error`/`err.message`), así que no hizo falta tocar código de cliente.

- **Cambiado** `supabase_setup.sql`: `pnp_invitaciones` gana columnas `aceptada_por`/
  `aceptada_en` (marca de canje, en vez de borrar la fila al usarse); `pnp_canjear_invitacion`
  reescrita para devolver `uuid` (el `espacio_id`) y levantar excepciones con mensaje
  específico (código inválido / expirado / ya usado / email no coincide / cuenta ya en un
  espacio) en vez de devolver `boolean` en silencio.
- Sin cambios de código de cliente ni de tests — es un archivo de referencia SQL, no
  ejecutado por la suite; la base real de producción ya tenía este esquema antes de esta
  actualización del repo.

### H7b — Reparación: la migración pendiente de H7 rompía TODA la sincronización (2026-08-11)

El usuario reportó no ver registros anteriores tras H7. Causa: `pull()` pedía
`pnp_ctx_espacios` dentro del mismo `Promise.all` que las cuatro tablas críticas
(pendientes/notas/proyectos/eventos) y abortaba TODO el pull si cualquiera fallaba — si el
proyecto de Supabase todavía no había corrido el `supabase_setup.sql` actualizado (tabla
`pnp_ctx_espacios` inexistente), el error de esa tabla nueva tumbaba la descarga completa,
así que nada de lo que ya existía en la nube (de otro dispositivo, o de antes de esta
sesión) volvía a bajar. `flush()` tenía el mismo problema en la dirección contraria: si
había Espacios locales sin subir, su error de upsert impedía `guardarLast()` para todo lo
demás que sí se había subido con éxito.

- **Cambiado** `src/sync.tsx`: la consulta/subida de `pnp_ctx_espacios` en `pull()` y
  `flush()` ahora vive en su propio `try/catch`, aislada de las cuatro colecciones
  originales. Si la tabla no existe todavía, Espacios simplemente no sincroniza (igual que
  antes de H7) y pendientes/notas/proyectos/eventos siguen funcionando con normalidad; se
  reintenta en el próximo ciclo sin intervención.
- Verificado con `npm run lint`, `npm run build`, `npm run test` (209/209 — sin tests
  nuevos: el bug es de fontanería de red, no cubierto por la suite actual de `sync.tsx`).
- **Recordatorio**: sigue siendo necesario correr `supabase_setup.sql` (idempotente) para
  que Espacios sincronice — este fix solo evita que su ausencia rompa lo demás mientras
  tanto.

### H7 — Sincronización de Espacios entre dispositivos (2026-08-10)

Corrige un hallazgo de la revisión de EPIC 2 (H6): los "Espacios" del Personal Workspace
(Trabajo/Casa/etc.) se creaban y persistían solo en `localStorage` — a diferencia de
pendientes/notas/proyectos/eventos, nunca viajaban a Supabase. Efecto observado: un Espacio
creado en el celular y asignado a proyectos sincronizaba esos proyectos a la laptop, pero el
Espacio en sí no aparecía ahí — el selector no lo listaba y esos proyectos solo eran
visibles bajo "Todos" en ese dispositivo, nunca filtrables. Nada se perdía de verdad (los
datos seguían en `localStorage` de origen), pero se sentía como pérdida y quedaba
inconsistente entre dispositivos de la misma cuenta.

- **Añadido** `mergeEspacio` en `src/lib/sync-merge.ts`: mismo criterio last-write-wins que
  `mergeProyecto` (conflicto si cambian nombre/icono/color).
- **Cambiado** `src/sync.tsx`: `espacios` se suma como quinta colección sincronizada —
  mismo tratamiento que pendientes/notas/proyectos/eventos en `recalcularPendientes`,
  `flush` (upsert/delete a `pnp_ctx_espacios`), `pull` (select + reconciliar + protección
  read-after-write) y la suscripción realtime.
- **Cambiado** `src/store.tsx`: `reemplazarTodo` gana un 6º parámetro opcional `esp?:
  Espacio[]` (aditivo, no rompe llamadas previas) para que `sync.tsx` pueda aplicar el
  resultado reconciliado de Espacios igual que ya hace con Proyectos.
- **Añadido** `supabase_setup.sql`: tabla `pnp_ctx_espacios` (mismo sobre `id/user_id/
  espacio_id/data/updated_at` que las otras cuatro tablas de dominio), su índice, política
  RLS y alta en la publicación de realtime. Prefijo `ctx_` para no chocar con `pnp_espacios`
  (la cuenta compartida) — distinción ya documentada en el código, ahora también en el SQL.
- **Añadido** `tests/sync-merge.test.ts`: 2 casos para `mergeEspacio`. Total: 209 tests.
- Verificado con `npm run lint`, `npm run build`, `npm run test` (209/209).
- Requiere correr `supabase_setup.sql` de nuevo en proyectos ya provisionados (es
  idempotente) para crear `pnp_ctx_espacios` antes de que la sincronización tome efecto.
- Sin bump de Service Worker: es un cambio de sincronización de datos, no de assets/UI
  (nada que cachear cambió).

### H1 — Minuta universal: viñetas anidadas en la nota → subtareas (2026-08-09)

Primer hito del equipo de desarrollo hacia la "minuta reutilizable": una nota ya no genera
solo pendientes — una viñeta `- Tarea` seguida de viñetas indentadas (`  - Paso`) materializa
la tarea **y sus subtareas** de una sola vez, con responsable y fecha por subtarea.

- **Añadido** `src/lib/app-utils.ts`: `parsearMinuta(texto)` y `subtareaDeLinea(parsed)` —
  parser puro que agrupa viñetas de nivel superior como pendientes y las indentadas (2+
  espacios) como subtareas del pendiente actual (con `@resp` → responsable y `>fecha` →
  fecha límite). La prosa entre viñetas no interfiere. Testeado de forma aislada del DOM.
- **Añadido** `store.tsx`: `agregarSubtarea(pid, texto, extra?)` acepta de forma aditiva
  `responsable` y `fechaLimite` (resto intacto).
- **Añadido** `NotesView.tsx` "Extraer viñetas": procesa la jerarquía de un vistazo —
  convierte `-` en pendientes y las líneas indentadas en subtareas; las tareas ya
  convertidas actúan como pendiente "actual" para anidar debajo.
- **Añadido** `NotesView.tsx` atajo de teclado: `Enter` sobre una viñeta indentada bajo un
  pendiente genera una **subtarea** (en vez de un pendiente nuevo).
- **Añadido** `src/index.css`: `.nota-sub`, espejo visual indentado de la subtarea (sin
  `data-pid`, por lo que no se re-extrae ni indexa como pendiente).
- **Añadido** `tests/minuta.test.ts`: 8 tests del parser (agrupación, corte de agrupación,
  descripción con `:`, tokens `@`/`>`, prosa ignorada, primera línea indentada).
- Verificado con `npm run lint`, `npm run build`, `npm run test` (155/155).
- Service Worker: bump a `v12` (funcionalidad visible al usuario).

### H2 — Promoción: subtareas ↔ pendientes/proyectos (2026-08-09)

Cierre del ciclo subtareas: las tareas anidadas ya no están condenadas a vivir dentro de
un pendiente. Ahora desde una subtarea —o desde un pendiente con subtareas— se promueve a
una categoría superior en un clic, sin reescribir ni perder responsable, fecha, proyecto
ni origen.

- **Añadido** `src/lib/app-utils.ts` (parte pura, TDD aislada del DOM):
  - `buscarSubtarea(arr, sid)` — localiza una subtarea en el árbol (incluye anidadas).
  - `quitarSubtarea(arr, sid)` — árbol sin la subtarea indicada, inmutable y recursivo.
  - `pendientesDesdeSubtareas(p, proyectoId, proyecto)` — convierte subtareas en
    `Pendiente`s del proyecto recién creado, arrastrando `children` como subtareas.
- **Añadido** `store.tsx`:
  - `promoverPendienteAProyecto(pid)` (A2): crea el proyecto con el título/color del
    pendiente, lo asigna a la raíz y materializa cada subtarea como tarea del proyecto.
    Guarda contra pendientes sin subtareas. Transformación de datos, sin cambios de esquema.
  - `promoverSubtarea(pid, sid)` (A3): convierte la subtarea en `Pendiente` independiente
    (mismo proyecto/origen; hereda responsable de su padre cuando no lo tiene) y la retira
    del árbol del padre. Funciona también con sub-subtareas.
- **Añadido** UI:
  - `PendienteCuerpo.tsx` — botón "Convertir en proyecto" junto al header de Subtareas y
    botón "promover" (`↗`) en cada subtarea anidada.
  - `MenuContextoPendiente.tsx` — ítem "Convertir en proyecto" (deshabilitado si el
    pendiente no tiene subtareas).
- **Añadido** `tests/promover.test.ts`: 8 tests RED→GREEN (búsqueda en profundidad,
  quitar rama, conversión de subtareas con `children`/responsable heredado, `promoverSubtarea`
  con sub-subtareas, guarda sin subtareas, proyecto asignado y fuentes conservadas).
- Verificado con `npm run lint`, `npm run build`, `npm run test` (163/163).
- Service Worker: bump a `v13` (funcionalidad visible al usuario).

### H2b — Reparación: navegación "muerta" desde una nota/proyecto abierto (2026-08-09)

Hallazgo del QA manual: con una nota abierta (`notaActualId`) o un proyecto abierto
(`proyectoAbiertoId`), hacer clic en los botones de navegación (Pendientes, Panel, Papelera…)
no cambiaba de vista — `vistaMostrada` (`App.tsx`) los forzaba a quedarse en Notas/Proyectos.
La única vía de escape era `Escape` o el botón "Volver" del propio detalle. Afectaba también el
atejo navegar entre vistas con teclado y el menú.

- **Corregido** `App.tsx` `setVista`: al navegar siempre despeja `notaActualId` y
  `proyectoAbiertoId` para mostrar la vista elegida (y su lista). Un detalle abierto se sigue
  abriendo por su cuenta (chip/tarjeta) y `Esc`/`Volver` conservan su comportamiento original.
  El orden en `PaletaComandos` (navegar → abrir) se preserva.
- Verificado con Playwright en la app real: Pendientes y Panel alcanzables desde nota abierta,
  Pendientes alcanzable desde proyecto abierto, sin regresión al abrir notas.
- Service Worker: bump a `v14`.

### H3 — Epic 1 lote inicial: regla de exclusividad de overlays (2026-08-09)

Primer corte de la PDS §5.4 (Epic 1 del backlog): un solo overlay modal activo a la vez,
sin excepción. Modal de tarea, peek de detalle y paleta de comandos pasan a compartir una
única fuente de verdad; abrir uno cierra cualquier otro automáticamente.

- **Añadido** `src/lib/overlay.ts` (reducer puro + `esOverlay`) con 8 tests
  (`tests/overlay.test.ts`): abrir reemplaza al activo, cerrar solo desactiva si coincide,
  y `'ninguno'` no se puede reabrir desde una acción `abrir`.
- **Cambiado** `src/ui-store.tsx`: `overlay` pasa a ser la fuente de verdad; `modal.open`,
  `paletaAbierta` y el peek derivan de él. La API previa (`abrirModal`, `abrirPeek`) se
  mantiene — ningún llamador cambió de firma. `Ctrl+K` sigue alternando la paleta.
- **Cambiado** `PendientePeek.tsx`: su `Dialog` se abre/cierra según `overlay === 'peek'`
  (antes dependía solo de `peekId`, que podía quedar stale tras abrir otra cosa). El botón
  "Editar" cierra el peek y abre el modal en un solo acto.
- **Cambiado** `App.tsx`: se elimina el estado local `paletaAbierta`; paleta y atajo
  `Ctrl+K` usan el store único.
- **Cambiado** `WidgetsLayer`/`WidgetShell`: los widgets se atenían (`opacity-50` +
  `pointer-events-none`) mientras haya cualquier overlay activo (PDS §5.4: el overlay toma
  el foco completo). Sin animación de más para no molestar.
- Verificado con Playwright en la app real: Ctrl+K abre/cierra la paleta atenuando los
  widgets; click en tarea abre el peek como único diálogo; "Editar" reemplaza el peek por
  el modal (un solo diálogo en DOM); al cerrar, los widgets vuelven a estado normal. Sin
  errores de consola.
- Service Worker: bump a `v15`.

### H5 — Epic 2 lote inicial: «Espacios» como 5º destino de navegación primaria (2026-08-10)

Primer corte del PDS §5.3 (Epic 2 del backlog): la navegación primaria pasa a ser
exactamente **Hoy · Inbox · Proyectos · Notas · Espacios**. «Pendientes» deja de ser
destino de primer nivel y baja a la agrupación «Sistema» (junto a Panel/Papelera en el
sidebar de escritorio y al menú ⋮ en móvil) — sigue existiendo, intacto, como tablero
global. El destino «Espacios» es la primera materialización del concepto de contexto de
vida del workspace: entrar por Trabajo, Escuela, Casa, etc., en un clic.

- **Añadido** `src/views/EspaciosView.tsx` (nuevo): vista ligera que reusa toda la
  infraestructura existente — `espacios`/`proyectos` del store, `espacioActualId` de
  `ui-store`, `NuevoEspacioDialog` y `PROYECTO_COLORES`. Muestra la tarjeta «📋 Todos»
  y una tarjeta por espacio (icono, nombre, color, nº de proyectos activos) con botón
  «Nuevo espacio». Clic en un espacio → activa `espacioActualId` y navega a Proyectos
  filtrado a ese espacio (filtrado preexistente en `ProyectosView`); «Todos» lo limpia.
- **Cambiado** `src/App.tsx`: `type Vista` y `VISTAS_VALIDAS` a 8 miembros en orden
  hoy·inbox·proyectos·notas·espacios·pendientes·dashboard·papelera; `VISTAS_PRIMARIAS`
  reordenada al orden del PDS (Espacios con icono `LayoutGrid`); `pendientes` movida a
  `VISTAS_SISTEMA` con su badge `nAbiertos` reubicado; atajos numéricos `1-8`
  (5=Espacios, 6=Pendientes, 7=Panel, 8=Papelera); render lazy de `EspaciosView`;
  menú ⋮ móvil con ítem «Pendientes»; **eliminado** el bloque «Espacios» duplicado del
  sidebar (acceso redundante con el nuevo destino primario) y sus imports/estado muertos.
- **Cambiado** `src/components/PaletaComandos.tsx`: ítem «Espacios» en el grupo «Ir a»
  (entre Proyectos y Panel) y `type Vista` local ampliado. **Cambiado**
  `src/components/AyudaAtajos.tsx`: fila `1–8` con el orden nuevo.
- **Añadido** `tests/navegacion.test.tsx` (nuevo, 5 casos): orden de la navegación
  primaria, «Pendientes» bajo «Sistema», atajo `5` → Espacios, selección de espacio que
  navega a Proyectos filtrado y conteo de proyectos por espacio. Total: 190 tests.
- Verificado con `npm run lint`, `npm run build`, `npm run test` (190/190) y QA
  Playwright real en la app (21/21 checks, escritorio + móvil, sin errores de consola).
- Service Worker: bump a `v17`.

### H6 — Epic 2: selector de Espacio activo en móvil (2026-08-10)

Cierra el ítem «Selector de Espacio activo» del EPIC 2: el desktop ya tenía un dropdown
colapsable en el sidebar (H5), pero en móvil la única forma de cambiar de Espacio era
navegar a la pestaña «Espacios» completa y perder la vista en la que se estaba. Ahora el
menú «⋮» de móvil expone el mismo control, sin salir de la pantalla actual.

- **Cambiado** `src/App.tsx`: nueva sección colapsable «Espacio activo: …» en el menú «⋮»
  móvil (arriba de «Panel»/«Papelera»/«Pendientes»), con el mismo formato de etiqueta y
  conteo de proyectos activos que el selector de escritorio; al elegir un espacio, el menú
  se cierra y la vista actual queda refiltrada por `espacioActualId` (sin navegar). Eliminado
  el import muerto `PROYECTO_COLORES` (huérfano desde H5).
- **Añadido** `tests/espacio-mobile.test.tsx` (nuevo, 2 casos): la entrada de Espacio activo
  aparece en el menú móvil y lista «Todos» + cada espacio; elegir un espacio actualiza el
  filtro y se refleja en el propio punto de entrada.
- **Corregido** `tests/espacio-activo.test.tsx`: 3 aserciones preexistentes comparaban el
  aria-label del selector con una regex que no toleraba el icono del espacio (`"Espacio
  activo: 🏢 Trabajo"` vs `/Espacio activo: Trabajo/i`) — error de la propia aserción, no un
  defecto; corregidas para tolerar el icono. Las 9 pruebas de ese archivo (selector de
  escritorio + filtro de contexto en Hoy/Inbox + persistencia `pn_espacio_activo` +
  guardia ante id inexistente) ya estaban implementadas y ahora quedan verdes.
- Verificado con `npm run lint`, `npm run build`, `npm run test` (207/207).
- Service Worker: bump a `v18`.

### H4 — Cierre del Epic 1: confirmación antes de descartar una edición en curso (2026-08-09)

Última pieza de la PDS §5.4 (Epic 1): con un solo overlay activo, la exclusividad podía
tirar borradores sin aviso — abrir la paleta de comandos o cerrar el modal sobre una tarea
en edición descartaba los cambios guardados en el flujo previo. Ahora, si queda algo sin
guardar, se pregunta antes de perderlo: "Seguir editando" restaura el borrador intacto y
"Descartar" ejecuta la acción pendiente. Un modal limpio sigue cerrando sin preguntar.

- **Añadido** `src/lib/overlay.ts`: nuevo `TipoOverlay='confirmar-cierre'` (solo el cierre
  del modal puede entrar en él) y regla de `cerrar` sobre él; docstring H4. Extiende el
  reducer puro sin romper `Cerrar`/`esOverlay`.
- **Añadido** `src/ui-store.tsx`: `guardiaRef`/`accionPendienteRef` y funciones internas
  para interceptar un `cerrar` con cambios sin guardar; nueva API `registrarGuardia`,
  `confirmarDescartes` (`cancelar`/`descartar`) y `cancelarDescartes`. `modal.open` ahora
  incluye `'confirmar-cierre'` para mantener el form montado bajo la confirmación.
- **Cambiado** `TaskModal.tsx`: snapshot JSON del form en `baseRef`, `dirtyRef` derivado
  con `useLayoutEffect`, `sinVerificarRef` en Guardar/Eliminar, `onOpenChange` solo cierra
  cuando `overlay === 'modal'`, y `ConfirmDialog` de descarte (que pone en pausa la
  verificación de cierre).
- **Cambiado** `src/components/ConfirmDialog.tsx`: props aditivas `onCancelar?` y
  `cerrarTrasConfirmar?` (por defecto `true`); los callers previos permanecen intactos.
- **Añadido** `tests/overlay.test.ts` (+6, 8→14): cobertura de `'confirmar-cierre'` en
  abrir/cerrar. **Añadido** `tests/ui-store.test.tsx` (nuevo, 8 casos, harness con
  `UIProvider`): registrar guardia, confirmar/cancelar desacartes, cierre limpio sin
  preguntar y acciones pendientes encadenadas. Total: 185 tests.
- Verificado con Playwright en la app real (criterios CA1-CA6 del ticket EPIC-1-F4):
  confirmación con texto intacto, "Seguir editando" restaura, "Descartar" ejecuta la acción
  pendiente (cierra / abre la paleta), modal limpio cierra sin preguntar, Guardar no
  pregunta y persiste, y sin errores de consola (21/21 checks). Nota: la vista de lista
  abre el detalle en panel inline (no peek) — comportamiento esperado y verificado.
- Verificado con `npm run lint`, `npm run build`, `npm run test` (185/185).
- Service Worker: bump a `v16`.

### Fase 13 — Reparación de integridad: pendientes que se "salían" de su proyecto (2026-08-06)

Bug reportado por el usuario: un proyecto con varias actividades dejaba algunas fuera
del proyecto. Diagnóstico: no era un problema de sincronización — `Pendiente` guarda la
pertenencia dos veces (`proyecto`: nombre-espejo; `proyectoId`: referencia real), toda
la lectura filtra por `proyectoId`, y varios escritores actualizaban solo el nombre. El
resultado: la tarea seguía mostrando el badge del proyecto pero desaparecía de él.

- **Añadido** `src/lib/app-utils.ts`: `asignarProyecto(proyectoId, proyectos,
  nombreAnterior?)` — única fuente de verdad para asignar proyecto a un pendiente;
  `proyecto` (nombre) nunca se escribe solo. Si el `proyectoId` no resuelve (proyecto
  borrado/no sincronizado todavía), conserva el nombre anterior en vez de vaciarlo.
  `normalizarNombreProyecto(nombre)` — compara nombres sin distinguir mayúsculas/acentos.
- **Corregido** `store.tsx` `toggleCompletar` (recurrencia): la siguiente instancia de
  una tarea recurrente copiaba `proyecto` pero no `proyectoId` — cada repetición nacía
  fuera del proyecto. Causa principal del bug reportado.
- **Corregido** `store.tsx` `eliminarProyecto`: ahora limpia `proyecto` **y**
  `proyectoId` (antes dejaba el nombre del proyecto eliminado colgando en el badge).
- **Corregido** `store.tsx` `crearPendienteDesdePlantilla`: ahora resuelve el nombre
  además del id (antes el export CSV salía con el proyecto vacío).
- **Corregido** `TaskModal.tsx` `guardar`: si `proyectoId` apunta a un proyecto no
  presente todavía (otro dispositivo), conserva el nombre en vez de vaciarlo al guardar.
- **Corregido** `App.tsx` `quickAdd`: soporta `#"Nombre con espacios"` (antes el
  hashtag `#(\S+)` nunca podía matchear un proyecto de más de una palabra) y compara
  nombres sin distinguir acentos/mayúsculas.
- **Corregido** `ImportarCsvDialog.tsx`: si el nombre de proyecto de una fila no
  matchea ninguno existente, ahora **crea el proyecto** en vez de importar la tarea sin
  vínculo real (afectaba el roundtrip del propio export CSV de la app).
- **Corregido** `ProyectosView.tsx`: el tablero (sin `activo()`) y la lista (con
  `activo()`) usaban predicados distintos — una tarea archivada desaparecía de la lista
  del proyecto sin forma de recuperarla desde ahí. Unificado en `itemsDelProyecto`, con
  un toggle "🗄 Archivados" nuevo para verlas en ambos modos.
- **Cambiado** `src/lib/sync-merge.ts`: `proyectoId` se agrega a `CAMPOS_ESCALARES` —
  antes mover una tarea de proyecto en dos dispositivos a la vez no se detectaba como
  conflicto de sync.
- **Añadido** `store.tsx`: migración de reparación, una sola vez al montar — vincula
  por nombre (normalizado) todo pendiente con `proyecto` seteado y `proyectoId`
  ausente contra los proyectos existentes. Recupera las actividades ya huérfanas de
  antes de este fix. Idempotente, sin re-marcar `modificado` si no hay nada que reparar.
- Verificado con `npm run test` (147/147, 6 tests nuevos para `asignarProyecto`/
  `normalizarNombreProyecto`), `npm run lint`, `tsc --noEmit`, `npm run build`, y una
  prueba en vivo en Chrome: proyecto "Proyecto Integrador" (dos palabras) creado vía
  quickAdd con comillas, tarea recurrente diaria completada — la siguiente instancia
  nació dentro del tablero del proyecto —, y un pendiente huérfano inyectado a mano en
  `localStorage` fue reparado automáticamente al recargar.
- Service Worker: sin bump todavía (se agrupa con el resto de esta fase de diseño).

### Fase 2 — Personal Workspace (reorientación, ver `AUDITORIA.md`)

A partir de `Cambios.md` (2026-08-05), el roadmap se reordena: la app evoluciona hacia
un Personal Workspace con Espacios, Inbox universal, HOY como timeline única y widgets
flotantes con estética glass, antes de retomar la funcionalidad tipo Todoist/Things que
ya estaba planificada (ahora Fase 8+). Detalle completo, hallazgos y justificación en
`AUDITORIA.md`.

### Añadido (2.1 — Papelera real)
- `src/views/PapeleraView.tsx` con secciones Pendientes/Notas/Eventos.
- Acciones `restaurarPendiente`, `restaurarNota`, `restaurarEvento`, `vaciarPapelera`.
- Soft-delete: `eliminar*` ahora setea `borrado: true` en lugar de
  filtrar el objeto. Undo del toast ahora restaura.
- Vista nueva en navegación (`VISTAS`, `VISTAS_VALIDAS`) con icono Trash2.

### Cambiado (2.1)
- `activo(p)` en `app-utils.ts` ahora filtra `archivado` Y `borrado`.
- `CAMPOS_ESCALARES` en `sync-merge.ts` incluye `archivado` y `borrado`
  para que el conflicto edición-concurrente-al-borrado se detecte y resuelva
  por `modificado` más reciente.

### Fase 2 — Cimientos visuales (2026-08-05)

- **Añadido**: utilidad `.glass` (fondo translúcido + `backdrop-filter: blur(16px)
  saturate(1.4)`, con `@supports` y fallback sólido para navegadores sin soporte) y
  `.bg-ambient` (degradado radial cálido de 3 puntos), en `src/index.css`. Variables
  nuevas por tema: `--glass-bg`, `--glass-bg-opacity`, `--glass-border`,
  `--glass-border-opacity`, `--ambient-1/2/3`.
- **Añadido**: escala tipográfica `.text-display-sm/md/lg` (Space Grotesk) en
  `src/index.css`.
- **Añadido**: `boxShadow.soft` / `soft-lg` / `glass` (sombras difusas) y
  `transitionTimingFunction.spring` / `smooth` en `tailwind.config.js`; keyframe y
  animación `scale-in`; `borderRadius.xl` / `2xl`.
- Sin cambio funcional: son utilidades nuevas, opt-in, no consumidas todavía por
  ningún componente — cero riesgo de regresión visual. Verificado con `npm run test`
  (93/93) y `npm run build` sin cambios de output JS. Las consume la Fase 3.
- Service Worker: sin bump (no hay cambio visible al usuario todavía).

### Fase 3 — Shell Workspace (2026-08-05)

- **Cambiado**: sidebar de escritorio deja de ser hover-to-expand y pasa a permanente
  (`w-60`, siempre con etiquetas visibles), con `glass`/`backdrop-blur-xl` y
  `shadow-soft` (`src/App.tsx`). El título "Pendientes Pro" se movió del header al
  sidebar (ya no se duplicaba).
- **Añadido**: dock de accesos rápidos flotante en escritorio (Nota / Pendiente /
  Buscar), con estilo `.glass` + `shadow-glass`, reemplazando el FAB solo en desktop
  (móvil conserva su FAB expandible sin cambios).
- **Añadido**: franja "Cronología de hoy" en `TodayView` (`TimelineHoy`,
  `src/views/OtherViews.tsx`) que mezcla pendientes con hora asignada + eventos de
  calendario de hoy, ordenados cronológicamente — complementa (no reemplaza) las
  secciones existentes de Vencidos/Para hoy/Próximos/Bandeja/Registro.
- **Corregido**: nav móvil inferior usaba `grid-cols-5` con 6 vistas (Papelera quedaba
  apretada); ahora `grid-cols-6`. Atajos de teclado `1-5` no alcanzaban Papelera; ahora
  `1-6`.
- **Corregido** (hallado en prueba visual con Playwright): el dock flotante de
  escritorio tapaba la última fila de contenido en vistas largas; se añadió
  `pb-24` al `<main>` de escritorio.
- Verificado con `npm run test` (93/93), `npm run build`, `tsc --noEmit`, y una pasada
  visual en Chrome (claro/oscuro, navegación completa, dock, paleta Ctrl+K desde el
  dock) — sin regresiones funcionales.
- Service Worker: sin bump todavía (se agrupa con el resto de la Fase 3 al cerrarla).

### Fase 4 — Espacios como capa nueva (2026-08-05)

- **Añadido**: entidad `Espacio { id, nombre, icono, color, creado, modificado }` en
  `src/types.ts`, con `ESPACIO_ICONOS` (12 emoji predefinidos). `Proyecto.espacioId?`
  opcional. Retrocompatible: sin espacio asignado, un proyecto vive en el Espacio
  "General" implícito (no es un registro real, es la ausencia de `espacioId`).
- **Añadido**: CRUD completo en `src/store.tsx` (`crearEspacio`, `actualizarEspacio`,
  `eliminarEspacio`, persistido en `localStorage['pn_espacios']`) y filtro de contexto
  global `espacioActualId`/`setEspacioActualId`. Eliminar un espacio desvincula sus
  proyectos (no los borra) — mismo patrón que `eliminarProyecto`.
- **Añadido**: sección "ESPACIOS" en el sidebar de escritorio (`src/App.tsx`), con
  chip "Todos" (sin filtrar, comportamiento por defecto sin cambios) + un chip por
  espacio (icono, nombre, punto de color) + botón "Nuevo espacio".
- **Añadido**: `src/components/NuevoEspacioDialog.tsx` (nombre, selector de icono,
  selector de color) — deliberadamente no se llama `EspacioDialog`, ese nombre ya lo
  usa el diálogo de cuenta compartida de `src/sync.tsx`. Ver glosario en
  `.claude/skills/workspace-doctrine/SKILL.md`.
- **Añadido**: `ProyectosView` filtra por `espacioActualId` (si hay uno seleccionado);
  el mensaje de "vacío" distingue "sin proyectos en este espacio" de "sin proyectos en
  la app". Un proyecto nuevo creado con un espacio activo se le asigna automáticamente
  (menos clics: no exige un paso extra de "mover a espacio").
- **Añadido**: menú contextual "Mover a espacio" en cada proyecto de la lista, con
  submenú (Radix `ContextMenuSub`, ya usado en el proyecto) listando "General" + todos
  los espacios, con `✓` en el actual. Badge de icono de espacio visible junto al
  nombre del proyecto.
- **Cierra la Fase 3**: la sección Espacios era el único pendiente del shell Workspace.
- Verificado con `npm run test` (93/93), `tsc --noEmit`, `npm run build`, y una pasada
  visual en Chrome: crear espacio, crear proyecto (auto-asignado), filtrar por "Todos"
  vs. espacio específico, abrir el submenú de mover — sin regresiones.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 completo).

### Fase 5 — Inbox universal (2026-08-05)

- **Añadido**: `src/views/InboxView.tsx`, vista de primera clase que formaliza el
  filtro "sin fecha" que ya vivía dentro de `TodayView` (esa sección se conserva
  intacta como resumen dentro de Hoy; Inbox es ahora también su propia vista dedicada).
  Reusa `TaskRow` — la acción "mover a" (fecha) ya existía en `PosponerMenu`, montado
  dentro de cada fila, sin código nuevo para eso.
- **Añadido**: nueva vista `inbox` en la navegación (`src/App.tsx`), entre "Hoy" y
  "Pendientes" (sidebar de escritorio, nav inferior móvil, `PaletaComandos`), con badge
  de conteo igual que "Pendientes" muestra sus abiertos.
- **Corregido**: `PaletaComandos.tsx` tenía un tipo `Vista` local desalineado con
  `VISTAS_VALIDAS` (le faltaban `inbox` y `papelera`); ahora incluye las 7 vistas y se
  agregaron los `CommandItem` correspondientes en "Ir a".
- **Cambiado**: atajos de teclado `1-6` → `1-7` y nav móvil `grid-cols-6` → `grid-cols-7`
  para dar cabida a Inbox; texto de `AyudaAtajos.tsx` actualizado.
- Verificado con `npm run test` (93/93), `tsc --noEmit`, `npm run build`, y una pasada
  visual en Chrome: capturar sin fecha → aparece en Inbox con badge → "Posponer → Hoy"
  → desaparece de Inbox, badge a 0, toast de confirmación, atajo `2` navega a Inbox.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 completo).

### Fase 6 — Widgets flotantes (2026-08-05)

- **Añadido**: sistema de widgets flotantes como slice de estado aislado —
  `src/widgets-store.tsx` (`WidgetsProvider`/`useWidgets`), separado de `AppCtx` a
  propósito (posición/tamaño de UI, no dato de dominio; ver AUDITORIA.md §9),
  persistido en `localStorage['pn_widgets']` + `['pn_widgets_z']` (orden de apilado).
- **Añadido**: `src/components/widgets/WidgetShell.tsx`, la caja común (`glass` +
  `shadow-glass`) con drag (pointer events desde el header), resize (asa inferior
  derecha con clamp a un mínimo por tipo), colapsar y cerrar — ningún widget concreto
  reimplementa esto.
- **Añadido**: cuatro widgets, todos envolviendo componentes ya existentes en vez de
  crear UI nueva: `PomodoroWidget` (sobre `ProgressRing`), `KanbanRapidoWidget` (sobre
  `KanbanDnd`, mismo componente que el tablero de Pendientes/Proyecto), `NotaRapidaWidget`
  (crea una `Nota` real vía `crearNota`/`actualizarNota`, no un borrador aparte) y
  `ProximaTareaWidget` (sobre `TaskRow`, mismo criterio de "próxima" que `TodayView`).
- **Añadido**: selector "Widgets" en el dock de escritorio (`DropdownMenu` con los 4
  tipos, iconos, `WIDGET_DEFAULTS` centraliza título/tamaño/mínimos en `src/lib/widgets.ts`).
- Alcance de este hito: **solo escritorio** — el dock, el selector y `WidgetsLayer` no
  se montan en el layout móvil (drag/resize táctil con este mecanismo es fricción, no
  ayuda; queda como follow-up si se justifica).
- Verificado con `npm run test` (93/93), `tsc --noEmit`, `npm run build`, y una pasada
  visual en Chrome: abrí los 4 tipos, arrastré y redimensioné (Kanban reveló una
  columna oculta al agrandarse, confirmando que reusa el layout real de `KanbanDnd`),
  colapsé, cerré, y confirmé que "Nota rápida" crea una nota real visible en la vista
  Notas sin navegar fuera de la vista actual.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 completo).

### Fase 7 — Entidad común (2026-08-05)

- **Añadido**: `Nota.etiquetas?: string[]` y `Nota.comentarios?: Comentario[]` en
  `src/types.ts` — campos opcionales, aditivos, sin migración (una nota existente sin
  estos campos se trata como si tuviera arreglos vacíos). `Comentario` ya soportaba
  `adjuntos?`, así que un comentario de nota también puede llevar imágenes sin campo
  nuevo.
- **Añadido**: `agregarComentarioNota` en `src/store.tsx`; las etiquetas se editan vía
  `actualizarNota` (ya aceptaba `Partial<Nota>`, sin acción nueva necesaria).
- **Añadido**: `mergeNota` en `src/lib/sync-merge.ts` ahora une `comentarios`/`etiquetas`
  con el mismo criterio determinista que `mergePendiente` (nunca se pierden al
  sincronizar entre dispositivos) — mismo código, no una implementación paralela.
- **Añadido**: UI de etiquetas (pills con quitar) y comentarios en `NotesView.tsx`,
  visible tanto en modo edición como con la nota bloqueada (igual que en
  `PendienteCuerpo`); chips de etiqueta también visibles en la lista de notas.
- **Alcance deliberado, no ampliado en este hito**: no se creó un componente genérico
  `EntidadCuerpo` que unifique `PendienteCuerpo` y esta UI de notas — habría sido el
  refactor más caro dentro del más caro. Se prefirió duplicar ~40 líneas de JSX ya
  validado antes que arriesgar el flujo de Pendientes (con datos reales de usuarios en
  Supabase) para lograr una abstracción que hoy no paga su costo. Candidato a
  revisitarse si un tercer tipo de Entidad (Evento, Proyecto) necesita lo mismo.
  `Nota` tampoco ganó `adjuntos` a nivel raíz — el mockup pide "Archivos" en notas, que
  cubren mejor un componente de adjuntos de nota completo (como `AdjuntosUI` en
  Pendiente) que no se abordó aquí; los comentarios de nota sí pueden llevar imágenes.
- Verificado con `npm run test` (93/93, incluye los 22 de `sync-merge`), `tsc --noEmit`,
  `npm run build`, y una pasada visual en Chrome: agregar etiqueta y comentario a una
  nota bloqueada, confirmar que el chip aparece en la lista de notas.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 completo).

### Fase 8 — Funcionalidad tipo Todoist/Things (antes Fase 2, en curso)

### Fase 8.1 — Etiquetas como entidad (2026-08-06)

- **Añadido**: `Etiqueta { id, nombre, color, creado, modificado }` en `src/types.ts` +
  CRUD en `src/store.tsx` (`crearEtiqueta`, `actualizarEtiqueta`, `eliminarEtiqueta`,
  `colorDeEtiqueta`), persistido en `localStorage['pn_etiquetas']`.
- **Añadido**: gestión de etiquetas dentro de `AjustesDialog.tsx` (crear, recolorear con
  un clic en el punto de color, eliminar) — mismo patrón visual que el resumen de
  columnas del tablero que ya vivía ahí.
- **Cambiado**: los pills de etiqueta en `PendienteCuerpo.tsx` y `NotesView.tsx` (detalle
  y lista) ahora resuelven color por nombre contra la entidad si existe una etiqueta
  registrada con ese nombre; si no, siguen viéndose como antes (gris/primario).
- **Corregido**: "Ajustes" era inalcanzable en escritorio (el botón solo existía en el
  menú "más opciones" de móvil, `App.tsx`) — se agregó al sidebar permanente, junto a
  "Vencidos".
- **Decisión de alcance**: no se agregó el campo `etiquetaIds` de espejo que este hito
  tenía previsto originalmente — se resuelve por nombre (case-insensitive) porque nada
  consume todavía una referencia estable por id; añadirlo sin lector habría violado la
  regla de no diseñar para hipótéticos futuros. Se revisita si "filtros guardados"
  (siguiente hito de esta fase) necesita sobrevivir a un renombre de etiqueta.
- Verificado con `npm run test` (93/93), `tsc --noEmit`, `npm run build`, y una pasada
  visual en Chrome: crear la etiqueta "trabajo" con color en Ajustes → el pill `#trabajo`
  ya existente en una nota (de la Fase 7) adoptó ese color automáticamente.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 y ahora 8).

### Fase 8.2 — Papelera avanzada (2026-08-06)

- **Corregido**: `PapeleraView.tsx` prometía en la UI "se purgan a los 30 días" sin que
  ninguna lógica lo cumpliera — cualquier ítem borrado se quedaba ahí para siempre. Se
  agregó purga automática real en `src/store.tsx` (`useEffect` al montar `AppProvider`,
  filtra `pendientes`/`notas`/`eventos` con `borrado && modificado` más viejo que 30
  días).
- **Corregido**: `confirm()` nativo del navegador en "Vaciar papelera" (ya señalado en
  `AUDITORIA.md` §1) reemplazado por un `Dialog` propio con conteo dinámico de
  elementos a eliminar, consistente con el resto de confirmaciones de la app.
- Verificado con `npm run test` (93/93), `tsc --noEmit`, `npm run build`, y una pasada
  visual: eliminar un pendiente → aparece en Papelera → "Vaciar papelera" abre el
  diálogo propio con el conteo correcto → Cancelar lo conserva.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 y 8).

### Fase 8.3 — Filtros guardados / smart lists (2026-08-06)

- **Añadido**: `FiltroGuardado { id, nombre, atajo?, criterios, creado, modificado }` en
  `src/types.ts`, capturando el mismo criterio que ya filtraba `ListView` (texto, estado,
  prioridad, responsable, orden, agrupación, filtro de fecha). CRUD en `src/store.tsx`
  (`crearFiltroGuardado`, `actualizarFiltroGuardado`, `eliminarFiltroGuardado`), más
  `filtroActivoId`/`setFiltroActivoId` como señal de UI para aplicar un filtro desde
  fuera de `ListView` (mismo patrón que `filtroFecha`/`espacioActualId`).
- **Añadido**: fila de chips de filtros guardados en `ListView.tsx` (aplicar con un
  clic, quitar con la `x`) y diálogo "Guardar filtro actual" (nombre + atajo opcional).
- **Añadido**: atajo global `Ctrl+Shift+1-4` en `App.tsx` — navega a Pendientes y aplica
  el filtro asignado a esa posición, sin importar la vista donde se presione.
- **Cambio de alcance respecto al plan original**: el plan de esta fase reservaba los
  dígitos sueltos `6-9`. Se escribió cuando la app tenía 5 vistas (`1-5` libres); hoy
  tiene 7 (Inbox y Papelera se sumaron en fases posteriores), así que `6` y `7` ya
  navegan a Panel/Papelera. Se usa `Ctrl+Shift+1-4` en su lugar — documentado en
  `types.ts` y `AyudaAtajos.tsx` para que quede claro por qué difiere de lo planeado.
- Verificado con `npm run test` (93/93), `tsc --noEmit`, `npm run build`, y una pasada
  visual: guardar un filtro con atajo `Ctrl+Shift+1` desde Pendientes, navegar a Hoy, y
  confirmar que el atajo global vuelve a Pendientes con el filtro reaplicado.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 y 8).

### Fase 8.4 — Subtareas anidadas (2026-08-06)

- **Añadido**: `Subtarea.children?: Subtarea[]` en `src/types.ts` — opcional, sin
  migración. `subtareasPendientes` (types.ts) y `progresoSub` (app-utils.ts) ahora
  cuentan recursivamente (una subtarea con hijos vale 1 + su árbol).
- **Añadido**: `agregarSubSubtarea` en `src/store.tsx`, con `toggleSubtarea` y la
  inserción de hijos operando recursivamente por id sobre `children` (sin asumir
  profundidad fija).
- **Añadido**: `FilaSubtarea` en `PendienteCuerpo.tsx`, componente recursivo con
  indentación por nivel y botón "agregar sub-subtarea" (limitado a 2 niveles en la UI
  para no volverla ilegible; el dato soporta más).
- **Limitación conocida, documentada a propósito**: `mergeNota`/`mergePendiente` en
  `sync-merge.ts` siguen uniendo `subtareas` por id de nivel superior (sin fusionar
  `children` recursivamente); si dos dispositivos editan hijos distintos de la misma
  subtarea offline al mismo tiempo, gana el lado "más reciente" completo en vez de
  fusionar el árbol. Edge case aceptado por ahora — fusionar árboles es un problema
  bastante más grande que esta fase.
- Verificado con `npm run test` (93/93), `tsc --noEmit`, `npm run build`.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 y 8).

### Fase 8.5 — Dependencias entre pendientes (2026-08-06)

- **Añadido**: `Pendiente.bloqueadoPor?: string[]` (ids de otros pendientes) en
  `src/types.ts`, y `estaBloqueado(p, todos, idCompletado)` en `app-utils.ts` — un
  bloqueador que ya no existe (se borró) no cuenta, para no dejar algo bloqueado para
  siempre por un dato huérfano.
- **Añadido**: selector "Bloqueado por" (checklist) en la sección "Más detalles" de
  `TaskModal.tsx`.
- **Añadido**: badge "🔒 bloqueado" en `TaskRow.tsx` cuando aplica, y toggle
  "🔓 Disponibles" en `ListView.tsx` que oculta los pendientes bloqueados.
- **Decisión de alcance**: no se impide completar un pendiente bloqueado (a diferencia
  de las subtareas, que sí lo bloquean) — es informativo/filtrable, no una regla dura.
  Bloquear la acción sería una decisión de producto mayor que no pidió `Cambios.md`.
- Verificado con `npm run test` (93/93), `tsc --noEmit`, `npm run build`.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 y 8).

### Fase 8.6 — Plantillas de pendientes (2026-08-06)

- **Añadido**: `PlantillaPendiente { id, nombre, datos, creado, modificado }` en
  `src/types.ts` (`datos` = título, descripción, prioridad, etiquetas, subtareas,
  proyecto — deliberadamente sin fecha ni estado, que dependen del momento en que se
  instancia). CRUD + `crearPendienteDesdePlantilla` en `src/store.tsx` (fecha límite
  calculada por prioridad al instanciar, subtareas con ids frescos).
- **Añadido**: botón "Guardar como plantilla" en `TaskModal.tsx` (sección "Más
  detalles"), captura el estado actual del formulario.
- **Añadido**: grupo "Plantillas" en `PaletaComandos.tsx` — instancia y abre el Peek
  directamente, sin pasos intermedios ("menos clics").
- **Añadido**: gestión (solo eliminar) en `AjustesDialog.tsx`, mismo patrón que
  Etiquetas.
- Verificado con `npm run test` (93/93), `tsc --noEmit`, `npm run build`.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 y 8).

### Fase 8.7 — Recurrencias avanzadas tipo RRULE (2026-08-06)

- **Añadido**: sufijos `;until:YYYY-MM-DD` y `;count:N`, puramente aditivos a la
  gramática de `repetir` que ya existía (`extraerSufijos` en `app-utils.ts`) — una
  regla sin sufijos se comporta exactamente igual que antes.
- **Añadido**: patrón `nth:<n>:<dow>` ("el 2º martes de cada mes"), con
  `enesimoDiaSemana` calculando la ocurrencia N del día de la semana en un mes
  (si el mes no tiene una 5ª ocurrencia, `Date` normaliza al mes siguiente —
  comportamiento aceptado y documentado en el código).
- **Añadido**: `proximaInstanciaRepeticion(regla, fechaBase)` centraliza toda la
  decisión de "¿corresponde crear la siguiente instancia?" (respeta `until`/`count`) en
  un solo lugar testeable, reemplazando la lógica que antes vivía inline en
  `toggleCompletar` (`store.tsx`).
- **Añadido**: 11 tests nuevos en `tests/app-utils.test.ts` cubriendo sufijos, `nth:`,
  y las tres ramas de `proximaInstanciaRepeticion` (sin sufijos, `count` decreciente
  hasta 0, `until` cortando la serie) — el motor de recurrencias es lógica de fechas
  delicada con 69 tests previos ya dependiendo de ella, así que se verificó con tests
  en vez de solo una pasada visual.
- **Alcance deliberado, no ampliado en este hito**: `TaskModal.tsx` sigue exponiendo
  solo el `<Select>` fijo de reglas simples que ya tenía; no se construyó UI para
  elegir `until`/`count`/`nth` (date picker + selector de ordinal + día de semana). El
  motor es completamente funcional y probado; falta la superficie de UI para que un
  usuario la arme sin escribir la regla a mano — candidato a un hito propio si se pide.
- Verificado con `npm run test` (104/104, +11 nuevos), `tsc --noEmit`, `npm run build`.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 y 8).

### Fase 8.8 — Importación CSV / Todoist (2026-08-06)

- **Añadido**: `src/lib/importCsv.ts` — parser CSV propio (RFC 4180: comillas,
  comas y `""` escapadas dentro de campos, sin dependencia nueva), detección de
  formato (`propio` = roundtrip de nuestro "Exportar CSV", `todoist` = firma por
  columna `CONTENT`, `generico` = primera columna como título), y mapeo de filas.
- **Añadido**: `src/components/ImportarCsvDialog.tsx` — vista previa de lo que se
  va a crear (título, prioridad, fecha, responsable, proyecto) antes de
  confirmar; nunca importa a ciegas, mismo criterio que el resto de
  confirmaciones masivas/destructivas de la app.
- **Añadido**: entrada "Importar CSV / Todoist" en el sidebar de escritorio y el
  menú móvil, junto a "Importar JSON".
- **Añadido**: 13 tests en `tests/importCsv.test.ts` (parser CSV con comillas y
  CRLF, detección de formato, mapeo de los tres formatos, filas sin título
  descartadas, filas de Todoist que no son `TYPE=task` ignoradas).
- Verificado con `npm run test` (117/117, +13 nuevos), `tsc --noEmit`,
  `npm run build`, y una pasada real en Chrome: subí un CSV con un título que
  contiene una coma entre comillas (`"Cotizar equipo, urgente"`), confirmé que
  el parser no lo cortó a la mitad, y que el pendiente se creó con proyecto,
  fecha y prioridad correctos.
- Service Worker: sin bump todavía (se agrupa al cerrar el bloque Fase 2-6 y 8).

### Fase 8.9 — `supabase_setup.sql` idempotente (2026-08-06)

- **Añadido**: `supabase_setup.sql` en la raíz del repo (referenciado por
  `README.md` desde antes, pero inexistente hasta ahora). Extraído del código
  real (no inventado): `src/sync.tsx`, `src/lib/espacio.ts` y
  `supabase/functions/google-calendar/index.ts` — cada tabla/columna del script
  tiene un lector o escritor concreto en la app.
- Cubre: `pnp_espacios`, `pnp_espacio_miembros` (rol `padre`/`hija`),
  `pnp_invitaciones`, el sobre genérico `{id, user_id, espacio_id, data jsonb,
  updated_at}` que comparten `pnp_pendientes`/`pnp_notas`/`pnp_proyectos`/
  `pnp_eventos`, y `pnp_google_calendar` (acceso exclusivo de la Edge Function
  vía `service_role`, deny-all para el cliente). RLS por espacio compartido
  (padre e hija ven y editan los mismos datos, no solo lo que cada uno subió) en
  vez de por dueño de fila. RPCs `pnp_espacio_actual` (crea el espacio la
  primera vez) y `pnp_canjear_invitacion` (une como 'hija', de un solo uso).
  Registra las 5 tablas que la app suscribe por Realtime. Bucket de Storage
  `pnp_adjuntos`.
- Idempotente: `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`,
  `DROP POLICY IF EXISTS` antes de recrear, chequeo de publicación de Realtime
  antes de agregar cada tabla — correrlo de nuevo sobre una base ya
  provisionada no falla ni duplica.
- No se pudo verificar contra una base real (no hay credenciales del proyecto
  Supabase en este entorno) — revisado por lectura contra los usos exactos del
  código, pero recomendado correrlo primero contra un proyecto de prueba antes
  de un entorno con datos reales.
- Service Worker: sin bump (script SQL, no cambia nada del lado del cliente).

### Cierre del bloque Fase 8

Con 8.1-8.9 completas, el bloque de funcionalidad tipo Todoist/Things queda
cerrado. Verificación acumulada: 117/117 tests, `tsc --noEmit` y
`npm run build` limpios en cada hito.

### Fase 9.1 — Heatmap de actividad y métricas de productividad (2026-08-06)

- **Añadido**: `actividadPorDia`, `rachaDiaria`, `medianaTiempoVida`,
  `throughputSemanal`, `isoSumarDias` en `src/lib/app-utils.ts` — todas puras y
  testeadas (14 tests nuevos, con `vi.setSystemTime` para fechas
  deterministas). `actividadPorDia` cuenta por `fechaCompletado` (que ya se
  limpia a `null` al reabrir un pendiente, así que no hace falta filtrar por
  columna); la racha cuenta desde hoy o, si hoy todavía no tiene actividad,
  desde ayer (no se ve "rota" a las 9am).
- **Añadido**: `HeatmapActividad` en `src/views/OtherViews.tsx` — 16 semanas
  completas (domingo-sábado) en un solo hue (`bg-primary`, 5 pasos de
  opacidad), con `bg-muted` para "sin actividad" (nunca opacidad 0, que sería
  un hueco invisible en vez de un track). Tooltip nativo (`title`) por celda.
  Guiado por el skill `dataviz`: escala secuencial de una sola tonalidad, sin
  inventar una paleta nueva — reutiliza el primary ya validado del tema.
- **Añadido**: 3 KPI nuevos en el Dashboard (Racha 🔥, Esta semana, Mediana
  días/tarea) junto a los que ya existían.
- Verificado con `npm run test` (126/126, +9 nuevos), `tsc --noEmit`,
  `npm run build`, y una pasada visual en Chrome: completar un pendiente hizo
  aparecer la celda de hoy en el heatmap y actualizó Racha/Esta
  semana/Mediana en tiempo real.
- Service Worker: sin bump todavía.

### Fase 9.2 — Time tracking opcional (2026-08-06)

- **Añadido**: `Pendiente.tiempoTotalMin?`/`tiempoInicio?` en `src/types.ts` —
  aditivos, sin migración. `iniciarTimer`/`pausarTimer` en `src/store.tsx`:
  solo un timer corre a la vez en toda la app (empezar uno pausa cualquier otro
  que estuviera corriendo, como en la vida real). `toggleCompletar` pausa y
  acumula automáticamente si el timer seguía corriendo al completar — no tiene
  sentido que seguiera contando sobre algo ya terminado.
  `Comentario` se conserva sin cambios.
- **Añadido**: `TimerPendiente` en `PendienteCuerpo.tsx` — play/pause + tiempo
  acumulado formateado (`Xh Ym`), re-renderiza cada minuto mientras corre (no
  cada segundo, no hay razón para gastar renders en algo que se muestra
  redondeado a minutos).
- Verificado con `npm run test` (126/126), `tsc --noEmit`, `npm run build`, y
  una pasada visual en Chrome: iniciar → "corriendo" → pausar antes de un
  minuto → vuelve a "Sin tiempo registrado" (redondeo esperado, no un bug).
- Service Worker: sin bump todavía.

### Fase 9.3 — Vista Agenda: decisión de no construirla (2026-08-06)

- **Decisión**: no se construye una vista Agenda nueva. Ya existía un modo
  `'agenda'` en `PendientesView.tsx` (retirado en la Fase 1, migrado a
  `'calendario'` — ver el comentario en el propio código), y la Fase 3 de este
  mismo roadmap construyó `TimelineHoy` dentro de `TodayView` con el mismo
  propósito (timeline de hoy con horas, mezclando pendientes y eventos).
  Construir una tercera versión sería duplicar una funcionalidad que ya existe
  dos veces en el historial del proyecto — exactamente lo que `Cambios.md`
  pide evitar ("reutilizar componentes siempre que sea posible").
- No hay cambio de código en este punto — es una decisión de alcance, no una
  implementación.

### Cierre del bloque Fase 9

Con 9.1-9.3 completas (dos implementadas, una deliberadamente no construida
por redundancia), el bloque de estadísticas y productividad queda cerrado.
Verificación acumulada: 126/126 tests, `tsc --noEmit` y `npm run build`
limpios en cada hito.

### Fase 10.1 — Accesibilidad rápida (2026-08-06)

- **Cambiado**: zoom accesible en móvil — `index.html` pasa de
  `maximum-scale=1.0, user-scalable=no` (bloqueaba el zoom, una violación de
  accesibilidad conocida) a `maximum-scale=5.0, user-scalable=yes`.
- **Añadido**: `SkipLink` (`src/components/SkipLink.tsx`) — invisible hasta
  recibir foco por teclado, salta directo a `#main-content` sin pasar por todo
  el sidebar. Montado en ambos layouts (móvil y escritorio) de `App.tsx`.
- **Añadido**: `aria-label` descriptivo en los `Checkbox` de completar/toggle
  (`TaskRow.tsx`, `PendienteCuerpo.tsx`, `ListView.tsx`, `TaskModal.tsx`) y en
  el badge de ponderación (`TaskRow.tsx`) — antes un lector de pantalla solo
  anunciaba "casilla de verificación" sin decir de qué.
- **Cambiado**: i18n es-MX consistente — `nombreDiaSemana`/`nombreMes` en
  `src/lib/app-utils.ts`, vía `Intl.DateTimeFormat('es-MX', ...)`, reemplazan
  los arrays `NOMBRES_DIAS_LARGO` (`OtherViews.tsx`) y `MESES`
  (`CalendarioView.tsx`) hardcodeados. `NOMBRES_DIAS` interno de
  `app-utils.ts` ahora se deriva del mismo helper (mismo array final, sin
  cambio de comportamiento). Se dejaron intactos los diccionarios que existen
  para *parsear* texto libre del usuario (`DIAS_SEMANA` en `app-utils.ts`,
  usado por `parsearLinea`) — Intl formatea fechas, no reemplaza un parser de
  lenguaje natural.
- **Alcance deliberado, no tocado en este hito**: los arrays de días
  *abreviados* (`DIAS_CORTOS` en `OtherViews.tsx`/`CalendarioView.tsx`) se
  dejaron como estaban — `Intl` con `weekday: 'short'` en es-MX agrega un
  punto final ("dom." en vez de "dom"), lo que habría sido un cambio visual
  real en muchas etiquetas de fecha sin aportar valor de accesibilidad
  (es puro estilo, no i18n real: la app ya no tiene otro idioma).
- Verificado con `npm run test` (129/129, +3 nuevos para `nombreDiaSemana`/
  `nombreMes`), `tsc --noEmit`, `npm run build`, y una pasada visual en
  Chrome: `Tab` desde la carga muestra "Saltar al contenido principal",
  `Enter` salta a `#main-content` y el siguiente `Tab` entra directo a la
  vista (sin pasar por el sidebar); el Calendario muestra "02 – 08 De Agosto
  2026" con el mes vía `nombreMes`.
- Service Worker: sin bump todavía.

### Fase 10.2 — Confirmaciones destructivas (2026-08-06)

- **Añadido**: `src/components/ConfirmDialog.tsx` — confirmación destructiva
  genérica (título + descripción + Cancelar/Eliminar), extraída del patrón que
  ya usaba `PapeleraView.tsx` (Fase 8.2) para "Vaciar papelera", en vez de
  reimplementarlo en cada sitio nuevo.
- **Cambiado**: eliminar proyecto (`ProyectosView.tsx`, dos entradas: menú
  contextual de la lista y botón de la cabecera del detalle), eliminar carpeta
  de notas (`NotesView.tsx`, con conteo de notas afectadas en el mensaje) y
  eliminar evento de calendario (`CalendarioView.tsx`, tres entradas: dos
  menús contextuales + el botón del diálogo de edición) ahora piden
  confirmación en vez de borrar al primer clic.
- Verificado con `npm run test` (129/129), `tsc --noEmit`, `npm run build`, y
  una pasada visual en Chrome: eliminar un proyecto por el menú contextual
  abre el diálogo con el nombre interpolado; Cancelar lo conserva.
- Service Worker: sin bump todavía.

### Fase 10.3 — Atajos nuevos (2026-08-06)

- **Añadido**: `Ctrl+Enter` guarda en `TaskModal.tsx` (a nivel de `DialogContent`,
  no interfiere con el `Enter` simple que ya usaban los campos de subtarea/comentario).
- **Añadido**: `J`/`K` (mover selección a la fila siguiente/anterior) y `X`
  (completar la fila seleccionada) en `ListView.tsx` — solo en escritorio
  (`isMobile` los desactiva: en móvil son letras normales para escribir, y sin
  teclado físico el atajo no tiene destinatario).
- **Cambiado**: `AyudaAtajos.tsx` documenta los tres.
- Verificado con `npm run test` (129/129), `tsc --noEmit`, `npm run build`, y
  una pasada visual en Chrome: `J` selecciona y abre el detalle de la primera
  fila, `X` la completa (título tachado + badge), `X` de nuevo la reabre.
- Service Worker: sin bump todavía.

### Fase 10.4 — Drag & drop accesible por teclado (2026-08-06)

- **Añadido**: tarjetas del Kanban (`KanbanDnd.tsx`) ahora son enfocables
  (`tabIndex=0`, `role="button"`, `aria-label` describiendo pendiente + columna
  actual). `Espacio` sobre una tarjeta enfocada abre un diálogo "Mover
  <título>" con las columnas restantes (la actual queda deshabilitada);
  `Enter` sigue abriendo el detalle (Peek), igual que el click.
- **Decisión de diseño**: no se reutilizó el "Mover a columna" que ya existía
  en el menú contextual (`MenuContextoPendiente.tsx`) porque abrir un
  `ContextMenu` por teclado depende de la tecla física "Menú", que no todos
  los teclados tienen y el soporte varía entre navegadores — un diálogo
  dedicado con `Espacio` es la única vía garantizada de funcionar igual en
  cualquier teclado.
- Verificado con `npm run test` (129/129), `tsc --noEmit`, `npm run build`, y
  una pasada visual en Chrome: foco confirmado programáticamente en una
  tarjeta, `Espacio` abrió el diálogo con las columnas restantes correctas.
- Service Worker: sin bump todavía.

### Fase 10 — resto: decisión de diferir (2026-08-06)

- **Skeletons en el primer pull**: la app es local-first (los datos cargan
  síncronos desde `localStorage` al montar `AppProvider`) — no hay una espera
  de red visible en el camino crítico salvo la primera sincronización remota
  con Supabase, que ya muestra su propio estado (`SyncBadge`). Construir
  skeletons sin un caso de espera real que los justifique sería UI
  especulativa; se revisita si `sync.tsx` gana una carga inicial
  perceptiblemente lenta.
- **Búsqueda con sintaxis `assignee:/priority:/due:<`**: `ListView.tsx` ya
  tiene filtros estructurados equivalentes (selects de Responsable/Prioridad +
  chips de fecha) — la sintaxis de texto sería una segunda forma de expresar
  lo mismo que ya se puede hacer con controles visibles, no una capacidad
  nueva. Se prioriza si aparece una necesidad real de combinar criterios que
  los filtros actuales no cubran (ej. "vencidos hace más de 5 días").
- **Undo stack global multi-nivel (`Ctrl+Z`)**: la app ya tiene undo de
  un-nivel en las acciones destructivas más comunes (toast "Deshacer" al
  eliminar/archivar un pendiente o nota, `store.tsx`). Un stack global
  multi-nivel real requeriría un patrón de comando genérico sobre *todas* las
  mutaciones de las 6+ entidades del store (crear/actualizar/eliminar
  pendiente/nota/proyecto/evento/etiqueta/plantilla/filtro/espacio, más
  subacciones como subtareas/comentarios/timer), lo cual es un refactor
  arquitectónico de fondo — no algo para sumar al final de una sesión ya
  larga sin el diseño y la revisión que merece. Queda como el ítem pendiente
  más grande de esta fase, candidato a su propia sesión dedicada.
- Estas tres decisiones cierran la Fase 10 con lo de mayor valor/riesgo
  razonable ya resuelto (10.1-10.4) y lo que falta explícitamente justificado,
  no simplemente omitido.

### Cierre del bloque Fase 10

Con 10.1-10.4 implementadas y el resto conscientemente diferido con su
razón documentada, el bloque de UX/UI y accesibilidad queda cerrado.
Verificación acumulada: 129/129 tests, `tsc --noEmit` y `npm run build`
limpios en cada hito.

### Fase 11.1-11.3 — Colaboración multi-usuario, parte local (2026-08-06)

- **11.1 — "Asignadas a mí"**: chip fijo `🙋 Asignadas a mí` en `ListView.tsx`,
  junto a "Archivados"/"Disponibles". Reusa el filtro de Responsable que ya
  existía (`fResp`) en vez de duplicar lógica de filtrado — un clic pone
  "Responsable: `<tu usuario>`" sin abrir el select y buscarte en la lista.
- **11.2 — Menciones `@nombre`**: en el input de comentarios de
  `PendienteCuerpo.tsx`, detecta `@fragmento` al final del texto mientras se
  escribe y muestra un popover con coincidencias de `personas` (nombres ya
  usados como responsable/solicitante en la app — no requiere estar en un
  espacio sincronizado). Los comentarios ya publicados resaltan `@nombre` en
  color primario. Es puramente visual/de texto: no dispara ninguna
  notificación ni requiere que la persona mencionada exista como cuenta.
- **11.3 — Recordatorios locales**: `src/hooks/use-recordatorios-locales.ts` +
  toggle en `AjustesDialog.tsx` (pide permiso de `Notification` al activarlo).
  Revisa cada minuto los pendientes agendados con hora para hoy y dispara una
  notificación del navegador cuando llega (o hasta 5 min después, por si el
  intervalo lo agarra tarde), sin repetir el mismo aviso. **Limitación real,
  explicada en la propia UI**: sin servidor de push, solo funciona mientras la
  pestaña sigue abierta (aunque sea en segundo plano) — con la app totalmente
  cerrada no hay forma de notificar. Es "mejor que nada", no un sustituto de
  push real.
- Verificado con `npm run test` (129/129), `tsc --noEmit`, `npm run build`, y
  una pasada visual en Chrome: "Asignadas a mí" sincroniza con el select de
  Responsable; `@Li` en un comentario mostró el popover con "Liz", seleccionarla
  insertó `@Liz `, y el comentario publicado la resalta; el toggle de
  recordatorios intentó pedir permiso de notificación correctamente
  (`Notification.requestPermission()` se invoca — el diálogo nativo del
  navegador no es interactuable desde la automatización de pruebas, límite
  esperado, no un bug).
- Service Worker: sin bump todavía.

### Fase 11 — resto: decisión de diferir (2026-08-06)

Los ítems que quedan de esta fase cambian el **modelo de datos compartido en
vivo** (esquema de Supabase con datos reales de usuarios ya sincronizados) o
inventan una semántica de producto nueva que no pidió `Cambios.md`
explícitamente — se difieren con su razón, no se omiten en silencio:

- **Compartir pendiente ítem-a-ítem con miembros del espacio**: el modelo de
  sync actual (`src/sync.tsx`, RLS en `supabase_setup.sql`) comparte *todo* lo
  del espacio por igual entre padre e hija — no existe hoy un concepto de
  visibilidad por ítem. Pasar a compartir selectivo es un cambio de semántica
  de producto (¿quién decide qué se comparte? ¿el padre siempre ve todo?) que
  además requiere una tabla y políticas RLS nuevas tocando el esquema que ya
  usan cuentas reales — no algo para decidir unilateralmente sin confirmar el
  diseño con el usuario primero.
- **Vista Notificaciones con badge realtime**: requeriría una tabla
  `pnp_notificaciones` nueva más la lógica que decide *cuándo* se genera una
  notificación (¿trigger de Postgres en cada mención/asignación? ¿client-side
  al detectar el cambio?) — ninguna de las dos partes existe hoy. Es
  infraestructura de backend real para un solo ítem de una lista larga; mejor
  como su propio hito con el diseño del trigger acordado de antemano.
- **`supabase_setup.sql` con tablas para etiquetas/presets/plantillas
  compartidas**: hoy `Etiqueta` (Fase 8.1) y `PlantillaPendiente` (Fase 8.6)
  son puramente locales (`localStorage`), by design — sincronizarlas es una
  extensión real del alcance de esas fases, no de "colaboración". Se
  revisita si aparece la necesidad concreta de compartir etiquetas/plantillas
  entre miembros de un espacio.
- Menciones (11.2) y recordatorios (11.3) sí se implementaron completos
  porque son enteramente locales — no tocan el esquema compartido ni inventan
  semántica de producto nueva.

### Cierre del bloque Fase 11

Con 11.1-11.3 implementadas (todo lo que era seguro de resolver sin tocar el
esquema de datos compartido en vivo) y el resto diferido con su razón
documentada, el bloque de colaboración multi-usuario queda cerrado hasta que
se confirme el diseño de los ítems restantes. Verificación acumulada:
129/129 tests, `tsc --noEmit` y `npm run build` limpios en cada hito.

### Fase 12.1 — Exportación a ICS, Markdown y HTML imprimible (2026-08-06)

- **Añadido**: `src/lib/exportar.ts` — `generarICS` (VEVENT por pendiente
  agendado, con hora o de día completo, más eventos de calendario sueltos;
  escapado RFC 5545 de `\`, `;`, `,` y saltos de línea), `generarMarkdown`
  (checklist agrupado por prioridad, `- [x]`/`- [ ]` según `fechaCompletado`,
  más una sección de notas), `generarHTMLImprimible` (documento autocontenido
  con CSS de impresión, título/proyecto/fecha escapados contra inyección
  HTML).
- **Añadido**: dropdown "Más formatos…" en el sidebar de escritorio (junto a
  Exportar JSON/CSV, agrupado para no sumar 3 botones sueltos a un sidebar ya
  con varios) y 3 botones planos en el menú móvil.
- **Añadido**: 12 tests en `tests/exportar.test.ts` — formato de fecha/hora
  ICS, suma de `duracionMin`, evento de día completo, escapado de caracteres
  especiales, filtrado de borrados/archivados, resolución de nombre de
  proyecto por `proyectoId`, y que el HTML escapa `<`/`>` en vez de
  interpolar el título crudo.
- Verificado con `npm run test` (141/141, +12 nuevos), `tsc --noEmit`,
  `npm run build`, y una pasada visual en Chrome: el dropdown se abre sin
  romper el layout del sidebar, "HTML imprimible" descarga sin errores en
  consola.
- Service Worker: sin bump todavía.

### Fase 12.2 — CI mínimo (2026-08-06)

- **Añadido**: `.github/workflows/ci.yml` — corre en cada PR y en push a
  `main`: `npm ci` → `npm run lint` → `npm run build` (que ya encadena
  `tsc -b && vite build`, cubriendo typecheck) → `npm run test`. Sin job de
  despliegue (el README documenta despliegue manual de `dist/`, no hay
  secretos de hosting en este repo).
- **Corregido**: `npm run lint` no se había corrido en toda esta sesión (Fases
  2-11) y tenía 4 errores reales acumulados de las reglas
  `react-hooks/purity`/`react-hooks/refs`/`react-hooks/set-state-in-effect`
  (parte de las reglas del compilador de React, más estrictas que antes):
  - `PendienteCuerpo.tsx` (`TimerPendiente`, Fase 9.2): llamaba `Date.now()`
    directo en el cuerpo del render (debe ser puro). Ahora vive en estado
    (`ahora`), actualizado desde el propio efecto que ya existía.
  - `use-recordatorios-locales.ts` (Fase 11.3): escribía `ref.current` durante
    el render en vez de dentro de un efecto.
  - `store.tsx` (purga de papelera, Fase 8.2) y `ListView.tsx` (aplicar filtro
    guardado, Fase 8.3): `setState` síncrono dentro de un efecto — patrones
    legítimos (corrección puntual contra el reloj al montar; sincronizar
    estado local desde una señal externa) que la regla nueva marca por
    defecto; se documentó por qué con un `eslint-disable` acotado al bloque,
    no una supresión global.
  - Si se hubiera agregado el CI *antes* de corregir esto, habría fallado en
    el primer push — se corrigió antes de habilitarlo, no después.
- Verificado con `npm run lint` (0 errores, 0 warnings), `npm run test`
  (141/141), `tsc --noEmit`, `npm run build` — los cuatro pasos que el CI
  nuevo va a correr, confirmados localmente primero.
- Service Worker: sin bump (solo tooling, sin cambio visible al usuario).

### Fase 12.3 — Auditoría final con `knip` (2026-08-06)

- **Añadido**: `knip` como devDependency, con `knip.json` mínimo (`project:
  ["src/**/*.{ts,tsx}", "tests/**/*.ts"]`) — el glob restringe el análisis al
  grafo real de la app Vite, evitando falsos positivos en `public/sw.js` (no
  es un módulo importado, lo carga el navegador directo) y
  `supabase/functions/**` (Deno, fuera del bundle). Se probó primero una
  versión con `ignore` explícito para esos dos paths; el propio knip marcó esa
  config como redundante frente al `project` glob y se simplificó.
- **Eliminado** (confirmado sin importadores vía `grep -rl` antes de borrar):
  `src/App.css`; 10 componentes shadcn sin uso (`alert`, `card`, `popover`,
  `progress`, `separator`, `sheet`, `skeleton`, `switch`, `tabs`, `tooltip` —
  se habían conservado desde la Fase 1 "para fases 3-5" pero ninguna fase
  terminó consumiéndolos).
- **Eliminado** del `package.json`: dependencias de producción
  `@radix-ui/react-{popover,progress,separator,switch,tabs,tooltip}`,
  `date-fns`, `next-themes`; devDependencies `@parcel/config-default`,
  `@testing-library/user-event`, `buffer`, `html-inline`, `parcel`,
  `parcel-resolver-tspaths` (restos de un toolchain Parcel nunca conectado a
  este proyecto, que en realidad usa Vite).
- **Cambiado**: `src/types.ts` deja de exportar `subtareasPendientes`
  directamente (nada la importaba por ese nombre); se mantiene solo el alias
  público `subtareasFaltantes` que sí usa la UI. `src/sync.tsx` deja de
  reexportar `LogOut` de `lucide-react` (export muerto sin importadores) y
  elimina el import ahora innecesario.
- **Conservado deliberadamente** (falsos positivos de knip, no dead code):
  `saveGoogleClientId` (`src/lib/googleCalendarConfig.ts`, se invoca desde un
  flujo de configuración manual documentado en README, no desde código
  importado); los exports de superficie de librería de los componentes
  shadcn restantes (`badgeVariants`, `buttonVariants`, subcomponentes de
  `dialog`/`dropdown-menu`/`context-menu`/`select` — son la API pública del
  primitive, se usan mezclando composición JSX aunque el analizador estático
  no siempre conecte el import con el uso).
- Verificado con `npx knip` (config final, sin `ignore` redundante — los dos
  falsos positivos siguen suprimidos correctamente), `npm run lint` (0/0),
  `tsc --noEmit`, `npm run build`, `npm run test` (141/141) — todo limpio
  después de los borrados y `npm uninstall`.
- Service Worker: sin bump (limpieza interna, sin cambio visible al usuario).

### Fase 12.4 — Release `1.0.0` (2026-08-06)

- **Cambiado**: versión `0.1.0-pre.1` → `1.0.0` en `package.json`. Cierra el
  roadmap reordenado completo de `Cambios.md` (Fases 2-12): cimientos
  visuales, shell Workspace, Espacios, Inbox universal, widgets flotantes,
  entidad común, y el bloque de funcionalidad tipo Todoist (papelera
  avanzada, etiquetas-entidad, filtros guardados, subtareas anidadas,
  dependencias, plantillas, RRULE, import CSV, exportación ICS/Markdown/HTML,
  CI, auditoría de dead code).
- Service Worker: bump a `v9` — cubre todo lo servible al usuario desde `v8`
  (Fases 9-12: estadísticas/actividad, UX/accesibilidad, exportación,
  limpieza de bundle).

### Versiones del Service Worker (gantt)

- `v6` — línea base previa a la refactor.
- `v7` — fin de la Fase 1 (refactor interno completado; primer bump que confirma
  la base).
- `v8` — cierre de las Fases 2-8 en un solo bump: cimientos visuales,
  shell Workspace, Espacios, Inbox, widgets, entidad común (etiquetas/comentarios
  en notas) y todo el bloque de funcionalidad tipo Todoist (papelera avanzada,
  etiquetas-entidad, filtros guardados, subtareas anidadas, dependencias,
  plantillas, RRULE avanzado, import CSV/Todoist, `supabase_setup.sql`). Se
  desvía del plan original de "un bump por hito" porque estas fases se
  desarrollaron en una sola sesión continua sin despliegues intermedios reales
  entre pasos — no había un usuario final recibiendo cada hito por separado,
  así que un solo bump al cerrar el bloque es más honesto que fingir 20+
  versiones intermedias que nunca se sirvieron.
- `v9` — cierre de las Fases 9-12: estadísticas/actividad, ajustes
  UX/accesibilidad, exportación ICS/Markdown/HTML, CI, y limpieza final de
  dead code — release `1.0.0`.
- `v10` — inicio de la evolución visual documentada en `PDS.md`: los
  tokens `.glass`/`.bg-ambient`/`.text-display-*` (Fase 2, definidos hace
  tiempo y sin usar) empiezan a aplicarse de verdad en la app real.
- `v11` (actual) — primitiva `<Card/>` y sidebar de 5 destinos primarios.

### Fase v2.0 (parcial) — Cimientos visuales encendidos (2026-08-08)

Primeras dos fases del roadmap de evolución visual (`PDS.md`, `ROADMAP.md` v2.0):
arreglar un bug de arranque del tema, y encender en el shell real los tokens que ya
existían en `index.css`/`tailwind.config.js` desde la Fase 2 pero nunca se habían
aplicado a ningún componente.

- **Corregido** `index.html`/`App.tsx`: el tema oscuro no sobrevivía a un refresh —
  nada aplicaba la clase `dark` antes del primer render, así que quien lo había
  elegido explícitamente arrancaba siempre en claro. Se agrega un script inline en
  `index.html` que aplica la clase antes del primer paint (leyendo `localStorage` o,
  si nunca se eligió, `prefers-color-scheme`), y `App.tsx` inicializa su estado con el
  mismo criterio en vez de leer el DOM vacío.
- **Cambiado** `App.tsx`: el contenedor raíz del shell (móvil y escritorio) pasa de
  `bg-background` a `bg-ambient`; el sidebar de escritorio y el header móvil pasan de
  `border bg-card` a `.glass`.
- **Añadido** `src/index.css`: utilidades `.text-body` (14px/500) y `.text-meta`
  (11px/600) — completan la escala tipográfica de 3 niveles junto a `.text-display-*`
  (`PDS.md` §6.3).
- **Cambiado** `src/components/TaskRow.tsx`: el título pasa de `text-xs` (12px) a
  `.text-body`, y la metadata de `text-[10px]` a `.text-meta`. La metadata siempre
  visible se reduce a columna/proyecto/fecha/estado; responsable, subtareas,
  repetición, ponderación y modalidad ahora se revelan en hover/foco del contenedor
  (`group-hover`/`group-focus-within`) en vez de competir todos al mismo peso visual.
  La fila gana elevación y una leve traslación en hover (`ease-smooth`). El swipe
  móvil, el menú contextual y todos los handlers quedan intactos — el cambio es sólo
  de presentación.
- **Nota de accesibilidad**: en pantallas táctiles (sin hover persistente), la
  metadata secundaria de una fila queda oculta hasta que se abre esa tarea — el dato
  sigue siendo alcanzable en 1 toque (Peek), no se pierde, pero no es glanceable
  inline en la lista como antes. Si esto resulta un problema real de uso, revisar
  antes de la Fase 3 completa.

### Fase v2.0 (parcial, cont.) — Primitiva `<Card/>` y sidebar de 5 destinos (2026-08-08)

Continúa el roadmap de evolución visual: unifica las 25 superficies que reinventaban a
mano `rounded-xl/lg/2xl border bg-card`, y baja la navegación primaria de 7 a 5 destinos
(`PDS.md` §5.3, `ROADMAP.md` v2.0).

- **Añadido** `src/components/ui/card.tsx`: primitiva `<Card/>` (radio 12px, borde,
  `bg-card`; prop `interactive` agrega elevación + traslación en hover con
  `ease-smooth`), siguiendo la misma convención shadcn/ui que `badge.tsx`/`button.tsx`.
- **Cambiado**: migrados a `<Card/>` los contenedores estáticos de `OtherViews.tsx`
  (hero de Hoy, timeline, heatmap, KPIs del dashboard), `NotesView.tsx` y
  `ProyectosView.tsx` (paneles de lista/detalle), `ListView.tsx` (panel de detalle),
  `CalendarioView.tsx` (selector de modo, grilla de mes, columna de backlog, vista
  semana/día), `PendientesView.tsx` (selector de modo), `PapeleraView.tsx` (fila) e
  `InboxView.tsx` (estado vacío) y la pantalla de login de `sync.tsx`. El menú "⋮" de
  `App.tsx` (un overlay, no un contenedor estático) pasa a `.glass` en vez de `<Card/>`,
  consistente con `PDS.md` §6.6 (blur reservado a overlays/widgets/dock).
- **Sin cambios deliberados**: `TaskRow.tsx` y las tarjetas del Kanban conservan su
  propio estilo (borde de color por prioridad) — no son el mismo tipo de superficie que
  `<Card/>` generaliza. Dos botones de `OtherViews.tsx` (accesos de proyecto/nota
  recientes en Hoy) tampoco se migraron: son `<button>`, y `<Card/>` es un `<div>` — se
  dejan con su tratamiento de hover actual en vez de forzar una polimorfía que no
  estaba en el alcance de este cambio.
- **Cambiado** `App.tsx`: `VISTAS` se separa en `VISTAS_PRIMARIAS` (Hoy, Inbox,
  Pendientes, Notas, Proyectos — los 5 de uso diario) y `VISTAS_SISTEMA` (Panel,
  Papelera — consulta ocasional). El sidebar de escritorio muestra `VISTAS_SISTEMA` en
  su propio grupo "Sistema"; la barra inferior móvil pasa de `grid-cols-7` a
  `grid-cols-5` con solo los primarios, y Panel/Papelera se agregan al menú "⋮" móvil
  (antes no eran alcanzables ahí). `VISTAS_VALIDAS` (atajos de teclado `1..7`,
  `LS_VISTA`) no se tocó — sigue siendo la lista completa de 7, en el mismo orden.
- **Verificado**: `npm run test` (147/147), `npm run build` y `npm run lint` en verde;
  revisión visual en `npm run dev` del sidebar, Pendientes y Papelera en tema oscuro.
