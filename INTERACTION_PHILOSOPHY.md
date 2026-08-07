# Interaction Philosophy — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> Este documento define **cómo se comporta** el producto ante cualquier interacción,
> presente o futura. Las especificaciones técnicas exactas (duraciones, curvas,
> anatomía de componentes) viven en [`PDS.md`](./PDS.md) §4-9 — acá vive el razonamiento
> que cualquier interacción nueva debe respetar antes de diseñarse.

## La regla que gobierna todo lo demás: un solo overlay a la vez

Formalizada como Artículo 8 de `PRODUCT_CONSTITUTION.md` y como especificación técnica
en `PDS.md` §5.4. Es la corrección más importante que este sistema de documentación
existe para sostener en el tiempo: la falla que motivó todo este documento
(`PDS.md` §1.12) fue una captura mostrando ocho superficies interactivas abiertas a la
vez. Ninguna interacción nueva puede reintroducir ese estado, ni siquiera parcialmente
("solo por un momento", "solo en un caso raro") — la regla no admite grados.

## Paneles antes que modales

Un modal interrumpe: bloquea todo lo demás y exige una decisión antes de continuar. Un
panel acompaña: convive con el contexto que el usuario ya tenía. La filosofía de
interacción de este producto prefiere sistemáticamente el panel, porque la mayoría de
las acciones de un Personal Workspace (ver el detalle de una tarea, editar una nota, leer
un comentario) no son decisiones binarias urgentes — son continuaciones del trabajo que
ya se estaba haciendo.

**Cuándo sí corresponde un modal**: cuando la acción es genuinamente exclusiva y de
consecuencia inmediata — confirmar una eliminación irreversible, la paleta de comandos
(que por definición reemplaza momentáneamente el foco de toda la app), o un flujo de
autenticación. Fuera de esos casos, todo lo demás es panel.

## Mantener siempre el contexto del usuario

Ninguna interacción debería hacer que el usuario pierda de vista "dónde estaba". Esto se
traduce en reglas concretas:

- Abrir el detalle de una tarea desde una lista no navega a una pantalla nueva — abre un
  panel al costado, la lista sigue visible detrás.
- Cambiar de Espacio atenúa el contenido brevemente en vez de mostrar una pantalla de
  carga en blanco (microinteracción #33 en `PDS.md` §8) — el usuario nunca ve un vacío
  que le haga dudar si algo se rompió.
- Volver de un panel de detalle regresa exactamente al scroll y selección que había
  antes de abrirlo, nunca reinicia la vista.
- Un widget cerrado no pierde su estado (un Pomodoro corriendo sigue corriendo) — cerrar
  la ventana de una acción no interrumpe la acción misma.

## Reducir interrupciones

Una interrupción es cualquier cosa que exige la atención del usuario sin que él la haya
pedido. Este producto minimiza interrupciones activamente:

- No hay notificaciones push por defecto de "actividad" (comentarios, cambios de otros
  dispositivos) — se reflejan con un resalte discreto y transitorio en la fila afectada
  (microinteracción #87), nunca con un toast que exige ser descartado.
- Los errores de sincronización se comunican con un cambio de ícono silencioso (un
  triángulo de alerta, un solo parpadeo — microinteracción #88), no con un modal de
  error interrumpiendo el trabajo.
- Confirmaciones destructivas son la única interrupción deliberada y aceptada — porque
  prevenir la pérdida de datos vale más que la fluidez en ese caso específico (tensión
  ya resuelta en el Principio 5 de `PRODUCT_PRINCIPLES.md`).

## Priorizar la edición inline

Ya establecido como Principio 3 de `PRODUCT_PRINCIPLES.md`. Desde el ángulo de
interacción específicamente: un campo editable inline siempre se distingue visualmente
de uno de solo lectura *antes* de que el usuario intente tocarlo (borde sutil en hover,
cursor de texto al acercarse) — nunca depende de que el usuario descubra por accidente
que algo se puede editar.

## Feedback inmediato, siempre

Ninguna acción del usuario queda sin respuesta visual en menos de 150ms
(`duration-fast`, `PDS.md` §7.1) — ya sea el resultado final de la acción o, si esta
requiere una operación asíncrona (guardar en el servidor, sincronizar), un estado
intermedio que confirme "recibí tu acción" antes de que la operación completa termine.
El patrón de autoguardado con indicador discreto (microinteracción #69) es el ejemplo
de referencia: el usuario nunca se pregunta "¿esto se guardó?" porque siempre hay una
señal, aunque sea breve.

## Reversibilidad como valor de interacción

Formalizado como Artículo 7 de `PRODUCT_CONSTITUTION.md`. Desde la interacción: toda
acción de bajo costo (completar, archivar, mover) es instantánea y **deshacible** con un
solo gesto (toast con "Deshacer", ya implementado en la app real para archivar y
eliminar). Esto permite que las acciones frecuentes sean rápidas sin sacrificar
seguridad — el usuario no necesita pensar dos veces antes de actuar, porque revertir es
igual de rápido que actuar.

## Consistencia de gesto entre dominios distintos

Un mismo gesto significa lo mismo en toda la app, sin importar sobre qué tipo de dato
actúe. Ejemplos deliberados de reutilización (`PDS.md` §8): el "hueco fantasma" al
arrastrar (microinteracción #43) se usa igual en tarjetas Kanban y en listas dentro de
una nota (#71); el temblor lateral de "esto no se puede, y por qué" (#17) se usa igual
al intentar completar una tarea bloqueada y al intentar mover una tarjeta bloqueada
(#52). Esta reutilización deliberada es lo que permite que un usuario aprenda un gesto
una vez y lo aplique en cualquier contexto nuevo del producto.

## Accesibilidad como parte de la interacción, no un añadido posterior

Cada patrón de interacción descrito en este documento tiene, por definición, una vía sin
mouse y sin percepción de color exclusivamente (desarrollado en `PDS.md` §10) — mover
una tarjeta Kanban con `Ctrl+flechas`, foco visible en todo elemento interactivo. Un
patrón de interacción que solo funciona con mouse y con visión de color no está completo
según esta filosofía, sin importar qué tan pulido se vea.

## Cómo evaluar una interacción nueva

Antes de diseñar cualquier interacción nueva, se responde en orden:
1. ¿Respeta la regla de un solo overlay a la vez?
2. ¿Puede resolverse con un panel en vez de un modal?
3. ¿El usuario mantiene su contexto durante y después de la acción?
4. ¿Genera una interrupción, y si es así, está justificada por prevenir pérdida de
   datos?
5. ¿Da feedback en menos de 150ms?
6. ¿Es reversible, y si no, tiene una confirmación explícita?
7. ¿Reutiliza un gesto ya existente en vez de inventar uno nuevo para el mismo
   significado?
8. ¿Funciona sin mouse y sin depender solo del color?

Si la respuesta a cualquiera de estas es "no" sin una justificación registrada en
`DECISIONS_LOG.md`, la interacción no está lista para pasar de diseño a implementación.
