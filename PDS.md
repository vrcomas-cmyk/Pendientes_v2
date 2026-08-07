# Product Design Specification — Pendientes Pro v2.0

> Este documento es el **núcleo** del [Product Operating System](./DOCS_INDEX.md) de
> Pendientes Pro — su contenido permanece íntegro desde su versión original. La visión
> de producto que lo motiva vive en [`PRODUCT_VISION.md`](./PRODUCT_VISION.md); las
> reglas que gobiernan cualquier decisión futura sobre él viven en
> [`PRODUCT_PRINCIPLES.md`](./PRODUCT_PRINCIPLES.md) y
> [`PRODUCT_CONSTITUTION.md`](./PRODUCT_CONSTITUTION.md). Ver `DOCS_INDEX.md` para el
> mapa completo de los 14 documentos del sistema.

Documento de diseño de producto, listo para entregar a ingeniería. No contiene código,
componentes React ni clases de Tailwind — es la especificación de producto sobre la cual
esas decisiones técnicas se toman después. Evoluciona la app existente (Pendientes,
Notas, Proyectos, Espacios, Dashboard, Calendario, Captura rápida, Sidebar) — no la
rehace ni cambia su arquitectura o stack.

**Equipo que firma este documento** (roles aplicados, no narrados): Principal Product
Designer, Senior UX Researcher, Interaction Designer, Motion Designer, Design System
Architect, Staff Frontend Architect (revisa viabilidad, no implementa), Accessibility
Expert, Product Strategist.

**Competencia de referencia**: Apple Reminders, Things 3, Linear, Notion, TickTick,
Craft, Fantastical — ninguno se copia. Ver §0.3 para la tesis de identidad propia.

---

## Índice

0. Tesis del producto y objetivo
1. Crítica brutal de la captura de referencia
2. Scorecard (8 dimensiones, 1-10, justificado)
3. Estrategia de evolución (las 10 preguntas)
4. Sistema de Widgets
5. Sistema de Layout universal
6. Design System (tokens y componentes)
7. Sistema de Motion
8. Microinteracciones (100+)
9. User Flows completos
10. Notas de accesibilidad transversales
11. Glosario y siguiente paso

---

## 0. Tesis del producto y objetivo

### 0.1 Qué es hoy, qué tiene que ser

Hoy: un gestor de pendientes con Notas, Proyectos y Calendario alrededor. Destino: el
lugar donde una persona administra **toda** su vida — trabajo, universidad, personal,
compras, ideas, proyectos, metas, archivos, calendario, notas, pendientes, kanban — con
un solo modelo de datos por debajo ("todo es una Entidad", ya presente en `types.ts` de
la app real) y una sola gramática visual arriba.

### 0.2 El error que este documento existe para prevenir

La captura de referencia analizada en §1 comete el error más caro de un Personal
Workspace: confundir "hace de todo" con "muestra todo a la vez". Ámbito de este PDS:
diseñar un sistema donde la app hace más, pero cada pantalla muestra menos.

### 0.3 Tesis de identidad propia

Ningún competidor de la lista combina estas dos cosas: (a) una paleta cálida propia
(índigo-violeta sobre neutros con tinte cálido, ya en el código real de la app, con un
comentario explícito de "no el teal genérico de apps de tareas"), y (b) un modelo de
datos donde tarea/nota/proyecto comparten estructura. Things 3 gana por disciplina
minimalista fría; Linear por velocidad de teclado; Notion por flexibilidad de bloques;
Craft por tipografía editorial. La apuesta de identidad de este producto es
**"escritorio cálido, disciplinado"**: la calidez visual (glass sobre fondo ambiental,
nunca frío/oscuro-neón por defecto) combinada con la disciplina de Things/Linear
(una cosa a la vez, atajos de teclado en todo, sin ruido). Esa combinación no la tiene
nadie en la lista.

---

## 1. Crítica brutal de la captura de referencia

Se analiza la captura entregada tal como está: sidebar oscura a la izquierda, saludo +
reloj + "Resumen del día" en el centro-izquierda, cuatro tarjetas apiladas a la derecha
(Pendientes / Nota rápida / Próxima tarea / Mini-calendario), otra fila de cuatro
tarjetas debajo (Kanban rápido / Pomodoro / Captura rápida / algo recortado), una
paleta de comandos abierta en el centro-inferior, un dock de "Accesos rápidos" abajo a
la izquierda, y un panel flotante "Nueva tarea rápida" abajo a la derecha — **todo al
mismo tiempo, en la misma captura**.

### 1.1 Jerarquía visual — falla

No hay una sola cosa que el ojo deba mirar primero. Compiten al mismo nivel de peso
visual: el saludo "Buenos días, Vladimir 👋", el reloj digital "09:41", el anillo
"Resumen del día" con "12 Pendientes" en el centro, y cuatro tarjetas de igual tamaño a
la derecha. Un principio de Apple que esta pantalla viola de punta a punta: *si todo es
importante, nada lo es*. Con nueve superficies de igual peso, el usuario tiene que
decidir por sí mismo qué mirar — ese es exactamente el trabajo que el diseño debería
haber hecho por él.

### 1.2 Espaciados — inconsistente

La columna derecha apila cuatro tarjetas con separación uniforme entre ellas, pero el
padding *interno* de cada tarjeta es distinto: el anillo de "Pomodoro" casi toca el
borde de su tarjeta; "Mayo 2024" tiene aire generoso alrededor de la grilla; "Kanban
rápido" comprime tres columnas mini dentro de una tarjeta angosta, con celdas que casi
se tocan entre sí. No hay una unidad de espaciado compartida entre widgets.

### 1.3 Tipografía — sin escala

