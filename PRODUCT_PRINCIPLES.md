# Product Principles — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> Estos son los 20 principios que gobiernan **cómo se decide**, a diferencia de
> [`PRODUCT_CONSTITUTION.md`](./PRODUCT_CONSTITUTION.md) que define **qué está prohibido**.
> Un principio se puede ponderar contra otro caso por caso; una regla constitucional no.

Cada principio tiene: Descripción · Justificación · Ejemplo · Cuándo aplica · Cuándo no.

---

## 1. Una sola fuente de verdad por dato

**Descripción**: ningún dato se guarda dos veces con la esperanza de que ambas copias
queden sincronizadas. Cuando la app necesita el nombre de un proyecto en una tarea, lo
resuelve por referencia (`proyectoId`), nunca lo copia en un campo paralelo sin un
mecanismo activo que lo mantenga coherente.

**Justificación**: este principio existe porque ya se rompió y costó caro. El campo
`Pendiente.proyecto` (nombre-espejo) desincronizado de `Pendiente.proyectoId`
(referencia real) causó que tareas "se salieran" de su proyecto de forma silenciosa —
ver `DECISIONS_LOG.md`, entrada de la Fase 13. Es el ejemplo fundacional de por qué este
principio es innegociable.

**Ejemplo**: la fecha de vencimiento de una tarea se define una vez en la Entidad; la
vista Calendario, Kanban y Hoy la *leen*, no la copian a su propio estado.

**Cuándo aplica**: siempre que un dato tenga un dueño claro (una Entidad).

**Cuándo no aplica**: los campos-espejo que existen únicamente para compatibilidad
retroactiva (exports antiguos) son la excepción documentada explícitamente, nunca la
norma — y deben tener un mecanismo de reconciliación activo, no solo un comentario
prometiendo que "se va a mantener sincronizado".

---

## 2. Nunca duplicar información en pantalla

**Descripción**: un mismo dato no aparece dos veces en la misma vista, salvo que las dos
apariciones cumplan roles genuinamente distintos (ej. un resumen y su detalle expandido,
nunca dos representaciones idénticas del mismo dato).

**Justificación**: la crítica de `PDS.md` §1.4 documentó una tarea con hora apareciendo
dos veces en la misma pantalla de Hoy (timeline + sección "Para hoy"). Duplicar
información no es redundancia segura, es una fuente de desconfianza — si las dos copias
alguna vez muestran algo distinto, el usuario deja de confiar en ambas.

**Ejemplo**: el contador de "3 pendientes hoy" del header y la lista de abajo deben ser
la misma consulta, nunca dos cálculos independientes que puedan divergir.

**Cuándo aplica**: siempre, dentro de una sola vista/pantalla.

**Cuándo no aplica**: mostrar el mismo dato en dos *vistas distintas* (Hoy y Proyectos
ambas muestran el estado de una tarea) no es duplicación — es la misma fuente de verdad
consultada desde contextos distintos, correcto y esperado.

---

## 3. La edición ocurre preferentemente inline

**Descripción**: cambiar un dato no debería requerir abrir un formulario separado si el
dato ya está visible en pantalla.

**Justificación**: cada salto a un modal de edición es un cambio de contexto — el
usuario pierde de vista lo que estaba mirando. La edición inline (título editable con un
clic, checkbox que cambia estado al tocarlo) reduce ese costo a cero.

