# Product Backlog — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> Backlog estructurado en Epic → Feature → Story → Task. Cada Epic implementa una
> sección de [`PDS.md`](./PDS.md) o corrige un hallazgo de su crítica (§1). El detalle
> de fases/versiones vive en [`ROADMAP.md`](./ROADMAP.md); este documento es el
> inventario de trabajo, no la línea de tiempo.

## Cómo leer este backlog

- **Impacto**: Alto/Medio/Bajo — cuánto mueve la aguja respecto a `PRODUCT_VISION.md`.
- **Esfuerzo**: XS/S/M/L/XL — costo de implementación relativo, no estimación en horas.
- **Prioridad**: P0 (bloqueante, corrige una falla activa) / P1 (siguiente) / P2 (después)
  / P3 (backlog de largo plazo).
- **Estado**: `Propuesto` · `Listo para diseño` · `Listo para implementar` · `En curso` ·
  `Hecho` · `Descartado` (con motivo, enlazado a `DECISIONS_LOG.md`).
- **Dependencias**: qué otro ítem debe estar `Hecho` antes de empezar este.

---

## EPIC 1 — Regla de exclusividad de overlays

*Implementa: `PDS.md` §5.4, `PRODUCT_CONSTITUTION.md` Artículo 8. Impacto: Alto (corrige
la falla más grave detectada en la crítica de producto). Esfuerzo: M. Prioridad: **P0**.*

| Feature | Story | Impacto | Esfuerzo | Prioridad | Estado | Dependencias |
|---|---|---|---|---|---|---|
| Registro único de overlay activo | Como sistema, solo un overlay exclusivo puede estar activo a la vez | Alto | S | P0 | Listo para implementar | — |
| Scrim automático | Como usuario, al abrir un overlay veo el resto de la pantalla atenuado | Alto | XS | P0 | Listo para implementar | Registro único de overlay |
| Atenuación de widgets bajo overlay | Como usuario, mis widgets flotantes se atenúan (no se ocultan) mientras hay un overlay activo | Medio | S | P0 | Listo para implementar | Registro único de overlay |
| Confirmación antes de descartar edición en curso | Como usuario, si tengo cambios sin guardar y otro overlay intenta abrirse, se me pregunta antes de perderlos | Alto | S | P0 | Listo para implementar | Registro único de overlay |

## EPIC 2 — Reestructuración del sidebar y navegación primaria

*Implementa: `PDS.md` §5.3, `NAVIGATION_SYSTEM.md`. Impacto: Alto. Esfuerzo: M.
Prioridad: **P0**.*

| Feature | Story | Impacto | Esfuerzo | Prioridad | Estado | Dependencias |
|---|---|---|---|---|---|---|
| Navegación primaria de 5 ítems | Como usuario, veo solo Hoy/Inbox/Proyectos/Notas/Espacios como destinos de primer nivel | Alto | S | P0 | Listo para implementar | — |
| Selector de Espacio activo | Como usuario, elijo mi Espacio activo desde un selector colapsable, no una lista fija | Alto | M | P0 | Listo para implementar | Navegación primaria de 5 ítems |
| Agrupación "Sistema" | Como usuario, Ajustes/Datos/Ayuda viven detrás de un solo punto de entrada | Medio | S | P1 | Listo para implementar | — |
| Panel/Dashboard y Papelera a navegación secundaria | Como usuario, accedo a consulta ocasional sin que ocupe espacio permanente en el sidebar | Medio | S | P1 | Listo para implementar | Agrupación "Sistema" |
| Nombrado consistente entre plataformas | Como usuario, veo el mismo nombre de vista en escritorio y móvil | Medio | XS | P1 | Listo para implementar | — |

## EPIC 3 — Reducción de "Hoy" a su núcleo

*Implementa: `PDS.md` §1.4/§2.11. Impacto: Alto (pantalla más usada del producto).
Esfuerzo: M. Prioridad: **P0**.*

