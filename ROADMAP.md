# Roadmap — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> Línea de tiempo evolutiva. Cada versión agrupa Epics de [`PRODUCT_BACKLOG.md`](./PRODUCT_BACKLOG.md)
> con un objetivo coherente — nunca una mezcla arbitraria de lo que "estaba listo". El
> orden respeta la secuencia recomendada al cierre de [`PDS.md`](./PDS.md) §11: primero
> layout y overlays (corrige la falla más grave), después tokens, después todo lo demás.

## v2.0 — Corrección de fundamentos

**Objetivo**: eliminar las fallas estructurales detectadas en la crítica de `PDS.md`
§1, sin agregar ninguna función nueva. Esta versión es, deliberadamente, más
correctiva que aditiva.

- **Funcionalidades**: regla de exclusividad de overlays (Epic 1); sidebar
  reestructurado (Epic 2); Hoy reducida a su núcleo, sin duplicación (Epic 3);
  sistema tipográfico y de espaciado unificado (Epic 6).
- **Cambios de UX**: navegación primaria de 5 ítems; un header de vista consistente en
  las 12 superficies (`PDS.md` §5.2); estados vacíos rediseñados con guía de acción
  (Principio 16 de `PRODUCT_PRINCIPLES.md`).
- **Cambios técnicos**: tokens de Design System centralizados (`PDS.md` §6) como base
  de la que todo lo demás depende; migración de integridad de proyecto ya completada
  (Epic 5, ver `DECISIONS_LOG.md`).
- **Riesgos**: tocar la navegación primaria y el layout base afecta a toda la
  superficie de la app a la vez — riesgo de regresión visual amplio, mitigado por
  verificación pantalla por pantalla contra `PDS.md` antes de cerrar la versión.
- **Criterios de éxito**: cero superficies con dos overlays simultáneos posibles (por
  diseño, no por casualidad); cero tamaños de texto fuera de la escala de 3 niveles en
  auditoría de código; Hoy sin ninguna tarjeta duplicada de información.

## v2.1 — Sistema de Widgets v2

**Objetivo**: llevar el sistema de widgets existente al nivel de disciplina
especificado en `PDS.md` §4 / `WORKSPACE_SYSTEM.md`, y widgetizar los bloques que
salieron de Hoy en v2.0.

- **Funcionalidades**: clamp de viewport, snap a rejilla/bordes, reactivación de
  widgets sin pérdida de estado (Epic 4); Resumen del día, Próximos eventos, Kanban
  rápido y mini-calendario como widgets opcionales (Epic 3, ítems diferidos).
- **Cambios de UX**: el selector de widgets del dock pasa a ser el punto central de
  personalización del Workspace (`WORKSPACE_SYSTEM.md` §Personalización).
- **Cambios técnicos**: persistencia de layout de widgets por dispositivo, separada
  explícitamente de la sincronización de datos de trabajo.
- **Riesgos**: usuarios ya acostumbrados a los bloques fijos de Hoy pueden no descubrir
  que ahora son opcionales — mitigado activándolos por defecto la primera vez que se
  despliega esta versión, para que el cambio se sienta como reorganización, no pérdida.
- **Criterios de éxito**: ningún widget puede quedar fuera del área recuperable de
  pantalla; el estado de un widget (ej. Pomodoro corriendo) sobrevive a cerrar y
  reabrir el widget en el 100% de los casos verificados.

## v2.2 — Fusión de superficies y velocidad de captura

**Objetivo**: eliminar la redundancia de superficies detectada en `PDS.md` §1.6/§1.14
(Epic 7).

- **Funcionalidades**: Peek + TaskDetail unificados en una sola anatomía; caminos de
  creación de tarea reducidos de 5 a 2; fusión de Captura rápida y Nota rápida en un
  solo campo que decide el tipo de contenido.
- **Cambios de UX**: una tarea muestra siempre los mismos campos sin importar cómo se
  la abrió (Principio 6 de `PRODUCT_PRINCIPLES.md`, "razón de existir" verificable en
  la práctica).
- **Cambios técnicos**: consolidación de los props/flags que hoy diferencian Peek de
  TaskDetail en la app real hacia una sola configuración de anatomía.
- **Riesgos**: usuarios que memorizaron flujos específicos de cada superficie deben
  reaprender un flujo unificado — mitigado porque el flujo unificado es un
  superconjunto de ambos, nunca elimina una capacidad que alguno de los dos tenía.
- **Criterios de éxito**: cero diferencias de campos visibles entre las superficies que
  antes eran Peek y TaskDetail; tiempo medio de creación de una tarea simple reducido.

## v2.3 — Accesibilidad transversal y responsive completo

**Objetivo**: cerrar el Epic 10 (accesibilidad) y verificar los tres breakpoints de
`PDS.md` §5.5 contra cada superficie ya migrada en v2.0-v2.2.

- **Funcionalidades**: alternativa de teclado para drag-and-drop Kanban; foco visible en
  todo interactivo incluidos widgets; auditoría de contraste sobre superficies
  `.glass`.
- **Cambios de UX**: ningún flujo crítico (crear, completar, mover, buscar) depende
  exclusivamente de un gesto de mouse tras esta versión.
