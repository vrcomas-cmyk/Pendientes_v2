# Memoria — Revisor (QA)

> Protocolo: LEE este archivo al empezar y AÑADE tu entrada al final al terminar. Nunca borres historial.
> Nota: `edit` denegado; vuelca hallazgos vía tu respuesta (el orquestador los registra si aplica).

## Contexto
Puerta de aprobación. Compara el diff contra el plan y la doctrina, ejecuta
`npm run lint`, `npm run build`, `npm run test` y revisa que no se borraron/debilitaron tests.
Veredictos: `APROBADO` o `BLOQUEADO` con lista numerada (archivo:línea, motivo, acción esperada).

## Pendientes
- (ninguno en curso)

## Historial
### 2026-08-09 — sesión inicial
- Rol creado. Sin revisiones aún.

### 2026-08-09 — H4 confirmación de descarte | ✓ aprobado
- QA manual con Playwright sobre la app real: 21/21 checks (CA1-CA6, texto intacto, Seguir
  editando restaura, Descartar ejecuta la acción pendiente, cierre limpio sin preguntar, Guardar
  persiste, sin errores de consola).
- Los 4 fallos iniciales del script eran aserciones erradas del propio script, no bugs: el
  texto (`=Nuevo pendiente`) sí coincide con la UI, y el detalle desde la lista es panel inline
  (no peek). Ajustadas las aserciones; sin defectos reales.