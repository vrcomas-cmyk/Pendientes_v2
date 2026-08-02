# Graph Report - pendientes-pro  (2026-08-01)

## Corpus Check
- 98 files · ~49,924 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 751 nodes · 1154 edges · 113 communities (48 shown, 65 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bc290132`
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
- context-menu.tsx
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
- clsx
- cmdk
- date-fns
- embla-carousel-react
- eslint
- @eslint/js
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
- supabase.ts
- @radix-ui/react-accordion
- tabs.tsx
- label.tsx
- radio-group.tsx
- cmdk
- adjuntos.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 45 edges
2. `useApp()` - 34 edges
3. `hoyISO()` - 20 edges
4. `compilerOptions` - 20 edges
5. `compilerOptions` - 16 edges
6. `vencido()` - 15 edges
7. `Button` - 13 edges
8. `describirRepeticion()` - 13 edges
9. `What You Must Do When Invoked` - 12 edges
10. `Shell()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useToast()` --references--> `react`  [EXTRACTED]
  src/hooks/use-toast.ts → package.json
- `Shell()` --indirect_call--> `vencido()`  [INFERRED]
  src/App.tsx → src/lib/app-utils.ts
- `NotesView()` --calls--> `useApp()`  [EXTRACTED]
  src/views/NotesView.tsx → src/store.tsx

## Import Cycles
- None detected.

## Communities (113 total, 65 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.06
Nodes (34): Shell(), Vista, VISTAS, VISTAS_VALIDAS, ATAJOS, SINTAXIS, ErrorBoundary, Props (+26 more)

### Community 1 - "sync.tsx"
Cohesion: 0.23
Nodes (9): CAMPOS_ESCALARES, contenidoIgual(), ItemBase, MapaSync, mergePendiente(), reconciliar(), ResultadoReconcilia, sinVolatil() (+1 more)

### Community 2 - "command.tsx"
Cohesion: 0.12
Nodes (14): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+6 more)

### Community 3 - "compilerOptions"
Cohesion: 0.08
Nodes (26): DOM, vite/client, compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, ignoreDeprecations, jsx (+18 more)

### Community 4 - "use-toast.ts"
Cohesion: 0.12
Nodes (22): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+14 more)

### Community 5 - "cn"
Cohesion: 0.11
Nodes (14): Checkbox, HoverCardContent, Input, PopoverContent, Progress, ScrollArea, ScrollBar, Separator (+6 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (20): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+12 more)

### Community 7 - "carousel.tsx"
Cohesion: 0.07
Nodes (25): react, react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem (+17 more)

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

### Community 14 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

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
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 28 - "Pendientes + Notas Pro — PWA modular"
Cohesion: 0.22
Nodes (8): Base de datos, Compilar para producción, Cómo actualizar a TODOS los dispositivos, Desarrollo, Desplegar (una sola vez), Estructura (modular, para escalar fácil), Notas de sincronización, Pendientes + Notas Pro — PWA modular

### Community 30 - "class-variance-authority"
Cohesion: 0.06
Nodes (72): PaletaComandos(), Vista, PendientePeek(), conDia(), DIAS, PosponerMenu(), ProgressRing(), TaskModal() (+64 more)

### Community 32 - "cmdk"
Cohesion: 0.15
Nodes (13): class-variance-authority, dependencies, class-variance-authority, @radix-ui/react-radio-group, @radix-ui/react-scroll-area, @radix-ui/react-toast, @radix-ui/react-tooltip, vaul (+5 more)

### Community 41 - "dependencies"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

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
Cohesion: 0.20
Nodes (20): CuentasGoogleDialog(), actualizarEventoAgenda(), actualizarModoEspejo(), agendarPendiente(), combinarFechaHora(), CuentaGoogle, desconectarGoogle(), eliminarEventoAgenda() (+12 more)

### Community 103 - "index.ts"
Cohesion: 0.29
Nodes (16): accionCreateEvent(), accionDeleteEvent(), accionDisconnect(), accionExchange(), accionListConnections(), accionListEvents(), accionSetModo(), accionUpdateEvent() (+8 more)

### Community 104 - "Conectar Google Calendar (time-blocking / vista Agenda)"
Cohesion: 0.25
Nodes (7): 1. Crear el proyecto y habilitar la API, 2. Configurar la pantalla de consentimiento OAuth, 3. Crear las credenciales OAuth, 4. Dónde pegar cada credencial, 5. Probar la conexión (una cuenta o varias), Conectar Google Calendar (time-blocking / vista Agenda), Notas de seguridad

### Community 105 - "supabase.ts"
Cohesion: 0.70
Nodes (3): getConfig(), getSupabase(), isConfigured()

### Community 107 - "tabs.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 112 - "adjuntos.ts"
Cohesion: 0.35
Nodes (10): AdjuntosUI(), Miniatura(), eliminarAdjunto(), esImagen(), formatoTamano(), leerComoDataUrl(), subirAdjunto(), urlAdjunto() (+2 more)

## Knowledge Gaps
- **369 isolated node(s):** `EstadoSync`, `SyncCtx`, `Ctx`, `UltimoSync`, `graphify` (+364 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `carousel.tsx` to `cmdk`, `use-toast.ts`?**
  _High betweenness centrality (0.366) - this node is a cross-community bridge._
- **Why does `dependencies` connect `cmdk` to `carousel.tsx`, `@hookform/resolvers`, `package.json`, `clsx`, `date-fns`, `embla-carousel-react`, `lucide-react`, `next-themes`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-checkbox`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-day-picker`, `react-dom`, `react-hook-form`, `react-resizable-panels`, `tailwind-merge`, `vaul`, `zod`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-context-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `@supabase/supabase-js`, `@radix-ui/react-accordion`, `cmdk`?**
  _High betweenness centrality (0.242) - this node is a cross-community bridge._
- **What connects `EstadoSync`, `SyncCtx`, `Ctx` to the rest of the system?**
  _369 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.057912457912457915 - nodes in this community are weakly interconnected._
- **Should `command.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `use-toast.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12333333333333334 - nodes in this community are weakly interconnected._