- **Cambios técnicos**: verificación de que el sistema de widgets (exclusivo de
  desktop, `PDS.md` §5.5) se degrada correctamente a tarjetas apilables en mobile sin
  ningún estado roto.
- **Riesgos**: la superficie de prueba (todas las combinaciones de plataforma ×
  funcionalidad nueva desde v2.0) es amplia — mitigado con la regla ya vigente de que
  ninguna función nueva se aprueba sin su variante de cada breakpoint especificada
  desde el diseño (Artículo 10 de `PRODUCT_CONSTITUTION.md`).
- **Criterios de éxito**: cumplimiento WCAG AA verificado en ambos temas; cero
  funciones críticas sin alternativa de teclado.

## v3.0 — Extensión del modelo: Espacios como contexto real, Perspectivas, Archivos

**Objetivo**: primera versión donde el Espacio deja de ser una sección más del sidebar y
pasa a filtrar transversalmente toda la navegación (`WORKSPACE_SYSTEM.md`), y donde el
modelo de Entidad se extiende a un tipo de contenido nuevo (Archivos) validando que el
patrón de `DATA_PHILOSOPHY.md` escala sin fricción.

- **Funcionalidades**: selector de Espacio activo que refiltra Hoy/Inbox/Proyectos/Notas
  automáticamente (Epic 2, completando lo diferido de v2.0); sistema de Perspectivas
  evolucionado desde los filtros guardados actuales (Epic 8); Entidad "Archivo" con la
  base común de toda Entidad (Epic 9).
- **Cambios de UX**: cambiar de Espacio se siente como cambiar de Workspace completo,
  no como aplicar un filtro más.
- **Cambios técnicos**: primera extensión real del modelo de Entidad más allá de los
  cuatro tipos originales — valida que `PRODUCT_CONSTITUTION.md` Artículo 4 (heredar la
  base de Entidad) es sostenible para tipos de contenido no previstos originalmente.
- **Riesgos**: es el cambio de mayor alcance conceptual del roadmap — el Espacio pasa
  de ser decorativo a ser estructural. Mitigado con una migración que asigna todo a un
  Espacio "General" implícito, sin obligar a reclasificar nada retroactivamente
  (coherente con el Artículo 12, "captura sin clasificación previa", aplicado también a
  la migración misma).
- **Criterios de éxito**: cambiar de Espacio activo refiltra las cuatro vistas
  primarias sin ningún dato "fugado" de un Espacio a otro; una Entidad "Archivo" pasa
  por soft-delete y papelera igual que cualquier otra Entidad, sin código especial.

## v4.0 — Personal Operating System

**Objetivo**: el horizonte a 5 años de `PRODUCT_VISION.md` hecho versión concreta —
Metas como agrupador de largo plazo sobre Proyectos, colaboración puntual madura
(compartir un proyecto o Espacio sin convertir el producto en herramienta de equipo), y
el sistema de widgets/Workspace como diferenciador plenamente maduro y personalizable
dentro de los límites que `WORKSPACE_SYSTEM.md` §Personalización define como
no-negociables.

- **Funcionalidades**: Entidad "Meta" con progreso agregado sobre Proyectos vinculados;
  colaboración puntual (compartir, mencionar, comentar) sin fricción de configuración
  de permisos compleja; widgets acoplables como paneles persistentes por Espacio.
- **Cambios de UX**: la promesa de "un solo lugar" se extiende de "toda mi vida
  individual" a "toda mi vida individual, con las personas puntuales con las que
  colaboro", sin nunca convertirse en una herramienta de equipos grandes
  (`PRODUCT_VISION.md` §"Qué NO pretende ser").
- **Cambios técnicos**: el modelo de sincronización multi-dispositivo existente se
  extiende a colaboración multi-usuario acotada — reusando la infraestructura de
  Espacio-sincronización ya presente en el código real (distinta del Espacio-workspace,
  ver `NAVIGATION_SYSTEM.md` §2), no reemplazándola.
- **Riesgos**: el riesgo central de esta versión es de identidad, no técnico — la
  tentación de agregar funciones de gestión de equipo (roles, permisos granulares) que
  contradirían la tesis de producto. Mitigado por el Artículo 1 de
  `PRODUCT_CONSTITUTION.md` como filtro de entrada obligatorio para cada función
  propuesta en esta versión.
- **Criterios de éxito**: un usuario puede administrar 5+ años de datos personales sin
  haber necesitado migrar a otra herramienta para ninguna de las categorías de
  `PRODUCT_VISION.md` (trabajo, universidad, personal, compras, ideas, proyectos,
  metas, archivos, calendario, notas, pendientes, kanban).

---

## Nota sobre el orden de este roadmap

Ninguna versión posterior se adelanta antes de que la anterior cierre sus criterios de
éxito — en particular, v3.0 y v4.0 (extensión del modelo de datos) dependen de que
v2.0-v2.3 hayan estabilizado los fundamentos de layout, overlays y sistema visual. Un
error común que este roadmap previene deliberadamente: construir funciones nuevas
(Metas, Archivos, colaboración) sobre una base con las fallas estructurales que `PDS.md`
§1 documentó — eso solo multiplicaría el costo de corregirlas después.
