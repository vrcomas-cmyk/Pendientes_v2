# Graph Report - pendientes-pro  (2026-08-06)

## Corpus Check
- 121 files · ~88,683 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 914 nodes · 1441 edges · 116 communities (63 shown, 53 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `31bb9019`
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
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- Performance Optimization
- @radix-ui/react-separator
- Web App Manifest
- @radix-ui/react-slot
- @radix-ui/react-switch
- Testing PWA
- Service Worker Patterns
- KanbanDnd.tsx
- @fontsource/space-grotesk
- react-dom
- App.tsx
- button.tsx
- graphify reference: incremental update and cluster-only
- tailwind-merge
- alert.tsx
- OtherViews.tsx
- uid
- @parcel/config-default
- parcel-resolver-tspaths
- postcss
- tailwindcss
- tailwindcss-animate
- @types/node
- @types/react-dom
- typescript
- typescript-eslint
- @vitejs/plugin-react
- sw.js
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- @radix-ui/react-dialog
- CLAUDE.md
- CLAUDE.md
- extraction-spec.md
- @radix-ui/react-context-menu
- @radix-ui/react-tabs
- @radix-ui/react-toast
- @supabase/supabase-js
- googleCalendar.ts
- index.ts
- Conectar Google Calendar (time-blocking / vista Agenda)
- tabs.tsx
- eslint
- cmdk
- googleCalendarConfig.ts
- eslint-plugin-react-hooks
- eslint-plugin-react-refresh
- jsdom
- @types/react
- vitest
- @vitest/coverage-v8

## God Nodes (most connected - your core abstractions)
1. `[Unreleased]` - 34 edges
2. `useApp()` - 31 edges
3. `cn()` - 31 edges
4. `hoyISO()` - 27 edges
5. `compilerOptions` - 24 edges
6. `activo()` - 23 edges
7. `uid()` - 17 edges
8. `compilerOptions` - 16 edges
9. `vencido()` - 15 edges
10. `PWA Development Skill` - 15 edges

## Surprising Connections (you probably didn't know these)
- `pendienteCompletado()` --calls--> `uid()`  [EXTRACTED]
  tests/app-utils.test.ts → src/lib/app-utils.ts
- `KanbanRapidoWidget()` --indirect_call--> `activo()`  [INFERRED]
  src/components/widgets/KanbanRapidoWidget.tsx → src/lib/app-utils.ts
- `CalendarioView()` --indirect_call--> `activo()`  [INFERRED]
  src/views/CalendarioView.tsx → src/lib/app-utils.ts
- `DashboardView()` --indirect_call--> `activo()`  [INFERRED]
  src/views/OtherViews.tsx → src/lib/app-utils.ts
- `TodayView()` --indirect_call--> `activo()`  [INFERRED]
  src/views/OtherViews.tsx → src/lib/app-utils.ts

## Import Cycles
- None detected.

## Communities (116 total, 53 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.06
Nodes (59): AjustesDialog(), ColumnaHeader(), MenuContextoPendiente(), NuevoEspacioDialog(), PaletaComandos(), Vista, KanbanRapidoWidget(), NotaRapidaWidget() (+51 more)

### Community 1 - "sync.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 2 - "command.tsx"
Cohesion: 0.09
Nodes (22): ARQUITECTURA, ATAJOS, CALENDARIO, CONTEXTO, DASHBOARD, DISEÑO, EL CONCEPTO MÁS IMPORTANTE, ESPACIOS (+14 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (31): DOM, ES2023, ./src/*, vite/client, vitest/globals, compilerOptions, allowImportingTsExtensions, baseUrl (+23 more)

### Community 4 - "use-toast.ts"
Cohesion: 0.05
Nodes (40): [0.1.0-pre.1] — 2026-08-05 — Fase 1: Base técnica, Añadido, Añadido (2.1 — Papelera real), Cambiado, Cambiado (2.1), Changelog, Cierre del bloque Fase 10, Cierre del bloque Fase 8 (+32 more)

### Community 5 - "cn"
Cohesion: 0.10
Nodes (19): Alert, AlertDescription, AlertTitle, alertVariants, Badge(), BadgeProps, badgeVariants, Label (+11 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (20): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+12 more)

### Community 8 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 9 - "menubar.tsx"
Cohesion: 0.13
Nodes (19): adivinarPorEncabezado(), Columna, FilaPreview, ImportarPlanDialog(), OPCIONES_COLUMNA, parsearModalidad(), sugerirPrioridad(), Checkbox (+11 more)

### Community 10 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 11 - "devDependencies"
Cohesion: 0.29
Nodes (7): autoprefixer, globals, devDependencies, autoprefixer, globals, @testing-library/react, @testing-library/react

### Community 12 - "@hookform/resolvers"
Cohesion: 0.17
Nodes (23): actividadPorDia(), DIAS_SEMANA, enesimoDiaSemana(), esBullet(), extraerSufijos(), FMT_DIA_LARGO, isoLocal(), isoProximoFinDeSemana() (+15 more)

### Community 13 - "package.json"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:coverage, test:watch

### Community 15 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 16 - "sheet.tsx"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 18 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, baseUrl, ignoreDeprecations, paths, files, ./src/*, @/*, references

### Community 22 - "card.tsx"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 24 - "alert.tsx"
Cohesion: 0.29
Nodes (11): RFC-4180, ImportarCsvDialog(), NOMBRE_FORMATO, detectarFormato(), FilaImportada, FormatoCSV, mapearFilas(), normalizarFecha() (+3 more)

### Community 26 - "badge.tsx"
Cohesion: 0.50
Nodes (3): Al terminar, Cómo probar, /probar-como-usuario

### Community 27 - "tabs.tsx"
Cohesion: 0.12
Nodes (21): FMT_MES_LARGO, nombreMes(), altoPx(), CalendarioView(), colorDeCuenta(), COLORES_CUENTA, CUARTOS, DIAS_CORTOS (+13 more)

### Community 28 - "Pendientes + Notas Pro — PWA modular"
Cohesion: 0.22
Nodes (8): Base de datos, Compilar para producción, Cómo actualizar a TODOS los dispositivos, Desarrollo, Desplegar (una sola vez), Estructura (modular, para escalar fácil), Notas de sincronización, Pendientes + Notas Pro — PWA modular

### Community 30 - "class-variance-authority"
Cohesion: 0.12
Nodes (20): AdjuntosUI(), Miniatura(), ErrorBoundary, Props, State, Button, ButtonProps, buttonVariants (+12 more)

### Community 31 - "ListView.tsx"
Cohesion: 0.40
Nodes (3): Acento, ACENTOS, aplicarAcento()

### Community 32 - "cmdk"
Cohesion: 0.15
Nodes (13): class-variance-authority, clsx, dependencies, class-variance-authority, clsx, @radix-ui/react-checkbox, @radix-ui/react-progress, @radix-ui/react-separator (+5 more)

### Community 34 - "dialog.tsx"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 35 - "alert.tsx"
Cohesion: 0.17
Nodes (11): 10. Estrategia de implementación incremental, 1. Auditoría UX, 2. Auditoría UI, 3. Auditoría Arquitectura, 4. Auditoría Componentes, 5. Auditoría Performance, 6. Auditoría Accesibilidad, 7. Oportunidades de mejora (lista priorizable cruda) (+3 more)

### Community 36 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 37 - "PWA Development Skill"
Cohesion: 0.25
Nodes (7): After Launch, Before Launch, Common Mistakes, Core PWA Requirements, Project Structure, PWA Development Checklist, PWA Development Skill

### Community 38 - "html-inline"
Cohesion: 0.13
Nodes (19): conDia(), DIAS, PosponerMenu(), DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay (+11 more)

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
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 51 - "Offline Experience"
Cohesion: 0.50
Nodes (4): Background Sync (Queue Offline Actions), Offline Detection, Offline Experience, Offline Page

### Community 53 - "@radix-ui/react-progress"
Cohesion: 0.50
Nodes (4): Caching Strategy Cheat Sheet, Manifest Minimum Requirements, Quick Reference, Service Worker Lifecycle

### Community 56 - "Performance Optimization"
Cohesion: 0.50
Nodes (4): Code Splitting, Critical Rendering Path, Image Optimization, Performance Optimization

### Community 57 - "@radix-ui/react-separator"
Cohesion: 0.50
Nodes (4): Create React App, Framework-Specific Guides, Next.js, Vite (Any Framework)

### Community 58 - "Web App Manifest"
Cohesion: 0.50
Nodes (4): Enhanced Manifest (Full Features), Manifest Checklist, Required Fields, Web App Manifest

### Community 61 - "Testing PWA"
Cohesion: 0.50
Nodes (4): Lighthouse Audit, Manual Testing Checklist, Testing PWA, Testing Service Worker Updates

### Community 62 - "Service Worker Patterns"
Cohesion: 0.67
Nodes (3): Basic Service Worker, Registration, Service Worker Patterns

### Community 63 - "KanbanDnd.tsx"
Cohesion: 0.29
Nodes (6): KanbanDnd(), Props, activo(), ResumenProyectos(), ListaProyecto(), ProyectosView()

### Community 66 - "App.tsx"
Cohesion: 0.24
Nodes (12): formatear(), PomodoroWidget(), WidgetShell(), CONTENIDO, WidgetsLayer(), storage, WIDGET_DEFAULTS, WidgetInstancia (+4 more)

### Community 67 - "button.tsx"
Cohesion: 0.10
Nodes (13): Shell(), Vista, VISTAS, VISTAS_VALIDAS, WIDGET_ICONOS, ATAJOS, SINTAXIS, COLOR_PRIORIDAD (+5 more)

### Community 68 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 70 - "alert.tsx"
Cohesion: 0.17
Nodes (16): formatearMin(), PendienteCuerpo(), Props, TimerPendiente(), PendientePeek(), TaskRow(), describirRepeticion(), estaBloqueado() (+8 more)

### Community 71 - "OtherViews.tsx"
Cohesion: 0.17
Nodes (14): ProximaTareaWidget(), hoyISO(), isoMasDias(), AgendaGoogleHoy(), DIAS_CORTOS, etiquetaDia(), FranjaSemanal(), HeatmapActividad() (+6 more)

### Community 72 - "uid"
Cohesion: 0.29
Nodes (12): Modalidad, TaskModal(), defaultsHorario(), fechaPorPrioridad(), normalizar(), uid(), AppProvider(), normalizarConservandoId() (+4 more)

### Community 102 - "googleCalendar.ts"
Cohesion: 0.12
Nodes (28): CuentasGoogleDialog(), EspacioDialog(), AntesEspejo, DespuesEspejo, sincronizarEspejoGoogle(), canjearInvitacion(), codigoAleatorio(), crearInvitacion() (+20 more)

### Community 103 - "index.ts"
Cohesion: 0.26
Nodes (16): accionCreateEvent(), accionDeleteEvent(), accionDisconnect(), accionExchange(), accionListConnections(), accionListEvents(), accionSetModo(), accionUpdateEvent() (+8 more)

### Community 104 - "Conectar Google Calendar (time-blocking / vista Agenda)"
Cohesion: 0.17
Nodes (11): 1. Crear el proyecto y habilitar la API, 2. Configurar la pantalla de consentimiento OAuth, 3. Crear las credenciales OAuth, 4. Dónde pegar cada credencial, 5. Probar la conexión (una cuenta o varias), `access_denied` ("solo los verificadores aprobados pueden acceder"), Conectar Google Calendar (time-blocking / vista Agenda), Las cuentas conectadas dependen de la sesión de sincronización, no del dispositivo (+3 more)

## Knowledge Gaps
- **418 isolated node(s):** `Añadido`, `Cambiado`, `Eliminado`, `Refactor`, `Fase 2 — Personal Workspace (reorientación, ver `AUDITORIA.md`)` (+413 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `sync.tsx`, `context-menu.tsx`, `html-inline`, `menubar.tsx`, `sheet.tsx`, `card.tsx`, `class-variance-authority`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `useApp()` connect `App.tsx` to `html-inline`, `OtherViews.tsx`, `menubar.tsx`, `alert.tsx`, `tabs.tsx`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `hoyISO()` connect `OtherViews.tsx` to `App.tsx`, `button.tsx`, `html-inline`, `alert.tsx`, `uid`, `@hookform/resolvers`, `tabs.tsx`, `class-variance-authority`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `Añadido`, `Cambiado`, `Eliminado` to the rest of the system?**
  _418 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05630834086118639 - nodes in this community are weakly interconnected._
- **Should `command.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._