# Workspace System — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> Este documento diseña el concepto completo de **Workspace** como diferenciador de
> producto. La especificación técnica de widgets/layout vive en [`PDS.md`](./PDS.md)
> §4-5; acá se define el concepto que las sostiene y por qué es una ventaja competitiva.

## Qué es un Workspace en este producto

Un Workspace no es una pantalla — es la combinación de tres cosas que un usuario
construye a lo largo del tiempo sin darse cuenta de estar "configurando" nada:

1. **Su Espacio activo** (de qué área de su vida está hablando ahora, ver
   `NAVIGATION_SYSTEM.md`).
2. **Su Layout de widgets** (qué información quiere siempre a la vista, y dónde).
3. **Sus Perspectivas guardadas** (qué recortes de información ya definió como
   relevantes).

Ningún competidor de referencia (`PRODUCT_VISION.md`) combina estos tres ejes en un solo
concepto coherente — Notion tiene páginas infinitamente configurables pero sin este
sistema de widgets flotantes; TickTick tiene widgets pero sin el concepto de Espacio
como filtro transversal; Linear no tiene ninguno de los dos, por diseño (no es su
público). Esta combinación es uno de los diferenciadores centrales del producto.

## Workspaces

Cada usuario tiene, conceptualmente, tantos Workspaces como Espacios — cambiar de
Espacio activo (`NAVIGATION_SYSTEM.md` §2) es, en la práctica, cambiar de Workspace: el
Layout de widgets, aunque técnicamente persiste por dispositivo (no por Espacio, ver
§Persistencia abajo), la *información* que esos widgets muestran se refiltra
automáticamente al contexto del Espacio activo. Un widget "Próxima tarea" en el Espacio
Trabajo muestra la próxima tarea de Trabajo; el mismo widget, mismo lugar en pantalla,
al cambiar a Personal, muestra la próxima tarea de Personal — sin que el usuario tenga
que reconfigurar nada.

## Layouts

Un Layout es la disposición espacial de los widgets activos en un momento dado
(posición, tamaño, estado colapsado — especificación completa en `PDS.md` §4.4-4.6).
Filosofía de diseño del Layout: **se construye por uso, no por configuración previa**.
El usuario no entra a un panel de "personalizar mi workspace" y arma un dashboard desde
cero — activa un widget cuando lo necesita (desde el selector del dock), lo posiciona
donde le resulte natural, y el sistema recuerda esa elección. La personalización es
un subproducto del uso, no un paso previo obligatorio (coherente con el Principio 14 de
`PRODUCT_PRINCIPLES.md` sobre no exigir configuración antes de poder usar algo).

## Widgets

Especificación técnica completa en `PDS.md` §4. Desde el ángulo conceptual de este
documento: un widget es una **ventana a un dato que ya existe en alguna Vista o Panel
completo** (Principio 17 de `PRODUCT_PRINCIPLES.md`) — nunca un tipo de contenido
exclusivo del sistema de widgets. Esto tiene una consecuencia de diseño importante: se
puede diseñar un widget nuevo simplemente identificando qué Vista o Perspectiva ya
existente merece una versión compacta y siempre visible — nunca al revés (diseñar un
widget primero y después buscarle un dato que mostrar).

## Paneles

Distintos de los widgets (flotantes, opcionales, de contenido resumido), los Paneles son
superficies ancladas de contenido completo — el Panel de detalles de una tarea, el Panel
derecho de una lista (`PDS.md` §5, secciones 8-9). Un Panel puede, mediante
acoplamiento (`PDS.md` §4.7), transformarse a partir de un widget que el usuario arrastra
hasta un borde — la frontera entre "widget" y "panel acoplado" es fluida por diseño: el
mismo contenido, dos formas de anclaje, elegidas por el usuario.

## Contextos

Un Contexto es la combinación activa en un momento dado de: Espacio + Vista/Perspectiva
+ Entidad abierta (si hay alguna). El sistema garantiza que cambiar cualquiera de estos
tres ejes nunca pierde información del usuario en curso — desarrollado en
`INTERACTION_PHILOSOPHY.md` §"Mantener siempre el contexto del usuario". El Contexto es
lo que se restaura al reabrir la app tras cerrarla o cambiar de dispositivo (ver Flujo
9.11 en `PDS.md`).

## Personalización

Lo personalizable en este sistema, deliberadamente acotado (para no reintroducir la
complejidad que `PRODUCT_VISION.md` descarta explícitamente):
- Qué widgets están activos, y su posición/tamaño.
- Qué Perspectivas existen y sus criterios.
- El tema (claro/oscuro) y el color de acento (dentro de la paleta permitida, ver
  `DESIGN_LANGUAGE.md` — nunca colores arbitrarios que rompan la filosofía de color).
- Las columnas de un tablero Kanban por Espacio/Proyecto.

Lo que **no** es personalizable, deliberadamente: la estructura de navegación primaria,
la tipografía, el sistema de espaciado, el comportamiento de los overlays. Esas son
decisiones de identidad de producto (`PRODUCT_CONSTITUTION.md`), no preferencias de
usuario — un producto que permite personalizar todo termina sin identidad propia.

## Persistencia

Regla central: **el Layout de widgets es una preferencia de dispositivo, no un dato de
trabajo** — no se sincroniza entre dispositivos (mismo razonamiento ya aplicado en la
app real a `pn_widgets`). Un usuario puede querer un Pomodoro visible en su laptop de
trabajo y no en su teléfono, sin que eso implique ningún conflicto de sincronización.

En cambio, **las Perspectivas guardadas y los Espacios sí son datos de trabajo** — se
sincronizan como cualquier otra Entidad (`DATA_PHILOSOPHY.md`), porque representan
decisiones sobre la organización de la información del usuario, no sobre cómo se ve una
pantalla en particular.

## Cambio de contexto

Cambiar de Espacio, de Vista o de dispositivo nunca destruye estado en curso:
- Un widget con estado activo (timer corriendo) sigue corriendo en el modelo de datos
  aunque el widget esté cerrado o el Espacio haya cambiado — al volver a verlo, muestra
  el estado real, no reinicia (`PDS.md` §4.5).
- Un formulario de edición sin guardar pide confirmación antes de perderse si el cambio
  de contexto lo forzaría a cerrarse (regla derivada de la exclusividad de overlays,
  `INTERACTION_PHILOSOPHY.md`).
- El scroll y la selección de una lista se recuerdan al volver a ella tras navegar a
  otro lado (mismo Contexto restaurado, ver §Contextos arriba).

## Por qué esto es un diferenciador, no solo una función

La combinación de Espacios como filtro transversal + widgets opcionales con
posicionamiento libre pero disciplinado (clamp de viewport, snap, acoplamiento — nunca
el caos sin límites de la captura criticada en `PDS.md` §1) + persistencia por
dispositivo separada de la sincronización de datos de trabajo, es un sistema que ningún
competidor de referencia ofrece completo. Notion se acerca en flexibilidad pero exige
configuración manual de cada página; TickTick se acerca en widgets pero sin la capa de
Espacio ni la disciplina de layout. Este sistema es, junto con el modelo de Entidad
unificado de `DATA_PHILOSOPHY.md`, la base técnica y conceptual de la promesa de
`PRODUCT_VISION.md`: un solo lugar, propio, que se adapta a cómo cada persona realmente
organiza su vida sin pedirle que aprenda a configurarlo primero.
