# Navigation System — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> Especificación conceptual de la arquitectura de navegación. La implementación visual
> exacta (dimensiones, tokens) vive en [`PDS.md`](./PDS.md) §5; este documento explica
> el **por qué** de cada nivel y cómo se relacionan entre sí.

## Los cuatro niveles de navegación

Pendientes Pro tiene exactamente cuatro niveles de navegación, y ningún nuevo tipo de
navegación se agrega sin encajar en uno de ellos (previene la proliferación de "un quinto
sistema de navegación" que produjo el sidebar sobrecargado de `PDS.md` §1.10):

1. **Navegación primaria** (sidebar/nav inferior) — a qué tipo de contenido voy.
2. **Contexto de Espacio** — de qué área de mi vida estoy hablando.
3. **Perspectivas (Smart Views)** — qué subconjunto filtrado quiero ver dentro de un
   tipo de contenido.
4. **Navegación de detalle** (paneles, breadcrumbs) — dónde estoy dentro de una Entidad
   específica.

## 1. Navegación primaria

Máximo 5-7 destinos, sin excepción (Artículo 9 de `PRODUCT_CONSTITUTION.md`):

**Hoy · Inbox · Proyectos · Notas · Espacios**

Criterio de qué pertenece acá: **frecuencia de uso esperada, no importancia
percibida**. Panel (Dashboard) y Papelera se usan con frecuencia baja/ocasional — viven
en navegación secundaria (agrupadas bajo "Sistema", ver `PDS.md` §5.3), no porque sean
menos importantes, sino porque su presencia permanente en el nivel primario cuesta más
en carga cognitiva de lo que aporta en acceso rápido.

**Regla de nombrado**: el nombre de un destino de navegación primaria es idéntico en
todas las plataformas (Principio 18 de `PRODUCT_PRINCIPLES.md`) — nunca "Pendientes" en
escritorio y "Tareas" en móvil, el error ya documentado en `PDS.md` §1.3.

## 2. Contexto de Espacio

Un **Espacio** (Trabajo, Universidad, Personal, Finanzas, Ideas...) es un filtro de
contexto que se aplica *sobre* la navegación primaria, no un destino más al mismo nivel.
Elegir un Espacio activo filtra automáticamente Hoy, Inbox, Proyectos y Notas por ese
contexto — desarrollado en profundidad en `WORKSPACE_SYSTEM.md`.

Distinción importante que debe mantenerse siempre clara en cualquier documentación o
implementación futura: este "Espacio" (capa de workspace, nueva sobre `Proyecto`) es
un concepto **completamente distinto** del "Espacio" preexistente en el código de
sincronización (`sync.tsx`/`espacio.ts`), que significa cuenta compartida
multi-usuario. Ambos coexisten en el código base real por razones históricas — este
documento y todos los que lo acompañan usan siempre "Espacio" para el concepto de
workspace-UI, y "Cuenta compartida" o "Espacio de sincronización" cuando haga falta
referirse al otro. Ver la entrada correspondiente en `DECISIONS_LOG.md`.

Un Espacio nunca tiene un modelo de datos propio más allá de `id/nombre/icono/color` —
es una etiqueta de agrupación sobre Proyectos existentes (ver `DATA_PHILOSOPHY.md`
§Relaciones), nunca un contenedor que duplica los datos que agrupa.

## 3. Perspectivas (Smart Views)

Una **Perspectiva** es un criterio de filtro/orden guardado con un nombre, aplicable
dentro de una vista de lista (equivalente evolucionado de los "Filtros guardados" ya
presentes en la app real). A diferencia de un Espacio (que es un contexto amplio que
afecta a toda la navegación), una Perspectiva es local a una vista específica: "Alta
prioridad sin fecha", "Vencidas de Trabajo", "Asignadas a mí esta semana".

**Regla de diseño**: una Perspectiva nunca introduce una pantalla nueva — es siempre un
estado aplicado sobre una vista existente (Artículo 3 de `PRODUCT_CONSTITUTION.md`, "no
crear pantallas duplicadas"). El usuario puede tener quince Perspectivas guardadas sin
que la navegación primaria crezca ni un ítem.

**Acceso**: las Perspectivas guardadas se acceden desde dentro de la vista a la que
aplican (chip/dropdown de filtros) y, opcionalmente, con un atajo de teclado dedicado
(`Ctrl+Shift+1-4`, patrón ya presente en la app real) — nunca desde el sidebar de
navegación primaria.

## 4. Navegación de detalle: paneles y breadcrumbs

Al entrar al detalle de una Entidad específica (una tarea, un proyecto, una nota), la
navegación se vuelve local a esa Entidad:

- **Panel**: la superficie que muestra el detalle (ver `PDS.md` §5, Panel derecho/Panel
  de detalles) — nunca reemplaza la navegación primaria, convive con ella (Principio 7
  de `PRODUCT_PRINCIPLES.md`, "paneles antes que modales").
- **Breadcrumb**: cuando el detalle tiene una jerarquía real (una subtarea dentro de una
  tarea dentro de un proyecto), el breadcrumb comunica esa cadena — nunca más de 3
  niveles visibles a la vez; una jerarquía más profunda colapsa los niveles intermedios
  en un menú "…".

## Widgets y accesos rápidos: navegación opcional, nunca obligatoria

Los widgets flotantes (`PDS.md` §4, `WORKSPACE_SYSTEM.md`) y los accesos rápidos (dock,
atajos de teclado) son **atajos hacia** los cuatro niveles descritos arriba — nunca un
quinto sistema de navegación paralelo. Un widget de "Kanban rápido" no tiene su propia
lógica de navegación; simplemente muestra, en una superficie más pequeña, el mismo
tablero al que se llega por Proyectos → [proyecto] → Tablero. Esta regla es la
aplicación directa del Principio 17 de `PRODUCT_PRINCIPLES.md` ("el sistema de widgets
es siempre opcional, nunca la única vía").

## Mapa de decisión: ¿dónde vive una función de navegación nueva?

```
¿Es un tipo de contenido que el usuario visita cada sesión?
  Sí → navegación primaria (si hay espacio dentro del límite de 5-7; si no,
       reemplaza a algo que se degrada a secundaria)
  No → ¿es un contexto amplio que filtra varios tipos de contenido a la vez?
         Sí → Espacio
         No → ¿es un criterio de filtro específico de una sola vista?
                Sí → Perspectiva
                No → ¿es el detalle de una Entidad puntual?
                       Sí → Panel + breadcrumb
                       No → probablemente no es navegación — revisar si es una
                            acción (ver INTERACTION_PHILOSOPHY.md) en vez de un
                            destino
```

## Búsqueda como atajo transversal a los cuatro niveles

La paleta de comandos (`Ctrl+K`) no es un nivel de navegación adicional — es un acceso
directo *a través* de los cuatro niveles existentes: puede llevar a un destino primario,
cambiar el Espacio activo, aplicar una Perspectiva, o abrir el detalle de una Entidad
específica, todo desde una sola superficie. Sigue la regla de exclusividad de overlays
de `INTERACTION_PHILOSOPHY.md` — nunca convive con otro overlay abierto.
