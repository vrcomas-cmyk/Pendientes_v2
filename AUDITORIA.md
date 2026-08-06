# Auditoría — Pendientes Pro → Personal Workspace

Documento solicitado por `Cambios.md` antes de programar cualquier mejora. Cubre las
10 auditorías pedidas, con hallazgos referenciados a archivo:línea, y cierra con el
roadmap priorizado, riesgos y estrategia de implementación incremental.

Alcance de esta auditoría: código en `src/` tal como está commiteado a `2026-08-05`
(rama `main`, HEAD `790da33`). Cero cambios de producto en esta pasada — ver
`CLAUDE.md` del proyecto y `Cambios.md` para la doctrina de "no romper, no rehacer,
evolucionar incremental".

---

## 1. Auditoría UX

**Lo que funciona bien y hay que preservar:**
- `TodayView` (`src/views/OtherViews.tsx:208`) ya organiza el día en secciones
  (Vencidos / Para hoy / Próximos 7 días / Sin fecha-Bandeja / Registro) — es
  prácticamente el embrión del Inbox y del HOY del mockup, solo falta la fusión
  cronológica en una sola timeline y el rebranding de "Sin fecha" a Inbox real.
- Captura rápida con sintaxis (`quickAdd()` en `App.tsx:155`, parser en
  `src/lib/app-utils.ts`) ya resuelve gran parte de "Quick Capture" del mockup.
- Paleta de comandos Ctrl+K ya existe (`src/components/PaletaComandos.tsx`).
- Papelera con soft-delete y undo (`src/views/PapeleraView.tsx`, `store.tsx:165-176`).

**Fricciones detectadas:**
- El rail de navegación de escritorio es de 56px y solo se expande en `hover`
  (`App.tsx:379`, `group/rail ... w-14 ... hover:w-56`). Descubribilidad pobre en touch
  / trackpad sin hover sostenido; el mockup pide un sidebar siempre legible.
- Navegación de dos niveles: `PendientesView` (`src/views/PendientesView.tsx`) es un
  sub-shell con tabs internas (`lista`/`tablero`/`calendario`) dentro de la vista
  "Pendientes" — un clic extra que el objetivo final ("menos clics") penaliza.
- `vaciarPapelera` está detrás de un `confirm()` nativo del navegador (mencionado en
  el CHANGELOG, Fase 4 planificada) — rompe la estética y es inconsistente con el resto
  de confirmaciones (toasts con "Deshacer").
- No existe concepto de Inbox universal: la captura rápida crea directamente un
  `Pendiente` con `proyecto`/`proyectoId` opcional; no hay bandeja de "sin clasificar"
  explícita, aunque `TodayView` ya filtra "Sin fecha" como aproximación.
- Atajos de teclado incompletos: `1`–`5` solo cubren 5 de las 6 vistas (`App.tsx:101`,
  `papelera` es la 6ª y queda fuera).

## 2. Auditoría UI

**Sistema de diseño actual** (`src/index.css`, `tailwind.config.js`):
- Paleta ya diferenciada: primario índigo-violeta `250 65% 58%` (comentario explícito
  en el código: "no el teal genérico de apps de tareas"), fondo cálido `40 20% 98%`,
  acento ámbar `--accent-2: 38 92% 55%` para "centro de mando" (anillo de progreso,
  rachas). Dark mode con paleta espejo (`245 28% 7%` de fondo). Esto es una base sólida
  y coherente con "identidad propia, no copiar" — se conserva.
- Tipografía ya self-hosted vía `@fontsource`: Space Grotesk (`font-display`, pesos
  500/600/700) para títulos, Plus Jakarta Sans (`font-body`) para cuerpo, JetBrains
  Mono (`font-mono`) — tres familias, jerarquía correcta para un look tipo Apple/Linear.
- `--radius: 0.75rem` ya da esquinas suaves consistentes.
- 21 primitivas shadcn en `src/components/ui/` reusables tal cual.

**Brecha contra el mockup** (`e3b88335-...png`):
- **No existe ninguna utilidad glass/blur.** Cero `backdrop-blur` o clase `.glass` en
  todo el proyecto. Es el elemento visual más distintivo del mockup (paneles
  translúcidos sobre fondo degradado) y hoy no hay ni el token ni el patrón.
- Sin fondo ambiental: el mockup usa un degradado cálido de fondo detrás de paneles de
  vidrio; hoy el fondo es un color plano (`--background`).