Se cuentan al menos seis tamaños/pesos de texto distintos haciendo trabajos parecidos:
el saludo, "Hoy" (título de sección), los horarios de la timeline (09:00, 10:00…), los
títulos de tarea, los badges de prioridad, y las etiquetas de los widgets ("Resumen del
día", "Próximos eventos"). Ninguno de estos comparte una relación de escala clara con
los demás — no hay una progresión de tamaño perceptible como "display / cuerpo /
metadato", hay una nube de tamaños parecidos.

### 1.4 Balance — roto, cargado a la derecha

El lado izquierdo (lista de Hoy) es una sola columna de contenido lineal. El lado
derecho apila **ocho** tarjetas/widgets en dos columnas de cuatro. El resultado es un
diseño que pesa visiblemente más a la derecha — no hay ningún principio de composición
(ni simetría, ni proporción áurea, ni jerarquía en "F") sosteniendo esta distribución.

### 1.5 Alineación — no hay un borde compartido

Los badges de prioridad ("Reunión", "Alta", "Media", "Baja") no comparten un borde
derecho común entre las filas de tarea — cada uno "flota" a la distancia que le permite
el largo del texto del título. En una lista, el ojo necesita un eje vertical estable
para escanear rápido; acá no existe.

### 1.6 Escala — tres lenguajes circulares distintos en una pantalla

El anillo de "Resumen del día" (multicolor, tres segmentos), el reloj digital de arriba,
y el anillo de "Pomodoro" (un solo color, rojo) son tres componentes de progreso
circular con tres estilos visuales distintos, en la misma pantalla, sin relación entre
sí. Si un usuario aprende a leer uno, ese aprendizaje no le sirve para el otro.

### 1.7 Iconografía — tres sistemas de íconos conviviendo

(1) Íconos monocromáticos de línea en el sidebar. (2) Cuadrados de color sólido con
ícono blanco en "Accesos rápidos" (azul/verde/violeta/naranja/rojo). (3) Puntos de color
como indicador de estado en las columnas de Kanban rápido. Tres gramáticas de ícono
distintas — el usuario no puede aprender "así se ve una acción" una sola vez.

### 1.8 Color — el acento perdió su significado

El índigo/violeta aparece como marca (título "Pendientes_v2"), como estado de prioridad
("Media" en ámbar, pero en otro lugar el acento morado es solo decorativo), como color
de fondo del anillo de progreso, y como color de un chip de "Reunión" que no es ni
prioridad ni marca. Cuando el mismo color hace de marca, de estado y de decoración a la
vez, deja de comunicar nada específico — este es el error #1 de sistemas de color según
cualquier design system serio (Material, Apple HIG, Radix): **la semántica de estado
debe vivir separada del color de marca**, y acá están mezcladas.

### 1.9 Estados — no verificables, y eso ya es un problema

Una captura estática no puede mostrar hover/focus/pressed — pero la ausencia de *ninguna*
señal de qué es interactivo (botones, tarjetas, chips todos con el mismo tratamiento
plano) es en sí misma una falla de affordance: nada en la composición sugiere "esto se
puede tocar" versus "esto es solo información".

### 1.10 Navegación — sobrecargada

El sidebar contiene: 7 destinos primarios, una sección "Espacios" con 6 filas, dos
íconos de ajustes distintos, un ícono de ayuda, y un ítem de usuario al pie — **17+
objetivos de navegación en una sola columna**, sin agrupación tipográfica real más allá
de una etiqueta pequeña ("ESPACIOS"). Ningún sidebar de los siete competidores listados
tiene esta densidad en un solo nivel.

### 1.11 Componentes — nueve lenguajes de tarjeta en una pantalla

Se cuentan al menos nueve superficies con tratamiento de "tarjeta" distinto entre sí:
la fila de tarea de la timeline, el panel "Resumen del día", "Próximos eventos",
"Actividad reciente", "Pendientes" (contador), "Nota rápida" (post-it amarillo — el
único elemento de toda la pantalla con esa metáfora visual), "Próxima tarea", el
mini-calendario, "Kanban rápido", "Pomodoro" y "Captura rápida". Cada uno con su propio
radio, su propio header, su propia jerarquía interna. No es un sistema, es una colección
de piezas hechas por separado.

### 1.12 Interacciones — la captura muestra un estado que un producto real nunca debe permitir

Esto es lo más grave de toda la crítica: **la paleta de comandos (Ctrl+K) está abierta
al mismo tiempo que un panel flotante "Nueva tarea rápida", que el dock de accesos
rápidos, que ocho widgets más**. En cualquier modelo de interacción serio, un command
palette es un overlay que toma el foco y atenúa (scrim) todo lo demás — no coexiste con
otro formulario flotante abierto a su lado. Esta captura no representa un estado real de
producto: representa un collage de marketing de "todo lo que la app puede hacer", y si
se construye literalmente así, el usuario real jamás vería esto — vería un caos de
z-index y foco robado.

### 1.13 Paneles y distribución — cinco capas de layout simultáneas

Sidebar fijo + contenido central + columna de widgets a la derecha + dock inferior
flotante + overlay de comandos/captura — cinco sistemas de posicionamiento coexistiendo.
Ninguna arquitectura de layout (ni la de Notion, ni la de Linear, ni la de Craft) apila
tantas capas a la vez por defecto.

### 1.14 Flujo de trabajo — cinco caminos para "agregar algo"

Botón "Nuevo pendiente" en Accesos rápidos, ícono "Pendiente" en el widget de Captura
rápida, el panel flotante "Nueva tarea rápida" con su propio formulario, la sugerencia
"Pendientes" dentro de la paleta de comandos, y presumiblemente un "+" dentro de cada
columna de Kanban rápido. **Cinco superficies distintas ofreciendo la misma acción al
mismo tiempo** es fricción de decisión, no velocidad.

### 1.15 Carga cognitiva — más de 80 elementos de texto legibles en una sola pantalla

Contados: título, saludo, subtítulo, fecha, hora, 5 chips de filtro, "Resumen del día" +
6 líneas de leyenda, "Próximos eventos" + 3 filas, "Actividad reciente" + 4 filas, 8
filas de tarea con 2-3 datos cada una, 4 widgets con su contenido interno, la paleta de
comandos con 6 sugerencias, el panel flotante con 4 campos. Ninguna persona puede
"escanear" esto en el sentido en que Apple define un buen dashboard — se lee, no se
escanea, y leer toma tiempo que un Hoy no debería pedir.

### 1.16 Consistencia — la nota más baja de todo el análisis

Ya cubierta transversalmente arriba (§1.7, §1.8, §1.11): tres sistemas de ícono, tres
lenguajes circulares, nueve lenguajes de tarjeta, colores con significados mezclados.

### 1.17 Velocidad de uso

Para responder "¿qué es lo más importante que tengo que hacer ahora?", el usuario debe
reconciliar cuatro fuentes potencialmente contradictorias: la timeline de Hoy, el anillo
de "Resumen del día", el contador "8 hoy" del widget "Pendientes", y el widget "Próxima
tarea". Si dos de estas cuatro fuentes alguna vez muestran datos distintos (por un bug de
sincronización, por ejemplo), el usuario pierde confianza en las cuatro a la vez.

### 1.18 Acciones principales vs. secundarias

Se identifican al menos tres colores de botón "primario" distintos en una sola pantalla:
rojo ("Iniciar" del Pomodoro), azul ("Guardar" del panel flotante), y el acento
morado/índigo en otros lugares. La regla más básica de jerarquía de acción — *el color
de acento se reserva para una sola acción primaria por contexto* — está rota.

### 1.19 Estados vacíos, responsive

No verificables desde una imagen estática — y esa es precisamente la falla de proceso:
un sistema con cinco capas de layout simultáneas (§1.13) no tiene un camino obvio de
colapso a tablet o mobile. No se puede tener cuatro widgets flotantes + un dock + un
sidebar fijo en una pantalla de 390px de ancho. Este diseño, tal como está compuesto,
**no es responsive por construcción**, no porque falte adaptarlo — porque su premisa
(todo visible a la vez) es incompatible con pantallas chicas desde el diseño mismo.

---

## 2. Scorecard

| Dimensión | Nota | Por qué |
|---|---|---|
| **UX** | 4/10 | Cuatro fuentes de verdad para "qué hacer ahora" (§1.17), cinco caminos para la misma acción (§1.14), cero jerarquía de qué mirar primero (§1.1). |
| **UI (craft visual)** | 6/10 | Individualmente, cada pieza (glass, gradiente, íconos) está bien ejecutada. El problema no es la calidad de cada parte, es que no comparten sistema — parece un moodboard, no una pantalla. |
| **Accesibilidad** | 3/10 | Texto sobre fondo con gradiente y vidrio en zonas de contraste variable, ningún estado de foco visible, semántica de color reutilizada para tres cosas distintas (§1.8), affordance de interactividad ausente (§1.9). |
| **Productividad** | 4/10 | Cinco caminos de captura no es velocidad, es indecisión. El usuario gasta tiempo reconciliando datos duplicados en vez de actuando sobre ellos. |
| **Escalabilidad** | 3/10 | No hay evidencia de un sistema de tokens detrás de esto — cada widget parece estilado a mano por separado (nueve lenguajes de tarjeta, §1.11). Agregar un décimo widget con este método solo empeora el problema. |
| **Diseño (pulido general)** | 6/10 | La primera impresión es fuerte — el gradiente cálido y el glass generan una reacción positiva inmediata. No sobrevive a un segundo vistazo analítico. |
| **Identidad** | 7/10 | Esta es la nota más alta y la más importante de rescatar: el gradiente cálido + glass + iconografía de color es un punto de vista real, más distintivo que la frialdad de Linear o el blanco clínico de Things — hay que conservar y disciplinar esta dirección, no abandonarla. |
| **Consistencia** | 3/10 | La nota más baja. Ya cubierta transversalmente: tres sistemas de ícono, tres lenguajes circulares, nueve lenguajes de tarjeta, tres colores "primarios" distintos. |

**Promedio: 4.5/10.** Lectura del equipo: esto es un **collage de marketing bien
ejecutado**, no una pantalla de producto — cada pieza por separado demuestra buen gusto,
pero juntas no siguen ningún sistema, y el estado que muestran (todo abierto a la vez)
no es un estado que un producto real deba permitir jamás. La identidad visual (cálido +
glass) vale la pena conservar. La disciplina de sistema hay que construirla desde cero
sobre esa identidad — ese es exactamente el trabajo de las secciones 4 a 9 de este
documento.

---

## 3. Estrategia de evolución — las 10 preguntas

No es un rediseño: cada respuesta parte de un componente que ya existe (en la captura o
en la app real) y lo transforma, no lo reemplaza por algo ajeno.

**1. Qué eliminarías**
- El reloj digital grande ("09:41") del cuerpo de Hoy — el sistema operativo ya muestra
  la hora; no cumple ninguna función de producto.
- El widget "Actividad reciente" de la columna derecha — duplica exactamente lo que ya
  hace el "Registro" de la app real (Fase 8, `OtherViews.tsx`); es la misma información
  contada dos veces.
- El dock de "Accesos rápidos" **como superficie fija adicional** al lado de la Captura
  rápida — son la misma promesa (crear algo ya) resuelta dos veces en la misma pantalla.

**2. Qué fusionarías**
- "Resumen del día" (anillo) + el contador "Pendientes" (8 hoy) → son la misma cifra
  visualizada dos veces con dos lenguajes distintos (donut vs. número grande). Un solo
  bloque de estado, con el número grande como protagonista y el anillo como decoración
  secundaria del mismo bloque, no dos bloques.
- "Nota rápida" (post-it) + "Captura rápida" (widget con 4 íconos) → ambos resuelven
  "quiero anotar algo ya". Un solo campo de captura universal (ya existe en la app real
  como `quickAdd`) que decide el tipo de entidad por el contenido/sintaxis, no dos
  widgets separados pidiéndole al usuario que elija de antemano.

