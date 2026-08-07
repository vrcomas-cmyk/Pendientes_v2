# Knowledge Base — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> Memoria viva del proyecto en formato pregunta-respuesta. Se actualiza cada vez que
> alguien (humano o IA) hace una pregunta que no estaba respondida acá — nunca queda
> una pregunta recurrente sin su entrada. Cada respuesta enlaza al documento que
> profundiza el tema y, si corresponde, a la entrada de `DECISIONS_LOG.md` que originó
> la decisión.

## Sobre el producto

**¿Por qué la pantalla principal es "Hoy" y no un dashboard o una lista general?**
Porque la promesa central del producto (`PRODUCT_VISION.md`) es responder "¿qué hago
ahora?" en un vistazo. Un dashboard general responde "¿cómo van las cosas?", una
pregunta distinta y menos frecuente — por eso Dashboard existe pero vive en navegación
secundaria (`NAVIGATION_SYSTEM.md` §1), no como pantalla de entrada.

**¿Por qué se evita el uso excesivo de modales?**
Porque un modal interrumpe y un panel acompaña — desarrollado en
`INTERACTION_PHILOSOPHY.md` §"Paneles antes que modales". La mayoría de las acciones de
un Personal Workspace no son decisiones binarias urgentes, así que tratarlas como
tales (bloqueando toda la pantalla) es un costo de interrupción injustificado.

**¿Por qué "todo es una Entidad"?**
Porque es la única forma de que Kanban, Calendario, Hoy y Notas puedan mostrar los
mismos datos sin sincronizarlos entre sí como copias separadas — desarrollado en
`DATA_PHILOSOPHY.md`. La alternativa (modelos paralelos por tipo de contenido) ya
produjo un bug real de integridad de datos, documentado en `DECISIONS_LOG.md`.

**¿Por qué existen los widgets, y por qué son opcionales?**
Porque el sistema de Espacios + widgets es uno de los diferenciadores centrales de
producto frente a la competencia (`WORKSPACE_SYSTEM.md`), pero un widget nunca puede
ser la única forma de acceder a un dato (Principio 17 de `PRODUCT_PRINCIPLES.md`) —
si lo fuera, cerrar un widget accidentalmente equivaldría a perder acceso a información,
lo cual rompería la confianza que el producto promete sostener.

**¿Por qué el sidebar tiene la estructura de 5-7 ítems + Espacio activo + Sistema, y
no lista todo lo que la app puede hacer?**
Porque la navegación primaria se dimensiona por frecuencia de uso, no por cuánto puede
hacer la app (`NAVIGATION_SYSTEM.md` §1) — un sidebar que lista todo (17+ objetivos, el
estado documentado en `PDS.md` §1.10) deja de ser navegable de un vistazo, que es
justamente lo que un sidebar debería resolver.

**¿Por qué el color de marca (índigo-violeta) nunca se usa para indicar prioridad o
estado?**
Porque cuando un mismo color hace de marca, de estado y de decoración a la vez, deja de
comunicar nada específico — la falla exacta documentada en `PDS.md` §1.8. La regla
formal vive en `DESIGN_LANGUAGE.md` §Filosofía del color y en el Principio 9 de
`PRODUCT_PRINCIPLES.md`.

**¿Por qué solo tres niveles de tipografía (Display/Cuerpo/Metadato)?**
Porque la auditoría de la app real detectó que el 43% de los tamaños de texto en uso
eran valores arbitrarios fuera de cualquier escala reconocible — cinco o seis tamaños
casi iguales no comunican jerarquía, la anulan. Ver `PDS.md` §6.3 y Principio 10 de
`PRODUCT_PRINCIPLES.md`.