- Sidebar sin sección "Espacios" con chips de color — hoy la única lista lateral es
  `VISTAS` (`App.tsx:37`), sin agrupación por espacio de trabajo.
- Sin dock de accesos rápidos inferior tipo mockup (existe un FAB expandible,
  `App.tsx:232`, pero es un patrón distinto — un solo botón "+" con 2 opciones, no una
  fila fija de 4-6 accesos).
- Sin componente de "widget flotante" reutilizable (Pomodoro, Kanban rápido, Calendario
  mensual, Captura rápida) — todo lo que hoy existe está incrustado en las vistas.

## 3. Auditoría Arquitectura

- **Sin router**: navegación 100% por estado — `useState<Vista>` persistido en
  `localStorage['pn_vista']` (`App.tsx:32-54`). Barato para añadir vistas nuevas
  (Inbox, Espacios) sin dependencias nuevas; el costo es que no hay deep-linking
  (no se puede compartir/recargar una URL a una vista concreta). No es bloqueante para
  el roadmap propuesto.
- **Capas**: `App()` → `ErrorBoundary` → `AppProvider` (`src/store.tsx`) →
  `SyncProvider` (`src/sync.tsx`) → `Shell` (`App.tsx:455-465`). `Shell` tiene dos
  returns completos (móvil/escritorio) que comparten estado pero duplican JSX — ya es
  así hoy y no es un problema nuevo introducido por esta auditoría.
- **`AppCtx` (`store.tsx:9-57`) mezcla datos de dominio y estado de UI** en el mismo
  Context: `modal`, `peekId`, `notaActualId`, `proyectoAbiertoId`, `filtroFecha` viven
  junto a `pendientes`/`notas`/`proyectos`/`eventos`. Cualquier componente que consuma
  `useApp()` para leer datos se re-renderiza también cuando solo cambia UI state (abrir
  un peek, cambiar de filtro). Con Context plano sin selectores, esto escala mal a
  medida que se agreguen Espacios/Inbox/widgets con más estado de UI.
- **Persistencia**: `localStorage` vía el helper `storage` (`src/lib/app-utils.ts:178`,
  con fallback en memoria y aviso de toast si se excede la cuota), no IndexedDB. Un
  `useEffect` por colección escribe en cada cambio (`store.tsx:124-128`). Funciona bien
  al volumen actual; si Notas gana adjuntos pesados (Fase 7, entidad común) esto puede
  necesitar revisarse, pero no es bloqueante hoy.
- **Sync**: `src/sync.tsx` (498 líneas) + `src/lib/sync-merge.ts` implementan
  last-write-wins por campo escalar (comparando `modificado`) con unión determinista
  para `comentarios`/`adjuntos`/`subtareas`/`etiquetas` (`reconciliar<T>()`,
  `sync-merge.ts`). Es un merge razonablemente sofisticado para no tener backend
  propio — cualquier entidad nueva (Espacio) que quiera sincronizarse debe pasar por
  este mismo mecanismo, no inventar uno nuevo.
- **"Espacio" ya existe y significa otra cosa.** En `src/sync.tsx` y
  `src/lib/espacio.ts`, "Espacio" es la unidad de *cuenta compartida* multi-usuario
  (tablas `pnp_espacios`, `pnp_espacio_miembros`, `pnp_invitaciones`, roles
  `padre`/`hija`). El Espacio del mockup (Trabajo/Escuela/Personal/...) es un concepto
  de organización de contenido, no de identidad de cuenta. Confundirlos en el código
  sería un bug de diseño serio. Ver glosario en la skill de doctrina.

## 4. Auditoría Componentes

**Reusables sólidos, ya consolidados por refactors previos (Fase 1):**
- `src/components/PendienteCuerpo.tsx` — unificación de `TaskDetail`/`PendientePeek`.
- `src/components/KanbanDnd.tsx` — unificación de `KanbanView`/`TableroProyecto`.
- `src/components/TaskRow.tsx`, `src/components/ProgressRing.tsx` — piezas atómicas
  reusables para timeline y widgets.
- 21 primitivas `ui/*` shadcn.

**Qué reusar para el roadmap en vez de crear de cero:**
- El widget "Pomodoro" del mockup puede envolver el `ProgressRing` existente.
- El "Kanban rápido" widget puede envolver `KanbanDnd` con un `minColW` chico (la prop
  ya existe: `KanbanDnd({ pendientes, defaultsAlAgregar, minColW })`).
