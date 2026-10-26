# Graph Report - Pendientes_v2  (2026-10-26)

## Corpus Check
- 202 files · ~188,127 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1737 nodes · 3472 edges · 153 communities (127 shown, 26 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e5a4f564`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- sync.tsx
- command.tsx
- compilerOptions
- use-toast.ts
- cn
- compilerOptions
- carousel.tsx
- components.json
- menubar.tsx
- What You Must Do When Invoked
- devDependencies
- @hookform/resolvers
- package.json
- buffer
- graphify reference: extra exports and benchmark
- sheet.tsx
- table.tsx
- compilerOptions
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- card.tsx
- toggle-group.tsx
- alert.tsx
- avatar.tsx
- badge.tsx
- tabs.tsx
- Pendientes + Notas Pro — PWA modular
- sonner.tsx
- class-variance-authority
- ListView.tsx
- cmdk
- date-fns
- dialog.tsx
- alert.tsx
- context-menu.tsx
- PWA Development Skill
- html-inline
- lucide-react
- next-themes
- Doctrina del Workspace — Pendientes Pro
- App-Like Features
- graphify reference: query, path, explain
- @radix-ui/react-checkbox
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- @radix-ui/react-dropdown-menu
- Workbox (Recommended)
- @radix-ui/react-label
- package.json
- Offline Experience
- 2. Los 12 puntos pedidos
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- Product Principles — Pendientes Pro
- Performance Optimization
- @radix-ui/react-separator
- Web App Manifest
- @radix-ui/react-slot
- OtherViews.tsx
- Testing PWA
- Service Worker Patterns
- 1. Crítica brutal de la captura de referencia
- @fontsource/space-grotesk
- Cómo leer este documento
- App.tsx
- button.tsx
- graphify reference: incremental update and cluster-only
- tailwind-merge
- alert.tsx
- ImportarPlanDialog.tsx
- uid
- store.tsx
- App.tsx
- Engineering Guidelines — Pendientes Pro
- Product Backlog — Pendientes Pro
- 9. User Flows completos
- Design Language — Pendientes Pro
- Interaction Philosophy — Pendientes Pro
- describirRepeticion
- Workspace System — Pendientes Pro
- Navigation System — Pendientes Pro
- sw.js
- 4. Sistema de Widgets
- Product Vision — Pendientes Pro
- SkipLink.tsx
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- @radix-ui/react-dialog
- CLAUDE.md
- CLAUDE.md
- extraction-spec.md
- Data Philosophy — Pendientes Pro
- 6. Design System
- Roadmap — Pendientes Pro
- @supabase/supabase-js
- googleCalendar.ts
- index.ts
- Conectar Google Calendar (time-blocking / vista Agenda)
- vencido
- Decisions Log — Pendientes Pro
- Product Design Specification — Pendientes Pro v2.0
- Docs Index — Product Operating System de Pendientes Pro
- Knowledge Base — Pendientes Pro
- cmdk
- 5. Sistema de Layout universal
- dialog.tsx
- googleCalendarConfig.ts
- ProgressRing.tsx
- use-is-mobile.ts
- PendientesView.tsx
- 0. Tesis del producto y objetivo
- 7. Sistema de Motion
- Documentador — Bitácora y difusión
- Revisor — Control de calidad (QA)
- espacio-mobile.test.tsx
- Offline Experience
- sync-merge.test.ts
- Performance Optimization
- store.test.ts
- Web App Manifest
- Testing PWA
- opencode.json
- Service Worker Patterns
- LOG — Bitácora del Equipo de Desarrollo
- CalendarioView.tsx
- sistema-agrupado.test.tsx
- react-dom
- sonner
- @tanstack/react-virtual
- PROMPT_CONTINUACION_IA.md
- agenda-movil.test.tsx
- lucide-react
- espacio-general.test.tsx
- @fontsource/jetbrains-mono
- KanbanDnd.tsx
- store.tsx
- ImportarCsvDialog.tsx
- AjustesDialog.tsx
- hoyISO
- useSync
- Shell
- @fontsource/space-grotesk

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 86 edges
2. `[Unreleased]` - 72 edges
3. `useUI()` - 54 edges
4. `hoyISO()` - 44 edges
5. `Button` - 34 edges
6. `idColumnaCompletado()` - 33 edges
7. `Shell()` - 30 edges
8. `CalendarioView()` - 30 edges
9. `Pendiente` - 28 edges
10. `Changelog` - 28 edges

## Surprising Connections (you probably didn't know these)
- `AppProvider()` --indirect_call--> `proy()`  [INFERRED]
  src/store.tsx → tests/proyectos-metodos.test.ts
- `Shell()` --indirect_call--> `p()`  [INFERRED]
  src/App.tsx → tests/enEspacio.test.ts
- `KanbanDnd()` --indirect_call--> `p()`  [INFERRED]
  src/components/KanbanDnd.tsx → tests/enEspacio.test.ts
- `ProximaTareaWidget()` --indirect_call--> `p()`  [INFERRED]
  src/components/widgets/ProximaTareaWidget.tsx → tests/enEspacio.test.ts
- `useRecordatoriosLocales()` --indirect_call--> `p()`  [INFERRED]
  src/hooks/use-recordatorios-locales.ts → tests/enEspacio.test.ts

## Import Cycles
- None detected.

## Communities (153 total, 26 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.10
Nodes (19): Dependencias externas y límites, Hito 0 — Base unificada de captura y enlaces, Hito 1 — Agenda integrada utilizable, Hito 2 — Login Google y calendario bidireccional, Hito 3 — Resúmenes por correo, Hito 4 — Proyectos por método y aviso de estancamiento, Hito 5 — Rocas y registro de actividad, Hito 6 — Encuadres académicos (+11 more)

### Community 1 - "sync.tsx"
Cohesion: 0.25
Nodes (4): ErrorBoundary, Props, State, descargar()

### Community 2 - "command.tsx"
Cohesion: 0.09
Nodes (22): ARQUITECTURA, ATAJOS, CALENDARIO, CONTEXTO, DASHBOARD, DISEÑO, EL CONCEPTO MÁS IMPORTANTE, ESPACIOS (+14 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (30): DOM, src, vite/client, vitest/globals, compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly (+22 more)

### Community 4 - "use-toast.ts"
Cohesion: 0.03
Nodes (72): Añadido (2.1 — Papelera real), Cambiado (2.1), Cierre del bloque Fase 10, Cierre del bloque Fase 11, Cierre del bloque Fase 8, Cierre del bloque Fase 9, Etiquetas de rol "Miembro"/"Observador" (informativas, sin RLS) (2026-08-16), Fase 10.1 — Accesibilidad rápida (2026-08-06) (+64 more)

### Community 5 - "cn"
Cohesion: 0.12
Nodes (16): AGENTS.md — Pendientes Pro (en español), Archivos clave, Arquitectura esencial, Comandos de desarrollo, Convenciones TypeScript, Doctrina del Workspace (no negociable), Equipo de desarrollo (agentes opencode), Fuentes (autohospedadas) (+8 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (20): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+12 more)

### Community 8 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 9 - "menubar.tsx"
Cohesion: 0.12
Nodes (15): 2026-08-09 — H1 «Minuta universal: viñetas anidadas → subtareas» | ✓ cerrado, 2026-08-09 — H4 «Confirmación antes de descartar una edición» | ✓ cerrado, 2026-08-09 — sesión inicial, 2026-08-10 — H5 «Espacios como 5º destino primario, Pendientes a Sistema» | ✓ cerrado, 2026-08-10 — H6 «Selector de Espacio activo en móvil» | ✓ cerrado, 2026-08-10 — H7 «Sincronización de Espacios entre dispositivos» | ✓ cerrado, 2026-08-11 — H10 «Nombrado consistente entre plataformas» — EPIC 2 completo | ✓ cerrado, 2026-08-11 — H7b «Fix: migración pendiente de H7 rompía toda la sincronización» | ✓ cerrado (+7 more)

### Community 10 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 11 - "devDependencies"
Cohesion: 0.04
Nodes (47): autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom, devDependencies (+39 more)

### Community 12 - "@hookform/resolvers"
Cohesion: 0.08
Nodes (42): TaskModal(), asignarProyecto(), buscarSubtarea(), defaultsHorario(), DIAS_SEMANA, enesimoDiaSemana(), enEspacio(), enEspacioProyecto() (+34 more)

### Community 13 - "package.json"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:coverage, test:watch

### Community 14 - "buffer"
Cohesion: 0.09
Nodes (12): UIProvider(), abrirSinFecha(), espCasa, espTrabajo, HarnessEspacio(), hoy, irAVista(), iso (+4 more)

### Community 15 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 16 - "sheet.tsx"
Cohesion: 0.05
Nodes (70): RFC-5545, Props, dtstampAhora(), escaparICS(), fechaHoraICS(), generarHTMLImprimible(), generarICS(), generarMarkdown() (+62 more)

### Community 17 - "table.tsx"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 18 - "compilerOptions"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, ignoreDeprecations, paths, files, references

### Community 19 - "breadcrumb.tsx"
Cohesion: 0.06
Nodes (31): [0.1.0-pre.1] — 2026-08-05 — Fase 1: Base técnica, Agenda del día en móvil: hoja inferior (2026-10-26), Añadido, Añadido: completado de Hito 0 y Hito 5 (2026-10-25), Añadido: cuentas de Google con dirección de sincronización, propietario confirmado y resumen (2026-10-25), Añadido: fechas dd/mm/aaaa + minicalendario + proyectos desde Metas (2026-09-11), Añadido: Hito 0 — captura universal nota/pendiente/evento (2026-10-25), Añadido: Hito 1 (cierre) — vista Año, conflictos en edición y limpieza de Google (2026-10-25) (+23 more)

### Community 20 - "drawer.tsx"
Cohesion: 0.12
Nodes (28): cicloDeEnvio(), construirDe(), CORS, datosDelRango(), enviarCorreo(), marcar(), PrefsFila, reclamar() (+20 more)

### Community 21 - "navigation-menu.tsx"
Cohesion: 0.13
Nodes (26): AdjuntosUI(), Miniatura(), cargarEtiquetas(), claveEtiquetas(), EspacioDialog(), eliminarAdjunto(), esImagen(), formatoTamano() (+18 more)

### Community 22 - "card.tsx"
Cohesion: 0.10
Nodes (35): BulkActionsBar(), MenuContextoPendiente(), GanttProyecto(), ScrumProyecto(), NuevaMetaDialog(), NuevoContactoDialog(), NuevoEspacioDialog(), PaletaComandos() (+27 more)

### Community 23 - "toggle-group.tsx"
Cohesion: 0.40
Nodes (4): project, $schema, src/**/*.{ts,tsx}, tests/**/*.ts

### Community 24 - "alert.tsx"
Cohesion: 0.14
Nodes (28): Shell(), KanbanDnd(), conMenciones(), FilaSubtarea(), formatearMin(), PendienteCuerpo(), Props, TimerPendiente() (+20 more)

### Community 25 - "avatar.tsx"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 26 - "badge.tsx"
Cohesion: 0.50
Nodes (3): Al terminar, Cómo probar, /probar-como-usuario

### Community 27 - "tabs.tsx"
Cohesion: 0.25
Nodes (7): After Launch, Before Launch, Common Mistakes, Core PWA Requirements, Project Structure, PWA Development Checklist, PWA Development Skill

### Community 28 - "Pendientes + Notas Pro — PWA modular"
Cohesion: 0.22
Nodes (8): Base de datos, Compilar para producción, Cómo actualizar a TODOS los dispositivos, Desarrollo, Desplegar (una sola vez), Estructura (modular, para escalar fácil), Notas de sincronización, Pendientes + Notas Pro — PWA modular

### Community 30 - "class-variance-authority"
Cohesion: 0.60
Nodes (4): AccionOverlay, esOverlay(), overlayReducer(), TipoOverlay

### Community 31 - "ListView.tsx"
Cohesion: 0.25
Nodes (7): 2026-08-09 — H1 viñetas anidadas (GREEN), 2026-08-09 — H4 confirmación de descarte (GREEN) | ✓ hecho, 2026-08-09 — sesión inicial, Contexto, Historial, Memoria — Desarrollador (Implementación, GREEN), Pendientes

### Community 32 - "cmdk"
Cohesion: 0.18
Nodes (11): class-variance-authority, clsx, @fontsource/plus-jakarta-sans, dependencies, class-variance-authority, clsx, @fontsource/plus-jakarta-sans, @radix-ui/react-context-menu (+3 more)

### Community 33 - "date-fns"
Cohesion: 0.25
Nodes (7): Capas (separar para poder integrar), Checklist para añadir o cambiar un módulo, Mapa de módulos, Módulos de Pendientes Pro: integrados, pero separados, Principio rector, Reglas de interacción fluida, Trampas conocidas

### Community 34 - "dialog.tsx"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 35 - "alert.tsx"
Cohesion: 0.17
Nodes (11): 10. Estrategia de implementación incremental, 1. Auditoría UX, 2. Auditoría UI, 3. Auditoría Arquitectura, 4. Auditoría Componentes, 5. Auditoría Performance, 6. Auditoría Accesibilidad, 7. Oportunidades de mejora (lista priorizable cruda) (+3 more)

### Community 36 - "context-menu.tsx"
Cohesion: 0.25
Nodes (7): 2026-08-09 — H1 viñetas anidadas | ✓ documentado, 2026-08-09 — H4 cierre del Epic 1 | ✓ hecho, 2026-08-09 — sesión inicial, Contexto, Historial, Memoria — Documentador (Bitácora), Pendientes

### Community 37 - "PWA Development Skill"
Cohesion: 0.25
Nodes (7): After Launch, Before Launch, Common Mistakes, Core PWA Requirements, Project Structure, PWA Development Checklist, PWA Development Skill

### Community 38 - "html-inline"
Cohesion: 0.06
Nodes (77): ATAJOS, SINTAXIS, CampoFecha(), DIAS_CORTOS, MESES, ColumnaHeader(), EtiquetaRol, ETIQUETAS_ROL (+69 more)

### Community 39 - "lucide-react"
Cohesion: 0.29
Nodes (6): Idempotencia y reintentos, Pasos, Piezas, Qué envía, Resúmenes por correo (Hito 3) — puesta en marcha, Seguridad

### Community 41 - "Doctrina del Workspace — Pendientes Pro"
Cohesion: 0.29
Nodes (6): Dirección estética, Doctrina del Workspace — Pendientes Pro, Glosario — evitar colisión de nombres, Inventario reusable (no recrear), Restricciones no negociables, Roadmap vigente (ver `AUDITORIA.md` sección 8 para el detalle)

### Community 42 - "App-Like Features"
Cohesion: 0.40
Nodes (5): App-Like Features, Detecting Standalone Mode, Install Prompt, Push Notifications, Share Target

### Community 43 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 44 - "@radix-ui/react-checkbox"
Cohesion: 0.40
Nodes (5): Cache First (Offline First), Caching Strategies, Network First (Fresh First), Stale While Revalidate, Strategy Selection Guide

### Community 45 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 46 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 48 - "Workbox (Recommended)"
Cohesion: 0.40
Nodes (5): Installation, Why Workbox?, Workbox Manual Service Worker, Workbox (Recommended), Workbox with Vite

### Community 50 - "package.json"
Cohesion: 0.25
Nodes (7): 2026-08-09 — H1 viñetas anidadas (RED→GREEN), 2026-08-09 — H4 confirmación de descarte (RED→GREEN) | ✓ hecho, 2026-08-09 — sesión inicial, Contexto, Historial, Memoria — Tester (Ingeniero de pruebas, RED), Pendientes

### Community 51 - "Offline Experience"
Cohesion: 0.50
Nodes (4): Background Sync (Queue Offline Actions), Offline Detection, Offline Experience, Offline Page

### Community 52 - "2. Los 12 puntos pedidos"
Cohesion: 0.07
Nodes (28): 1.10 Lo que sobra, lo que falta, qué se fusiona, qué se vuelve widget, 1.1 Jerarquía visual y prioridad, 1.2 Espacios en blanco y ritmo, 1.3 Carga cognitiva y navegación, 1.4 "Hoy" — el caso más grave, porque es la pantalla que más se usa, 1.5 Densidad de la fila de tarea, 1.6 Superficies redundantes — el mismo dato, presentado distinto según cómo se llegó, 1.7 Toolbar de la Lista — el ejemplo más claro de redundancia funcional (+20 more)

### Community 53 - "@radix-ui/react-progress"
Cohesion: 0.50
Nodes (4): Caching Strategy Cheat Sheet, Manifest Minimum Requirements, Quick Reference, Service Worker Lifecycle

### Community 54 - "@radix-ui/react-radio-group"
Cohesion: 0.25
Nodes (4): espCasa, espTrabajo, iso, proyectos

### Community 55 - "Product Principles — Pendientes Pro"
Cohesion: 0.10
Nodes (21): 10. Tres niveles tipográficos, nunca más, 11. Toda animación comunica algo, o no existe, 12. Ninguna funcionalidad nueva puede contradecir la simplicidad ya lograda, 13. Todo dato pertenece a una Entidad reconocible, 14. La captura nunca exige clasificación previa, 15. La velocidad de teclado es un ciudadano de primera clase, no un extra, 16. Los estados vacíos enseñan, nunca solo informan, 17. El sistema de widgets es siempre opcional, nunca la única vía (+13 more)

### Community 56 - "Performance Optimization"
Cohesion: 0.50
Nodes (4): Code Splitting, Critical Rendering Path, Image Optimization, Performance Optimization

### Community 57 - "@radix-ui/react-separator"
Cohesion: 0.50
Nodes (4): Create React App, Framework-Specific Guides, Next.js, Vite (Any Framework)

### Community 58 - "Web App Manifest"
Cohesion: 0.50
Nodes (4): Enhanced Manifest (Full Features), Manifest Checklist, Required Fields, Web App Manifest

### Community 59 - "@radix-ui/react-slot"
Cohesion: 0.29
Nodes (6): Doctrina (no negociable; fuente en `AGENTS.md`), Loop del equipo (en manos del orquestador `team`), Manual del Equipo de Desarrollo, Pipelines de verificación (orden de CI), Roles del equipo, Sistema de memoria

### Community 60 - "OtherViews.tsx"
Cohesion: 0.15
Nodes (23): DIAS, Fila, hh(), PanelAgenda(), sumar(), aFecha(), agruparAgenda(), AntesEspejo (+15 more)

### Community 61 - "Testing PWA"
Cohesion: 0.50
Nodes (4): Lighthouse Audit, Manual Testing Checklist, Testing PWA, Testing Service Worker Updates

### Community 62 - "Service Worker Patterns"
Cohesion: 0.67
Nodes (3): Basic Service Worker, Registration, Service Worker Patterns

### Community 63 - "1. Crítica brutal de la captura de referencia"
Cohesion: 0.10
Nodes (20): 1.10 Navegación — sobrecargada, 1.11 Componentes — nueve lenguajes de tarjeta en una pantalla, 1.12 Interacciones — la captura muestra un estado que un producto real nunca debe permitir, 1.13 Paneles y distribución — cinco capas de layout simultáneas, 1.14 Flujo de trabajo — cinco caminos para "agregar algo", 1.15 Carga cognitiva — más de 80 elementos de texto legibles en una sola pantalla, 1.16 Consistencia — la nota más baja de todo el análisis, 1.17 Velocidad de uso (+12 more)

### Community 64 - "@fontsource/space-grotesk"
Cohesion: 0.29
Nodes (6): 2026-08-09 — H4 «Confirmación antes de descartar…» | ✓ hecho, 2026-08-09 — sesión inicial, Contexto, Historial, Memoria — Planificador (Arquitecto), Pendientes

### Community 65 - "Cómo leer este documento"
Cohesion: 0.11
Nodes (18): Artículo 10 — Ninguna plataforma (mobile/tablet/desktop) se diseña como una ocurrencia tardía, Artículo 11 — El color semántico de estado nunca se reutiliza para otra cosa, Artículo 12 — Toda captura de contenido tiene una vía sin clasificación previa, Artículo 13 — Ninguna migración de datos es silenciosa, Artículo 14 — Ninguna decisión de arquitectura de datos se toma sin registrar alternativas, Artículo 15 — La identidad visual no se diluye para parecerse a un competidor, Artículo 1 — No agregar funcionalidades por moda, Artículo 2 — No incorporar IA si aumenta la complejidad percibida (+10 more)

### Community 66 - "App.tsx"
Cohesion: 0.31
Nodes (10): WidgetShell(), CONTENIDO, WidgetsLayer(), storage, WIDGET_DEFAULTS, WidgetInstancia, WidgetTipo, Ctx (+2 more)

### Community 67 - "button.tsx"
Cohesion: 0.29
Nodes (6): 2026-08-09 — H4 «Confirmación antes de descartar…» | ✓ hecho, 2026-08-09 — sesión inicial, Contexto, Historial, Memoria — Producto (Product Owner), Pendientes

### Community 68 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 70 - "alert.tsx"
Cohesion: 0.13
Nodes (21): conDia(), PosponerMenu(), actividadPorDia(), isoLocal(), isoMasDias(), isoProximoFinDeSemana(), isoSumarDias(), medianaTiempoVida() (+13 more)

### Community 71 - "ImportarPlanDialog.tsx"
Cohesion: 0.29
Nodes (10): Vista, Command, CommandDialog(), CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (+2 more)

### Community 73 - "store.tsx"
Cohesion: 0.29
Nodes (6): 2026-08-09 — H4 confirmación de descarte | ✓ aprobado, 2026-08-09 — sesión inicial, Contexto, Historial, Memoria — Revisor (QA), Pendientes

### Community 74 - "App.tsx"
Cohesion: 0.07
Nodes (20): ContactosView, DashboardView, EquipoView, EspaciosView, GRUPO_PLANEAR, MetasView, NotesView, PapeleraView (+12 more)

### Community 76 - "Engineering Guidelines — Pendientes Pro"
Cohesion: 0.15
Nodes (12): Accesibilidad, Componentes reutilizables antes que nuevos, Convención de nombres compartida con el resto del sistema, Engineering Guidelines — Pendientes Pro, Escalabilidad, Feature Flags, Modularidad y separación por dominios, No duplicar lógica (+4 more)

### Community 77 - "Product Backlog — Pendientes Pro"
Cohesion: 0.15
Nodes (13): Cómo leer este backlog, EPIC 10 — Accesibilidad transversal, EPIC 1 — Regla de exclusividad de overlays, EPIC 2 — Reestructuración del sidebar y navegación primaria, EPIC 3 — Reducción de "Hoy" a su núcleo, EPIC 4 — Sistema de Widgets v2, EPIC 5 — Reparación de integridad de datos (ya completado), EPIC 6 — Sistema tipográfico y de espaciado unificado (+5 more)

### Community 78 - "9. User Flows completos"
Cohesion: 0.17
Nodes (12): 9.10 Cambio de espacio, 9.11 Cambio de contexto (mobile ↔ desktop, o interrupción de tarea), 9.1 Nuevo pendiente, 9.2 Nueva nota, 9.3 Nuevo proyecto, 9.4 Nueva checklist (subtareas), 9.5 Mover tarjeta (Kanban), 9.6 Completar tarea (+4 more)

### Community 79 - "Design Language — Pendientes Pro"
Cohesion: 0.18
Nodes (11): Design Language — Pendientes Pro, Emociones que el producto busca generar, Espacios, Filosofía de la tipografía, Filosofía del color, Filosofía del movimiento, Jerarquía, Personalidad (+3 more)

### Community 80 - "Interaction Philosophy — Pendientes Pro"
Cohesion: 0.18
Nodes (11): Accesibilidad como parte de la interacción, no un añadido posterior, Consistencia de gesto entre dominios distintos, Cómo evaluar una interacción nueva, Feedback inmediato, siempre, Interaction Philosophy — Pendientes Pro, La regla que gobierna todo lo demás: un solo overlay a la vez, Mantener siempre el contexto del usuario, Paneles antes que modales (+3 more)

### Community 81 - "describirRepeticion"
Cohesion: 0.33
Nodes (5): Desarrollador — Implementación (GREEN), Entrada, Memoria, Reglas (innegociables), Tareas

### Community 82 - "Workspace System — Pendientes Pro"
Cohesion: 0.18
Nodes (11): Cambio de contexto, Contextos, Layouts, Paneles, Persistencia, Personalización, Por qué esto es un diferenciador, no solo una función, Qué es un Workspace en este producto (+3 more)

### Community 83 - "Navigation System — Pendientes Pro"
Cohesion: 0.22
Nodes (9): 1. Navegación primaria, 2. Contexto de Espacio, 3. Perspectivas (Smart Views), 4. Navegación de detalle: paneles y breadcrumbs, Búsqueda como atajo transversal a los cuatro niveles, Los cuatro niveles de navegación, Mapa de decisión: ¿dónde vive una función de navegación nueva?, Navigation System — Pendientes Pro (+1 more)

### Community 87 - "4. Sistema de Widgets"
Cohesion: 0.22
Nodes (9): 4.1 Principios, 4.2 Anatomía universal del widget, 4.3 Catálogo de tamaños (grid de 4px, todo widget se ajusta a esta rejilla), 4.4 Posicionamiento, 4.5 Comportamientos, 4.6 Estados, 4.7 Acoplamiento (docking), 4.8 Persistencia y visibilidad (+1 more)

### Community 88 - "Product Vision — Pendientes Pro"
Cohesion: 0.22
Nodes (9): Cómo debe sentirse usarlo, Horizonte a 10 años, Horizonte a 5 años, La promesa del producto, Product Vision — Pendientes Pro, ¿Qué es Pendientes Pro?, ¿Qué lo hace diferente?, ¿Qué NO pretende ser? (+1 more)

### Community 91 - "SkipLink.tsx"
Cohesion: 0.33
Nodes (5): Entrada, Memoria, Planificador — Arquitecto técnico, Reglas, Salida (en tu respuesta y mejorada en el ticket)

### Community 98 - "Data Philosophy — Pendientes Pro"
Cohesion: 0.25
Nodes (8): Data Philosophy — Pendientes Pro, Entidades, La idea central, Por qué esto importa más de lo que parece, Reglas del modelo, Relaciones, Representaciones, Vistas

### Community 99 - "6. Design System"
Cohesion: 0.25
Nodes (8): 6.1 Spacing scale, 6.2 Radius, 6.3 Tipografía — 3 niveles, sin excepción, 6.4 Color — capas separadas por función, 6.5 Elevación (sombras), 6.6 Blur (`.glass`), 6.7 Componentes base (especificación, no implementación), 6. Design System

### Community 100 - "Roadmap — Pendientes Pro"
Cohesion: 0.25
Nodes (8): Nota sobre el orden de este roadmap, Roadmap — Pendientes Pro, v2.0 — Corrección de fundamentos, v2.1 — Sistema de Widgets v2, v2.2 — Fusión de superficies y velocidad de captura, v2.3 — Accesibilidad transversal y responsive completo, v3.0 — Extensión del modelo: Espacios como contexto real, Perspectivas, Archivos, v4.0 — Personal Operating System

### Community 102 - "googleCalendar.ts"
Cohesion: 0.14
Nodes (26): CuentasGoogleDialog(), dia(), DIRECCIONES, hora(), resumirGoogle(), sincronizarEspejoGoogle(), actualizarDireccion(), actualizarEventoAgenda() (+18 more)

### Community 103 - "index.ts"
Cohesion: 0.23
Nodes (20): accionCreateEvent(), accionDeleteEvent(), accionDisconnect(), accionExchange(), accionListConnections(), accionListEvents(), accionSetDireccion(), accionSetModo() (+12 more)

### Community 104 - "Conectar Google Calendar (time-blocking / vista Agenda)"
Cohesion: 0.17
Nodes (11): 1. Crear el proyecto y habilitar la API, 2. Configurar la pantalla de consentimiento OAuth, 3. Crear las credenciales OAuth, 4. Dónde pegar cada credencial, 5. Probar la conexión (una cuenta o varias), `access_denied` ("solo los verificadores aprobados pueden acceder"), Conectar Google Calendar (time-blocking / vista Agenda), Las cuentas conectadas dependen de la sesión de sincronización, no del dispositivo (+3 more)

### Community 105 - "vencido"
Cohesion: 0.33
Nodes (5): Entrada, Memoria, Producto — Product Owner, Reglas, Salida (en `memory/producto.md` y vía tu respuesta)

### Community 106 - "Decisions Log — Pendientes Pro"
Cohesion: 0.18
Nodes (11): 2026-08-05 — El roadmap se reordena: lo visual primero, lo funcional después, 2026-08-05 — "Espacio" como capa nueva, no un renombre, 2026-08-06 — Adopción del Product Design Specification como base oficial, evolución a Product Operating System, 2026-08-06 — Diagnóstico y reparación de la pertenencia de pendientes a proyecto, 2026-08-06 — La crítica del mockup de referencia se convierte en la regla de exclusividad de overlays, 2026-08-10 — «Espacios» se convierte en destino primario y «Pendientes» baja a Sistema, 2026-08-10 — Los Espacios (Personal Workspace) ganan tabla propia en Supabase: `pnp_ctx_espacios`, 2026-08-12 — El Espacio "General" se modela como id reservado, no como fila real de `espacios` (+3 more)

### Community 107 - "Product Design Specification — Pendientes Pro v2.0"
Cohesion: 0.18
Nodes (11): 0.1 Qué es hoy, qué tiene que ser, 0.2 El error que este documento existe para prevenir, 0.3 Tesis de identidad propia, 0. Tesis del producto y objetivo, 10. Notas de accesibilidad transversales, 11. Glosario y siguiente paso, 2. Scorecard, 3. Estrategia de evolución — las 10 preguntas (+3 more)

### Community 108 - "Docs Index — Product Operating System de Pendientes Pro"
Cohesion: 0.33
Nodes (6): Cómo está organizado el sistema, Docs Index — Product Operating System de Pendientes Pro, Los 14 documentos, Qué leer según lo que necesitás hacer, Regla de integración de este sistema, Terminología compartida (glosario canónico)

### Community 109 - "Knowledge Base — Pendientes Pro"
Cohesion: 0.33
Nodes (5): Cómo se mantiene esta base de conocimiento, Knowledge Base — Pendientes Pro, Sobre decisiones de UX específicas, Sobre el historial técnico del proyecto, Sobre el producto

### Community 111 - "5. Sistema de Layout universal"
Cohesion: 0.33
Nodes (6): 5.1 Principio rector, 5.2 La rejilla de tres franjas (se conserva de la app real, se disciplina), 5.3 Reestructuración del sidebar (resuelve §1.10, §3.5), 5.4 Regla de exclusividad de overlays (resuelve §1.12, la falla más grave de la captura), 5.5 Breakpoints y colapso, 5. Sistema de Layout universal

### Community 112 - "dialog.tsx"
Cohesion: 0.33
Nodes (5): Antes de arrancar (F0), Cierre, Disciplina, El loop (por cada ticket), Team Lead — Orquestador

### Community 113 - "googleCalendarConfig.ts"
Cohesion: 0.33
Nodes (5): Entrada, Memoria, Reglas, Tareas, Tester — Ingeniero de pruebas (RED)

### Community 114 - "ProgressRing.tsx"
Cohesion: 0.60
Nodes (3): ProgressRing(), formatear(), PomodoroWidget()

### Community 115 - "use-is-mobile.ts"
Cohesion: 0.40
Nodes (5): App-Like Features, Detecting Standalone Mode, Install Prompt, Push Notifications, Share Target

### Community 116 - "PendientesView.tsx"
Cohesion: 0.40
Nodes (5): Cache First (Offline First), Caching Strategies, Network First (Fresh First), Stale While Revalidate, Strategy Selection Guide

### Community 117 - "0. Tesis del producto y objetivo"
Cohesion: 0.40
Nodes (5): Installation, Why Workbox?, Workbox Manual Service Worker, Workbox (Recommended), Workbox with Vite

### Community 118 - "7. Sistema de Motion"
Cohesion: 0.50
Nodes (4): 7.1 Duraciones, 7.2 Curvas, 7.3 Especificación por gesto, 7. Sistema de Motion

### Community 119 - "Documentador — Bitácora y difusión"
Cohesion: 0.40
Nodes (4): Documentador — Bitácora y difusión, Memoria, Reglas, Tareas

### Community 120 - "Revisor — Control de calidad (QA)"
Cohesion: 0.40
Nodes (4): Reglas, Revisor — Control de calidad (QA), Tu labor, Veredicto

### Community 121 - "espacio-mobile.test.tsx"
Cohesion: 0.40
Nodes (3): espCasa, espTrabajo, iso

### Community 122 - "Offline Experience"
Cohesion: 0.50
Nodes (4): Background Sync (Queue Offline Actions), Offline Detection, Offline Experience, Offline Page

### Community 123 - "sync-merge.test.ts"
Cohesion: 0.50
Nodes (4): Caching Strategy Cheat Sheet, Manifest Minimum Requirements, Quick Reference, Service Worker Lifecycle

### Community 124 - "Performance Optimization"
Cohesion: 0.50
Nodes (4): Code Splitting, Critical Rendering Path, Image Optimization, Performance Optimization

### Community 125 - "store.test.ts"
Cohesion: 0.50
Nodes (4): Create React App, Framework-Specific Guides, Next.js, Vite (Any Framework)

### Community 127 - "Web App Manifest"
Cohesion: 0.50
Nodes (4): Enhanced Manifest (Full Features), Manifest Checklist, Required Fields, Web App Manifest

### Community 128 - "Testing PWA"
Cohesion: 0.50
Nodes (4): Lighthouse Audit, Manual Testing Checklist, Testing PWA, Testing Service Worker Updates

### Community 129 - "opencode.json"
Cohesion: 0.50
Nodes (3): instructions, $schema, .opencode/instructions/team.md

### Community 130 - "Service Worker Patterns"
Cohesion: 0.67
Nodes (3): Basic Service Worker, Registration, Service Worker Patterns

### Community 132 - "CalendarioView.tsx"
Cohesion: 0.17
Nodes (18): useEventosGoogle(), listarEventosDia(), listarEventosRango(), RespuestaSync, sincronizarEventosGoogle(), aplicarCambios(), cache, cacheCaliente() (+10 more)

### Community 143 - "espacio-general.test.tsx"
Cohesion: 0.22
Nodes (4): espTrabajo, iso, pendientesInbox, proyectos

### Community 145 - "KanbanDnd.tsx"
Cohesion: 0.33
Nodes (5): Cómo aplicarlas, Estado, Línea base (anterior a esta convención), Migraciones de Supabase, Reglas

### Community 146 - "store.tsx"
Cohesion: 0.21
Nodes (16): nombreMes(), CuentaGoogle, altoPx(), CalendarioView(), colorDeCuenta(), COLORES_CUENTA, CUARTOS, DIAS_CORTOS (+8 more)

### Community 147 - "ImportarCsvDialog.tsx"
Cohesion: 0.24
Nodes (13): RFC-4180, ImportarCsvDialog(), NOMBRE_FORMATO, LineaParseada, normalizarNombreProyecto(), detectarFormato(), FilaImportada, FormatoCSV (+5 more)

### Community 148 - "AjustesDialog.tsx"
Cohesion: 0.28
Nodes (12): AjustesDialog(), marcarNotificado(), recordatoriosActivos(), setRecordatoriosActivos(), useRecordatoriosLocales(), yaNotificado(), siguienteColor(), Acento (+4 more)

### Community 149 - "hoyISO"
Cohesion: 0.20
Nodes (12): EditorCampoFecha(), AjustesProyectoDialog(), ProximaTareaWidget(), fechaLegibleAISO(), hoyISO(), EventoRapido, extraerDuracion(), extraerHora() (+4 more)

### Community 150 - "useSync"
Cohesion: 0.31
Nodes (7): DIAS, Prefs, ResumenCorreoSeccion(), zonaLocal(), mensajeDeFuncion(), SyncBadge(), useSync()

### Community 156 - "Shell"
Cohesion: 0.60
Nodes (4): fijarAgendaAbierta(), leerAgendaAbierta(), pantallaAncha(), useAgendaLateral()

## Knowledge Gaps
- **895 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+890 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useApp()` connect `card.tsx` to `html-inline`, `ImportarPlanDialog.tsx`, `alert.tsx`, `App.tsx`, `@hookform/resolvers`, `sheet.tsx`, `store.tsx`, `ImportarCsvDialog.tsx`, `AjustesDialog.tsx`, `hoyISO`, `navigation-menu.tsx`, `alert.tsx`, `OtherViews.tsx`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Product Design Specification — Pendientes Pro v2.0` connect `Product Design Specification — Pendientes Pro v2.0` to `6. Design System`, `DOCS_INDEX.md`, `9. User Flows completos`, `5. Sistema de Layout universal`, `7. Sistema de Motion`, `4. Sistema de Widgets`, `1. Crítica brutal de la captura de referencia`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `useUI()` connect `card.tsx` to `App.tsx`, `html-inline`, `ImportarPlanDialog.tsx`, `alert.tsx`, `App.tsx`, `@hookform/resolvers`, `buffer`, `store.tsx`, `alert.tsx`, `OtherViews.tsx`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _895 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `command.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._