**¿Por qué no hay un asistente de IA que sugiera, priorice o resuma automáticamente?**
Porque cualquier función de IA que agregue un paso o una decisión ("¿confío en esta
sugerencia?") va en contra de la promesa de simplicidad — Artículo 2 de
`PRODUCT_CONSTITUTION.md`. Donde una automatización sí tiene valor real (interpretar
lenguaje natural en la captura rápida), se implementa como una regla determinística y
explicable, no como una sugerencia opaca de un modelo.

**¿Por qué existe la distinción entre "Espacio" (workspace) y "Espacio" (cuenta
compartida de sincronización)?**
Por una colisión de nombres histórica: el concepto de sincronización multi-dispositivo
ya usaba "Espacio" en el código antes de que el rediseño de producto introdujera el
concepto de Espacio-workspace. Se decidió mantener ambos como conceptos separados en
vez de renombrar el existente (que tiene datos reales de usuarios sincronizados) — ver
`NAVIGATION_SYSTEM.md` §2 y la entrada correspondiente en `DECISIONS_LOG.md`.

## Sobre decisiones de UX específicas

**¿Por qué la captura rápida no obliga a elegir un proyecto antes de guardar?**
Porque la fricción de clasificar antes de capturar es, según el análisis competitivo de
`PRODUCT_VISION.md`, la razón principal por la que la gente abandona sistemas de
productividad. Ver Principio 14 de `PRODUCT_PRINCIPLES.md` y Artículo 12 de
`PRODUCT_CONSTITUTION.md`.

**¿Por qué las acciones destructivas (eliminar un proyecto) mantienen una confirmación,
aunque el producto valore "menos clics"?**
Porque el Principio 5 de `PRODUCT_PRINCIPLES.md` establece explícitamente esa excepción:
menos clics es mejor salvo que el paso adicional prevenga un error costoso e
irreversible. Completar una tarea (reversible, bajo costo) es un clic; eliminar un
proyecto (irreversible, alto costo) no lo es.

**¿Por qué un widget cerrado no pierde su estado (ej. un Pomodoro sigue corriendo)?**
Porque cerrar la ventana de una acción no debería interrumpir la acción misma —
desarrollado en `INTERACTION_PHILOSOPHY.md` §"Mantener siempre el contexto del
usuario" y especificado técnicamente en `PDS.md` §4.5.

**¿Por qué nunca puede haber dos overlays modales abiertos a la vez?**
Porque esa fue la falla más grave detectada en la crítica de la captura de referencia
del producto (`PDS.md` §1.12) — un estado de interacción que un producto real nunca
debería permitir. Es la única regla de este sistema sin ninguna excepción autorizada,
formalizada como Artículo 8 de `PRODUCT_CONSTITUTION.md`.

## Sobre el historial técnico del proyecto

**¿Qué pasó con el bug de "tareas que se salían de su proyecto"?**
Una tarea recurrente, al completarse, copiaba el nombre de su proyecto pero no la
referencia (`proyectoId`) — la nueva instancia nacía con el badge del proyecto visible
pero sin pertenecer realmente a él, porque todas las vistas filtran por la referencia,
no por el nombre. Se corrigió unificando la asignación en un único punto y agregando una
migración de reparación automática. Ver la entrada completa en `DECISIONS_LOG.md`, y el
principio que esto estableció (`PRODUCT_PRINCIPLES.md` §1, `DATA_PHILOSOPHY.md`
§Reglas).

**¿Por qué el sistema de widgets tiene un "clamp de viewport" que no dejaba tener el
sistema anterior de la app real?**
Porque el sistema anterior permitía arrastrar un widget casi completamente fuera de
pantalla sin ninguna forma de recuperarlo — un widget "perdido" en la práctica.
`PDS.md` §4.4 especifica que un widget nunca puede quedar con menos del 25% de su área
visible, y que se reposiciona automáticamente si el viewport cambia de tamaño y lo deja
huérfano.

## Cómo se mantiene esta base de conocimiento

Cualquier pregunta que se repita en una conversación con un desarrollador o una IA
trabajando sobre este producto, y que no tenga una entrada acá, se agrega — con su
respuesta y sus enlaces a los documentos que la sostienen — inmediatamente después de
responderla la primera vez. El objetivo es que la segunda vez que alguien haga esa
pregunta, la respuesta ya exista.
