# Pendientes + Notas Pro — PWA modular

App de pendientes y notas con sincronización en la nube (Supabase), **offline-first** e
instalable como PWA en computadora y celular. Código modular en React + TypeScript + Vite.

## Estructura (modular, para escalar fácil)

```
src/
  App.tsx                 Shell: navegación, barra de captura rápida, exportar
  store.tsx               Estado global (pendientes/notas) + persistencia local
  sync.tsx                Motor de sincronización offline-first (reconciliación 3 vías)
  types.ts                Tipos de datos
  lib/
    supabase.ts           Conexión a Supabase (URL + anon key ya configuradas)
    sync-merge.ts         Lógica de fusión de conflictos (merge + reconciliar)
    adjuntos.ts           Subida/descarga de archivos a Supabase Storage
    app-utils.ts          Utilidades + parser de la sintaxis de notas (@ ! >)
  components/
    TaskModal.tsx         Modal de crear/editar pendiente
    TaskRow.tsx           Fila de pendiente
    AdjuntosUI.tsx        Componente de adjuntos reutilizable
    ui/                   Componentes base (shadcn/ui)
  views/
    PendientesView.tsx    Contenedor con selector Lista / Tablero / Calendario
    ListView.tsx          Vista lista + detalle
    NotesView.tsx         Editor de notas con chips de pendientes
    OtherViews.tsx        Hoy, Kanban, Calendario, Panel
  hooks/
    use-is-mobile.ts
public/
  manifest.webmanifest    Manifiesto PWA
  sw.js                   Service worker (offline + auto-actualización)
  icon-*.png              Iconos de la app
```

Para agregar un módulo nuevo: crea el componente en `views/` o `components/`,
y enlázalo en `App.tsx` (navegación) o en `PendientesView.tsx` (vista).

## Desarrollo

```bash
npm install        # o: pnpm install
npm run dev        # servidor local en http://localhost:5173
```

## Compilar para producción

```bash
npm run build      # genera la carpeta dist/ lista para desplegar
npm run preview    # previsualiza la build
```

## Desplegar (una sola vez)

Sube la carpeta **dist/** a cualquier hosting con HTTPS:

- **Vercel:** importa el repo o sube el proyecto; framework "Vite". Build: `npm run build`, salida: `dist`.
- **Netlify:** "Add new site → Deploy manually" y arrastra la carpeta `dist/`.
- **GitHub Pages / Cloudflare Pages:** sirve `dist/`.

Abre la URL en compu y celular e instálala ("Instalar app" / "Agregar a pantalla de inicio").
Tras la primera carga funciona **sin internet**.

## Cómo actualizar a TODOS los dispositivos

1. Haz tus cambios en `src/`.
2. **Sube el número de versión del cache** en `public/sw.js`:
   `const CACHE = 'pendientes-pro-v3'` → `...-v4`.
3. `npm run build` y vuelve a desplegar `dist/`.

Cada dispositivo recibe la actualización solo la próxima vez que tenga internet.

## Base de datos

Las tablas viven en Supabase con prefijo `pnp_` (`pnp_pendientes`, `pnp_notas`) y el
bucket `pnp_adjuntos`, para no chocar con otras apps del mismo proyecto. El script SQL
de creación es `supabase_setup.sql` (idempotente).

## Notas de sincronización

- Funciona offline: los cambios se guardan local y se suben al reconectar.
- Fusión de conflictos: comentarios, subtareas, adjuntos y etiquetas de distintos
  dispositivos **se unen** (no se pisan); los campos simples usan el más reciente.
