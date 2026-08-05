# Changelog

Todos los cambios notables de **Pendientes Pro** se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y el versionado
[SemVer](https://semver.org/lang/es/). El cache del Service Worker (`public/sw.js`) se
incrementa por hito funcional-visible al usuario (no así en refactor internos).

## [Unreleased]

### Fase 1 — Base técnica (no visible para el usuario final, pero sienta las bases)

- **Añadido**: suite de tests con Vitest + Testing Library + jsdom.
- **Añadido**: cobertura inicial de tests para `src/lib/app-utils.ts` y `src/lib/sync-merge.ts`
  (parsers, recurrencias, formato de fecha/hora flexible, merge y reconciliación).
- **Añadido**: tests para acciones puras del store (`crearPendiente`, `toggleCompletar`
  con recurrencia, `actualizarPendiente` con bloqueo por subtareas, archivar/desarchivar).
- **Cambiado**: `tsconfig.app.json` activa `strict` y `strictNullChecks`; se corrigen los
  errores de tipado resultantes sin alterar la lógica existente.
- **Eliminado**: dead code — `src/hooks/use-toast.ts`, `src/components/ui/toast.tsx`,
  `src/components/ui/toaster.tsx`, `src/components/ui/sonner.tsx`, `src/assets/react.svg`,
  `src/assets/vite.svg` (la app usa `sonner` directamente).
- **Refactor**: unificación de `TaskDetail` (en `ListView.tsx`) y `PendientePeek` en un
  componente base `<PendienteCuerpo>` para evitar divergencia silenciosa.
- **Refactor**: unificación de `KanbanView` (OtherViews) y `TableroProyecto` (ProyectosView)
  en un componente reutilizable `<KanbanDnd>`.

### Fase 2 — Funcionalidad tipo Todoist/Things

- **Añadido**: papelera real consumiendo el flag `borrado` ya declarado en tipos; vista
  de restaurar / vaciar papelera.
- **Añadido**: sistema de etiquetas como entidad (CRUD + colores + vista por etiqueta),
  con migración dual-write (`etiquetaIds` + `etiquetas` espejo) para no romper datos
  locales existentes.
- **Añadido**: filtros guardados / smart lists nombradas, con atajos 6-9 configurables.
- **Añadido**: subtareas anidadas multi-nivel (`Subtarea.children?: Subtarea[]`).
- **Añadido**: dependencias entre pendientes (`bloqueadoPor: string[]`) y vista
  "Disponibles" que filtra los que tienen blockers pendientes.
- **Añadido**: plantillas de pendientes reutilizables.
- **Añadido**: recurrencias avanzadas tipo RRULE (end-date, #ocurrencias, "every 2nd Tue").
- **Añadido**: importación desde CSV / Todoist.
- **Añadido**: `supabase_setup.sql` idempotente (hoy inexistente pero referenciado en
  el README).

### Fase 3 — Estadísticas y productividad

- **Añadido**: heatmap de actividad estilo GitHub en el Dashboard.
- **Añadido**: racha diaria, mediana de tiempo de vida, throughput semanal.
- **Añadido**: time tracking opcional (timer play/pause).
- **Añadido**: vista Agenda (timeline de hoy con horas).

### Fase 4 — UX/UI y accesibilidad

- **Añadido**: skeletons en el primer pull (en vez de spinners).
- **Cambiado**: confirmaciones destructivas para eliminar proyecto / carpeta / evento.
- **Cambiado**: zoom accesible en móvil (`maximum-scale=5`, `user-scalable=yes`).
- **Añadido**: SkipLink al contenido principal.
- **Añadido**: drag & drop accesible por teclado (`<Space>` abre diálogo mover).
- **Añadido**: `aria-label` en `Checkbox` de toggle y badges de ponderación.
- **Cambiado**: i18n es-MX consistente (`Intl.DateTimeFormat`) eliminando `MESES` /
  `NOMBRES_DIAS` hardcodeados.
- **Añadido**: búsqueda con sintaxis `assignee:Liz priority:alta due:<5d`.
- **Añadido**: atajos nuevos (`Ctrl+Z` undo global, `Ctrl+Enter` guardar en TaskModal,
  `J/K` navegar filas, `X` completar).
- **Añadido**: undo stack global multi-nivel (`Ctrl+Z` / `Shift+Ctrl+Z`).

### Fase 5 — Colaboración multi-usuario (sin push server)

- **Añadido**: schema SQL idempotente (`supabase_setup.sql`) con tablas para etiquetas,
  presets, plantillas, compartidos, menciones, notificaciones, proyecto_miembros. RLS
  por espacio.
- **Añadido**: vista "Asignadas a mí" como smart list destacada.
- **Añadido**: compartir pendiente ítem-a-ítem con miembros del espacio.
- **Añadido**: menciones `@miembro` en comentarios con suggestions popover.
- **Añadido**: vista Notificaciones con badge en header (realtime Supabase).
- **Añadido**: recordatorios locales (Web Notifications) sin push server.

### Fase 6 — Limpieza final y exportación

- **Añadido**: exportación a ICS, Markdown y HTML imprimible.
- **Añadido**: CI mínimo (`lint` + `typecheck` + `build` + `test` en PRs).
- **Añadido**: auditoría final con `knip`.
- **Cambiado**: versión `0.0.0` → `1.0.0`.

### Versiones del Service Worker (gantt)

- `v6` (actual) — línea base previa a la refactor.
- `v7` — fin de la Fase 1 (refactor interno completado; primer bump que confirma la base).
- `v8` (papelera) → `v15` (import Todoist) — Fase 2.
- `v16` (heatmap) → `v19` (vista Agenda) — Fase 3.
- `v20` (skeletons) → `v28` (undo global) — Fase 4.
- `v29` (schema SQL) → `v34` (recordatorios) — Fase 5.
- `v35` (export multi-formato) → `v36` (release `1.0.0`) — Fase 6.
