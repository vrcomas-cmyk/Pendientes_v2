---
name: workspace-doctrine
description: Doctrina no negociable para evolucionar Pendientes Pro hacia un Personal Workspace. Úsala en cualquier tarea que toque src/, CHANGELOG.md o AUDITORIA.md de este proyecto — planificación de features, diseño visual, o revisión de si un cambio encaja con la dirección del producto.
---

# Doctrina del Workspace — Pendientes Pro

Destilado de `Cambios.md` (raíz del repo, 2026-08-05) y `AUDITORIA.md`. Si necesitás
el detalle completo o los hallazgos de arquitectura que sustentan una fase del
roadmap, leé esos dos archivos — esta skill es el resumen operativo para no
releerlos cada vez.

## Restricciones no negociables

1. **La app ya funciona y tiene datos reales sincronizados en Supabase.** No rehacer,
   no cambiar arquitectura de base, no romper funcionalidades actuales.
2. **Todo cambio es incremental.** Un hito a la vez: implementar → verificar
   (`npm run test`, `npm run build`, prueba manual o skill `probar-como-usuario`) →
   documentar en `CHANGELOG.md` (con bump del Service Worker si es visible al
   usuario) → recién entonces el siguiente hito.
3. **Reusar antes de crear.** Antes de escribir un componente nuevo, buscar si ya
   existe algo equivalente (ver "Inventario reusable" abajo).
4. **Retrocompatibilidad siempre.** Cambios de modelo de datos son aditivos
   (campos opcionales `?`), nunca remueven ni renombran campos existentes sin
   migración explícita aprobada por el usuario.
5. **Sin IA por ahora.** El objetivo se resuelve con UX, no con features de IA.
6. **La pregunta de validación** de cualquier mejora, textual de `Cambios.md`:
   > "¿Esta mejora hace que el usuario necesite menos clics, menos ventanas y menos
   > tiempo para organizar su día?"
   Si la respuesta es no, replantear la solución antes de implementar.

## Glosario — evitar colisión de nombres

**"Espacio" tiene dos significados distintos en este proyecto. No confundirlos.**

| Término | Significado | Dónde vive |
|---|---|---|
| **Espacio (sync / cuenta compartida)** — ya existe | Unidad de identidad multi-usuario: cuenta padre/hija que comparte datos vía Supabase Realtime | `src/sync.tsx`, `src/lib/espacio.ts`, tablas `pnp_espacios`, `pnp_espacio_miembros`, `pnp_invitaciones` |
| **Espacio (workspace UI)** — nuevo, Fase 4 del roadmap | Agrupación visual de contenido por contexto: Trabajo, Escuela, Personal, Finanzas, Moto, Ideas. Capa nueva sobre `Proyecto` (`Proyecto.espacioId?`) | por crear en `src/types.ts` |

En UI, referirse al primero como "cuenta compartida" o "sincronización" para no
pisar el segundo. En código, el tipo nuevo debe llamarse `Espacio` sin colisionar
con las funciones de `src/lib/espacio.ts` — revisar nombres antes de introducir el
tipo.

## Dirección estética

Inspiración: Apple Reminders, Apple Notes, Things 3, Fantastical, Linear, Notion,
Craft, TickTick, Trello, Obsidian — **sin copiar ninguna**. Identidad propia.

- Limpio, minimalista, mucho espacio en blanco, jerarquía visual clara.
- Microinteracciones: hover, ripple, elevación, fade, scale, spring, momentum.
- Glass / blur / sombras suaves — **hoy no existe ningún token de esto en el
  proyecto** (`tailwind.config.js` / `src/index.css`); es la Fase 2 del roadmap y
  desbloquea todo lo visual posterior.
- Paleta ya distintiva y a conservar: primario índigo-violeta (`--primary: 250 65%
  58%`), acento ámbar cálido (`--accent-2`), tipografía Space Grotesk (display) +
  Plus Jakarta Sans (cuerpo) + JetBrains Mono, ya self-hosted vía `@fontsource`.
- Cuidado con contraste bajo blur: cualquier panel glass necesita un piso de
  opacidad y verificación WCAG en ambos temas antes de darse por cerrado.

## Inventario reusable (no recrear)

- Timeline / secciones del día: `TodayView` (`src/views/OtherViews.tsx:208`) y su
  patrón `Seccion` ya agrupan Vencidos/Hoy/Próximos/Sin fecha/Registro.
- Filas de tarea: `src/components/TaskRow.tsx`.
- Detalle de pendiente: `src/components/PendienteCuerpo.tsx` (unifica
  TaskDetail/Peek).
- Tablero Kanban: `src/components/KanbanDnd.tsx` (props `pendientes`,
  `defaultsAlAgregar`, `minColW` — sirve tal cual para un "Kanban rápido" widget).
- Anillo de progreso: `src/components/ProgressRing.tsx` (base para widget Pomodoro).
- Command palette Ctrl+K: `src/components/PaletaComandos.tsx` (cmdk).
- Captura rápida con sintaxis: `quickAdd()` en `App.tsx` + `parsearLinea` en
  `src/lib/app-utils.ts`.
- Papelera / soft-delete: `src/views/PapeleraView.tsx`, flag `borrado` en tipos.
- Colores de proyecto/columna: `PROYECTO_COLORES` en `src/types.ts` — reusar sus
  10 claves para Espacios en vez de inventar una paleta nueva.

## Roadmap vigente (ver `AUDITORIA.md` sección 8 para el detalle)

Orden aprobado, visual primero: **Fase 2** cimientos visuales → **Fase 3** shell
Workspace (sidebar permanente, dock, HOY como timeline) → **Fase 4** Espacios →
**Fase 5** Inbox universal → **Fase 6** widgets flotantes → **Fase 7** entidad
común (etiquetas/comentarios/adjuntos compartidos entre Pendiente y Nota, el
refactor más caro, al final) → **Fase 8+** funcionalidad tipo Todoist/Things que ya
estaba planificada.

No abrir una fase nueva sin haber cerrado (implementado + verificado + documentado)
la anterior.
