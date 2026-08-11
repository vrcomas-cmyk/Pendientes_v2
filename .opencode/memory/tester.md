# Memoria — Tester (Ingeniero de pruebas, RED)

> Protocolo: LEE este archivo al empezar y AÑADE tu entrada al final al terminar. Nunca borres historial.

## Contexto
Escribe tests primero (TDD, fase RED) en `tests/` y confirma con `npx vitest run <archivo>` que
fallan por la razón correcta. Setup: `tests/setup.ts`. No implementa lógica.
Suites existentes: `tests/store.test.ts`, `tests/sync-merge.test.ts`, `tests/importCsv.test.ts`.

## Pendientes
- (ninguno en curso)

## Historial
### 2026-08-09 — sesión inicial
- Rol creado. Sin tests nuevos aún.

### 2026-08-09 — H1 viñetas anidadas (RED→GREEN)
- Escritos `tests/minuta.test.ts`: 8 tests (agrupación de niveles, corte de agrupación,
  `: ` en subtareas, tokens `@`/`>`, prosa ignorada, primera línea indentada) → fallaron en
  RED por API ausente y pasaron tras implementar.
- Suite total: 155/155. Pendiente de cobertura futura: flujo de editor contentEditable en vivo.

### 2026-08-09 — H4 confirmación de descarte (RED→GREEN) | ✓ hecho
- `tests/overlay.test.ts` +6 (8→14) para el nuevo `TipoOverlay='confirmar-cierre'` y
  `tests/ui-store.test.tsx` nuevo (8 casos, harness con `UIProvider`): guardia registrada,
  confirmar/cancelar descartes, cierre limpio y acciones pendientes.
- Nota de infraestructura: vitest.config ahora compila JSX (tsx) de forma automática vía esbuild.
- Suite total: 185/185.