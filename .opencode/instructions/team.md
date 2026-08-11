# Manual del Equipo de Desarrollo

Protocolo común para todos los agentes del **Equipo de Desarrollo** de Pendientes Pro.
Este archivo se carga en cada sesión. Lo específico de cada rol vive en `.opencode/agent/*.md`
y su memoria en `.opencode/memory/*.md`.

## Doctrina (no negociable; fuente en `AGENTS.md`)
1. **La app funciona con datos reales sincronizados** — no reescribir, no romper funcionalidades.
2. **Solo incremental** — un hito a la vez: implementar → verificar (`npm run lint`, `npm run build`,
   `npm run test`, manual) → documentar en `CHANGELOG.md` (bump SW si el cambio es visible) → siguiente.
3. **Reusar antes de crear** — revisar `src/components/`, `src/views/OtherViews.tsx` primero.
4. **Retrocompatibilidad siempre** — cambios de modelo solo aditivos (campos opcionales `?`).
5. **Sin IA por ahora** — resolver con UX.
6. **Pregunta de validación**: *"¿Esta mejora hace que el usuario necesite menos clics, menos ventanas y
   menos tiempo para organizar su día?"*

## Pipelines de verificación (orden de CI)
```bash
npm run lint
npm run build
npm run test
```
Si una fase del equipo rompe algo que pasaba, el resto del equipo **se detiene** y se corrige
antes de continuar. Nunca se oculta un fallo para "avanzar".

## Sistema de memoria
- Cada agente tiene un archivo personal: `.opencode/memory/<agente>.md`.
- **Al empezar**: leer tu memoria y `.opencode/memory/LOG.md` (bitácora compartida).
- **Al terminar**: añadir una entrada al final de tu memoria (`### YYYY-MM-DD — tema`) con:
  qué hiciste, decisiones, lecciones, pendientes y estado (`✓ hecho / ⏳ en curso / ✗ bloqueado`).
- Añadir **una línea** a `LOG.md` por acción relevante (formato: `fecha | agente | acción | estado`).
- Nunca borres historial de tu memoria: solo se añade.

## Loop del equipo (en manos del orquestador `team`)
```
F0 Preparación   → leer memorias + LOG + contexto (AGENTS.md, docs)
F1 Producto      → objetivo → tickets con criterios de aceptación        [agente: producto]
F2 Plan          → plan de implementación: archivos, orden, riesgos, TDD  [agente: planificador]
F3 Red (tests)   → escribir tests que fallan por la razón correcta         [agente: tester]
F4 Verde (cód.)  → implementar hasta que test+lint+build pasen             [agente: desarrollador]
F5 QA / review   → Aprobar o devolver con bloqueos                         [agente: revisor]
F6 Código si bloqueos → volver a F3/F4 (máx 3 intentos por ticket)
F7 Documentar    → CHANGELOG.md + SW si visible + memoria                  [agente: documentador]
F8 Verificación  → lint + build + test finales + resumen al usuario
```
El orquestador decide el orden; los especialistas se invocan vía la herramienta `task` con su
`subagent_type`. Si un especialista no está disponible como tipo, usar `general` con el mismo briefing
o ejecutar la fase directamente.

## Roles del equipo
| Agente | Rango | Responsabilidad |
|--------|-------|-----------------|
| `team` | primario | Orquestador / bucle del equipo |
| `producto` | subagente | Transformar objetivos en tickets |
| `planificador` | subagente | Plan de implementación técnica |
| `tester` | subagente | Tests TDD (red) + matriz de cobertura |
| `desarrollador` | subagente | Implementar y dejar el pipeline verde |
| `revisor` | subagente | QA: aprobar o devolver contra plan y doctrina |
| `documentador` | subagente | CHANGELOG, SW y bitácora |