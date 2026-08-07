# Data Philosophy — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> Este documento define el modelo conceptual del producto — la razón por la que "todo es
> una Entidad" no es una decisión técnica aislada, sino la base de la que dependen
> `PRODUCT_VISION.md`, `NAVIGATION_SYSTEM.md` y `WORKSPACE_SYSTEM.md`.

## La idea central

Una tarea, una nota, un evento y un proyecto **no son cuatro modelos de datos
distintos que la interfaz hace parecer relacionados**. Son cuatro *representaciones*
distintas del mismo concepto base: una **Entidad** con una identidad, un momento de
creación, un contenido, y opcionalmente un lugar en el tiempo y en el espacio de
organización del usuario.

Esta distinción no es filosofía abstracta — tiene una consecuencia técnica y de
producto directa: **Kanban, Calendario, Hoy y Notas pueden reusar exactamente los mismos
datos sin sincronizarlos entre sí**, porque no hay copias, hay una sola fuente vista
desde ángulos distintos. Es la implementación directa del Principio 1 de
`PRODUCT_PRINCIPLES.md` ("una sola fuente de verdad").

## Entidades

Toda Entidad comparte una base común:

| Campo base | Qué significa |
|---|---|
| `id` | Identidad única, estable durante toda la vida de la Entidad |
| `creado` | Momento de nacimiento — nunca cambia |
| `modificado` | Última edición — usado para resolver conflictos de sincronización entre dispositivos |
| `etiquetas` | Categorización libre, compartida entre tipos de Entidad |
| `comentarios` | Conversación asociada, compartida entre tipos de Entidad |
| `borrado` | Soft-delete — nada se elimina físicamente sin pasar antes por la Papelera |

Sobre esa base, cada tipo de Entidad agrega los campos propios de su representación:

- **Pendiente** (tarea): agrega `estado`, `prioridad`, `fechaLimite`, `subtareas`,
  `repetir`, `proyectoId`.
- **Nota**: agrega `contenido`, `carpeta`.
- **Evento**: agrega `fecha`, `hora`, `duracionMin`.
- **Proyecto**: es un contenedor de Entidades — agrupa Pendientes por `proyectoId`, y a
  su vez puede pertenecer a un **Espacio**.
- **Archivo** (extensión futura, ver `ROADMAP.md`): sigue el mismo patrón — hereda la
  base de Entidad y agrega los campos propios de un adjunto (tamaño, tipo, ubicación).

Ninguna Entidad nueva se diseña sin heredar esta base — es el Artículo 4 de
`PRODUCT_CONSTITUTION.md`.

## Relaciones

Las relaciones entre Entidades son siempre por **referencia**, nunca por copia:

```
Espacio  1 ──── N  Proyecto
Proyecto 1 ──── N  Pendiente
Pendiente N ──── N  Etiqueta   (por nombre normalizado)
Pendiente 1 ──── N  Subtarea   (anidamiento recursivo)
Pendiente 1 ──── N  Comentario
Nota     N ──── 1  Pendiente  (origen: una tarea puede haber nacido de una nota)
```

Regla dura, formalizada en `PRODUCT_CONSTITUTION.md` Artículo 4: cuando una Entidad
necesita mostrar el nombre de otra a la que referencia (ej. una tarea mostrando el
nombre de su proyecto), ese nombre se **resuelve en el momento de mostrarlo**, buscando
por la referencia — nunca se guarda una copia del nombre "para no tener que buscarlo".
La única excepción tolerada es un campo-espejo explícitamente documentado para
compatibilidad de exportación, con un mecanismo activo de reconciliación (ver
`DECISIONS_LOG.md`, Fase 13, para el caso donde esta excepción se manejó mal y se
corrigió).

## Representaciones

La misma Entidad **Pendiente** se representa de formas distintas según el contexto,
pero siempre son la misma Entidad subyacente:

| Representación | Dónde vive | Qué añade a la lectura base |
|---|---|---|
| Fila de lista | Hoy, Inbox, Pendientes | Vista compacta, escaneable |
| Tarjeta Kanban | Proyectos, Kanban rápido | Vista de estado/columna |
| Bloque de calendario | Calendario | Vista temporal, con duración |
| Panel de detalles | Al abrir cualquier tarea | Vista completa, editable |
| Línea dentro de una Nota | Notas | Vista embebida — la tarea "vive también" en el contexto donde se la mencionó |

Ninguna de estas representaciones tiene su propio estado independiente — todas leen y
escriben sobre la misma Entidad. Marcar una tarea completada desde su tarjeta Kanban la
marca completada en su fila de lista, sin ninguna sincronización explícita necesaria,
porque no hay dos estados que sincronizar.

## Vistas

Una **Vista** es una composición de Entidades filtradas/agrupadas con un propósito.
Distinta de una representación (que es *cómo* se ve una Entidad individual), una Vista
es *cuáles* Entidades se muestran juntas y en qué orden. El sistema de Vistas —
incluidas las Perspectivas o Smart Views definidas por el usuario— se especifica en
`NAVIGATION_SYSTEM.md`. Acá lo relevante conceptualmente: una Vista nunca almacena datos
propios, solo un criterio de filtro/orden sobre las Entidades existentes. Esto es lo que
permite crear una Vista nueva (una Perspectiva) sin ningún riesgo de que sus datos se
desincronicen del resto de la app — no tiene datos propios que desincronizar.

## Reglas del modelo

1. **Toda Entidad tiene un dueño de dato claro** — nunca dos campos en dos Entidades
   distintas pretenden ser la fuente de verdad de lo mismo.
2. **Las relaciones se navegan en ambas direcciones sin duplicar datos** — un Proyecto
   no mantiene una lista de IDs de sus Pendientes; se calcula filtrando Pendientes por
   `proyectoId` en el momento de consultar.
3. **El soft-delete es universal** — ninguna Entidad se borra físicamente sin pasar por
   un estado `borrado: true` recuperable (Artículo 7 de `PRODUCT_CONSTITUTION.md`).
4. **La sincronización resuelve conflictos por Entidad completa, no por campo** — cuando
   dos dispositivos editan la misma Entidad, gana la versión con `modificado` más
   reciente como unidad completa (con listas como comentarios/subtareas unidas, no
   sobrescritas) — nunca una mezcla campo por campo que podría dejar el registro en un
   estado que ningún dispositivo produjo realmente.
5. **Ninguna vista almacena una copia filtrada de datos** — toda Vista es un cálculo
   sobre las Entidades reales en el momento de mostrarse, nunca una tabla paralela.

## Por qué esto importa más de lo que parece

El error de modelo de datos más caro que un competidor comete (y que este producto ya
sufrió una vez, ver `DECISIONS_LOG.md` Fase 13) no es técnico en el sentido de
"performance" — es de **confianza**. Cuando un usuario ve la misma tarea mostrada de dos
formas distintas en dos pantallas distintas, y esas dos formas alguna vez no coinciden,
deja de confiar en ambas, y ese es el momento en que abandona la herramienta. El modelo
de "todo es una Entidad" no es una elegancia arquitectónica — es la garantía estructural
de que eso nunca puede pasar, porque no existen dos copias que puedan divergir.