| Feature | Story | Impacto | Esfuerzo | Prioridad | Estado | Dependencias |
|---|---|---|---|---|---|---|
| Eliminar duplicación timeline / "Para hoy" | Como usuario, una tarea con hora aparece una sola vez en Hoy | Alto | S | P0 | Listo para implementar | — |
| Widgetizar Resumen del día / Próximos eventos | Como usuario, decido si quiero esos bloques anclados o no | Alto | M | P1 | Listo para diseño | Epic 4 |
| Widgetizar Kanban rápido y mini-calendario | Como usuario, esos bloques dejan de ser fijos en Hoy | Medio | M | P1 | Listo para diseño | Epic 4 |
| Header de Hoy en una sola línea jerárquica | Como usuario, el saludo/fecha/hora se leen como un bloque, no cuatro | Medio | XS | P1 | Listo para implementar | — |

## EPIC 4 — Sistema de Widgets v2

*Implementa: `PDS.md` §4, `WORKSPACE_SYSTEM.md`. Impacto: Alto (diferenciador de
producto). Esfuerzo: L. Prioridad: **P1**.*

| Feature | Story | Impacto | Esfuerzo | Prioridad | Estado | Dependencias |
|---|---|---|---|---|---|---|
| Clamp de viewport | Como usuario, nunca pierdo un widget arrastrándolo fuera de pantalla | Alto | S | P1 | Listo para implementar | — |
| Snap a rejilla y a bordes | Como usuario, mis widgets se alinean solos al moverlos | Medio | M | P1 | Listo para implementar | — |
| Acoplamiento a bordes | Como usuario, puedo anclar un widget para que se comporte como panel fijo | Medio | M | P2 | Listo para diseño | Clamp de viewport |
| Selector de widgets con reactivación de estado | Como usuario, reabro un widget cerrado y su estado sigue donde lo dejé | Alto | S | P1 | Listo para implementar | — |
| Always-on-top (solo build de escritorio) | Como usuario de escritorio, fijo un widget por encima de otras ventanas | Bajo | L | P3 | Propuesto | Empaquetado de escritorio (fuera de alcance actual) |

## EPIC 5 — Reparación de integridad de datos (ya completado)

*Implementa: la corrección documentada en `DECISIONS_LOG.md`, Fase 13. Impacto: Alto.
Esfuerzo: M. Prioridad: **P0 — Hecho**.*

| Feature | Story | Impacto | Esfuerzo | Prioridad | Estado | Dependencias |
|---|---|---|---|---|---|---|
| Helper único de asignación de proyecto | Como sistema, `proyectoId` es la única fuente de verdad, `proyecto` (nombre) siempre derivado | Alto | S | P0 | **Hecho** | — |
| Migración de reparación de huérfanos | Como usuario con datos existentes, mis tareas ya desvinculadas se reparan automáticamente | Alto | S | P0 | **Hecho** | Helper único de asignación |
| `proyectoId` en detección de conflicto de sync | Como sistema, un conflicto de reasignación de proyecto entre dispositivos se detecta | Medio | XS | P0 | **Hecho** | — |

## EPIC 6 — Sistema tipográfico y de espaciado unificado

*Implementa: `PDS.md` §6.1/§6.3, `DESIGN_LANGUAGE.md`. Impacto: Alto (base de todo lo
visual). Esfuerzo: L. Prioridad: **P0**.*

| Feature | Story | Impacto | Esfuerzo | Prioridad | Estado | Dependencias |
|---|---|---|---|---|---|---|
| Auditoría y reemplazo de tamaños fuera de escala | Como sistema, ningún texto usa un tamaño fuera de Display/Cuerpo/Metadato | Alto | L | P0 | Listo para implementar | — |
| Rejilla de espaciado de 4px aplicada | Como sistema, todo padding/gap deriva de la escala de 8 valores | Alto | L | P0 | Listo para implementar | — |
| Separación de capas de color (marca/semántico/neutro/ambiental) | Como sistema, ningún color hace dos trabajos a la vez | Alto | M | P0 | Listo para implementar | — |

## EPIC 7 — Fusión de superficies redundantes

