# Memoria — Desarrollador (Implementación, GREEN)

> Protocolo: LEE este archivo al empezar y AÑADE tu entrada al final al terminar. Nunca borres historial.

## Contexto
Implementa lo mínimo para dejar verde: `npm run lint`, `npm run build`, `npm run test`.
Doctrina: solo incremental, modelo aditivo, reusar antes de crear (mirar `src/components/` y
`src/views/OtherViews.tsx`), sin comentarios de adorno.

## Pendientes
- (ninguno en curso)

## Historial
### 2026-08-09 — sesión inicial
- Rol creado. Sin implementaciones aún.

### 2026-08-09 — H1 viñetas anidadas (GREEN)
- `parsearMinuta`/`subtareaDeLinea` en app-utils; `agregarSubtarea(pid,texto,extra?)` aditivo
  en store; NotesView: extracción anidada (`.nota-sub`) + Enter indentado → subtarea; CSS.
- 1 gira de revisión (F5): faltaba destructurar `agregarSubtarea` y narrowing de `el`.
  Corregido; el pipeline quedó verde sin tocar funcionalidad existente.

### 2026-08-09 — H4 confirmación de descarte (GREEN) | ✓ hecho
- `src/lib/overlay.ts`: `TipoOverlay='confirmar-cierre'` + regla de cerrar. `src/ui-store.tsx`:
  guardiaRef/accionPendienteRef, `registrarGuardia`/`confirmarDescartes`/`cancelarDescartes`,
  interceptar(). `TaskModal.tsx`: snapshots baseRef/dirtyRef/sinVerificarRef y cierre solo con
  overlay modal. `ConfirmDialog.tsx`: `onCancelar?`/`cerrarTrasConfirmar?` aditivos.
- Pipeline verde sin romper callers previos; estado montado preservado bajo la confirmación.