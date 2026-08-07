# Dirección de diseño — Pendientes Pro → Personal Workspace

Documento de crítica de producto y evolución de diseño. Sin código, sin componentes
React, sin librerías — esto es el producto, no la implementación. Roadmap, mockups y
especificaciones de UX vienen después, en turnos separados, una vez que esta dirección
esté validada contigo.

**Cómo se armó**: cada afirmación de este documento está anclada a algo verificable —
una captura de la app corriendo (Chrome, claro y oscuro, las 7 vistas) o una cita
`archivo:línea` del código real. No hay opiniones sueltas; donde algo es una opinión de
diseño se marca como tal y se explica el criterio detrás.

**El mockup que enviaste** se trata como referencia de *destino de identidad visual*
(glass, blur, tipografía display, calidez), no como plano a copiar campo por campo.
Donde el propio mockup se contradice con tu objetivo declarado — "experiencia
extremadamente limpia" — este documento lo dice explícitamente en vez de callarlo por
cortesía. Ese es el trabajo que pediste.

---

## Las cinco voces, resumidas antes de entrar en detalle

- **Product Designer (Apple)**: el problema no es que falte glass. Es que hay 9 bloques
  apilados en la pantalla que debería ser la más simple de todas, y el glass que sí
  existe se usa en 3 lugares sueltos sin ningún criterio. Apple no vende blur, vende
  *foco* — una sola cosa clara a la vez.
- **Director de UX (Linear)**: la app tiene 13 destinos navegables reales, no 7.
  Linear existe porque decidió que casi todo lo que otras apps ponen en pantalla no
  necesita estar ahí. Este producto necesita esa misma disciplina de sustracción, no
  una capa nueva de widgets encima de lo que ya sobra.