**3. Qué dividirías**
- La fila de chips "Todo 14 · Trabajo 6 · Escuela 3 · Personal 4 · Sin fecha 1" mezcla
  dos conceptos en un solo control: **contexto** (a qué Espacio pertenece) y **filtro**
  (qué subconjunto de Hoy estoy mirando). El contexto de Espacio ya vive en el sidebar
  — no debería repetirse como chip de filtro en el cuerpo. Separar: el sidebar decide el
  Espacio activo; los chips de Hoy filtran solo por estado (Todo/Vencido/Sin fecha).

**4. Qué moverías**
- El mini-calendario ("Mayo 2024") no pertenece al cuerpo de Hoy — es contenido de la
  vista Calendario. Se mueve a un widget opcional (invocable, no fijo) o se elimina de
  esta pantalla.
- El reloj + fecha, si se conservan en alguna forma, se mueven al header de la app (una
  sola línea, tipografía secundaria), no al cuerpo del contenido.

**5. Qué simplificarías**
- El sidebar: de 17+ objetivos en una columna plana a 3 grupos con jerarquía tipográfica
  real — Navegación (5 destinos) / Espacios (colapsable) / Sistema (ajustes, ayuda,
  cuenta, agrupados detrás de un solo punto de entrada). Ver §5.2.

**6. Qué harías más rápido**
- Crear un pendiente: de 5 caminos simultáneos a 2 — el atajo de teclado (`N`, siempre
  vivo, invisible hasta que se necesita) y un solo punto de entrada visual persistente
  (no cuatro compitiendo). Ver Flujo 9.1.

**7. Qué harías más visual**
- El estado "bloqueado por subtareas" y "vencido" hoy son solo un chip de texto entre
  otros ocho chips de la misma fila — se les da una representación más fuerte y
  reconocible (un ícono de candado con color de estado dedicado, nunca compartido con
  prioridad) para que se lean sin tener que leer texto.

**8. Qué harías más minimalista**
- El header de Hoy: de cuatro elementos sueltos (saludo, subtítulo, fecha, reloj) a una
  sola línea con un elemento protagonista (el saludo, en tipografía Display) y el resto
  como metadato secundario debajo, en un solo tamaño.

**9. Qué debería desaparecer (como comportamiento, no como feature)**
- El estado mostrado en la captura — command palette + panel flotante + ocho widgets,
  todos abiertos a la vez — desaparece por regla de interacción, no por eliminación de
  ninguna feature: **un solo overlay modal a la vez**. Abrir la paleta de comandos oscurece
  (scrim) todo lo demás automáticamente; abrir "Nueva tarea rápida" cierra cualquier otro
  overlay activo. Esto se especifica formalmente en §5.4.

**10. Qué debería convertirse en widget**
- Pomodoro: ya lo es, correcto, se mantiene como referencia de anatomía.
- "Resumen del día", "Próximos eventos", "Kanban rápido", el mini-calendario: los cuatro
  pasan de ser bloques fijos de la pantalla Hoy a widgets **opcionales** del sistema
  descrito en la sección 4 — el usuario decide si los quiere anclados o no, en vez de
  que vengan fijos para todos.

---

## 4. Sistema de Widgets

### 4.1 Principios

1. Un widget nunca es la única forma de ver un dato — siempre existe una vista completa
   equivalente en la navegación primaria (el widget es un atajo, no una isla).
2. Un widget flotante no compite nunca con un overlay modal — ver regla de exclusividad
   en §5.4.
3. Todo widget comparte la misma anatomía y el mismo lenguaje de interacción, sin
   importar su contenido — un usuario que aprende a mover/redimensionar/colapsar un
   widget sabe hacerlo con cualquier otro.

### 4.2 Anatomía universal del widget

```
┌───────────────────────────────┐
│ ⠿  Título del widget      ⌄ ✕ │  ← header, 36px alto, drag handle a la izq.
├───────────────────────────────┤
│                                │
│         cuerpo (scroll         │  ← padding interno 16px, scroll propio
│         propio si excede)      │
│                                │
└───────────────────────────────┘◢  ← resize handle 14×14px, esquina inf. derecha
```

- **Header** (36px alto fijo): ícono/handle de arrastre (⠿, cursor `grab`/`grabbing`) a
  la izquierda, título en tipografía Meta-strong (11px/700), botón colapsar (chevron) y
  botón cerrar (✕) a la derecha, ambos de 24×24px de área táctil mínima.
- **Cuerpo**: padding 16px en los cuatro lados salvo que el contenido sea una lista (en
  ese caso, 8px vertical / 12px horizontal para más densidad útil). Scroll propio si el
  contenido excede la altura del widget — el widget nunca crece más allá de su `hMax`.
- **Resize handle**: visible solo en hover del widget completo, 14×14px, cursor
  `nwse-resize`, en la esquina inferior derecha únicamente (no se permite redimensionar
  desde otros bordes en v2.0 — reduce ambigüedad de gesto).

### 4.3 Catálogo de tamaños (grid de 4px, todo widget se ajusta a esta rejilla)

| Tamaño | Uso | w × h por defecto | w × h mínimo | w × h máximo |
|---|---|---|---|---|
| **S — compacto** | Pomodoro, Próxima tarea, Nota rápida | 240×200 | 200×160 | 320×280 |
| **M — estándar** | Captura rápida, Mini-calendario, Resumen del día | 320×240 | 260×200 | 440×360 |
| **L — panel** | Kanban rápido, Próximos eventos | 420×320 | 320×260 | 640×480 |

Ningún widget tiene un tamaño "libre" sin límites — el rango mín/máx evita que un
usuario redimensione un widget hasta hacerlo ilegible o hasta que tape media pantalla.

### 4.4 Posicionamiento

- **Cascada al crear**: nuevo widget nace en `x: 96 + (n % 6) × 24, y: 96 + (n % 6) × 24`
  (patrón ya presente en la app real, se conserva).
- **Snap a rejilla invisible de 8px** al soltar tras un arrastre — nunca queda en una
  posición sub-píxel arbitraria.
