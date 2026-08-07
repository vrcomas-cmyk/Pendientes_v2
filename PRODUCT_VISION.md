# Product Vision — Pendientes Pro

> Parte del **Product Operating System** de Pendientes Pro. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md)
> para el mapa completo. Este documento responde *qué es y por qué existe*; el *cómo se ve y se
> comporta* vive en [`PDS.md`](./PDS.md) y [`DESIGN_LANGUAGE.md`](./DESIGN_LANGUAGE.md); el *qué
> nunca hacer* vive en [`PRODUCT_CONSTITUTION.md`](./PRODUCT_CONSTITUTION.md).

## ¿Qué es Pendientes Pro?

Pendientes Pro es un **Personal Workspace**: el lugar único donde una persona administra
todo lo que tiene que hacer, recordar, escribir y planear — trabajo, universidad,
personal, compras, ideas, metas — sin cambiar de aplicación según el tipo de contenido.

No es un gestor de tareas con notas al costado. Es un sistema donde una tarea, una nota,
un evento y un proyecto son **la misma clase de cosa vista desde distintos ángulos**
(desarrollado en detalle en [`DATA_PHILOSOPHY.md`](./DATA_PHILOSOPHY.md)). Esa decisión de
modelo de datos es la base de todo lo demás: es lo que permite que Kanban, Calendario,
Hoy y Notas reusen exactamente los mismos datos sin sincronizarlos entre sí — porque no
hay copias que sincronizar, hay una sola fuente.

## ¿Qué problema resuelve?

El problema no es "olvidarse cosas" — para eso alcanza con una lista. El problema real,
el que ninguno de los siete competidores de referencia resuelve del todo, es la
**fragmentación de la vida personal entre herramientas**: la tarea vive en Todoist, la
nota en Notion, el evento en Calendar, el tablero en Trello, y la persona gasta más
energía moviendo información entre esas cuatro superficies que haciendo el trabajo real.

Pendientes Pro resuelve eso ofreciendo **un solo lugar con un solo modelo**, donde
capturar algo no obliga a decidir de antemano "¿esto es una tarea o una nota?" — la
decisión de forma es secundaria a la de captura (ver Flujo 9.1 y 9.9 en `PDS.md`).

## ¿Qué NO pretende ser?

- **No pretende ser una suite de oficina** (no compite con Office/Google Workspace en
  documentos colaborativos extensos, hojas de cálculo, o presentaciones).
- **No pretende ser un CRM ni una herramienta de gestión de equipos grandes** — está
  diseñado para una persona que administra su propia vida, con colaboración puntual
  (compartir un proyecto, mencionar a alguien), no para organizaciones de decenas de
  personas con roles y permisos complejos.
- **No pretende ser una IA que decide por el usuario.** No hay asistente que reescriba,
  priorice o resuma automáticamente sin pedírselo — ver el principio de simplicidad en
  `PRODUCT_CONSTITUTION.md` §"No incorporar IA si aumenta la complejidad".
- **No pretende tener todas las funciones de todos los competidores juntas.** Cada
  función nueva compite por espacio en la app con las que ya existen — ver
  `PRODUCT_PRINCIPLES.md` §12 y la regla constitucional de "una acción principal nueva
  exige eliminar otra".
- **No pretende ser la app más rápida de tipear código de teclado tipo Vim** (ese es el
  territorio de Linear) — prioriza velocidad para *tareas de vida personal*, no para
  flujos de ingeniería de software.

## ¿Qué lo hace diferente?

| Competidor | Su fortaleza | Por qué Pendientes Pro no la copia |
|---|---|---|
| **Notion** | Flexibilidad de bloques infinita | Esa flexibilidad tiene un costo de fricción — cada página nueva exige decidir su estructura. Pendientes Pro ofrece estructura ya resuelta (Entidad con campos conocidos) a cambio de menos configuración. |
| **Todoist** | Captura con lenguaje natural muy pulida | Se adopta la idea (captura con sintaxis, ver `PDS.md` §9.1) pero sin la fragmentación entre proyectos/etiquetas/filtros que Todoist expone como configuración manual. |
| **TickTick** | Todo-en-uno (Pomodoro, hábitos, calendario) | Comparte la ambición de "todo en un lugar", pero TickTick lo hace apilando features sin un lenguaje visual unificado — exactamente el error que `PDS.md` §1 documenta y corrige. |
| **Things 3** | Disciplina minimalista, "Hoy" como núcleo | Se adopta la disciplina (una cosa a la vez, ver `INTERACTION_PHILOSOPHY.md`) pero sin su frialdad visual ni su exclusión de todo lo que no sea tarea (notas, proyectos con tablero). |
| **Linear** | Velocidad de teclado, atajos en todo | Se adopta la velocidad como valor central, pero el público es distinto: Linear diseña para equipos de ingeniería; Pendientes Pro para una persona y su vida entera. |
| **Apple Reminders** | Integración nativa del sistema, cero fricción de configuración | Se adopta la simplicidad de cero-configuración como ideal, pero Reminders no tiene notas, proyectos ni tablero — es deliberadamente limitado. |
| **Craft** | Tipografía y calidez editorial | Es el pariente más cercano en identidad visual — Pendientes Pro comparte esa calidez (ver `DESIGN_LANGUAGE.md`) pero la aplica a un modelo de productividad estructurado, no a documentos libres. |