**Ejemplo**: el título de una tarea en el Panel de detalles (`PDS.md` §5, "Panel de
detalles") es un campo de texto editable directamente, no un botón "Editar" que abre
otro formulario.

**Cuándo aplica**: campos simples (texto, fecha, estado, prioridad) visibles en el
contexto actual.

**Cuándo no aplica**: operaciones que requieren varios campos relacionados a la vez
(crear una tarea nueva desde cero, con título + proyecto + fecha en un solo paso) sí
justifican un formulario dedicado — la captura rápida ya resuelve esto sin modal (ver
Flujo 9.1), pero cuando un formulario es necesario, se prefiere un panel a un modal
(ver Principio 7 e `INTERACTION_PHILOSOPHY.md`).

---

## 4. Reducir siempre el cambio de contexto

**Descripción**: cada vez que una acción obliga a salir de la pantalla actual para
completarla en otro lugar, se cuenta como un costo de diseño que hay que justificar.

**Justificación**: el cambio de contexto es la causa principal de la "carga cognitiva"
identificada como falla en `PDS.md` §1.15 — no es solo estético, es tiempo real perdido
reconstruyendo dónde estaba el usuario.

**Ejemplo**: mover una tarea a otro proyecto se resuelve desde un menú contextual sin
salir de la lista (ya implementado en `MenuContextoPendiente`), no navegando a la vista
Proyectos y arrastrándola manualmente.

**Cuándo aplica**: cualquier acción secundaria (mover, archivar, cambiar prioridad,
posponer).

**Cuándo no aplica**: acciones que genuinamente requieren un contexto distinto y más
amplio (abrir el detalle completo de una tarea con subtareas, comentarios y adjuntos)
justifican navegar — la clave es que ese salto sea a un Panel, no que desaparezca la
noción de dónde estaba el usuario (ver Principio 7).

---

## 5. Menos clics es mejor, pero no a costa de la claridad

**Descripción**: cuando dos diseños logran el mismo resultado, se prefiere el de menos
pasos — salvo que el paso adicional exista para prevenir un error costoso (una acción
destructiva).

**Justificación**: la velocidad es parte de la promesa del producto (`PRODUCT_VISION.md`),
pero la velocidad sin criterio produce errores irreversibles — de ahí la excepción
explícita.

**Ejemplo**: completar una tarea es un solo clic en el checkbox. Eliminar un proyecto
completo (acción irreversible sobre datos de otras tareas) mantiene una confirmación
explícita, deliberadamente.

**Cuándo aplica**: cualquier acción reversible o de bajo costo de error.

**Cuándo no aplica**: acciones destructivas o que afectan a múltiples Entidades a la vez
— ahí el paso extra es la funcionalidad, no fricción.

---

## 6. Todo componente debe tener una razón de existir que se pueda nombrar en una frase

**Descripción**: si no se puede explicar en una sola oración por qué un componente
existe y qué resuelve que otro no resuelva ya, no se agrega.

**Justificación**: `PDS.md` §1.11 documentó nueve lenguajes de tarjeta distintos en una
sola pantalla — resultado directo de componentes creados sin esta pregunta.

**Ejemplo**: el widget "Próxima tarea" existe porque responde una pregunta que ningún
otro widget responde ("¿qué es lo inmediato siguiente?"). Si su contenido fuera idéntico
al de otro widget, no debería existir como pieza separada (ver Principio 12 y Evolución
§3 punto 2 en `PDS.md`).

**Cuándo aplica**: siempre, antes de crear cualquier componente nuevo.

**Cuándo no aplica**: no tiene excepciones — es un filtro de entrada, no una regla de
estilo.

---

## 7. Los paneles se prefieren sobre los modales

**Descripción**: cuando una acción necesita más espacio del que cabe inline, se abre un
panel (anclado, no bloqueante del resto de la pantalla) antes que un modal (bloqueante).

**Justificación**: desarrollado en profundidad en `INTERACTION_PHILOSOPHY.md`. Un panel
preserva la sensación de "seguís en el mismo lugar"; un modal la interrumpe. Se reserva
el modal para lo que genuinamente exige atención exclusiva (confirmaciones destructivas,
comandos globales).

**Ejemplo**: ver el detalle de una tarea abre el Panel derecho (`PDS.md` §5, sección 8);
eliminar un proyecto abre un diálogo modal con scrim.

**Cuándo aplica**: cualquier vista o edición que no sea una decisión binaria urgente.

**Cuándo no aplica**: la paleta de comandos, por su naturaleza de "quiero ir a cualquier
lugar ya", sí es un overlay modal — la regla de exclusividad de `PDS.md` §5.4 aplica
igual.

---

## 8. Un solo overlay activo a la vez, sin excepción

**Descripción**: nunca coexisten dos superficies que exigen atención exclusiva
(diálogo, paleta de comandos, sheet) al mismo tiempo.

**Justificación**: la falla más grave detectada en la crítica de `PDS.md` §1.12 —
convertida en regla formal en `PDS.md` §5.4 e `INTERACTION_PHILOSOPHY.md`.

**Ejemplo**: abrir la paleta de comandos mientras hay un formulario de edición sin
guardar cierra o pide confirmar sobre ese formulario primero — nunca los apila.

**Cuándo aplica**: siempre, sin excepción — este es uno de los pocos principios sin caso
"cuándo no aplica" genuino; su versión endurecida vive como regla constitucional en
`PRODUCT_CONSTITUTION.md`.

**Cuándo no aplica**: no aplica — ver arriba.

---

## 9. El color de marca nunca comunica estado

**Descripción**: el acento de marca (índigo-violeta) se reserva para navegación activa,
foco y llamadas a la acción primarias. Prioridad, vencimiento y completado usan una
paleta semántica separada (`DESIGN_LANGUAGE.md` §Filosofía del color).

**Justificación**: `PDS.md` §1.8 documentó el acento haciendo de marca, de prioridad y
de decoración a la vez en la misma pantalla — perdiendo todo significado.

**Ejemplo**: una tarea de prioridad Media nunca usa el mismo morado que el botón "Nuevo
pendiente".

**Cuándo aplica**: cualquier elemento de UI con significado semántico de estado.

**Cuándo no aplica**: no tiene excepción — es una regla de separación de capas, no de
estilo.

---

## 10. Tres niveles tipográficos, nunca más

**Descripción**: Display / Cuerpo / Metadato son los únicos niveles de jerarquía de
texto permitidos (`PDS.md` §6.3).

**Justificación**: se detectaron 43% de tamaños fuera de escala en la auditoría de la
app real — la proliferación de tamaños "casi iguales" no comunica jerarquía, la anula.

**Ejemplo**: el título de una vista usa Display; su descripción usa Cuerpo; su contador
de elementos usa Metadato. Nunca un cuarto tamaño intermedio "porque queda mejor".

**Cuándo aplica**: todo texto de la interfaz.

**Cuándo no aplica**: contenido generado por el usuario (el cuerpo de una nota larga)
puede tener su propia jerarquía interna de encabezados dentro del editor — pero esos
encabezados igual derivan de la escala Display, no inventan tamaños nuevos.

---

## 11. Toda animación comunica algo, o no existe

**Descripción**: ninguna transición se agrega "porque se ve bien" — cada una tiene una
función (confirmar una acción, indicar dirección, señalar jerarquía).

**Justificación**: el Sistema de Motion (`PDS.md` §7) fue diseñado deliberadamente
alrededor de esta regla — cada curva y duración está atada a un propósito específico,
nunca a la decoración.

**Ejemplo**: el rebote `ease-spring` al completar una tarea confirma la acción; no hay
un rebote equivalente en una acción neutral como hacer scroll.

**Cuándo aplica**: cualquier motion nuevo propuesto.

**Cuándo no aplica**: no tiene excepción — es el filtro de entrada para nuevo motion,
igual que el Principio 6 lo es para nuevos componentes.

---

## 12. Ninguna funcionalidad nueva puede contradecir la simplicidad ya lograda

**Descripción**: agregar una función se evalúa no solo por su propio valor, sino por el
costo que le agrega a todo lo que ya existe alrededor.

**Justificación**: es el principio que previene el error que TickTick comete según
`PRODUCT_VISION.md` — apilar funciones sin revisar el costo acumulado en el sistema.

**Ejemplo**: agregar "Metas" como nueva Entidad se evalúa preguntando si puede
representarse como un Proyecto con una fecha límite larga, antes de crear un modelo
paralelo — ver `DATA_PHILOSOPHY.md`.

**Cuándo aplica**: toda propuesta de función nueva, sin excepción, antes de aprobarse.

**Cuándo no aplica**: no aplica — es un filtro de entrada obligatorio, formalizado como
regla constitucional ("una acción principal nueva exige eliminar otra").

---

## 13. Todo dato pertenece a una Entidad reconocible

**Descripción**: no existen tipos de dato "sueltos" fuera del modelo de Entidad descrito
en `DATA_PHILOSOPHY.md`.

**Justificación**: es la base técnica de que Kanban, Calendario, Hoy y Notas puedan
compartir datos sin sincronización manual.

**Ejemplo**: un "Archivo" adjunto no es un tipo aparte sin relación — es un campo
`adjuntos[]` de una Entidad existente, o eventualmente una Entidad propia con las mismas
propiedades base (`id`, `creado`, `modificado`, `etiquetas`) que Tarea y Nota ya tienen.

**Cuándo aplica**: cualquier tipo de contenido nuevo propuesto para la app.

**Cuándo no aplica**: metadatos puramente de configuración de UI (posición de un widget,
tema elegido) no son Entidades — son preferencias de dispositivo, ver
`WORKSPACE_SYSTEM.md` §Persistencia.

---

## 14. La captura nunca exige clasificación previa

**Descripción**: capturar algo (crear una tarea/nota rápida) no obliga a decidir de
antemano en qué proyecto o espacio vive — eso se resuelve después, o nunca (Inbox es un
destino legítimo permanente, no un estado de tránsito obligatorio).

**Justificación**: es el corazón de la promesa del producto (`PRODUCT_VISION.md`) — la
fricción de clasificar antes de capturar es la razón por la que la gente abandona
sistemas de productividad.

**Ejemplo**: escribir en el campo de captura rápida sin ningún `#proyecto` crea la tarea
igual, sin clasificar, visible en Inbox.

**Cuándo aplica**: toda captura de contenido nuevo.

**Cuándo no aplica**: crear directamente *dentro* de un contexto ya elegido (agregar una
tarjeta a una columna Kanban específica) sí hereda ese contexto por defecto — no es una
excepción al principio, es la clasificación ya resuelta por dónde el usuario está parado.

---

## 15. La velocidad de teclado es un ciudadano de primera clase, no un extra

**Descripción**: toda acción frecuente tiene un atajo de teclado desde el día uno de su
diseño, no agregado después como mejora.

**Justificación**: honra la fortaleza de Linear (`PRODUCT_VISION.md`) sin copiar su
identidad — la velocidad de teclado es un principio de diseño transversal, no una
función aislada de "power users".

**Ejemplo**: `N` para nueva tarea, `Ctrl+K` para búsqueda, `1`-`5` para navegación
directa — todos definidos junto con el flujo, no después.

**Cuándo aplica**: cualquier acción que un usuario haría más de una vez por sesión.

**Cuándo no aplica**: acciones de configuración infrecuente (cambiar el color de un
Espacio) no necesitan atajo dedicado.

---

## 16. Los estados vacíos enseñan, nunca solo informan

**Descripción**: un estado vacío siempre incluye qué hacer a continuación, no solo el
hecho de que no hay datos.

**Justificación**: `PDS.md` §1.19 y la auditoría de la app real detectaron ~20 estados
vacíos inconsistentes, la mayoría solo informativos.

**Ejemplo**: "Bandeja vacía — todo lo capturado ya tiene fecha" en vez de "No hay
elementos".

**Cuándo aplica**: toda lista, tablero o vista que pueda no tener contenido.

**Cuándo no aplica**: no aplica — cero excepciones; incluso vistas de consulta ocasional
(Dashboard) necesitan su propio estado vacío diseñado, no dejado en blanco.

---

## 17. El sistema de widgets es siempre opcional, nunca la única vía

**Descripción**: ningún dato accesible por un widget deja de ser accesible por su vista
completa correspondiente.

**Justificación**: previene que la personalización (widgets) se convierta en
fragmentación — desarrollado en `WORKSPACE_SYSTEM.md`.

**Ejemplo**: el widget "Kanban rápido" muestra el mismo tablero que la vista Proyectos
completa; cerrarlo no hace perder acceso al tablero.

**Cuándo aplica**: todo widget del sistema (`PDS.md` §4).

**Cuándo no aplica**: no aplica — es una condición de existencia del sistema de widgets
mismo, no una preferencia de diseño.

---

## 18. La consistencia entre plataformas es de comportamiento, no de píxeles

**Descripción**: escritorio y móvil pueden verse distinto (rail vs. nav inferior) pero
nunca deben llamar a lo mismo con nombres distintos ni ofrecer acciones inconsistentes
entre sí.

**Justificación**: `PDS.md` §1.3/§3 detectó "Pendientes" en escritorio y "Tareas" en
móvil para la misma vista — síntoma de mantener dos árboles de layout sin una fuente
compartida de verdad conceptual (aunque la implementación visual difiera).

**Ejemplo**: el atajo conceptual "crear tarea" existe en ambas plataformas, con
affordance distinta (atajo de teclado en desktop, FAB en mobile) pero mismo resultado y
mismo nombre en toda copy visible.

**Cuándo aplica**: toda terminología y toda acción expuesta al usuario.

**Cuándo no aplica**: la implementación visual (layout, tamaño de componentes) sí puede
y debe adaptarse por plataforma — ver `PDS.md` §5.5.

---

## 19. Cada decisión de diseño relevante se registra, no se recuerda de memoria

**Descripción**: una decisión de producto no documentada se pierde con quien la tomó —
se registra en `DECISIONS_LOG.md` en el momento en que se toma, no después.

**Justificación**: es la condición que hace posible que "cualquier IA o desarrollador
pueda trabajar sobre este sistema durante los próximos años sin perder la visión del
producto" — el objetivo explícito de este Product Operating System.

**Ejemplo**: la decisión de que `proyectoId` es la única fuente de verdad sobre
`proyecto` (nombre) se registra con su fecha, contexto y consecuencias — no queda solo
como un comentario suelto en el código.

**Cuándo aplica**: toda decisión que afecte modelo de datos, arquitectura de
navegación, o un principio/regla de este sistema.

**Cuándo no aplica**: decisiones puramente de implementación técnica sin impacto de
producto (elegir una librería de fechas) no requieren entrada en el log de producto —
esas viven en el historial de commits.

---

## 20. Ningún principio de este documento se aplica de forma absoluta sin juicio

**Descripción**: los principios (a diferencia de las reglas constitucionales) se
ponderan entre sí caso por caso — cuando dos principios entran en tensión, se resuelve a
favor de la promesa del producto (`PRODUCT_VISION.md`), documentando la decisión
(Principio 19).

**Justificación**: un sistema de principios sin esta cláusula se vuelve rígido hasta el
punto de la parálisis — el objetivo es guiar el juicio, no reemplazarlo.

**Ejemplo**: el Principio 5 (menos clics) y el Principio 8 (confirmación en acciones
destructivas) están en tensión deliberada — se resuelve siempre a favor de prevenir
pérdida de datos.

**Cuándo aplica**: cualquier situación donde dos principios de esta lista parezcan
contradecirse.

**Cuándo no aplica**: no aplica a las reglas de `PRODUCT_CONSTITUTION.md` — esas sí son
absolutas por diseño.
