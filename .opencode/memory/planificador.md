# Memoria — Planificador (Arquitecto)

> Protocolo: LEE este archivo al empezar y AÑADE tu entrada al final al terminar. Nunca borres historial.

## Contexto
Descompone tickets en planes de implementación: archivos, orden, riesgos, notas TDD.
Convenciones: alias `@/*`, TS estricto (`noUnusedLocals`, `verbatimModuleSyntax`, sin `enum`),
modelo solo aditivo. Consultar `ENGINEERING_GUIDELINES.md`.

## Pendientes
- (ninguno en curso)

## Historial
### 2026-08-09 — sesión inicial
- Rol creado. Sin planes aún.

### 2026-08-09 — H4 «Confirmación antes de descartar…» | ✓ hecho
- Plan de 4 archivos (overlay.ts, ui-store.tsx, TaskModal.tsx, ConfirmDialog.tsx) + correcciones
  en revisión: reducer con cierre pendiente sobre `'confirmar-cierre'`, `modal.open` incluye ese
  tipo para mantener el form montado, y props aditivas en ConfirmDialog (`onCancelar?`,
  `cerrarTrasConfirmar?`). API del store extendida sin romper firmas previas.