- **Staff Designer (Notion)**: el modelo de datos ya tiene la idea correcta ("todo es
  una entidad") pero la interfaz no la representa — un pendiente se abre en 4
  superficies distintas y muestra campos distintos según cuál. Notion gana porque cada
  bloque se comporta igual en todas partes. Acá no.
- **Senior Product Designer (Things 3)**: Things 3 es la referencia correcta para "Hoy"
  porque hace *una* cosa: te dice qué hacer ahora, con cero ruido. Esta "Hoy" hace lo
  opuesto — reexpone cada otra vista de la app en una sola pantalla.
- **Motion Designer (Arc Browser)**: hay una escala de movimiento definida
  (`ease-spring`, `scale-in`, timing cuidado) y casi no se usa. El motion no está
  fallando por exceso, está fallando por abandono — se construyó el lenguaje y no se
  aplicó.

---

## 1. Crítica — pantalla por pantalla, con evidencia

### 1.1 Jerarquía visual y prioridad

La app no tiene un sistema de tamaños que le diga al ojo qué mirar primero. Se midió:
**43% de los tamaños de texto en todo el código son valores arbitrarios fuera de
escala** (`text-[9px]`, `text-[10px]`, `text-[11px]`), y `text-[11px]` (69 usos) le gana
2 a 1 a `text-sm` (35 usos). La escala de display que sí existe (`text-display-lg`,
pensada para títulos grandes) se usa **cero veces** en toda la interfaz corriendo. El
resultado: casi todo el texto de la app vive entre 9 y 14 píxeles — cinco tamaños
distintos comprimidos en 5px de rango, tratando de comunicar jerarquías distintas
(un título, una etiqueta, un metadato, un badge) con diferencias que el ojo no puede
distinguir de un vistazo. Cuando todo es casi del mismo tamaño, nada es importante.

La prioridad de una tarea — Alta / Media / Baja, la señal más urgente que puede llevar
un pendiente — se codifica **solo** con el color del borde izquierdo de la fila
(`PRIORIDAD_BORDER`, 4px de ancho). Es la única señal de una decisión crítica del
usuario, y compite visualmente con nueve badges más de igual peso en la misma fila.

**Veredicto (Apple / Things 3)**: en un producto premium, la jerarquía se lee sin
esfuerzo consciente. Acá hace falta esfuerzo — hay que buscar la prioridad, no se ve.

### 1.2 Espacios en blanco y ritmo

Se midió el uso real de espaciados en Tailwind en todo `src/`: los valores de "medio
paso" (`gap-1.5` = 6px, `py-0.5` = 2px, `p-2.5` = 10px) se usan **más** que los enteros
(`gap-1.5` aparece 39 veces, más que `gap-2`). Hay **9 valores distintos** de padding de
contenedor en uso (`p-1` hasta `p-8`) y **8 valores distintos** de espaciado vertical
entre bloques. La rejilla efectiva es de 2px — que en la práctica es lo mismo que no
tener rejilla. El espacio en blanco no es un recurso de diseño en esta app todavía: es
lo que sobra después de acomodar todo lo demás.

Esto se nota en comparaciones directas dentro de la misma pantalla: el header de la
barra lateral usa `p-2.5`, el nav usa `px-2`, el pie usa `p-1.5`, el header principal
usa `px-4 py-2`, el contenido usa `p-4` en escritorio y `p-3` en móvil. Ninguno de estos
números se relaciona con otro por una razón visible.

**Veredicto (Apple)**: el espacio en blanco no es "lo que queda". Es una decisión
activa que separa lo importante de lo secundario. Acá todavía no está tomada esa
decisión — está distribuida al azar entre 9 valores distintos.

### 1.3 Carga cognitiva y navegación

La app se presenta como "7 vistas". La carga real medida es mayor:

- 7 pestañas de primer nivel (`Hoy`, `Inbox`, `Pendientes`, `Notas`, `Proyectos`,
  `Panel`, `Papelera`)
- + "Vencidos" (un octavo destino, fuera de la lista de vistas, con su propio ícono
  rojo en la barra)
- + "Ajustes" (un noveno destino, dialog en vez de vista, mismo nivel visual)
- + N filas de "Espacios" (un eje de navegación *ortogonal* completo, no una vista más)
- + 3 sub-pestañas dentro de "Pendientes" (Lista / Tablero / Calendario)
- + un sub-modo dentro de cada Proyecto (tablero / lista)

Y la misma vista se llama "Pendientes" en la barra de escritorio y "Tareas" en la barra
inferior de móvil — dos nombres para el mismo destino, porque `App.tsx` mantiene **dos
árboles de layout completamente separados y sincronizados a mano** para escritorio y
móvil (nunca comparten JSX), y esa costura es visible en cada inconsistencia de nombre y
de comportamiento entre plataformas.

**Veredicto (Linear)**: la disciplina de Linear no es "menos features". Es que cada
cosa vive en *un solo lugar* con *un solo nombre*. Acá el mismo concepto (la lista de
tareas) tiene dos nombres, y el mismo dato (una tarea vencida) es alcanzable desde al
menos tres caminos distintos (la sección de Hoy, el ítem de sidebar "Vencidos", y el
filtro "⚠ Vencidos" dentro de Pendientes).

### 1.4 "Hoy" — el caso más grave, porque es la pantalla que más se usa

Esta es la pantalla donde pediste que el usuario pase el 90% de su tiempo, y hoy es la
más recargada de las siete. Orden real, medido en el código (`OtherViews.tsx:244-311`):

1. Hero con anillo de progreso y saludo
2. Franja semanal (7 tarjetas de día)
3. Panel del día seleccionado (condicional)
4. **"Cronología de hoy"** — timeline que mezcla pendientes con hora + eventos
5. "Proyectos" — tarjetas resumen de cada proyecto abierto
6. "Notas recientes" — 4 tarjetas
7. "De Google Calendar hoy"
8. Cuatro secciones apiladas: **⚠ Vencidos** · **📆 Para hoy** · **🔜 Próximos 7 días**
   · **📥 Sin fecha / Bandeja**
9. "Registro" — historial de completadas, colapsable

**Nueve bloques.** Y hay duplicación real, no solo percibida: una tarea con hora
asignada aparece **dos veces en la misma pantalla** — una vez en el bloque 4
("Cronología de hoy") y otra vez, completa, dentro de la sección "📆 Para hoy" del
bloque 8. El comentario en el propio código (`OtherViews.tsx:207-210`) dice que las
tareas sin hora "no se duplican" en la cronología — lo cual es cierto, pero implica que
las que *sí* tienen hora, se duplican, y el código no lo evita.

Más: el bloque 5 ("Proyectos") es un resumen de la vista Proyectos, que es un tab
propio. El bloque 6 ("Notas recientes") es un resumen de la vista Notas, que es un tab
propio. La sección "📥 Sin fecha / Bandeja" usa el mismo predicado exacto que la vista
Inbox completa (`activo(p) && !p.fechaLimite && p.estado !== idCompletado`), que
también es un tab propio. La sección "⚠ Vencidos" duplica el ítem "Vencidos" del
sidebar.

**"Hoy" hoy no es una vista: es un resumen de las otras seis vistas, sin haber quitado
nada de ninguna de ellas.** Por eso no puede ser el 90% del tiempo del usuario — compite
en información con seis pantallas que siguen existiendo intactas al lado.

**Veredicto (Things 3)**: Things 3 gana la categoría "Hoy" precisamente porque su Hoy
es aburrida — una lista, sin resúmenes de otras secciones, sin cifras, sin gráficos.
El valor de Hoy no es mostrar todo lo que hay. Es decidir por el usuario qué **no**
tiene que mirar hoy.

### 1.5 Densidad de la fila de tarea

Una sola fila (`TaskRow.tsx`) puede llegar a mostrar **hasta 15 elementos distintos**:
checkbox, título, ícono de "viene de nota", badge "bloqueado", badge "vencido", chip de
columna/estado, chip de proyecto (o el emoji legado `📁 nombre`), responsable con ícono,
fecha límite **en formato ISO crudo `YYYY-MM-DD` sin humanizar** ("2026-08-09" en vez de
"9 ago"), progreso de subtareas, ícono de repetición, porcentaje de ponderación, ícono
de modalidad en equipo, y dos botones de acción siempre visibles al 70% de opacidad. Todo
esto a 10-12px de tamaño de texto.

**Veredicto (Notion / Linear)**: una fila de lista es la unidad más repetida de toda la
app — se ve cientos de veces por sesión. Cada elemento que no aporta a la decisión "qué
hago con esto" es una tasa de impuesto cognitivo pagada cientos de veces al día.

### 1.6 Superficies redundantes — el mismo dato, presentado distinto según cómo se llegó

Un pendiente se puede abrir en **4 superficies distintas**: Peek (dialog, solo lectura),
TaskDetail (panel embebido en la Lista), TaskModal (dialog editable), y el menú
contextual (clic derecho). Las dos primeras renderizan el mismo componente interno
(`PendienteCuerpo`) pero con *flags distintos* — una activa "agregar subtarea", la otra
activa "destacar origen de nota" y "mostrar fecha de creación" — así que la misma tarea
literalmente **muestra campos diferentes** dependiendo de cuál de las dos puertas usaste
para entrar.

Crear una tarea nueva tiene **5 caminos simultáneos en escritorio**: el botón "Nuevo
pendiente" del sidebar, el botón "Pendiente" del dock flotante inferior, el atajo `N`,
"Nuevo pendiente" en la paleta de comandos, y el campo de captura rápida del header. Y
en la esquina inferior derecha, al mismo tiempo que el dock centrado ofrece "Nota" y
"Pendiente", el FAB (que en teoría es un patrón solo-móvil) también se renderiza en
escritorio ofreciendo exactamente las mismas dos acciones — dos superficies flotantes
compitiendo por el mismo gesto en la misma pantalla.

**Veredicto (Staff Designer, Notion)**: cuando cada entrada a un mismo dato lo muestra
distinto, el usuario no puede construir un modelo mental estable de "así se ve una
tarea". Esa inconsistencia cuesta más confianza que cualquier detalle visual.

### 1.7 Toolbar de la Lista — el ejemplo más claro de redundancia funcional

Sobre la lista de pendientes hay **17 controles interactivos en 5 filas**: búsqueda,
contador + "limpiar filtros" (que existe *dos veces*, también dentro del estado vacío),
8 chips de filtro rápido mezclando tres dimensiones distintas sin separación visual
(fecha / responsable / archivo / dependencias), 6 controles de filtro avanzado (Estado,
Prioridad, Responsable, Orden, Agrupar, Subtareas — 5 de ellos son `Select` visualmente
idénticos), y una fila de filtros guardados. Hay redundancia directa: el chip "Abiertos"
duplica lo que ya hace el dropdown "Estado"; el chip "🙋 Asignadas a mí" duplica el
dropdown "Responsable". En reposo, los cinco `Select` se leen como cinco píldoras grises
casi indistinguibles ("Estado: todos · Prioridad: todas · Responsable: todos ·
Recientes · Agrupar: no").

**Veredicto (Linear)**: un filtro que existe en dos formas distintas no es una
conveniencia, es una decisión de diseño no tomada.

### 1.8 Estados vacíos

No hay un sistema de estados vacíos: se contaron **cerca de 20 strings distintos**
escritos a mano, con contradicciones directas — el mismo dato (bandeja sin fecha) tiene
dos textos diferentes según si se mira desde el tab Inbox ("Bandeja vacía — todo lo
capturado ya tiene fecha o quedó organizado. 🎉") o desde la sección de Hoy ("Bandeja
vacía."). El estado vacío de comentarios tiene **tres** redacciones distintas en tres
archivos (`PendienteCuerpo.tsx`: "Aún no hay comentarios.", `TaskModal.tsx`: "Sin
comentarios.", `NotesView.tsx`: otra vez "Aún no hay comentarios."). El Dashboard no
tiene ningún estado para cuando no hay datos — un usuario nuevo ve un heatmap en blanco
y seis tarjetas en cero sin ninguna explicación. **No existe ningún flujo de
onboarding** en la app: la primera pantalla que ve alguien nuevo es la misma "Hoy"
recargada de nueve bloques que ve un usuario con dos años de datos.

**Veredicto (Apple)**: un estado vacío bien hecho enseña qué hacer. Acá, en el mejor
caso, informa que no hay nada; en el peor, ni siquiera eso.

### 1.9 Motion y microinteracciones

Existe una base de movimiento cuidada — `ease-spring` (cubic-bezier con rebote suave),
`ease-smooth`, keyframes `scale-in` y `fade-in-up`, reduced-motion contemplado. Y casi no
se usa: `ease-spring` aparece **una sola vez** en todo el código (el hover del botón
"Nuevo pendiente"), `animate-scale-in` **cero veces**, `shadow-soft-lg` **cero veces**.
El `.glass` que es la firma visual del destino al que quieres llegar se usa en
exactamente **3 lugares** (el dock, los widgets, la cronología de Hoy); `.bg-ambient` —
el fondo degradado cálido que en el mockup sostiene todo el clima visual — está
**definido en el CSS y montado en ningún componente**, con un comentario del propio
código que lo admite ("No se monta en ningún lado todavía").

**Veredicto (Arc Browser)**: esto no es un problema de que falte trabajo de motion. El
trabajo está hecho y en el repo. Es un problema de que se construyó el vocabulario y no
se terminó de hablar el idioma — el 90% del lenguaje de movimiento que existe no se usa
en ningún lugar que el usuario vea.

### 1.10 Lo que sobra, lo que falta, qué se fusiona, qué se vuelve widget

**Sobra** (elimina o fusiona, no agregues nada nuevo encima):
- El FAB de escritorio (el dock ya cubre exactamente lo mismo).
- La duplicación TimelineHoy / sección "Para hoy" — una tarea con hora vive en un solo
  lugar.
- Los bloques "Proyectos" y "Notas recientes" dentro de Hoy — son resúmenes de tabs que
  ya existen; si el usuario quiere ver proyectos, hace clic en Proyectos.
- El sub-nivel de tabs dentro de "Pendientes" (Lista/Tablero/Calendario) como *pantalla
  separada* — Lista y Tablero deberían ser dos formas de ver el mismo Proyecto/Espacio,
  no una tercera jerarquía de navegación.
- Los chips redundantes de la Lista (Abiertos vs. Estado; Asignadas a mí vs.
  Responsable).

**Falta**:
- Un componente único de estado vacío, con una sola voz, reusado en toda la app.
- Un primer-uso guiado (ni siquiera elaborado — tres pantallas bastan) para que "Hoy"
  vacía no sea indistinguible de "Hoy" rota.
- Fechas humanizadas en toda la UI ("hoy", "mañana", "9 ago"), nunca ISO crudo.
- Un segundo nivel tipográfico real que sí use la escala de display ya definida.

**Se fusiona**:
- Peek + TaskDetail: son el mismo componente con flags distintos hoy; deberían ser
  literalmente la misma superficie en todos los contextos donde se abre una tarea.
- Los 5 caminos de "crear pendiente" en escritorio se reducen a 2: el atajo de teclado
  (siempre disponible, invisible hasta que se necesita) y un solo punto de entrada visual
  (no dos flotantes simultáneos).

**Se vuelve widget** (candidatos reales, ya con precedente en el sistema de widgets
existente):
- El resumen de un Proyecto (el bloque que hoy vive fijo en Hoy) — como widget opcional
  que el usuario decide anclar o no, en vez de estar siempre presente para todos.
- El heatmap de actividad del Dashboard — sacarlo de una pantalla dedicada y ofrecerlo
  como widget opcional para quien quiera verlo a diario, dejando el Dashboard como una
  vista de consulta ocasional, no algo que compite con Hoy.

---

## 2. Los 12 puntos pedidos

### 2.1 Nueva distribución de pantalla

La estructura de tres franjas que ya existe (sidebar fijo · contenido · dock flotante)
es correcta y se conserva — no hay que inventar un layout nuevo, hay que hacer que cada
franja haga una sola cosa bien. El cambio real no es geométrico, es de **contenido por
franja**:

- El sidebar dejar de mezclar navegación (7 vistas), acciones de datos (5 exports/
  imports) y navegación secundaria (Espacios) al mismo nivel visual. Tres bloques con
  peso distinto, no una lista plana de 20 filas.
- El área principal deja de tener una "Hoy" que es un resumen de todo; pasa a tener una
  jerarquía clara: **una** cosa arriba (qué hacer ahora), **una** cosa media (la lista
  del día), y todo lo demás — proyectos, notas, actividad — vive en su propio tab, sin
  resumen duplicado en Hoy.
- El dock deja de competir con un FAB fantasma; es el único punto de creación flotante.

### 2.2 Nueva jerarquía visual

Tres niveles de tamaño con trabajo real, no cinco casi iguales:
- **Display** (la escala ya definida y sin usar: `text-display-sm/md/lg`) para: el
  saludo de Hoy, el título de un Proyecto, el título de una Nota. Cosas que hay una por
  pantalla.
- **Cuerpo** (`text-sm`, consolidado — dejar de usar `text-xs` como default de párrafo)
  para todo lo que se lee, no se escanea: descripciones, comentarios, contenido de nota.
- **Metadato** (un solo tamaño, no tres: fijar `11px` y borrar `9px`/`10px` del
  vocabulario) para chips, badges, fechas, contadores — todo lo que se escanea, no se
  lee.

La prioridad de una tarea deja de vivir solo en un borde de 4px: gana también una
segunda señal (posición del badge, o un punto de color con más peso) para que se lea sin
tener que fijarse en el borde izquierdo específicamente.

### 2.3 Qué cambia del sidebar

- Tres secciones con separación visual real (no solo un `border-t`): **Navegación**
  (Hoy · Inbox · Pendientes · Notas · Proyectos — 5, no 7: Panel y Papelera bajan de
  rango, ver 2.7), **Espacios** (como ya está, pero con más aire), **Sistema** (Ajustes,
  exports/imports colapsados detrás de un solo punto de entrada "Datos", no 5 filas
  sueltas al pie).
- Un solo nombre en las dos plataformas: "Pendientes" en todos lados, no "Tareas" en
  móvil.
- "Vencidos" deja de ser un octavo destino con ícono propio; es un filtro dentro de
  Pendientes, alcanzable con un clic pero no compitiendo visualmente con las vistas
  reales.

### 2.4 Qué cambia del panel principal

- Cabecera de vista consistente: hoy el header de escritorio no dice en qué vista estás
  (solo lo indica el resaltado del sidebar); cada vista principal gana un título visible
  con la tipografía display, coherente con lo que ya existe en móvil.
- La Lista pierde la mitad de sus controles de toolbar por fusión de redundancias (ver
  1.7) antes de ganar ningún control nuevo.
- El detalle de tarea (Peek/TaskDetail fusionados) muestra siempre los mismos campos,
  en el mismo orden, sin importar desde dónde se abrió.

### 2.5 Cómo aprovechar el espacio vacío

No agregando más bloques — dándole aire a los que quedan. Con Hoy reducida de 9 a 3
bloques (ver 2.9), el espacio que hoy ocupan 6 secciones redundantes se convierte en
margen real: más espacio alrededor de la lista del día, tipografía display más grande
donde corresponde, y — recién ahí — sitio real para que `.bg-ambient` (el fondo cálido
degradado que existe en el CSS y no se usa) tenga sentido como clima de fondo detrás de
paneles de vidrio, en vez de competir con nueve bloques opacos.

### 2.6 Qué widgets agregarías

Antes de agregar widgets nuevos, los 4 que ya existen (Pomodoro, Kanban rápido, Nota
rápida, Próxima tarea) necesitan un sistema de posicionamiento real — hoy es
posicionamiento libre en píxeles sin snap ni grid, y un widget se puede arrastrar casi
completamente fuera de la pantalla sin forma de recuperarlo. Encima de esa base sólida,
candidatos con precedente claro en el modelo de datos: **Resumen de un Proyecto**
(sacado de Hoy, ver 1.10), **Actividad/heatmap** (sacado del Dashboard, ver 1.10), y
**Agenda del día** (una versión mínima de la franja semanal, para quien quiere Hoy
todavía más reducida).

### 2.7 Qué paneles eliminarías

Ningún dato se elimina — se reclasifica. "Panel" (Dashboard) y "Papelera" bajan de
navegación primaria (7 tabs) a navegación secundaria (alcanzables desde el sidebar en un
segundo nivel, o desde la paleta de comandos) porque son vistas de consulta ocasional,
no destinos que alguien visita varias veces por sesión. Esto no es "esconder features" —
es alinear la jerarquía de navegación con la frecuencia de uso real.

### 2.8 Qué paneles combinarías

- Peek + TaskDetail → una sola superficie de "ver tarea", con un botón "Editar" que
  escala al modal completo. Ya casi es así (comparten el mismo componente interno); hoy
  falta que también compartan los mismos flags.
- Los 5 exports + 2 imports del pie del sidebar → un solo punto de entrada "Datos" que
  abre un panel con las mismas acciones, sin ocupar 7 filas permanentes.
- Los bloques "Proyectos" y "Notas recientes" de Hoy → widgets opcionales (ver 2.6), no
  contenido fijo de la pantalla más visitada.

### 2.9 Qué paneles serían flotantes

"Hoy" reducida a lo esencial fijo en el lienzo principal (**una** franja del día,
**una** lista priorizada del día — fusionando timeline y "Para hoy" en una sola
representación sin duplicar tareas) + todo lo demás (resumen de proyectos, actividad,
agenda semanal) disponible como widgets opcionales que el usuario decide mostrar. Esto
invierte el problema actual: hoy todo está fijo y nada es opcional; el objetivo es que
lo fijo sea mínimo y lo opcional viva en el sistema de widgets que ya existe.

### 2.10 Qué acciones necesitan menos clics

- Crear una tarea desde cualquier pantalla: ya casi resuelto con la captura rápida y el
  atajo de teclado — lo que sobra son las *superficies redundantes* que hacen lo mismo
  (dock + FAB simultáneos), no falta de acceso.
- Ver por qué algo está bloqueado o vencido: hoy exige abrir el detalle completo para
  ver la razón; el hover/tap sobre el badge debería bastar.
- Mover una tarea de proyecto: ya resuelto por el menú contextual — el patrón correcto
  (ver `MenuContextoPendiente.tsx`) simplemente no está generalizado a las otras 4
  superficies donde se edita una tarea.
- Archivar y recuperar algo archivado desde dentro de su propio proyecto: no existía
  ningún camino antes de la Fase 13 de este mismo turno (ver Parte A) — ya resuelto con
  el toggle "Archivados" agregado a `ProyectosView`.

### 2.11 Cómo lograr que el 90% del tiempo sea en "Hoy"

No agregando más a Hoy — sacando todo lo que hoy obliga a salir de ahí para ver el resto
de la app en una versión resumida. Un usuario no se queda en una pantalla porque tenga
mucha información; se queda porque esa pantalla resuelve su pregunta ("¿qué hago
ahora?") sin fricción y sin ruido. Hoy la pantalla intenta responder seis preguntas a la
vez (qué hago ahora, cómo van mis proyectos, qué notas hice, qué tengo en Calendar, qué
completé, qué está vencido) y por eso no responde bien ninguna. La apuesta de Things 3
es la correcta acá: una Hoy aburrida que hace una cosa gana más tiempo de uso real que
una Hoy completa que hace nueve.

### 2.12 Cómo se convierte en Workspace Personal

No agregando una capa nueva llamada "Workspace" encima de lo que existe — el modelo de
datos ya tiene la pieza correcta (`Espacio` como capa sobre `Proyecto`, documentada en
`AUDITORIA.md` y `workspace-doctrine`). Lo que falta no es dato, es que la interfaz deje
de tratar Espacios como una sección más del sidebar y empiece a tratarlo como el
**contexto que filtra todo lo demás** — Hoy, Inbox, Proyectos, Notas — de forma
consistente, en vez de un filtro que hoy solo aplica a la vista Proyectos. Un Workspace
Personal no se construye agregando destinos nuevos (Archivos, Kanban como tab propio ya
existe disperso en 3 lugares) — se construye haciendo que el contexto (¿en qué Espacio
estoy?) sea una decisión que se toma una vez y se respeta en toda la navegación.

---

## 3. Identidad propia (no copiar Apple / Notion / Todoist / Trello / Linear)

Ya existe una decisión diferenciadora tomada y documentada en el propio código: el
primario índigo-violeta (250° de matiz, 65% saturación) sobre neutros con un tinte
cálido deliberado (fondo en 40° de matiz, no un gris plano de plantilla), con un
comentario explícito en el CSS que dice por qué — "no el teal genérico de apps de
tareas". Esa decisión se refuerza en esta dirección, no se sustituye por el azul frío
genérico del mockup de referencia. El mockup aporta el *patrón* (glass, jerarquía,
calidez de fondo, dock inferior) — la *paleta* que lo sostiene es la que ya tiene esta
app y ningún competidor.

La segunda pieza de identidad propia, más importante que el color: el modelo "todo es
una entidad" que ya está en `types.ts` y en la doctrina del proyecto. Ningún competidor
de la lista (Apple Reminders, Notion, Todoist, Trello, Linear) modela así — es la base
real para una experiencia distinta, no una capa visual distinta sobre la misma
arquitectura de todos los demás.

---

## Resumen ejecutivo — lo que este documento pide, en una frase por rol

- **Apple**: menos tamaños, más silencio visual, un solo foco por pantalla.
- **Linear**: 13 destinos reales se reducen a 5 con disciplina, no se agregan más.
- **Notion**: una tarea se ve igual en todas partes donde se la abre, sin excepciones.
- **Things 3**: "Hoy" dejar de ser un resumen de las otras seis vistas y ser, otra vez,
  solo la respuesta a "¿qué hago ahora?".
- **Arc**: usar el lenguaje de movimiento que ya se escribió, en los lugares donde el
  usuario realmente lo va a ver.

Nada de esto exige rehacer la app ni cambiar de stack. Es sustracción y consistencia
sobre una base que ya es sólida — el trabajo de las Fases 2-13 previas construyó los
cimientos correctos (glass, tipografía, `Espacio` como capa nueva, widgets); lo que
falta es la disciplina de terminar de aplicarlos y de quitar lo que ya no necesita estar.

---

**Siguiente paso, cuando lo confirmes**: roadmap priorizado de esta dirección (qué se
hace primero, qué depende de qué, qué es de riesgo casi nulo vs. qué toca navegación
central), después mockups por pantalla, después especificaciones de UX por
componente. En ese orden, sin escribir código todavía.
