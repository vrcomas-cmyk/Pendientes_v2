# Product Constitution — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> A diferencia de [`PRODUCT_PRINCIPLES.md`](./PRODUCT_PRINCIPLES.md) (que se ponderan
> caso por caso), estas reglas son **absolutas**. Ninguna excepción se autoriza sin
> primero modificar este documento mismo, con una entrada correspondiente en
> [`DECISIONS_LOG.md`](./DECISIONS_LOG.md) explicando por qué la regla cambió.

## Cómo leer este documento

Cada artículo tiene: la regla, qué falla previene (con referencia a dónde se documentó
esa falla en el resto del sistema), y qué se hace en su lugar.

---

### Artículo 1 — No agregar funcionalidades por moda

**Regla**: ninguna función se incorpora porque "los competidores la tienen" o porque
"está de moda" (IA generativa, gamificación, redes sociales integradas). Se incorpora
solo si resuelve un problema descrito en `PRODUCT_VISION.md` que hoy no está resuelto.

**Previene**: la fragmentación de producto que `PRODUCT_VISION.md` identifica como el
error de TickTick — apilar funciones sin una tesis que las sostenga.

**En su lugar**: toda propuesta de función pasa primero por `PRODUCT_BACKLOG.md` como
Epic, con su justificación de impacto explícita antes de asignarse a un Roadmap.

---

### Artículo 2 — No incorporar IA si aumenta la complejidad percibida

**Regla**: cualquier función asistida por IA debe reducir clics/decisiones netos para el
usuario. Si una función de IA agrega un paso, una configuración, o una decisión nueva
("¿confío en esta sugerencia o no?"), no se incorpora en esa forma.

**Previene**: el patrón de "asistente que decide por el usuario" explícitamente
descartado en `PRODUCT_VISION.md` §"Qué NO pretende ser".

**En su lugar**: si una automatización tiene valor real (ej. sugerir fecha desde
lenguaje natural, ya implementado en el parser de captura), se implementa como una regla
determinística y explicable, no como una "sugerencia de IA" opaca.

---

### Artículo 3 — No crear pantallas duplicadas

**Regla**: ninguna vista nueva puede mostrar el mismo conjunto de datos, con el mismo
propósito, que una vista ya existente.

**Previene**: la duplicación de "Hoy" reexponiendo Inbox, Proyectos, Notas y Calendario
sin haber quitado nada de ellos — la falla central documentada en `PDS.md` §1.4.

**En su lugar**: si una vista existente ya cubre el caso, se extiende esa vista (o se le
agrega una Perspectiva, ver `NAVIGATION_SYSTEM.md`) en vez de crear una nueva.

---

### Artículo 4 — No crear modelos de datos paralelos

**Regla**: ningún tipo de contenido nuevo se modela sin heredar la estructura base de
Entidad definida en `DATA_PHILOSOPHY.md` (`id`, `creado`, `modificado`, `etiquetas`,
`comentarios` donde aplique).

**Previene**: exactamente el bug que motivó la Fase 13 (`DECISIONS_LOG.md`) — un dato
con dos representaciones (`proyecto` nombre vs. `proyectoId` referencia) que se
desincronizan entre sí.

**En su lugar**: un tipo de contenido nuevo se evalúa primero contra "¿puede ser una
Entidad existente con un campo adicional?" antes de proponerse como tipo nuevo.

---

### Artículo 5 — No romper la consistencia del sistema visual

**Regla**: ningún componente nuevo introduce un radio, tipografía, color o sombra fuera
de los tokens definidos en `PDS.md` §6 (Design System) y `DESIGN_LANGUAGE.md`.

**Previene**: los "nueve lenguajes de tarjeta" y "tres sistemas de ícono" documentados
en `PDS.md` §1.7/§1.11.

**En su lugar**: si un caso de uso genuinamente necesita un token nuevo, se agrega al
sistema central primero (con su justificación registrada en `DECISIONS_LOG.md`), y
recién entonces se usa — nunca se declara un valor puntual "solo para este componente".

---

### Artículo 6 — No introducir una acción principal nueva sin eliminar otra

**Regla**: si una pantalla ya tiene una acción primaria (CTA de acento) definida, no se
agrega una segunda acción primaria sin degradar la anterior a secundaria o eliminarla.

**Previene**: los "tres colores de botón primario en una sola pantalla" documentados en
`PDS.md` §1.18, y los "cinco caminos simultáneos para crear una tarea" de §1.14.

**En su lugar**: se aplica el Principio 12 de `PRODUCT_PRINCIPLES.md` — toda función
nueva se evalúa por su costo acumulado, no solo por su valor aislado.

---

### Artículo 7 — Ningún dato se pierde sin una vía de recuperación explícita

**Regla**: toda operación destructiva (eliminar, desvincular, archivar) tiene un
mecanismo de reversión — papelera con purga diferida, deshacer con ventana de tiempo, o
confirmación explícita — nunca un borrado inmediato sin aviso.

**Previene**: la clase de bug que dejaba pendientes huérfanos de su proyecto sin ningún
camino de vuelta, hasta la migración de reparación de la Fase 13.

**En su lugar**: toda función nueva que borre o desvincule datos se diseña junto con su
mecanismo de reversión, no como un añadido posterior.

---

### Artículo 8 — Un solo overlay modal activo a la vez, siempre

