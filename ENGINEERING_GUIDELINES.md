# Engineering Guidelines — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> Reglas de ingeniería de producto — el **cómo se construye** de forma consistente con
> todo lo anterior. Sin código: son criterios de decisión para cuando la implementación
> empiece, no una guía de sintaxis. Complementa (no reemplaza) las convenciones
> técnicas ya vigentes en el repositorio real (ver `CLAUDE.md` del proyecto).

## Principio rector

Toda regla de ingeniería de este documento existe para que el producto pueda crecer en
funcionalidad durante años (`PRODUCT_VISION.md`, horizonte a 10 años) sin que el costo
de mantenerlo crezca más rápido que su valor. Es la traducción técnica del Principio 12
de `PRODUCT_PRINCIPLES.md` ("ninguna funcionalidad nueva puede contradecir la
simplicidad ya lograda").

## Componentes reutilizables antes que nuevos

Ningún componente de interfaz se crea sin antes verificar si uno existente puede
extenderse para cubrir el caso nuevo. Esto no es una preferencia de estilo — es la
única forma de que el Artículo 5 de `PRODUCT_CONSTITUTION.md` ("no romper la
consistencia del sistema visual") sea sostenible en la práctica: un sistema donde cada
función agrega un componente nuevo desde cero termina, inevitablemente, con nueve
lenguajes de tarjeta distintos (el error ya documentado en `PDS.md` §1.11).

**Criterio de decisión**: antes de escribir un componente nuevo, se responde "¿esto es
genuinamente un componente nuevo, o es una variación de tamaño/contenido de uno que ya
existe?" — la mayoría de los casos son lo segundo.

## No duplicar lógica

Toda regla de negocio (cómo se calcula si una tarea está vencida, cómo se resuelve un
conflicto de sincronización, cómo se determina la próxima instancia de una tarea
recurrente) vive en un único lugar del código, consultado desde todas las
representaciones que la necesiten (ver `DATA_PHILOSOPHY.md` §Representaciones). Dos
implementaciones independientes de la misma regla son, con el tiempo, una garantía de
que eventualmente van a divergir — exactamente el mecanismo que produjo el bug de
integridad de proyecto documentado en `DECISIONS_LOG.md`.

## Feature Flags

Toda función nueva de alcance significativo (cualquier cosa que aparezca en
`PRODUCT_BACKLOG.md` como Feature o Epic) se implementa detrás de un flag activable,
que permite:
- Probar la función con un subconjunto de contexto antes de exponerla a todos.
- Revertir sin un despliegue de emergencia si algo no se comporta como se diseñó.
- Mantener el Artículo 6 de `PRODUCT_CONSTITUTION.md` ("ninguna acción principal nueva
  sin eliminar otra") verificable en producción antes de comprometerse permanentemente.

Los flags no son un mecanismo de "IA experimental" ni de configuración de usuario final
— son una herramienta de despliegue seguro, invisible para quien usa el producto.

## Modularidad y separación por dominios

El código se organiza por dominio de producto (Entidades, Sincronización, Navegación,
Widgets, Motion) antes que por tipo técnico de archivo. Un cambio en la lógica de
"cómo se calcula si algo está vencido" debería tocar un solo módulo de dominio, no
dispersarse entre la vista de Hoy, la de Proyectos y la de Calendario por separado —
consecuencia directa de que esas tres vistas leen la misma Entidad (`DATA_PHILOSOPHY.md`)
y por lo tanto deberían consultar la misma función, no reimplementarla cada una.

## Escalabilidad

Se diseña para el volumen de datos de **una persona a lo largo de años**, no para
volumen de equipo — cientos o pocos miles de Entidades por usuario, no millones. Esto
es una decisión deliberada de alcance (`PRODUCT_VISION.md` §"Qué NO pretende ser") que
simplifica genuinamente las decisiones de arquitectura: no hace falta paginación
agresiva ni infraestructura de escala horizontal para el caso de uso central del
producto. Donde el volumen sí puede crecer más allá de lo cómodo (historial de
actividad, adjuntos grandes), se diseña con purga/archivado automático desde el
principio, no como optimización tardía (patrón ya aplicado: purga automática de la
Papelera a los 30 días).

## Rendimiento

El estándar de rendimiento se define por la promesa de `PRODUCT_VISION.md` ("nunca te
va a costar más de un vistazo"): cualquier interacción frecuente (navegar, capturar,
completar, buscar) debe sentirse instantánea, coherente con los tiempos del Sistema de
Motion (`PDS.md` §7 — feedback en menos de 150ms). Rendimiento no es un ítem de
backlog separado — es un criterio de aceptación implícito de cualquier función nueva.

## Offline-first

El producto debe seguir siendo completamente usable sin conexión — capturar, editar,
completar, navegar — con sincronización que se resuelve cuando la conexión vuelve,
nunca bloqueando el trabajo mientras tanto. Esto es coherente con la promesa de que el
producto es "el lugar donde vive tu vida" (`PRODUCT_VISION.md`): un sistema operativo
personal no puede depender de la calidad de una conexión de red para funciones básicas.
La resolución de conflictos de sincronización sigue la regla de `DATA_PHILOSOPHY.md`
§Reglas punto 4 (por Entidad completa, con listas unidas, nunca sobrescritura ciega).

## Accesibilidad

No es una fase posterior de "pulido" — es un criterio de aceptación desde el diseño de
cada función, tal como se especifica en `PDS.md` §10 e `INTERACTION_PHILOSOPHY.md`
§"Cómo evaluar una interacción nueva" (pregunta 8: "¿funciona sin mouse y sin depender
solo del color?"). Ninguna función se considera terminada si no responde afirmativamente
a esa pregunta.

## Observabilidad

El sistema debe poder responder, sin adivinar: ¿qué migraciones de datos corrieron y
cuándo? ¿qué decisiones de reparación automática se ejecutaron (Artículo 13 de
`PRODUCT_CONSTITUTION.md`, migraciones nunca silenciosas)? ¿con qué frecuencia se usa
cada función, para informar las decisiones de `PRODUCT_BACKLOG.md`/`ROADMAP.md`? Esta
observabilidad es interna (para quien mantiene el producto) y **nunca** se convierte en
una superficie de vigilancia hacia el usuario — no hay tracking de comportamiento
individual expuesto ni vendido; es telemetría agregada al servicio de decisiones de
producto, coherente con el Artículo 2 de `PRODUCT_CONSTITUTION.md` sobre no aumentar
complejidad ni comprometer la confianza del usuario.

## Convención de nombres compartida con el resto del sistema

Todo nombre técnico de módulo, función o tabla que represente un concepto de producto
usa la misma terminología que este sistema de documentación (Entidad, Espacio,
Perspectiva, Panel, Widget, Overlay — ver el glosario centralizado, `DOCS_INDEX.md`
§Terminología compartida). Un desarrollador o una IA que lea el código y la
documentación de producto nunca debería encontrar dos nombres distintos para el mismo
concepto.