La combinación que nadie de la lista tiene: **calidez visual propia + disciplina de una
sola cosa a la vez + un modelo de datos verdaderamente unificado** (no solo "todo vive
en la misma app", sino "todo es la misma clase de dato"). Ver `PRODUCT_PRINCIPLES.md`
§1 y `DATA_PHILOSOPHY.md`.

## La promesa del producto

> **"Todo lo que tenés que hacer, recordar y planear vive en un solo lugar cálido y
> silencioso — y encontrarlo nunca te va a costar más de un vistazo."**

Esta promesa tiene dos mitades verificables:
1. **Un solo lugar**: cualquier cosa que una persona necesite capturar (tarea, nota,
   evento, idea, archivo) tiene un destino inmediato, sin decidir de antemano en qué
   app o en qué sección va.
2. **Un vistazo**: la pantalla que más se usa (Hoy) responde "¿qué hago ahora?" sin que
   el usuario tenga que leer más de lo que puede escanear en 2-3 segundos — la métrica
   de éxito de diseño detrás de `PDS.md` §1.4/§2.11.

## Cómo debe sentirse usarlo

- **Cálido, no clínico.** El fondo ambiental y el `.glass` (ver `DESIGN_LANGUAGE.md`)
  existen para que abrir la app se sienta como entrar a un espacio propio, no a una
  hoja de cálculo con checkboxes.
- **Silencioso, no ruidoso.** Ninguna pantalla debería generar la sensación de "cuántas
  cosas hay acá" — la disciplina de una superficie a la vez (`INTERACTION_PHILOSOPHY.md`)
  es lo que sostiene esta sensación.
- **Ágil, no lento.** Cada acción frecuente (capturar, completar, mover, buscar) se
  siente instantánea — respaldado por el sistema de motion de `PDS.md` §7, nunca una
  animación que hace esperar al usuario más de lo necesario.
- **Propio, no genérico.** El usuario debería poder reconocer una captura de pantalla de
  Pendientes Pro sin ver el logo — por la paleta, la tipografía, el ritmo de espaciado.
  Esa es la vara de éxito de `DESIGN_LANGUAGE.md`.
- **Confiable, no frágil.** Ningún dato se pierde ni se desconecta silenciosamente de su
  contexto (la reparación de integridad de proyecto documentada en `DECISIONS_LOG.md` es
  el ejemplo fundacional de este valor puesto en práctica).

## Horizonte a 5 años

Pendientes Pro es, para su usuario, el sistema operativo de su vida personal: el primer
lugar que abre a la mañana y el último antes de cerrar el día. Todo Espacio de vida
(Trabajo, Universidad, Personal, Finanzas, Ideas) vive ahí, con vistas propias
(Perspectivas, ver `NAVIGATION_SYSTEM.md`) que se sienten hechas a medida sin haber
exigido configuración manual. La colaboración puntual (compartir un proyecto con otra
persona) es fluida pero nunca convierte al producto en una herramienta de equipo — el
centro de gravedad sigue siendo una persona organizando su propia vida.

## Horizonte a 10 años

Pendientes Pro es la categoría que hoy no tiene nombre propio entre "gestor de tareas" y
"segundo cerebro": un **Personal Operating System** liviano, sin fricción de
configuración, que una persona no cambia nunca porque ya modeló diez años de su vida
adentro. El valor no está en agregar más funciones — está en que el modelo de datos
unificado (`DATA_PHILOSOPHY.md`) permitió que el producto creciera en superficie
(Archivos, Metas, Kanban avanzado) sin nunca fragmentar la experiencia ni pedirle al
usuario que reaprenda el sistema. La medida de éxito a 10 años no es cuántas funciones
tiene, es cuántas nunca tuvo que agregar porque las 20 originales, bien hechas, seguían
alcanzando.
