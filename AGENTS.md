# AGENTS.md — Pendientes Pro (en español)

## Visión general del proyecto
PWA de tareas/notas con sincronización Supabase, *offline-first*. React 19 + TypeScript + Vite. Fuentes autohospedadas, Radix UI, Tailwind.

## Comandos de desarrollo
```bash
npm run dev          # servidor dev en :5173
npm run build        # tsc -b && vite build → dist/
npm run lint         # eslint .
npm run test         # vitest run
npm run test:watch   # vitest en modo watch
npm run test:coverage
npm run preview      # previsualiza dist/
```
**Orden en CI (debe pasar local primero):** `lint → build → test`

## Arquitectura esencial
- **Estado**: Dos contextos React — `AppProvider` (`src/store.tsx`) para todos los datos locales, `SyncProvider` (`src/sync.tsx`) para auth/sincronización Supabase.
- **Flujo de datos**: Cambios locales → push con debounce (1s) → upsert en Supabase. Realtime + poll 60s + visibilitychange pull → merge a 3 vías (`src/lib/sync-merge.ts`).
- **Offline**: Service worker (`public/sw.js`) cachea todos los assets. Incrementar versión `CACHE` en sw.js al desplegar.
- **Ruteo**: Single-page, cambio de vistas en `App.tsx` (sin librería de router).
- **Alias de ruta**: `@/*` → `src/*` (configurado en vite + tsconfig).

## Archivos clave
| Archivo | Propósito |
|---------|-----------|
| `src/store.tsx` | Estado global, todo CRUD, persistencia en localStorage |
| `src/sync.tsx` | Auth Supabase, realtime, merge a 3 vías, cola offline |
| `src/types.ts` | Tipos compartidos (Pendiente, Nota, Proyecto, Espacio, etc.) |
| `src/lib/sync-merge.ts` | Resolución de conflictos (merge + reconciliar) |
| `src/lib/app-utils.ts` | Parsing, fechas, IDs, sintaxis quick-add |
| `src/views/*.tsx` | 7 vistas: Inbox, Pendientes, Notas, Proyectos, Calendario, Papelera, Panel |
| `src/components/` | UI reutilizable (TaskRow, TaskModal, KanbanDnd, PaletaComandos, etc.) |

## Convenciones TypeScript
- Modo estricto: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`
- `type Estado = string` (IDs de columna), **no enum** — las columnas las edita el usuario
- Cambios de modelo **solo aditivos** (campos opcionales `?`). Nunca eliminar/renombrar sin migración explícita aprobada.

## Testing
- Framework: Vitest + jsdom + React Testing Library
- Config: `vitest.config.ts` (coverage en `src/lib/**/*.ts`, `src/store.tsx`)
- Setup: `tests/setup.ts` (polyfills matchMedia, ResizeObserver, filtro console.error)
- Test individual: `npx vitest run tests/store.test.ts`

## PWA / Service Worker
- `public/sw.js` registrado **solo en producción** (`main.tsx`)
- Al desplegar: incrementar `const CACHE = 'pendientes-pro-vX'` en sw.js, luego `npm run build`
- Dev: SW desregistrado + caches limpiados al cargar

## Supabase
- Tablas: `pnp_pendientes`, `pnp_notas`, `pnp_proyectos`, `pnp_eventos`, `pnp_espacios`, `pnp_espacio_miembros`, `pnp_invitaciones`
- Bucket: `pnp_adjuntos`
- Esquema en `supabase_setup.sql` (idempotente)
- Config guardada en localStorage (`sb_url`, `sb_anon`)

## Doctrina del Workspace (no negociable)
1. **La app funciona con datos reales sincronizados** — no reescribir, no romper funcionalidades
2. **Solo incremental** — un hito a la vez: implementar → verificar (`test`, `build`, manual) → documentar en `CHANGELOG.md` (bump SW si visible al usuario) → siguiente
3. **Reusar antes de crear** — revisar `src/components/`, `src/views/OtherViews.tsx` primero
4. **Retrocompatibilidad siempre** — cambios de modelo solo aditivos
5. **Sin IA por ahora** — resolver con UX
6. **Pregunta de validación** (textual de `Cambios.md`):
   > "¿Esta mejora hace que el usuario necesite menos clics, menos ventanas y menos tiempo para organizar su día?"

## Glosario — Colisión "Espacio"
| Término | Significado | Ubicación |
|---------|-------------|-----------|
| **Espacio (sync)** | Cuenta compartida multi-usuario (padre/hija) vía Supabase Realtime | `src/sync.tsx`, `src/lib/espacio.ts`, `pnp_espacios` |
| **Espacio (workspace UI)** | Agrupación visual de proyectos (Trabajo, Personal, etc.) — Fase 4 | `src/types.ts` (nueva interfaz `Espacio`) |

En UI llamar al primero "cuenta compartida" o "sincronización". En código, evitar colisión con `src/lib/espacio.ts`.

## Graphify
Grafo de conocimiento en `graphify-out/`. Tras cambios: `graphify update .` (solo AST, sin costo API).
Para consultas: `graphify query "..."`, `graphify path "A" "B"`, `graphify explain "concepto"`.

## Knip
Detección de código no usado: `npx knip` (config en `knip.json`)

## Fuentes (autohospedadas)
`@fontsource/space-grotesk`, `plus-jakarta-sans`, `jetbrains-mono` — importadas en `main.tsx`, funcionan offline en la PWA.