- El timeline de HOY puede construirse combinando `TaskRow` con los eventos de
  `EventoCalendario`, ordenados por hora — ya hay un `Seccion` genérico en
  `OtherViews.tsx` para agrupar por categoría.
- La paleta Ctrl+K (`PaletaComandos.tsx`) es la base directa del command palette del
  mockup; solo necesita más fuentes de datos (Archivos, Eventos, Personas) y tabs.

**Duplicación restante**: ninguna crítica detectada más allá de lo ya documentado en
el CHANGELOG de Fase 1.

## 5. Auditoría Performance

- Un solo `Context` sin selectores (`store.tsx`) — ver punto de arquitectura arriba.
  Riesgo creciente, no urgente hoy.
- Persistencia sincrónica a `localStorage` en cada cambio de cada colección
  (`store.tsx:124-128`) — cinco `useEffect` separados, cada uno serializa su colección
  completa con `JSON.stringify` en cada render en que cambió. Con pocos cientos de
  ítems no es un problema medible; con miles (uso muy intensivo a largo plazo) podría
  justificar debounce.
- `PaletaComandos.tsx` corta resultados con `slice(0,200)` sin virtualización — límite
  duro razonable para hoy, pero no escalará bien si se añaden Archivos/Eventos/Personas
  a la búsqueda como pide el mockup sin paginar/virtualizar.
- Ningún `React.lazy`/`Suspense` — las 7 vistas de `src/views/` (2400+ líneas
  combinadas) están en el bundle inicial. Con Vite y estas dimensiones el impacto es
  bajo hoy, pero al sumar Inbox/Espacios/Widgets es buen momento para introducir
  code-splitting por vista.

## 6. Auditoría Accesibilidad

**Ya presente:** `aria-current="page"` en ambos navs (`App.tsx:360`, `389`),
`aria-label`/`aria-expanded` en el FAB (`App.tsx:250`), `motion-reduce:animate-none`
consistente en las transiciones de vista, guard de `prefers-reduced-motion` en
`index.css:74`.

**Faltante:**
- No hay `SkipLink` al contenido principal.
- Drag & drop de Kanban (`KanbanDnd.tsx`) no tiene alternativa por teclado.
- El checkbox de completar/toggle en `TaskRow`/`Seccion` no confirmado con
  `aria-label` explícito en todos los casos (a verificar por componente al tocarlos).
- **Riesgo nuevo que introduce el mockup**: los paneles glass/blur con texto sobre
  fondo semitransparente son un riesgo de contraste conocido (WCAG). Cualquier
  implementación de glass debe fijar un mínimo de opacidad de fondo bajo el blur y
  testear contraste en ambos temas antes de aceptarse como hito completo.

## 7. Oportunidades de mejora (lista priorizable cruda)

1. Tokens glass/blur + fondo ambiental — desbloquea todo lo visual, riesgo mínimo.
2. Sidebar permanente con sección Espacios.
3. HOY como timeline cronológica única (fusionar pendientes + eventos + notas
   importantes, ya hay 80% de los datos que se necesitan en `TodayView`).