**Regla**: versión constitucional (absoluta, sin ponderación) del Principio 8 de
`PRODUCT_PRINCIPLES.md` y la regla de `PDS.md` §5.4. Ninguna implementación puede
mostrar dos overlays exclusivos simultáneamente, bajo ninguna circunstancia, en ninguna
plataforma.

**Previene**: el estado de interacción imposible documentado en la crítica de `PDS.md`
§1.12 (paleta de comandos + panel flotante + ocho widgets abiertos a la vez).

**En su lugar**: la implementación mantiene un registro único de "overlay activo" a
nivel de aplicación; abrir uno nuevo cierra o bloquea cualquier otro automáticamente.

---

### Artículo 9 — La navegación primaria no crece sin una remoción equivalente

**Regla**: el sidebar de navegación primaria se mantiene en un máximo de 5-7 destinos.
Agregar un octavo exige mover algo existente a navegación secundaria.

**Previene**: el sidebar de 17+ objetivos documentado en `PDS.md` §1.10, ya corregido
en la reestructuración de §5.3.

**En su lugar**: ver `NAVIGATION_SYSTEM.md` para el criterio de qué calza en
navegación primaria vs. secundaria (frecuencia de uso, no importancia percibida).

---

### Artículo 10 — Ninguna plataforma (mobile/tablet/desktop) se diseña como una ocurrencia tardía

**Regla**: ninguna función se aprueba para Roadmap sin especificar su comportamiento en
las tres clases de pantalla de `PDS.md` §5.5 en el momento del diseño, no después del
lanzamiento en desktop.

**Previene**: el patrón identificado en `PDS.md` §1.19 — un layout que "no es
responsive por construcción" porque su premisa (widgets libres superpuestos) es
incompatible con pantallas chicas desde el diseño mismo.

**En su lugar**: toda especificación de función en `PRODUCT_BACKLOG.md` incluye su
variante de cada breakpoint antes de pasar a "lista para implementar".

---

### Artículo 11 — El color semántico de estado nunca se reutiliza para otra cosa

**Regla**: rojo/ámbar/verde (vencido/en curso/completado, o alta/media/baja prioridad)
están reservados exclusivamente para esos significados en toda la aplicación.

**Previene**: la pérdida de significado del color documentada en `PDS.md` §1.8.

**En su lugar**: cualquier necesidad de color decorativo adicional usa la paleta
ambiental o de marca, nunca la semántica.

---

### Artículo 12 — Toda captura de contenido tiene una vía sin clasificación previa

**Regla**: versión constitucional del Principio 14. Ninguna función de creación de
contenido puede exigir seleccionar un proyecto, espacio o categoría como paso
obligatorio antes de guardar.

**Previene**: la fricción de clasificación forzada que `PRODUCT_VISION.md` identifica
como la razón principal de abandono de sistemas de productividad competidores.

**En su lugar**: Inbox (o su equivalente sin clasificar) es siempre un destino válido y
permanente, nunca un estado de "pendiente de arreglar".

---

### Artículo 13 — Ninguna migración de datos es silenciosa

**Regla**: toda migración automática de datos existentes (reparación de integridad,
cambio de esquema) informa al usuario qué se hizo y por qué, con un mensaje verificable
— nunca se ejecuta sin dejar rastro visible.

**Previene**: la posibilidad de que una reparación automática (como la migración de la
Fase 13) modifique datos del usuario sin que este pueda verificarlo.

**En su lugar**: toda migración emite una notificación con el conteo de elementos
afectados (ver el patrón ya implementado: "Se reparó la pertenencia a proyecto de N
pendiente(s)").

---

### Artículo 14 — Ninguna decisión de arquitectura de datos se toma sin registrar alternativas

**Regla**: un cambio al modelo de Entidad (`DATA_PHILOSOPHY.md`) no se implementa sin
una entrada en `DECISIONS_LOG.md` que documente qué alternativas se consideraron y por
qué se descartaron.

**Previene**: la pérdida de contexto histórico que hace que decisiones ya evaluadas y
rechazadas se vuelvan a proponer y re-evaluar desde cero años después.

**En su lugar**: antes de proponer un cambio de modelo, se consulta `DECISIONS_LOG.md`
para verificar si ya fue evaluado.

---

### Artículo 15 — La identidad visual no se diluye para parecerse a un competidor

**Regla**: ninguna decisión de diseño se justifica únicamente con "así lo hace
[Notion/Linear/Things]". Debe justificarse contra la tesis de identidad propia de
`PRODUCT_VISION.md` y `DESIGN_LANGUAGE.md`.

**Previene**: la erosión gradual de identidad que ocurre cuando cada decisión aislada
copia al competidor de moda del momento, hasta que el producto pierde su punto de vista.

**En su lugar**: se puede *aprender* de un competidor (ver la tabla comparativa de
`PRODUCT_VISION.md`), pero la implementación final debe explicarse en términos del
lenguaje propio del producto, no del ajeno.

---

## Enmiendas

Este documento solo se modifica mediante una entrada explícita en `DECISIONS_LOG.md`
que declare qué artículo cambia, por qué la regla original dejó de servir al producto, y
qué la reemplaza. Ninguna implementación puede violar un artículo vigente citando
"se va a corregir después" — la regla se cumple o se enmienda primero.
