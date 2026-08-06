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

### Fase 10 — UX/UI y accesibilidad (antes Fase 4, planificado)

- **Añadido**: skeletons en el primer pull (en vez de spinners).
- **Cambiado**: confirmaciones destructivas para eliminar proyecto / carpeta / evento
  (reemplaza el `confirm()` nativo de "Vaciar papelera").
- **Cambiado**: zoom accesible en móvil (`maximum-scale=5`, `user-scalable=yes`).
- **Añadido**: SkipLink al contenido principal.
- **Añadido**: drag & drop accesible por teclado (`<Space>` abre diálogo mover).
- **Añadido**: `aria-label` en `Checkbox` de toggle y badges de ponderación.
- **Cambiado**: i18n es-MX consistente (`Intl.DateTimeFormat`) eliminando `MESES` /
  `NOMBRES_DIAS` hardcodeados.
- **Añadido**: búsqueda con sintaxis `assignee:Liz priority:alta due:<5d`.
- **Añadido**: atajos nuevos (`Ctrl+Z` undo global, `Ctrl+Enter` guardar en TaskModal,
  `J/K` navegar filas, `X` completar); corrección de atajos `1-6` (hoy `1-5` no
  alcanzan Papelera, `App.tsx:101`).
- **Añadido**: undo stack global multi-nivel (`Ctrl+Z` / `Shift+Ctrl+Z`).

### Fase 11 — Colaboración multi-usuario (antes Fase 5, planificado, sin push server)

- **Añadido**: schema SQL idempotente (`supabase_setup.sql`) con tablas para etiquetas,
  presets, plantillas, compartidos, menciones, notificaciones, proyecto_miembros. RLS
  por espacio.
- **Añadido**: vista "Asignadas a mí" como smart list destacada.
- **Añadido**: compartir pendiente ítem-a-ítem con miembros del espacio.
- **Añadido**: menciones `@miembro` en comentarios con suggestions popover.
- **Añadido**: vista Notificaciones con badge en header (realtime Supabase).
- **Añadido**: recordatorios locales (Web Notifications) sin push server.

### Fase 12 — Limpieza final y exportación (antes Fase 6, planificado)

- **Añadido**: exportación a ICS, Markdown y HTML imprimible.
- **Añadido**: CI mínimo (`lint` + `typecheck` + `build` + `test` en PRs).
- **Añadido**: auditoría final con `knip`.
- **Cambiado**: versión `0.0.0` → `1.0.0`.

### Versiones del Service Worker (gantt)

- `v6` — línea base previa a la refactor.
- `v7` — fin de la Fase 1 (refactor interno completado; primer bump que confirma
  la base).
- `v8` (actual) — cierre de las Fases 2-8 en un solo bump: cimientos visuales,
  shell Workspace, Espacios, Inbox, widgets, entidad común (etiquetas/comentarios
  en notas) y todo el bloque de funcionalidad tipo Todoist (papelera avanzada,
  etiquetas-entidad, filtros guardados, subtareas anidadas, dependencias,
  plantillas, RRULE avanzado, import CSV/Todoist, `supabase_setup.sql`). Se
  desvía del plan original de "un bump por hito" porque estas fases se
  desarrollaron en una sola sesión continua sin despliegues intermedios reales
  entre pasos — no había un usuario final recibiendo cada hito por separado,
  así que un solo bump al cerrar el bloque es más honesto que fingir 20+
  versiones intermedias que nunca se sirvieron.
- `v9` en adelante — Fase 9 (estadísticas, ex Fase 3), Fase 10
  (UX/UI/accesibilidad, ex Fase 4), Fase 11 (colaboración, ex Fase 5), Fase 12
  (limpieza + release `1.0.0`, ex Fase 6) — numeración exacta a definir cuando
  arranque cada una.
