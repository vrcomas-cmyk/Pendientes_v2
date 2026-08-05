---
name: probar-como-usuario
description: "Prueba Pendientes Pro como lo haría una persona real usando Playwright (skill webapp-testing), no solo revisando el código. Detecta fricciones, inconsistencias y bugs de UX, y produce una lista priorizada de deficiencias y mejoras. Úsalo tras terminar una tanda de cambios de UI, o cuando el usuario pida 'pruébala como usuario' / 'revisa qué le falta a la app'."
---

# /probar-como-usuario

Objetivo: encontrar lo que un usuario real notaría al usar Pendientes Pro, no solo verificar que
compile. `tsc`/`lint`/`build` limpios NO son evidencia de que la funcionalidad esté bien — son el
piso mínimo, no el techo.

## Cómo probar

1. Arranca el dev server (`npm run dev`) y usa el skill `webapp-testing` (Playwright) para
   interactuar con la app real en el navegador — no leas el código y asumas que funciona.
2. Recorre como usuario, no como QA con checklist rígido: crea un pendiente, agéndalo, edítalo,
   complétalo, bórralo; crea una nota; crea un proyecto y muévele pendientes; cambia de vista
   (lista/tablero/hoy/agenda); prueba en móvil y en escritorio (viewport angosto y ancho); prueba
   con datos vacíos y con varios elementos.
3. Presta atención a lo que un checklist automatizado no atrapa:
   - Estados de carga/vacío que se ven rotos o abruptos.
   - Textos truncados, botones que se montan encima de otros, contraste pobre en modo oscuro.
   - Acciones que no dan ninguna señal de éxito/error (sin toast, sin cambio visible).
   - Flujos con más clics de los necesarios, o que obligan a salir de la app (ej. redirigir a
     Google Calendar cuando podría resolverse dentro de la app).
   - Datos que se pierden o se ven inconsistentes al recargar, cambiar de vista, o sincronizar
     entre dos sesiones.
   - Campos editables que no deberían serlo una vez el registro tiene cierto estado (o viceversa).
4. Anota cada hallazgo con: qué hiciste, qué esperabas, qué pasó realmente, y una captura si ayuda
   (`webapp-testing` puede tomarlas). No repares nada todavía si el usuario solo pidió "prueba y
   dime qué falta" — reporta primero.
5. Prioriza el reporte: qué rompe el flujo principal (crear/ver/completar pendientes) primero, qué
   es fricción molesta después, qué es pulido cosmético al final. No infles la lista con quejas
   triviales para parecer exhaustivo.

## Al terminar

Entrega una lista corta y accionable, agrupada por severidad, con el archivo/componente probable
si es identificable desde el código (usa `graphify query` si existe `graphify-out/graph.json` para
ubicar rápido el componente responsable de lo que falló). Si el usuario pidió que además lo
arregles, arregla primero lo que rompe el flujo principal.
