# Graph Report - pendientes-pro  (2026-08-04)

## Corpus Check
- 109 files · ~60,666 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 824 nodes · 1672 edges · 106 communities (43 shown, 63 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `931effc1`
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
- cmdk
- date-fns
- eslint
- globals
- html-inline
- lucide-react
- next-themes
- dependencies
- @radix-ui/react-aspect-ratio
- graphify reference: query, path, explain
- @radix-ui/react-checkbox
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- @radix-ui/react-dropdown-menu
- @radix-ui/react-hover-card
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-toggle
- @radix-ui/react-toggle-group
- @radix-ui/react-tooltip
- react-day-picker
- react-dom
- react-hook-form
- react-resizable-panels
- graphify reference: incremental update and cluster-only
- tailwind-merge
- vaul
- zod
- @radix-ui/react-collapsible
- @parcel/config-default
- parcel-resolver-tspaths
- postcss
- tailwindcss
- tailwindcss-animate
- @types/node
- @types/react-dom
- typescript
- typescript-eslint
- vite
- @vitejs/plugin-react
- sw.js
- accordion.tsx
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
- @radix-ui/react-accordion
- eslint
- cmdk

## God Nodes (most connected - your core abstractions)
1. `cn()` - 52 edges
2. `useApp()` - 44 edges
3. `idColumnaCompletado()` - 22 edges
4. `hoyISO()` - 20 edges
5. `CalendarioView()` - 20 edges
6. `compilerOptions` - 20 edges
7. `Button` - 18 edges
8. `colorColumna()` - 17 edges
9. `Shell()` - 16 edges
10. `getSupabase()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useToast()` --references--> `react`  [EXTRACTED]
  src/hooks/use-toast.ts → package.json
- `PaletaComandos()` --calls--> `useApp()`  [EXTRACTED]
  src/components/PaletaComandos.tsx → src/store.tsx
- `BreadcrumbSeparator()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/breadcrumb.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (106 total, 63 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.09
Nodes (52): ColumnaHeader(), MenuContextoPendiente(), PendientePeek(), ProgressRing(), TaskRow(), ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem (+44 more)

### Community 1 - "sync.tsx"
Cohesion: 0.26
Nodes (11): PaletaComandos(), Vista, Command, CommandDialog(), CommandEmpty, CommandGroup, CommandInput, CommandItem (+3 more)

### Community 3 - "compilerOptions"
Cohesion: 0.08
Nodes (26): DOM, vite/client, compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, ignoreDeprecations, jsx (+18 more)

### Community 4 - "use-toast.ts"
Cohesion: 0.07
Nodes (38): react, react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem (+30 more)

### Community 5 - "cn"
Cohesion: 0.10
Nodes (16): HoverCardContent, PopoverContent, Progress, RadioGroup, RadioGroupItem, ScrollArea, ScrollBar, Separator (+8 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (20): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+12 more)

### Community 7 - "carousel.tsx"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 8 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 9 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 10 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 11 - "devDependencies"
Cohesion: 0.18
Nodes (11): autoprefixer, buffer, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, autoprefixer, buffer, eslint-plugin-react-hooks (+3 more)

### Community 13 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 15 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 16 - "sheet.tsx"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 17 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 18 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, baseUrl, ignoreDeprecations, paths, files, ./src/*, @/*, references

### Community 19 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 20 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 21 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 22 - "card.tsx"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 23 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 24 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 25 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 26 - "badge.tsx"
Cohesion: 0.50
Nodes (3): Al terminar, Cómo probar, /probar-como-usuario

### Community 27 - "tabs.tsx"
Cohesion: 0.08
Nodes (42): EspacioDialog(), canjearInvitacion(), codigoAleatorio(), crearInvitacion(), Invitacion, quitarMiembro(), getConfig(), getSupabase() (+34 more)

### Community 28 - "Pendientes + Notas Pro — PWA modular"
Cohesion: 0.22
Nodes (8): Base de datos, Compilar para producción, Cómo actualizar a TODOS los dispositivos, Desarrollo, Desplegar (una sola vez), Estructura (modular, para escalar fácil), Notas de sincronización, Pendientes + Notas Pro — PWA modular

### Community 30 - "class-variance-authority"
Cohesion: 0.06
Nodes (60): AdjuntosUI(), Miniatura(), ATAJOS, SINTAXIS, adivinarPorEncabezado(), Columna, FilaPreview, ImportarPlanDialog() (+52 more)

### Community 32 - "cmdk"
Cohesion: 0.15
Nodes (13): class-variance-authority, dependencies, class-variance-authority, @radix-ui/react-radio-group, @radix-ui/react-scroll-area, @radix-ui/react-toast, @radix-ui/react-tooltip, vaul (+5 more)

### Community 38 - "html-inline"
Cohesion: 0.07
Nodes (49): Shell(), Vista, VISTAS, VISTAS_VALIDAS, AjustesDialog(), ErrorBoundary, Props, State (+41 more)

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

### Community 91 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 102 - "googleCalendar.ts"
Cohesion: 0.10
Nodes (37): CuentasGoogleDialog(), AntesEspejo, DespuesEspejo, sincronizarEspejoGoogle(), actualizarEventoAgenda(), actualizarModoEspejo(), agendarPendiente(), combinarFechaHora() (+29 more)

### Community 103 - "index.ts"
Cohesion: 0.26
Nodes (16): accionCreateEvent(), accionDeleteEvent(), accionDisconnect(), accionExchange(), accionListConnections(), accionListEvents(), accionSetModo(), accionUpdateEvent() (+8 more)

### Community 104 - "Conectar Google Calendar (time-blocking / vista Agenda)"
Cohesion: 0.17
Nodes (11): 1. Crear el proyecto y habilitar la API, 2. Configurar la pantalla de consentimiento OAuth, 3. Crear las credenciales OAuth, 4. Dónde pegar cada credencial, 5. Probar la conexión (una cuenta o varias), `access_denied` ("solo los verificadores aprobados pueden acceder"), Conectar Google Calendar (time-blocking / vista Agenda), Las cuentas conectadas dependen de la sesión de sincronización, no del dispositivo (+3 more)

## Knowledge Gaps
- **357 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+352 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `cmdk` to `command.tsx`, `use-toast.ts`, `@hookform/resolvers`, `package.json`, `date-fns`, `lucide-react`, `next-themes`, `dependencies`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-checkbox`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-day-picker`, `react-dom`, `react-hook-form`, `react-resizable-panels`, `tailwind-merge`, `vaul`, `zod`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-context-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `@supabase/supabase-js`, `@radix-ui/react-accordion`, `cmdk`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **Why does `react` connect `use-toast.ts` to `cmdk`?**
  _High betweenness centrality (0.211) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `App.tsx`, `sync.tsx`, `use-toast.ts`, `carousel.tsx`, `menubar.tsx`, `sheet.tsx`, `table.tsx`, `breadcrumb.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `card.tsx`, `toggle-group.tsx`, `alert.tsx`, `avatar.tsx`, `accordion.tsx`, `class-variance-authority`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _357 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08735733099209833 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `use-toast.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06620209059233449 - nodes in this community are weakly interconnected._