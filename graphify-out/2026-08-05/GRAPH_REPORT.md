# Graph Report - pendientes-pro  (2026-08-05)

## Corpus Check
- 96 files · ~59,190 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 705 nodes · 1163 edges · 99 communities (43 shown, 56 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `790da334`
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
- context-menu.tsx
- html-inline
- lucide-react
- next-themes
- graphify reference: query, path, explain
- @radix-ui/react-checkbox
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- @radix-ui/react-separator
- @radix-ui/react-slot
- @radix-ui/react-switch
- react-dom
- graphify reference: incremental update and cluster-only
- tailwind-merge
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
1. `cn()` - 31 edges
2. `useApp()` - 27 edges
3. `compilerOptions` - 24 edges
4. `CalendarioView()` - 20 edges
5. `compilerOptions` - 16 edges
6. `Shell()` - 15 edges
7. `Pendiente` - 14 edges
8. `hoyISO()` - 14 edges
9. `uid()` - 13 edges
10. `useSync()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `PaletaComandos()` --calls--> `useApp()`  [EXTRACTED]
  src/components/PaletaComandos.tsx → src/store.tsx
- `CommandShortcut()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/command.tsx → src/lib/utils.ts
- `ContextMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/context-menu.tsx → src/lib/utils.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts
- `SheetHeader()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/sheet.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (99 total, 56 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.08
Nodes (47): Shell(), Vista, VISTAS, VISTAS_VALIDAS, AjustesDialog(), MenuContextoPendiente(), COLOR_PRIORIDAD, PreviaParseo() (+39 more)

### Community 1 - "sync.tsx"
Cohesion: 0.26
Nodes (11): PaletaComandos(), Vista, Command, CommandDialog(), CommandEmpty, CommandGroup, CommandInput, CommandItem (+3 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (31): DOM, ES2023, ./src/*, vite/client, vitest/globals, compilerOptions, allowImportingTsExtensions, baseUrl (+23 more)

### Community 4 - "use-toast.ts"
Cohesion: 0.14
Nodes (13): [0.1.0-pre.1] — 2026-08-05 — Fase 1: Base técnica, Añadido, Cambiado, Changelog, Eliminado, Fase 2 — Funcionalidad tipo Todoist/Things, Fase 3 — Estadísticas y productividad, Fase 4 — UX/UI y accesibilidad (+5 more)

### Community 5 - "cn"
Cohesion: 0.11
Nodes (16): Alert, AlertDescription, AlertTitle, alertVariants, Badge(), BadgeProps, badgeVariants, Label (+8 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (20): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+12 more)

### Community 8 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 9 - "menubar.tsx"
Cohesion: 0.13
Nodes (18): adivinarPorEncabezado(), Columna, FilaPreview, ImportarPlanDialog(), OPCIONES_COLUMNA, parsearModalidad(), sugerirPrioridad(), Checkbox (+10 more)

### Community 10 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 11 - "devDependencies"
Cohesion: 0.29
Nodes (7): autoprefixer, globals, devDependencies, autoprefixer, globals, @testing-library/react, @testing-library/react

### Community 12 - "@hookform/resolvers"
Cohesion: 0.08
Nodes (13): Props, DashboardView(), DIAS_CORTOS, etiquetaDia(), KanbanView(), NOMBRES_DIAS_LARGO, Registro(), saludo() (+5 more)

### Community 13 - "package.json"
Cohesion: 0.15
Nodes (12): name, private, scripts, build, dev, lint, preview, test (+4 more)

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
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 26 - "badge.tsx"
Cohesion: 0.50
Nodes (3): Al terminar, Cómo probar, /probar-como-usuario

### Community 27 - "tabs.tsx"
Cohesion: 0.07
Nodes (46): ColumnaHeader(), PendienteCuerpo(), Props, PendientePeek(), colorColumna(), COLUMNA_ELIMINADA, siguienteColor(), CAMPOS_ESCALARES (+38 more)

### Community 28 - "Pendientes + Notas Pro — PWA modular"
Cohesion: 0.22
Nodes (8): Base de datos, Compilar para producción, Cómo actualizar a TODOS los dispositivos, Desarrollo, Desplegar (una sola vez), Estructura (modular, para escalar fácil), Notas de sincronización, Pendientes + Notas Pro — PWA modular

### Community 30 - "class-variance-authority"
Cohesion: 0.12
Nodes (19): AdjuntosUI(), Miniatura(), ErrorBoundary, Props, State, Button, ButtonProps, buttonVariants (+11 more)

### Community 31 - "ListView.tsx"
Cohesion: 0.38
Nodes (8): EspacioDialog(), canjearInvitacion(), codigoAleatorio(), crearInvitacion(), Invitacion, quitarMiembro(), SyncBadge(), useSync()

### Community 32 - "cmdk"
Cohesion: 0.29
Nodes (7): class-variance-authority, @fontsource/space-grotesk, dependencies, class-variance-authority, @fontsource/space-grotesk, @radix-ui/react-select, @radix-ui/react-select

### Community 34 - "dialog.tsx"
Cohesion: 0.16
Nodes (15): ATAJOS, SINTAXIS, conDia(), DIAS, PosponerMenu(), DialogContent, DialogDescription, DialogFooter() (+7 more)

### Community 36 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 38 - "html-inline"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 43 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 45 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 46 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 68 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 102 - "googleCalendar.ts"
Cohesion: 0.10
Nodes (40): CuentasGoogleDialog(), Modalidad, AntesEspejo, DespuesEspejo, sincronizarEspejoGoogle(), sinDuplicarLocal(), activo(), actualizarEventoAgenda() (+32 more)

### Community 103 - "index.ts"
Cohesion: 0.26
Nodes (16): accionCreateEvent(), accionDeleteEvent(), accionDisconnect(), accionExchange(), accionListConnections(), accionListEvents(), accionSetModo(), accionUpdateEvent() (+8 more)

### Community 104 - "Conectar Google Calendar (time-blocking / vista Agenda)"
Cohesion: 0.17
Nodes (11): 1. Crear el proyecto y habilitar la API, 2. Configurar la pantalla de consentimiento OAuth, 3. Crear las credenciales OAuth, 4. Dónde pegar cada credencial, 5. Probar la conexión (una cuenta o varias), `access_denied` ("solo los verificadores aprobados pueden acceder"), Conectar Google Calendar (time-blocking / vista Agenda), Las cuentas conectadas dependen de la sesión de sincronización, no del dispositivo (+3 more)

## Knowledge Gaps
- **288 isolated node(s):** `Añadido`, `Cambiado`, `Eliminado`, `Refactor`, `Fase 2 — Funcionalidad tipo Todoist/Things` (+283 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `sync.tsx`, `dialog.tsx`, `context-menu.tsx`, `html-inline`, `menubar.tsx`, `sheet.tsx`, `card.tsx`, `alert.tsx`, `class-variance-authority`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `useApp()` connect `App.tsx` to `sync.tsx`, `dialog.tsx`, `googleCalendar.ts`, `menubar.tsx`, `@hookform/resolvers`, `tabs.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `dependencies` connect `cmdk` to `command.tsx`, `carousel.tsx`, `package.json`, `breadcrumb.tsx`, `date-fns`, `lucide-react`, `next-themes`, `@radix-ui/react-checkbox`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-separator`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `react-dom`, `tailwind-merge`, `@radix-ui/react-dialog`, `@radix-ui/react-context-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `@supabase/supabase-js`, `cmdk`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `Añadido`, `Cambiado`, `Eliminado` to the rest of the system?**
  _288 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07650273224043716 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `use-toast.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._