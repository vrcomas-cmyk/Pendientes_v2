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
- `v9` (actual) — cierre de las Fases 9-12: estadísticas/actividad, ajustes
  UX/accesibilidad, exportación ICS/Markdown/HTML, CI, y limpieza final de
  dead code — release `1.0.0`.