- **Snap a bordes**: si el borde de un widget queda a menos de 12px del borde de otro
  widget o del viewport, se alinea automáticamente (comportamiento tipo "guías
  inteligentes" de Figma/Sketch) — con una línea guía de 1px en el color de acento
  visible solo durante el arraste.
- **Clamp de viewport obligatorio**: un widget nunca puede quedar con menos del 25% de
  su área visible dentro del viewport — a diferencia del sistema actual de la app real,
  que permite arrastrar un widget casi completamente fuera de pantalla sin forma de
  recuperarlo. Si el viewport se redimensiona (ventana, rotación) y un widget queda
  huérfano fuera del área visible, se reposiciona automáticamente a la cascada por
  defecto, con una notificación breve ("Reordenamos tus widgets para que quepan").

### 4.5 Comportamientos

- **Colapsar** (chevron del header): el cuerpo se oculta con una transición de altura
  (`height` animado, 220ms, curva `ease-out-quart` — ver §7), el widget queda reducido
  a la barra de header únicamente. Estado persistente.
- **Cerrar** (✕): el widget desaparece de la superficie activa pero **no se destruye ni
  pierde su estado** (ej. el Pomodoro sigue corriendo en segundo plano) — reaparece
  exactamente donde estaba, con su estado intacto, al reactivarlo desde el selector de
  widgets del dock.
- **Arrastre**: se activa solo desde el header (nunca desde el cuerpo, para no competir
  con scroll/selección de texto interno). Durante el arrastre, el widget sube de
  elevación (sombra `elevation-4`, ver §6.5) y su opacidad baja a 0.92 para señalar que
  está "en vuelo".
- **Redimensión**: solo desde el handle de la esquina inferior derecha; mientras se
  arrastra, se muestra una etiqueta flotante junto al cursor con las dimensiones en
  vivo (`320 × 240`), igual que en herramientas de diseño profesional.

### 4.6 Estados

| Estado | Señal visual |
|---|---|
| **Idle** | `.glass` estándar, sombra `elevation-2` |
| **Hover** | Sombra sube a `elevation-3`, resize handle se hace visible, cursor cambia según zona |
| **Dragging** | Sombra `elevation-4`, opacidad 0.92, cursor `grabbing`, guías de snap visibles |
| **Resizing** | Mismo tratamiento que dragging + etiqueta de dimensiones |
| **Colapsado** | Solo header visible, cuerpo con `height:0` animado, chevron rotado 180° |
| **Foco (teclado)** | Anillo de foco de 2px en color de acento alrededor de todo el widget |
| **Deshabilitado por overlay activo** | Opacidad 0.5, `pointer-events:none`, sin blur adicional — señala "en pausa", no "roto" |

### 4.7 Acoplamiento (docking)

Un widget puede **anclarse** a un borde del viewport (arrastrarlo hasta 16px del borde
lo convierte en "acoplado"): pierde su sombra flotante, su radio se ajusta a 0 en el
lado acoplado, y su tamaño se fija al alto/ancho completo de ese borde. Un widget
acoplado se comporta como un panel lateral fijo (comparte anatomía con el Panel Derecho
de §5.3) hasta que se lo vuelve a arrastrar hacia el centro, momento en el que recupera
su forma flotante. Máximo un widget acoplado por borde.

### 4.8 Persistencia y visibilidad

- Posición, tamaño, estado colapsado/expandido y **qué widgets están activos** persisten
  por dispositivo (no se sincronizan entre dispositivos por defecto — un layout de
  widgets es una preferencia de pantalla, no un dato de trabajo; ver razonamiento
  idéntico ya aplicado a `pn_widgets` en la app real).
- Un selector de widgets (ícono dedicado en el dock) muestra los widgets disponibles
  con un toggle on/off — nunca hay que "recrear" un widget cerrado, solo reactivarlo.
- **Always-on-top**, cuando la plataforma lo permite (apps de escritorio empaquetadas,
  no en navegador): un widget individual puede fijarse por encima de otras ventanas del
  sistema operativo (ej. Pomodoro visible mientras se trabaja en otra app). Se indica
  con un pin (📌) en el header, disponible solo en build de escritorio — en la versión
  web/PWA actual esta opción no se muestra (no hay forma de implementarla en un
  navegador, y no se ofrece una opción que no puede cumplir su promesa).

---

## 5. Sistema de Layout universal

### 5.1 Principio rector

Una sola composición de layout sirve para las 12 superficies de la app (Hoy, Inbox,
Pendientes, Notas, Proyectos, Kanban, Calendario, Dashboard, Espacios, Panel de
detalles, Captura rápida, Papelera). Ningún módulo define su propia estructura de
columnas desde cero.

### 5.2 La rejilla de tres franjas (se conserva de la app real, se disciplina)

```
┌──────────┬─────────────────────────────────┬──────────────┐
│          │  Header de vista (56px alto)     │              │
│ Sidebar  ├─────────────────────────────────┤ Panel lateral │
│ 240px    │                                  │ opcional      │
│ fijo     │        Contenido principal        │ 380px         │
│          │        (max-width 880px en        │ (se abre a    │
│          │         vistas de lectura/         │  demanda,     │
│          │         formulario; full-bleed     │  nunca fijo   │
│          │         en Kanban/Calendario)      │  salvo que el │
│          │                                  │  usuario lo    │
│          │                                  │  ancle)        │
└──────────┴─────────────────────────────────┴──────────────┘
```

- **Sidebar**: 240px, fijo, nunca colapsa a hover-only (falla ya corregida respecto a
  la app real, documentada en `AUDITORIA.md`). Tres grupos con jerarquía tipográfica
  real (ver abajo).
- **Header de vista**: 56px, presente en las 12 superficies, misma anatomía siempre —
  título (Display-sm) a la izquierda, acciones contextuales a la derecha (máximo 3
  botones visibles + un menú "más" para el resto).
- **Contenido principal**: ancho máximo 880px en vistas de lectura/lista (Hoy, Inbox,
  Notas, Panel de detalles) — un ancho de línea legible, nunca full-bleed en texto.
  Full-bleed permitido solo en vistas de grilla espacial (Kanban, Calendario, Dashboard).
- **Panel lateral**: nunca fijo por defecto — se abre a demanda (ver una tarea, editar
  un detalle) y se cierra con `Esc` o clic afuera. Si el usuario lo ancla explícitamente
  (ver §4.7), se vuelve persistente para esa sesión.

### 5.3 Reestructuración del sidebar (resuelve §1.10, §3.5)

```
Pendientes Pro                    ← marca, 26px logo + wordmark
[+ Nuevo pendiente]               ← CTA primaria, único botón de acento del sidebar

NAVEGACIÓN                        ← label 10px/700/uppercase, color ink-faint
  ★ Hoy
  📥 Inbox                12
  📁 Proyectos
  📝 Notas
  🗂 Espacios

ESPACIO ACTIVO: Trabajo ▾         ← selector colapsable, no lista fija de 6 filas
  ● Cliente DEGASA        6
  ● Reportes mensuales    2

──────────────────────────────
⚙ Sistema                        ← un solo punto de entrada: Ajustes, Datos
                                    (export/import), Ayuda, Atajos — todo detrás
                                    de este ítem, no 5 filas sueltas al pie
👤 Vladimir
```

Baja de 17+ objetivos en una columna plana a **7 objetivos de primer nivel** (5 de
navegación + Espacio activo + Sistema), con "Panel" (Dashboard) y "Papelera" movidos a
navegación secundaria dentro del ítem "Sistema" — son vistas de consulta ocasional, no
destinos de cada sesión (decisión ya fundamentada en `DISENO.md` §2.7).

### 5.4 Regla de exclusividad de overlays (resuelve §1.12, la falla más grave de la captura)

**Un solo overlay modal activo a la vez, sin excepción.** Overlay = paleta de comandos,
diálogo de creación/edición, panel de confirmación, hoja (sheet) de detalle en mobile.
Abrir cualquier overlay:
1. Aplica un scrim (`hsl(var(--ink) / 0.35)`, blur 2px) sobre todo lo demás.
2. Cierra cualquier otro overlay que estuviera activo (sin perder su estado —
   `TaskModal` con cambios sin guardar pide confirmación antes de cerrarse).
3. Atenúa (no destruye) los widgets flotantes a `opacity: 0.5, pointer-events: none`
   — ver estado "Deshabilitado por overlay activo" en §4.6.

Esta regla, sola, elimina el problema más grave identificado en §1.12: la escena de la
captura (comandos + formulario + ocho widgets, todos interactivos a la vez) queda
estructuralmente prohibida por el sistema, no solo desaconsejada por guía de estilo.

### 5.5 Breakpoints y colapso

| Breakpoint | Ancho | Comportamiento |
|---|---|---|
| **Desktop** | ≥ 1180px | Layout de 3 franjas completo, widgets flotantes disponibles |
| **Tablet** | 768–1179px | Sidebar colapsa a rail de íconos (64px, expandible con clic, nunca hover-only); panel lateral pasa a superponerse (overlay) en vez de convivir con el contenido; widgets flotantes se ofrecen como tarjetas ancladas, no libres |
| **Mobile** | < 768px | Sidebar se convierte en nav inferior de 5 ítems (los mismos 5 de "Navegación", nunca más); header de vista se simplifica a un título + un botón de acción; **los widgets flotantes no existen en mobile** — su contenido se ofrece como tarjetas apilables dentro de Hoy, opcionales, nunca superpuestas a nada |

Regla dura: cualquier patrón que en desktop dependa de posicionamiento libre superpuesto
(widgets flotantes) tiene una **variante distinta, no una versión encogida**, en mobile.
Encoger un widget flotante a un teléfono no produce un buen resultado — se rediseña
como tarjeta de lista, con la misma anatomía interna de contenido pero sin chrome de
ventana flotante.

---

## 6. Design System

### 6.1 Spacing scale

Una sola rejilla de 4px para toda la app (reemplaza los 9 valores sueltos detectados en
la auditoría de la app real):

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 72` (px)

Uso recomendado: 4/8 para separaciones internas de componente (ícono-a-texto, chip
padding); 12/16 para padding de tarjeta y separación entre elementos de una lista;
20/24 para separación entre bloques dentro de una sección; 32/40 para separación entre
secciones; 56/72 para separación entre zonas mayores de layout (ej. header y contenido).

### 6.2 Radius

`4 · 8 · 12 · 16 · 24 · 999` (px) — base 12px (se conserva de la app real).
- 4px: chips pequeños, indicadores.
- 8px: inputs, botones secundarios.
- 12px: tarjetas estándar, botones primarios.
- 16px: paneles, diálogos.
- 24px: superficies `.glass` (widgets, dock).
- 999px (pill): badges, avatares, botón de captura rápida.

### 6.3 Tipografía — 3 niveles, sin excepción

| Nivel | Tamaño/peso | Uso |
|---|---|---|
| **Display** | 18/600 · 24/700 · 32/700, tracking −0.01 a −0.02em | Un elemento por pantalla: saludo de Hoy, título de vista, título de entidad abierta |
| **Cuerpo** | 14/400–600, line-height 1.55 | Todo lo que se lee: descripciones, comentarios, contenido de nota, texto de fila |
| **Metadato** | 11/600, line-height 1.4 | Todo lo que se escanea: chips, badges, fechas, contadores, labels uppercase |

Prohibido: cualquier tamaño fuera de esta lista (elimina el 43% de tamaños arbitrarios
detectados en la auditoría de la app real).

### 6.4 Color — capas separadas por función

1. **Marca** (`--primary`, índigo-violeta 250°): CTA primaria, ítem de navegación
   activo, foco, enlaces. Nunca se usa para comunicar estado.
2. **Semántico de estado** (`--danger` rojo / `--warning` ámbar / `--success` verde):
   prioridad, vencimiento, completado. Reservado — nunca se usa como decoración ni como
   color de marca.
3. **Neutros** (`--ink`, `--ink-soft`, `--ink-faint`, `--border`, `--muted`): texto y
   estructura.
4. **Ambiental** (los 3 radiales cálidos existentes): solo como fondo detrás de
   superficies `.glass`, nunca detrás de texto de lectura extensa (riesgo de contraste).

Regla dura que la captura de referencia viola: un color de la capa 1 nunca aparece
también con función de la capa 2 en la misma pantalla.

### 6.5 Elevación (sombras)

| Nivel | Uso | Sombra |
|---|---|---|
| `elevation-0` | Superficie plana (fondo) | ninguna |
| `elevation-1` | Tarjeta en reposo | `0 1px 2px hsl(ink/.04)` |
| `elevation-2` | Tarjeta interactiva / widget idle | `0 1px 2px hsl(ink/.04), 0 8px 20px -12px hsl(ink/.14)` |
| `elevation-3` | Hover de tarjeta/widget | `0 2px 6px hsl(ink/.06), 0 14px 30px -14px hsl(ink/.20)` |
| `elevation-4` | Widget en arrastre, diálogo activo | `0 4px 12px hsl(ink/.08), 0 24px 48px -18px hsl(ink/.32)` |

### 6.6 Blur (`.glass`)

`backdrop-filter: blur(18px) saturate(1.4)`, fondo `hsl(var(--bg2) / 0.7)` en claro,
`0.6` en oscuro, borde `1px solid hsl(var(--border) / 0.6)`. Uso reservado a: widgets,
dock, overlays sobre fondo ambiental, command palette. **Nunca** en superficies de
lectura extensa (listas largas, editor de notas) — el blur compite con la legibilidad
del texto que contienen.

### 6.7 Componentes base (especificación, no implementación)

- **Card**: radio 12px, `elevation-1` en reposo, `elevation-2` si es interactiva,
  padding 16px estándar / 12px en listas densas.
- **Button primario**: radio 12px (pill 999px si es CTA flotante), altura 36px estándar
  / 44px en formularios táctiles, un solo color de acento por pantalla.
- **Button secundario**: mismo tamaño, fondo `--muted`, sin sombra.
- **Button ghost**: sin fondo ni borde, aparece en hover.
- **Input**: altura 36px, radio 8px, borde 1px `--border`, foco: borde `--primary` +
  anillo de 2px al 20% de opacidad.
- **Dialog**: radio 16px, `elevation-4`, ancho máximo 560px (formularios cortos) / 720px
  (formularios largos con tabs internas), scrim obligatorio (regla §5.4).
- **Panel** (lateral): mismo radio y elevación que Dialog pero anclado a un borde, sin
  scrim si convive con contenido (desktop ≥1180px); con scrim si se abre superpuesto
  (tablet/mobile).
- **Lista**: fila de 44px mínimo de alto (objetivo táctil), separador 1px `--border` o
  espaciado de 4px entre tarjetas si el estilo es "lista de tarjetas".
- **Tabla**: uso reservado a datos tabulares reales (ej. importación CSV con vista
  previa) — nunca para reemplazar una lista de tareas.
- **Badge**: pill 999px, 11px/600, un color semántico o de marca, nunca ambos a la vez.
- **Tag/Chip**: pill 999px, incluye punto de color + texto, usado para proyecto/etiqueta
  — visualmente distinto del Badge (que comunica estado, no categoría).
- **Avatar**: círculo 24/32/40px según contexto (fila / header / perfil), iniciales sobre
  fondo del color asignado a la persona si no hay foto.
- **Ícono**: un solo set (línea, 1.5-1.8px de grosor, esquinas redondeadas), 14/16/18/20px
  según densidad del contexto — reemplaza los tres sistemas de ícono detectados en §1.7.

---

## 7. Sistema de Motion

### 7.1 Duraciones

| Token | Valor | Uso |
|---|---|---|
| `duration-instant` | 80ms | Feedback de click/tap (escala de botón) |
| `duration-fast` | 150ms | Hover, cambio de color, aparición de tooltip |
| `duration-base` | 220ms | Expandir/colapsar, apertura de dropdown, transición de vista |
| `duration-slow` | 320ms | Apertura de diálogo/panel, drag-to-drop de tarjeta Kanban |
| `duration-deliberate` | 450ms | Entrada escalonada de una lista completa (stagger) |

### 7.2 Curvas

| Token | Curva | Uso |
|---|---|---|
| `ease-standard` | `cubic-bezier(.4,0,.2,1)` | La mayoría de transiciones de UI (fade, color) |
| `ease-out-quart` | `cubic-bezier(.16,1,.3,1)` | Elementos que entran a la pantalla (aparecer, expandir) |
| `ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | Confirmaciones con carácter: completar tarea, crear algo, un botón que "rebota" levemente |
| `ease-in-quart` | `cubic-bezier(.5,0,.75,0)` | Elementos que salen de la pantalla (cerrar, colapsar) |
| linear | — | Solo para loaders indeterminados y el giro del ícono de sincronización |

### 7.3 Especificación por gesto

- **Hover**: `duration-fast` + `ease-standard`, cambia fondo/borde, nunca tamaño (evita
  "salto" de layout).
- **Click/Tap (press)**: `duration-instant`, escala a 0.97, `ease-standard`; al soltar,
  vuelve a 1 con `ease-spring` — el micro-rebote es la firma táctil de la marca.
- **Drag (widget o tarjeta Kanban)**: elevación sube inmediatamente (sin transición, 0ms
  — la mano del usuario ya está "levantando" el objeto, no debe sentirse un retraso),
  el elemento sigue al cursor 1:1 sin easing durante el arrastre.
- **Drop**: `duration-base` + `ease-out-quart` para el asentamiento final en la nueva
  posición; si cae en una columna Kanban válida, un pulso de color (`elevation` sube y
  vuelve en 300ms) confirma la aceptación; si se suelta en zona inválida, `duration-fast`
  de vuelta al origen con `ease-in-quart` (siente "rechazo", más corto que la aceptación).
- **Expand/Collapse**: altura anima con `duration-base` + `ease-out-quart` al expandir,
  `ease-in-quart` al colapsar (expandir se siente generoso, colapsar se siente eficiente
  — asimetría deliberada).
- **Fade** (aparición/desaparición de overlay, scrim): `duration-fast` para el fondo
  (scrim), `duration-base` para el contenido del overlay, desfasados 40ms entre sí (el
  scrim empieza un instante antes que el contenido).
- **Momentum** (scroll de listas largas, franja semanal): se respeta el momentum nativo
  de la plataforma — nunca se intercepta el scroll con easing custom, salvo en el
  "snap" de la franja semanal / carrusel de Kanban en mobile (`scroll-snap-type: x
  mandatory`).
- **Reduced motion**: con `prefers-reduced-motion`, todas las transiciones de posición/
  escala se sustituyen por fade de opacidad de 100ms; el spring de confirmación se
  sustituye por un cambio de color instantáneo. Ninguna animación es la única portadora
  de información de estado — siempre hay un cambio de color/ícono/texto en paralelo.

---

## 8. Microinteracciones (100+)

Organizadas por zona. Cada una responde "qué pasa exactamente cuando…".

**Captura y creación (1-14)**
1. Foco en el campo de captura rápida → el placeholder se atenúa y aparece un cursor
   parpadeante con el color de marca.
2. Escribir `!alta` → la palabra se resalta en rojo en vivo, dentro del mismo input.
3. Escribir `#proyecto` → aparece un popover de autocompletado con los proyectos que
   matchean, navegable con flechas.
4. Escribir `@nombre` → mismo patrón, con avatares en el popover.
5. Escribir una fecha en lenguaje natural ("mañana", "en 3 días") → se subraya con un
   guion punteado y se previsualiza la fecha resuelta como chip fantasma a la derecha.
6. Presionar Enter con contenido válido → el input se vacía con un fundido de 100ms y
   una fila fantasma de la tarea creada aparece brevemente en la lista de destino con un
   destello del color de marca que se disuelve en 400ms.
7. Presionar Enter con sintaxis inválida → el borde del input pulsa en rojo una vez
   (`duration-fast`) y aparece un mensaje breve debajo, sin bloquear el texto escrito.
8. Arrastrar un archivo sobre cualquier superficie de captura → el borde de la superficie
   se resalta con guiones animados en movimiento (~1px/s) señalando "soltar aquí".
9. Pegar una imagen (Ctrl+V) dentro de un comentario → aparece una miniatura de carga
   con un anillo de progreso hasta confirmarse la subida.
10. Crear una tarea desde la paleta de comandos → el overlay se cierra con fade y el
    foco vuelve exactamente a donde estaba antes de abrir la paleta.
11. Doble clic en un espacio vacío de una columna Kanban → abre el formulario de captura
    rápida anclado a esa columna, con foco inmediato en el título.
12. Escribir el título de una plantilla ya guardada → sugerencia inline ("¿Usar la
    plantilla 'Reunión semanal'? Tab para aplicar").
13. Cancelar una captura a medio escribir (Esc) → pide confirmación solo si hay texto;
    si está vacío, cierra sin preguntar.
14. Crear una subtarea desde el detalle de una tarea → la nueva fila entra con
    `duration-fast` de fade + un leve desplazamiento hacia abajo de las filas siguientes.

**Completar y estado (15-28)**
15. Clic en checkbox de tarea → el checkbox se llena con `ease-spring` (rebote sutil),
    el texto del título gana `line-through` animado (se dibuja de izquierda a derecha en
    150ms, no aparece de golpe).
16. Completar la última subtarea pendiente → el botón "Completar" de la tarea padre, que
    estaba deshabilitado, se habilita con un pulso de color que dura 300ms.
17. Intentar completar una tarea con subtareas pendientes → el botón tiembla lateralmente
    2px, dos veces, y aparece un tooltip explicando cuántas faltan.
18. Deshacer un "completar" (clic de nuevo) → el `line-through` se retira con la misma
    animación de dibujo, en reversa.
19. Una tarea vencida cambia de estado a "hoy" a medianoche → transición de color de
    borde de rojo a ámbar/normal, con fundido de 400ms, sin recargar la pantalla.
20. Marcar prioridad "Alta" desde el menú contextual → el borde izquierdo de la fila
    cambia de color con una transición de 150ms y un leve "flash" del color nuevo.
21. Iniciar el timer de una tarea → el ícono de reloj empieza a pulsar suavemente
    (opacidad 0.6↔1, loop de 2s) mientras corre.
22. Pausar el timer → el pulso se detiene inmediatamente, sin transición de salida.
23. Posponer una tarea (menú rápido) → la fila se desliza fuera de la lista actual hacia
    la derecha (200ms) y, si la lista destino es visible, entra por la izquierda en la
    posición correspondiente.
24. Archivar una tarea (swipe en mobile) → el fondo rojo se revela progresivamente según
    el porcentaje de arrastre, con un ícono que crece de 0 a 100% de escala.
25. Restaurar desde la papelera → la fila aparece con `ease-out-quart` desde una
    opacidad 0 y un leve movimiento hacia arriba, señalando "vuelve a subir a la lista".
26. Bloqueo por dependencia → el candado del badge "bloqueado" hace un pequeño giro de
    15° y vuelve, una sola vez, al aparecer (llama la atención sin ser una animación en
    loop molesta).
27. Vencimiento a punto de ocurrir (menos de 1 hora) → el chip de fecha cambia a un
    tono más intenso de rojo con una transición de color de 300ms, sin parpadeo.
28. Racha diaria alcanza un múltiplo de 7 → el emoji 🔥 hace un único rebote de escala
    (1 → 1.3 → 1) con `ease-spring`, para celebrar sin ser intrusivo.

**Navegación (29-42)**
29. Cambiar de vista en el sidebar → el contenido saliente se desvanece 100ms mientras
    el entrante aparece con un leve desplazamiento vertical de 6px hacia arriba,
    superpuestos (no hay "pantalla en blanco" intermedia).
30. Hover sobre un ítem de sidebar → fondo `--muted` aparece con `duration-fast`, sin
    mover el texto.
31. Ítem de sidebar activo → barra de acento de 3px a la izquierda del ítem, con
    transición de posición de `duration-base` al cambiar de ítem activo (se desliza, no
    salta).
32. Expandir "Espacio activo ▾" → la lista de proyectos se desliza hacia abajo con
    `duration-base`, empujando (no superponiendo) los ítems siguientes del sidebar.
33. Cambiar de Espacio → todo el contenido principal (Hoy, Inbox, etc.) se atenúa a
    opacidad 0.4 por 100ms mientras recarga el contexto, luego vuelve a 1 — señala
    "cambié de mundo" sin una pantalla de carga completa.
34. Atajo de teclado numérico (`1`-`5`) → el ítem correspondiente del sidebar hace un
    flash breve de fondo antes de navegar, confirmando qué tecla se detectó.
35. Búsqueda con Ctrl+K → el overlay entra con fade + escala desde 0.98 a 1 en
    `duration-base`, el scrim detrás se oscurece en paralelo.
36. Escribir en la búsqueda → resultados se filtran en vivo, cada resultado nuevo entra
    con fade de 80ms (no reflow brusco de toda la lista).
37. Navegar resultados con flechas → el resultado resaltado tiene fondo `--muted` que
    se desliza suavemente entre ítems adyacentes (no un salto de color instantáneo).
38. Breadcrumb de proyecto (dentro de Kanban) → clic en el nivel superior anima un
    "zoom out" leve (escala 1.02 → 1) al volver a la vista de lista de proyectos.
39. Scroll de la lista principal → el header de vista gana una sombra sutil
    (`elevation-1`) solo cuando el contenido se desplaza debajo de él (más de 4px de
    scroll), señalando profundidad sin un borde estático permanente.
40. Volver atrás (gesto o botón) desde el Panel de detalles → el panel se desliza hacia
    la derecha y se desvanece simultáneamente, `duration-base`.
41. Tab entre campos de un formulario → el foco se mueve con el anillo de foco
    apareciendo/desapareciendo con `duration-fast`, nunca instantáneo (ayuda a rastrear
    visualmente el salto).
42. Cambio de tema claro/oscuro → transición de color de fondo/texto de toda la app en
    `duration-slow`, con `ease-standard`, para que el cambio se sienta deliberado, no un
    parpadeo.

**Kanban y drag-and-drop (43-52)**
43. Iniciar arrastre de una tarjeta → la tarjeta original queda como "hueco" fantasma
    (opacidad 0.3, borde punteado) en su posición mientras una copia sigue al cursor.
44. Arrastrar sobre una columna válida → la columna gana un resplandor interior sutil
    de su color de estado.
45. Arrastrar sobre zona inválida (fuera de cualquier columna) → el cursor cambia a
    "no permitido" y la tarjeta arrastrada gana un leve tinte rojo en el borde.
46. Soltar en nueva columna → la tarjeta se asienta con `ease-spring`, la columna
    destino actualiza su contador con un pequeño "tick" numérico animado (no salto
    brusco de número).
47. Reordenar dentro de la misma columna → las tarjetas vecinas se desplazan para abrir
    espacio en tiempo real mientras se arrastra (no solo al soltar).
48. Arrastrar una tarjeta cerca del borde inferior visible de una columna larga →
    autoscroll suave de la columna, velocidad proporcional a la cercanía al borde.
49. Colapsar una columna (clic en el header) → se reduce a una franja vertical angosta
    con el título rotado 90°, transición `duration-base`.
50. Agregar columna nueva (botón fantasma "+") → el formulario de nombre aparece inline
    en el lugar del botón, con foco inmediato.
51. Arrastrar para reordenar columnas completas (no tarjetas) → mismo lenguaje que
    reordenar tarjetas, pero con un handle dedicado en el header de columna (evita
    arrastres accidentales al mover tarjetas).
52. Tarjeta bloqueada (dependencia sin resolver) intentando arrastrarse → no se levanta;
    en su lugar tiembla lateralmente 2px, dos veces, igual que el intento de completar
    (§17) — mismo lenguaje de "esto no se puede, por esta razón" en toda la app.

**Widgets (53-64)**
53. Arrastrar el header de un widget → ver Motion §7.3 (elevación instantánea, sigue al
    cursor 1:1).
54. Acercar un widget a 16px de un borde → aparece una guía de acoplamiento (línea de 2px
    en color de acento) antes de soltar, confirmando "si soltás acá, se ancla".
55. Soltar sobre la guía de acoplamiento → el widget se transforma de flotante a
    acoplado con una transición de forma (radio y sombra cambian en `duration-base`).
56. Colapsar un widget → el cuerpo se retrae con `duration-base`/`ease-in-quart`, el
    header permanece fijo en su lugar (no salta de posición).
57. Cerrar un widget → fade + escala a 0.95 en `duration-fast`, desaparece.
58. Reactivar un widget desde el selector → aparece en su última posición conocida con
    fade + escala desde 0.95, `ease-out-quart`.
59. Redimensionar → el contenido interno se reflow en vivo (no espera a soltar el mouse
    para recalcular el layout interno).
60. Hover sobre un widget → el resize handle aparece con fade de 100ms.
61. Widget alcanza su tamaño mínimo durante la redimensión → un leve rebote (`ease-
    spring`, 1-2px) en el borde señala el límite, en vez de simplemente detenerse en seco.
62. Un overlay modal se abre mientras hay widgets flotantes → los widgets se atenúan a
    opacidad 0.5 simultáneamente, `duration-fast`, todos a la vez (regla §5.4).
63. El overlay se cierra → los widgets vuelven a opacidad 1 con el mismo `duration-fast`.
64. Pomodoro llega a 00:00 → el anillo circular completa su vuelta con un pulso final de
    color (rojo → color de marca) y una notificación del sistema, si el usuario la
    habilitó.

**Notas y edición de texto (65-74)**
65. Foco en el título de una nota → el campo gana un borde inferior de 2px en color de
    marca que se dibuja de izquierda a derecha (no aparece de golpe).
66. Escribir `#` al inicio de una línea en el editor de nota → sugerencia inline de
    formato (encabezado), con preview en vivo del tamaño resultante.
67. Seleccionar texto → aparece una barra flotante contextual (negrita, cursiva, enlace,
    convertir en tarea) con fade + leve movimiento hacia arriba desde la selección.
68. Convertir una línea de nota en tarea vinculada → la línea se transforma con una
    transición de fondo (de transparente a `--muted` con checkbox), sin recargar el
    editor.
69. Autoguardado → un indicador discreto ("Guardado" con ícono de check) aparece por 1.5s
    en la esquina del editor tras cada pausa de escritura de 800ms, luego se desvanece.
70. @mención dentro de un comentario → el nombre mencionado queda resaltado con fondo
    `--primary/0.12` de forma permanente (no solo mientras se escribe).
71. Arrastrar para reordenar una lista dentro de una nota → mismo lenguaje de "hueco
    fantasma" que Kanban (§43), reutilizado deliberadamente.
72. Nota vinculada a un proyecto → clic en el chip de proyecto dentro del editor abre un
    popover de vista previa del proyecto sin navegar fuera de la nota.
73. Buscar dentro de una nota larga (Ctrl+F local) → coincidencias resaltadas con un
    fondo ámbar suave, la actual con un contorno adicional.
74. Cerrar el editor de nota sin guardar cambios pendientes → transición normal (no hay
    diálogo de confirmación si el autoguardado ya corrió, coherente con §69).

**Calendario (75-82)**
75. Hover sobre un día con eventos → el día gana `elevation-1` y una vista previa
    (tooltip) de los primeros 3 eventos aparece con fade tras 400ms de hover sostenido.
76. Arrastrar una tarea desde la lista hacia un día del calendario → el día destino se
    resalta igual que una columna Kanban válida (§44), mismo lenguaje reutilizado.
77. Redimensionar un evento en la vista semanal (arrastrar su borde inferior) → la
    duración se actualiza en vivo con una etiqueta flotante mostrando la nueva hora de
    fin.
78. Cambiar de vista Mes → Semana → Agenda → transición de layout con
    `duration-slow`/`ease-standard`, los eventos existentes hacen morphing de posición
    en vez de desaparecer y reaparecer.
79. Día actual → resplandor sutil de anillo alrededor del número de día, sin parpadeo,
    permanente mientras sea el día actual.
80. Clic en un espacio vacío de un día → abre captura rápida con la fecha preasignada,
    mismo patrón que doble clic en Kanban (§11).
81. Conflicto de horario entre dos eventos → ambos bloques ganan un borde diagonal
    rayado sutil, señalando superposición sin bloquear la vista.
82. Sincronización con Google Calendar en curso → ícono de sincronización gira
    (`linear`, sin easing) solo mientras la operación está en curso, se detiene en seco
    al terminar (no hay desaceleración — terminar es instantáneo, no gradual).

**Dashboard, Espacios y misceláneos (83-100+)**
83. Hover sobre una celda del heatmap de actividad → tooltip con fecha exacta y cantidad,
    fade de 100ms, la celda gana un anillo de 1px.
84. Cambiar de Espacio desde la pantalla de Espacios (clic en una card) → la card
    seleccionada gana un anillo de color inmediato y el resto de las cards se atenúan
    levemente (opacity 0.7) por 200ms para confirmar la elección antes de navegar.
85. Crear un nuevo Espacio → el formulario de ícono/color aparece como diálogo con
    `duration-base`, la selección de emoji tiene hover con escala 1.15.
86. Arrastrar un proyecto de un Espacio a otro (menú contextual "Mover a") → no es un
    drag real de superficie a superficie; el ítem del menú seleccionado da un flash de
    confirmación antes de cerrar el menú.
87. Actualización en tiempo real por sincronización de otro dispositivo → la fila
    afectada recibe un resalte de fondo (`--primary/0.08`) que se desvanece en 1.5s,
    señalando "esto cambió sin que vos lo tocaras" sin ser disruptivo.
88. Error de red al guardar → el ícono de sincronización cambia a un triángulo de alerta
    con un único parpadeo (no loop continuo — un loop continuo generaría ansiedad
    innecesaria).
89. Reconexión exitosa tras error → el triángulo se transforma (morph, no salto) de
    vuelta al ícono de check, con `ease-spring`.
90. Copiar un enlace (compartir) → el botón cambia su ícono a un check por 1.5s con
    `ease-spring`, luego vuelve al ícono original.
91. Tooltip genérico en cualquier ícono sin texto → aparece tras 500ms de hover
    sostenido (nunca instantáneo, para no interrumpir un movimiento de mouse de paso),
    fade de 100ms.
92. Menú contextual (clic derecho) → aparece anclado al cursor con escala desde 0.96 a 1
    y fade, `duration-fast`, con origen de transformación en la esquina más cercana al
    clic (nunca desde el centro).
93. Confirmación destructiva (eliminar proyecto) → el diálogo tiene el botón destructivo
    en rojo, deshabilitado por 600ms tras la apertura (previene un doble-clic accidental
    que confirme antes de leer).
94. Deshacer disponible tras una acción destructiva (toast "Enviado a la papelera —
    Deshacer") → la barra de progreso del toast se vacía visualmente durante los 5s de
    ventana de deshacer, comunicando el tiempo restante sin un número.
95. Arrastre de un archivo hacia la vista Archivos → toda la zona de drop gana un borde
    punteado animado, mismo lenguaje que §8 (captura), reutilizado a propósito.
96. Carga de un archivo grande → barra de progreso lineal dentro de la tarjeta del
    archivo, con textura sutil en movimiento (no una barra sólida estática) para
    comunicar actividad incluso en conexiones lentas.
97. Zoom de imagen adjunta (clic para expandir) → transición de "imagen expandida desde
    su posición original" (shared element transition), no un fade genérico — la imagen
    crece desde su miniatura hasta el centro de la pantalla.
98. Cambio de responsable de una tarea (selector de persona) → el avatar anterior se
    desvanece mientras el nuevo aparece con un leve crecimiento de escala, superpuestos
    50ms.
99. Primera vez que se usa un atajo de teclado nuevo (detectado por telemetría local, no
    servidor) → un pequeño indicador de "Tip" aparece una única vez la primera vez que
    la acción equivalente se hace con el mouse, ofreciendo el atajo — nunca se repite
    una vez descartado.
100. Onboarding de primer uso (3 pantallas) → transición tipo carrusel horizontal,
     `duration-base`/`ease-standard`, con los puntos indicadores inferiores animando su
     posición activa con el mismo lenguaje que la barra de acento del sidebar (§31) —
     consistencia deliberada entre ambos indicadores de "posición actual".
101. Cerrar sesión → todo el contenido de la app se desvanece a blanco/negro (según
     tema) en `duration-slow`, para una sensación de cierre limpio, no un corte abrupto.
102. Notificación push local (recordatorio) → entra desde arriba con `ease-out-quart`,
     permanece 4s, sale con `ease-in-quart` — mismo par de curvas asimétrico que
     expand/collapse (§7.3), reutilizado como firma de "entra con generosidad, sale con
     eficiencia" en toda la app.

---

## 9. User Flows completos

Notación: cada paso indica pantalla/estado → acción del usuario → resultado. Los flujos
asumen las reglas de §5.4 (un solo overlay a la vez) y reusan las microinteracciones de
la sección 8 por número de referencia.

### 9.1 Nuevo pendiente

1. Estado inicial: cualquier pantalla. Dos caminos posibles, nunca más de dos a la vez
   (resuelve §1.14/§3.6):
   - **(a) Atajo global `N`** → foco salta al campo de captura rápida del header (si no
     está visible en la vista actual, aparece un mini-overlay de captura anclado al
     centro-superior, microint. §35).
   - **(b) Clic en el único botón persistente "Nuevo pendiente"** (sidebar).
2. Usuario escribe con sintaxis libre (`!`, `#`, `@`, fecha natural) — microint. 1-5.
3. Enter → tarea creada, aparece en su lista de destino con destello (microint. 6).
4. Si el usuario quiere más detalle (subtareas, adjuntos, descripción larga): clic en
   la tarea recién creada → se abre el Panel de detalles (no un modal nuevo — la tarea
   ya existe, esto es edición, no creación) con foco en el campo de descripción.

**Errores contemplados**: sintaxis no reconocida (microint. 7); proyecto mencionado con
`#` que no existe → se ofrece "Crear proyecto 'X'" como primera opción del
autocompletado, no se crea silenciosamente ni se descarta la mención.

### 9.2 Nueva nota

1. Desde Notas: botón "+" en el header de vista → nueva nota vacía se abre directamente
   en modo edición (sin diálogo intermedio de "nombre de la nota" — el título es la
   primera línea del editor, mismo patrón que Craft/Notion).
2. Desde cualquier otra vista: atajo `Shift+N` o comando de paleta "Nueva nota".
3. Autoguardado desde la primera pulsación (microint. 69) — no existe un botón
   "Guardar" explícito.
4. Cerrar (Esc o navegar afuera) → la nota queda guardada; si el título quedó vacío, se
   le asigna "Sin título" y se lista al tope de "Notas recientes" igual.

### 9.3 Nuevo proyecto

1. Desde Espacios o Proyectos: botón "+" → diálogo con nombre, color, ícono opcional,
   Espacio destino (preseleccionado si se abrió desde dentro de un Espacio).
2. Confirmar → el proyecto aparece en la lista con fade + el diálogo se cierra
   (microint. de diálogo estándar §5.4).
3. Estado vacío del proyecto recién creado: tablero Kanban con las columnas por defecto
   ya creadas y una invitación central ("Arrastrá tu primera tarea acá, o capturala con
   `N`") — nunca una pantalla en blanco sin guía.

### 9.4 Nueva checklist (subtareas)

1. Dentro del Panel de detalles de una tarea → sección "Subtareas" → campo de texto
   siempre visible al final de la lista existente (o al inicio si la lista está vacía).
2. Escribir texto + Enter → nueva subtarea entra (microint. 14), el foco permanece en
   el campo para seguir agregando en cadena (flujo de captura rápida sucesiva, sin
   reabrir nada entre una y otra).
3. Escribir `>` al inicio de una subtarea → la convierte en sub-subtarea anidada
   (indentación visual, microint. de indentado consistente con Notas §71).

### 9.5 Mover tarjeta (Kanban)

1. Presionar sobre el cuerpo de la tarjeta (no sobre botones internos) → se activa modo
   arrastre tras 4px de movimiento (umbral que evita arrastres accidentales al hacer
   clic para abrir el detalle).
2. Arrastrar sobre columnas → feedback en vivo (microint. 43-48).
3. Soltar → confirmación visual + contador de columna actualizado (microint. 46).
4. **Alternativa sin mouse**: con la tarjeta enfocada por teclado, `Ctrl+→`/`Ctrl+←`
   mueve la tarjeta a la columna siguiente/anterior — accesible sin drag-and-drop
   (requisito de accesibilidad, ver §10).

### 9.6 Completar tarea

1. Clic en checkbox (o `Space` con la fila enfocada por teclado) → microint. 15.
2. Si tiene subtareas pendientes → bloqueo con feedback (microint. 17), no se completa.
3. Si tiene recurrencia → tras completar, toast "Se repite: próxima el [fecha]" con
   opción de deshacer que revierte tanto el completado como la creación de la siguiente
   instancia (evita el bug de integridad de proyecto ya corregido en la app real — la
   siguiente instancia hereda todos los campos de contexto, incluida su pertenencia a
   proyecto).
4. Sin recurrencia → la fila permanece visible con estilo completado por el resto de la
   sesión (no desaparece de golpe — desaparecer instantáneamente sentiría el trabajo
   "borrado" en vez de "hecho"); al recargar/cambiar de vista, se reclasifica según los
   filtros activos.

### 9.7 Buscar

1. `Ctrl+K` desde cualquier pantalla → paleta de comandos con scrim (microint. 35, regla
   §5.4 — cierra cualquier otro overlay).
2. Escribir → resultados en vivo agrupados por tipo (Pendientes/Notas/Proyectos/
   Archivos/Personas), microint. 36.
3. Navegar con flechas (microint. 37), Enter para abrir el resultado seleccionado en su
   superficie natural (una tarea abre el Panel de detalles, una nota abre el editor).
4. Sin resultados → estado vacío dedicado ("Sin resultados para 'x' — probá buscar por
   proyecto o etiqueta"), nunca una lista en blanco sin explicación.

### 9.8 Filtrar

1. Dentro de una lista (Pendientes, Inbox): controles de filtro agrupados por dimensión
   única cada uno (Estado, Prioridad, Responsable, Fecha) — nunca duplicados como chip
   + dropdown simultáneos (resuelve la redundancia detectada en la auditoría de la app
   real).
2. Aplicar un filtro → la lista se actualiza con un fade breve de las filas que
   entran/salen del resultado (no un salto brusco de contenido).
3. Guardar el filtro actual como "Filtro guardado" → aparece inmediatamente como chip
   nuevo en la fila de guardados, con foco listo para renombrarlo.

### 9.9 Captura rápida (flujo dedicado, además del 9.1)

1. Disponible desde: atajo global, campo persistente del header, y **un** widget
   opcional (nunca los tres simultáneos como superficies separadas de la misma acción
   — resuelve §1.14, fusión #2 de §3).
2. El parser interpreta en vivo (microint. 2-5) y muestra un preview de chips debajo del
   campo antes de confirmar — el usuario ve cómo se va a interpretar antes de comprometerse.
3. Confirmar (Enter o botón) → se decide automáticamente el tipo de entidad (tarea por
   defecto; si el texto empieza con una sintaxis de nota reconocida, se ofrece
   "¿Crear como nota en cambio?" antes de confirmar, no después).

### 9.10 Cambio de espacio

1. Selector "Espacio activo ▾" en el sidebar (§5.3) → dropdown con todos los Espacios +
   "Todos" (sin filtro) al tope.
2. Seleccionar uno → atenuación breve del contenido (microint. 33), recarga del
   contexto: Hoy, Inbox, Proyectos y Notas se filtran automáticamente por ese Espacio.
3. El Espacio activo persiste entre sesiones (se recuerda al reabrir la app) hasta que
   el usuario lo cambie explícitamente.

### 9.11 Cambio de contexto (mobile ↔ desktop, o interrupción de tarea)

1. La app nunca pierde el "dónde estabas": cambiar de dispositivo (gracias a sync) o
   volver tras minimizar reabre exactamente en la misma vista, con el mismo scroll y el
   mismo panel lateral abierto si lo había.
2. Un widget con estado activo (Pomodoro corriendo) sigue corriendo en el modelo de
   datos aunque el widget esté cerrado — al reabrirlo, muestra el tiempo transcurrido
   real, no reinicia (coherente con §4.5, "cerrar no destruye estado").

---

## 10. Notas de accesibilidad transversales

- **Contraste**: todo texto sobre superficie `.glass` debe cumplir WCAG AA (4.5:1) contra
  el fondo *más claro* que esa superficie pueda tener (el gradiente ambiental varía) —
  se valida contra el peor caso, no el promedio.
- **Foco visible**: todo elemento interactivo tiene un anillo de foco de 2px en color de
  marca, sin excepción — incluidos los widgets completos (§4.6) y las tarjetas Kanban.
- **Navegación sin mouse**: drag-and-drop siempre tiene una alternativa de teclado (ver
  9.5); ningún flujo crítico (crear, completar, mover, buscar) depende exclusivamente
  de un gesto de arrastre.
- **Reduced motion**: especificado en §7.3 — ninguna animación es portadora única de
  información de estado.
- **Lectores de pantalla**: los cambios de estado que hoy son solo visuales (color de
  borde de prioridad, pulso de racha) tienen equivalente textual accesible (`aria-label`
  describiendo el estado, no solo el color).
- **Objetivo táctil mínimo**: 44×44px en toda superficie táctil (mobile/tablet),
  incluidos los handles de widgets y los resize handles, que en desktop pueden ser más
  pequeños (14px) pero ganan un área de hit-testing invisible ampliada.

---

## 11. Glosario y siguiente paso

- **Overlay**: cualquier superficie que toma foco exclusivo (diálogo, paleta de
  comandos, sheet de detalle en mobile) — sujeta a la regla de exclusividad de §5.4.
- **Widget**: superficie flotante opcional, nunca la única forma de acceder a un dato
  (§4.1).
- **Panel**: superficie anclada a un borde, puede convivir con contenido (desktop) o
  superponerse (tablet/mobile).
- **Entidad**: el concepto base del modelo de datos (tarea, nota, proyecto, evento,
  archivo) — ya presente en la app real, este documento no lo modifica, diseña la capa
  visual sobre él.

**Siguiente paso**: con este PDS aprobado, el equipo de ingeniería puede tomar cada
sección (4-9) como especificación de implementación directa, sin decisiones de diseño
adicionales pendientes. Recomendación de secuencia: primero §5 (layout + regla de
exclusividad de overlays, porque corrige la falla más grave de la captura de
referencia) y §6 (tokens del design system, porque todo lo demás depende de ellos),
después §4 (widgets) y §7-9 (motion, microinteracciones, flows) sobre esa base.