4. Entidad `Espacio` (capa nueva sobre `Proyecto`).
5. Inbox universal explícito (formalizar lo que `TodayView` ya filtra como "Sin
   fecha").
6. Sistema de widgets flotantes reutilizando `ProgressRing`/`KanbanDnd`/`TaskRow`.
7. Extender atajos (llegar a la 6ª vista, `Ctrl+Shift+*` del mockup).
8. Refactor de entidad común (`etiquetas`/`comentarios`/`adjuntos` para Notas) — caro,
   se pospone.
9. Reemplazar `confirm()` nativo de vaciar papelera por diálogo del sistema propio.
10. Corregir bugs menores de navegación (`grid-cols-5` con 6 vistas, atajos `1-5`,
    tipo `Vista` local de `PaletaComandos` sin `'papelera'`).

## 8. Roadmap priorizado

Reordenado: **lo visual primero**, según decisión explícita del usuario — la
funcionalidad tipo Todoist que ya estaba planificada (antes Fases 2-6 del CHANGELOG) se
empuja a después del rework de Workspace.

- **Fase 2 — Cimientos visuales.** Sin cambio funcional: tokens glass/blur en
  `tailwind.config.js` + `src/index.css`, fondo ambiental, escala tipográfica de
  display, curvas de animación/microinteracciones estándar, sombras suaves. Riesgo casi
  nulo porque no toca lógica ni datos. Desbloquea todas las fases siguientes.
- **Fase 3 — Shell Workspace.** Sidebar rediseñado permanente (retira el
  hover-to-expand), dock de accesos rápidos, `HOY` reconstruida como timeline
  cronológica única. Reusa `TaskRow`, `Seccion`, `ProgressRing`.
- **Fase 4 — Espacios (capa nueva).** `Espacio { id, nombre, icono, color }`,
  `Proyecto.espacioId?` opcional. Retrocompatible: sin espacio asignado, cae en un
  Espacio "General" implícito. No se reutiliza el nombre "Espacio" de sync — ver
  glosario en la skill de doctrina.
- **Fase 5 — Inbox universal.** Formaliza el filtro "sin fecha/sin clasificar" que ya
  existe en `TodayView` como una vista de primera clase con acción "mover a".
- **Fase 6 — Widgets flotantes.** Sistema desacoplado movible/redimensionable, con
  glass; primeros widgets envuelven componentes existentes (Pomodoro→`ProgressRing`,
  Kanban rápido→`KanbanDnd`).
- **Fase 7 — Entidad común.** Extraer `etiquetas`/`comentarios`/`adjuntos`/`subtareas`
  a una base compartida para que `Nota` los tenga también ("todo es una Entidad"). El
  refactor más caro y con más superficie de regresión — deliberadamente al final,
  cuando el resto del shell ya esté estable.
- **Fase 8+ — Funcionalidad tipo Todoist/Things** (lo que hoy es Fase 2-6 del
  CHANGELOG): papelera avanzada, etiquetas-entidad, filtros guardados, subtareas
  anidadas, dependencias, plantillas, RRULE, import CSV/Todoist, estadísticas,
  accesibilidad avanzada, colaboración multi-usuario, exportación.

El mapa de versiones del Service Worker se recalcula en el CHANGELOG cuando arranque
cada fase (bump por hito funcional-visible, no por refactor interno — regla ya vigente).

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Confundir "Espacio" (workspace UI, nuevo) con "Espacio" (cuenta compartida, sync existente) en código o UI | Nombre de tipo distinto en TS (`Espacio` vs el ya existente concepto de sync, que se referencia como "cuenta compartida" en UI); glosario fijado en la skill de doctrina |
| Glass/blur rompe contraste WCAG | Fijar piso de opacidad bajo el blur; testear ambos temas antes de cerrar la Fase 2 |
| Fase 7 (entidad común) rompe datos ya sincronizados en Supabase de usuarios reales | Migración aditiva únicamente (campos opcionales `?`), nunca remover columnas existentes; probar migración con `reconciliar()` de `sync-merge.ts` antes de desplegar |
| Sidebar permanente reduce espacio en pantallas angostas | Mantener el patrón mobile-first ya existente (`useIsMobile`) — el sidebar permanente es solo desktop, mobile conserva su nav propia |
| Widgets flotantes añaden complejidad de estado (posición, tamaño, z-index) que puede pisar el patrón de Context único | Diseñar el store de widgets como slice aislado (posible candidato a Context separado, no mezclarlo en `AppCtx`) |
| Alcance del roadmap se percibe como "rehacer" en vez de "evolucionar" | Cada fase se entrega, prueba y documenta independientemente; ninguna fase depende de romper la anterior |

## 10. Estrategia de implementación incremental

Protocolo por hito, uno a la vez:

1. Implementar el hito más pequeño de la fase actual.
2. Verificar que no rompe: `npm run test`, `npm run build`, y una pasada manual (o con
   la skill `probar-como-usuario`) de los flujos existentes tocados.
3. Documentar el cambio en `CHANGELOG.md` bajo la fase correspondiente, con bump del
   Service Worker si el cambio es visible al usuario.
4. Solo entonces avanzar al siguiente hito. No se abren dos fases en paralelo.
5. Antes de cada fase que toque datos (4, 7 y en adelante), confirmar explícitamente
   con el usuario que el modelo de migración es aceptable antes de escribir código.

Esta auditoría no incluye código de producto. El siguiente paso es aprobar el orden de
fases (sección 8) antes de comenzar la Fase 2.