*Implementa: `PDS.md` §1.6/§2.8, Principio 6 de `PRODUCT_PRINCIPLES.md`. Impacto:
Medio. Esfuerzo: M. Prioridad: **P1**.*

| Feature | Story | Impacto | Esfuerzo | Prioridad | Estado | Dependencias |
|---|---|---|---|---|---|---|
| Unificar Peek + TaskDetail | Como usuario, veo los mismos campos de una tarea sin importar cómo la abrí | Medio | M | P1 | Listo para diseño | — |
| Reducir caminos de creación de tarea de 5 a 2 | Como usuario, tengo un atajo y un único punto visual de creación | Medio | S | P1 | Listo para implementar | — |
| Fusionar Captura rápida + Nota rápida | Como usuario, un solo campo decide el tipo de contenido | Medio | M | P2 | Propuesto | — |

## EPIC 8 — Sistema de Perspectivas (Smart Views evolucionadas)

*Implementa: `NAVIGATION_SYSTEM.md` §3. Impacto: Medio. Esfuerzo: M. Prioridad: **P2**.*

| Feature | Story | Impacto | Esfuerzo | Prioridad | Estado | Dependencias |
|---|---|---|---|---|---|---|
| Renombrar/consolidar "Filtros guardados" como Perspectivas | Como usuario, guardo un criterio de filtro con nombre y atajo | Medio | S | P2 | Propuesto | — |
| Perspectivas por Espacio | Como usuario, mis Perspectivas se filtran automáticamente por el Espacio activo | Medio | M | P2 | Propuesto | Selector de Espacio activo (Epic 2) |

## EPIC 9 — Extensión del modelo de Entidad: Archivos y Metas

*Implementa: `DATA_PHILOSOPHY.md` §Entidades, `ROADMAP.md` v3.0. Impacto: Alto (nueva
categoría de contenido). Esfuerzo: XL. Prioridad: **P2**.*

| Feature | Story | Impacto | Esfuerzo | Prioridad | Estado | Dependencias |
|---|---|---|---|---|---|---|
| Entidad "Archivo" con base común | Como usuario, adjunto y organizo archivos con las mismas etiquetas/comentarios que uso en tareas | Alto | L | P2 | Propuesto | — |
| Entidad "Meta" (objetivo de largo plazo) | Como usuario, agrupo proyectos bajo una meta con progreso agregado | Medio | L | P3 | Propuesto | Entidad "Archivo" (valida el patrón de extensión) |

## EPIC 10 — Accesibilidad transversal

*Implementa: `PDS.md` §10, `ENGINEERING_GUIDELINES.md` §Accesibilidad. Impacto: Alto
(no negociable). Esfuerzo: L. Prioridad: **P0, continuo**.*

| Feature | Story | Impacto | Esfuerzo | Prioridad | Estado | Dependencias |
|---|---|---|---|---|---|---|
| Alternativa de teclado para drag-and-drop Kanban | Como usuario sin mouse, muevo tarjetas con `Ctrl+flechas` | Alto | S | P0 | Listo para implementar | — |
| Foco visible en todo interactivo, incluidos widgets | Como usuario de teclado, veo siempre dónde está el foco | Alto | M | P0 | Listo para implementar | — |
| Auditoría de contraste sobre `.glass` | Como usuario con baja visión, todo texto sobre superficies de vidrio cumple AA | Alto | M | P0 | Propuesto | Epic 6 |

---

## Ítems descartados (registro, no se re-proponen sin nueva evidencia)

| Ítem | Motivo | Referencia |
|---|---|---|
| Asistente de IA que sugiere/prioriza automáticamente | Contradice Artículo 2 de `PRODUCT_CONSTITUTION.md` | `KNOWLEDGE_BASE.md` |
| FAB de escritorio conviviendo con el dock | Duplica la misma promesa dos veces (`PDS.md` §1.14) | `DECISIONS_LOG.md` |
| Sincronizar el Layout de widgets entre dispositivos | Es preferencia de dispositivo, no dato de trabajo (`WORKSPACE_SYSTEM.md` §Persistencia) | `DECISIONS_LOG.md` |
