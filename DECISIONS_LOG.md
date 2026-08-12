# Decisions Log — Pendientes Pro

> Parte del **Product Operating System**. Ver [`DOCS_INDEX.md`](./DOCS_INDEX.md).
> Registro cronológico de toda decisión de producto significativa, por Principio 19 de
> [`PRODUCT_PRINCIPLES.md`](./PRODUCT_PRINCIPLES.md). Se actualiza en el momento en que
> la decisión se toma, no después. Cada entrada: fecha, decisión, contexto, alternativas
> evaluadas, motivo, consecuencias.

---

## 2026-08-05 — El roadmap se reordena: lo visual primero, lo funcional después

**Decisión**: reordenar el roadmap original (que priorizaba funciones tipo Todoist) para
poner primero los cimientos visuales y el shell de Workspace, empujando la funcionalidad
avanzada a fases posteriores.

**Contexto**: `Cambios.md` definía una reorientación completa del producto hacia
Personal Workspace, pero el roadmap original mezclaba trabajo visual y funcional sin
un orden claro de dependencia.

**Alternativas evaluadas**: (a) mantener el orden original función-primero; (b) hacer
ambos en paralelo sin secuencia definida.

**Motivo**: los cimientos visuales (glass, tipografía, layout) son prerequisito de todo
lo demás — construir funciones nuevas sobre un sistema visual sin resolver multiplica el
costo de corregirlo después (mismo razonamiento que sostiene el orden de `ROADMAP.md`).

**Consecuencias**: el roadmap de la app real (documentado en `AUDITORIA.md` y
`CHANGELOG.md`) sigue este orden desde entonces; este Product Operating System hereda el
mismo principio de secuencia.

---

## 2026-08-05 — "Espacio" como capa nueva, no un renombre

**Decisión**: el concepto de Espacio (workspace-UI) se implementa como una entidad
nueva sobre `Proyecto`, en vez de renombrar el "Espacio" ya existente en el código de
sincronización multi-dispositivo (`sync.tsx`/`espacio.ts`, que significa cuenta
compartida).

**Contexto**: el mockup de referencia y `Cambios.md` usan "Espacio" para el concepto de
agrupación de vida (Trabajo, Personal...), pero ese nombre ya estaba tomado en el código
real con un significado distinto y datos de usuarios reales sincronizados.

**Alternativas evaluadas**: (a) renombrar el Espacio de sincronización a otro término y
liberar el nombre; (b) usar un término distinto para el concepto nuevo (ej. "Área",
"Contexto"); (c) mantener ambos como conceptos separados con el mismo nombre,
documentando la distinción explícitamente.

**Motivo**: renombrar el Espacio de sincronización (opción a) tiene alto riesgo sobre
datos reales de usuarios ya sincronizados. Un término distinto (opción b) perdía la
palabra que el mockup y el usuario ya usaban naturalmente. Se eligió (c): mantener el
nombre "Espacio" para ambos conceptos, con una distinción documentada de forma
insistente en cada lugar donde podría haber ambigüedad.

**Consecuencias**: `NAVIGATION_SYSTEM.md` §2 y `KNOWLEDGE_BASE.md` cargan la
responsabilidad permanente de mantener esta distinción clara para cualquier
desarrollador o IA nueva en el proyecto — es la ambigüedad de nombres más importante de
todo el sistema de documentación.

---

## 2026-08-06 — Diagnóstico y reparación de la pertenencia de pendientes a proyecto

**Decisión**: unificar la asignación de proyecto a una tarea en un único helper
(`asignarProyecto`), donde `proyectoId` es la única fuente de verdad y `proyecto`
(nombre) es siempre un espejo derivado — nunca escrito de forma independiente. Se
agrega una migración de reparación automática para los datos ya afectados.

**Contexto**: el usuario reportó que un proyecto con varias tareas "dejaba algunas
fuera" del proyecto. La investigación encontró que `Pendiente` guardaba la pertenencia
dos veces (`proyecto` nombre-espejo, `proyectoId` referencia real), y que la
recurrencia de tareas (entre otros 6 puntos de escritura) actualizaba solo el nombre —
la tarea seguía mostrando el badge del proyecto pero desaparecía de él, porque toda la
lectura filtra por `proyectoId`.

**Alternativas evaluadas**: (a) eliminar el campo `proyecto` (nombre) por completo y
resolver el nombre siempre en tiempo de lectura; (b) mantener ambos campos pero
unificar todos los puntos de escritura detrás de un solo helper; (c) agregar solo la
migración de reparación sin tocar los puntos de escritura (parche superficial).

**Motivo**: se descartó (a) por el costo de migrar exports/CSV existentes que dependen
del campo nombre. Se descartó (c) por dejar la causa raíz sin corregir — habría vuelto
a producir huérfanos con cada nueva tarea recurrente. Se eligió (b): corrige la causa
raíz sin romper compatibilidad, y establece el patrón (Entidad con un campo derivado
nunca escrito de forma independiente) como regla general del sistema.

**Consecuencias**: se convirtió en el caso fundacional de tres piezas de este sistema
de documentación: Principio 1 de `PRODUCT_PRINCIPLES.md` ("una sola fuente de verdad"),
Artículo 4 y 13 de `PRODUCT_CONSTITUTION.md` (no crear modelos paralelos, migraciones
nunca silenciosas), y la regla de reconciliación de `DATA_PHILOSOPHY.md` §Relaciones.

---

## 2026-08-06 — La crítica del mockup de referencia se convierte en la regla de exclusividad de overlays

**Decisión**: formalizar "un solo overlay modal activo a la vez, sin excepción" como
regla de interacción de todo el producto (`PDS.md` §5.4, `PRODUCT_CONSTITUTION.md`
Artículo 8), a partir de una falla detectada en la imagen de referencia proporcionada
por el usuario.

**Contexto**: al analizar la captura de referencia para el Product Design
Specification, se detectó que mostraba una paleta de comandos, un panel flotante de
captura y ocho widgets, todos abiertos simultáneamente — un estado de interacción que
ningún modelo de producto serio permitiría en producción real.

**Alternativas evaluadas**: (a) tratarlo como un detalle menor de la composición de la
captura (probablemente un collage de marketing, no representativo); (b) elevarlo a
regla formal de interacción, con validación constitucional.

**Motivo**: aunque la captura probablemente sea efectivamente un collage compuesto para
mostrar capacidades, el riesgo de que una implementación real reproduzca ese estado
"por partes, sin querer" (dos overlays que técnicamente pueden coexistir porque nadie
escribió la regla que lo prohíbe) es real y ya se ha visto en productos de la
competencia. Se eligió (b).

**Consecuencias**: es la regla más citada de todo este sistema de documentación —
aparece en `PDS.md`, `PRODUCT_PRINCIPLES.md`, `PRODUCT_CONSTITUTION.md`,
`INTERACTION_PHILOSOPHY.md` y `WORKSPACE_SYSTEM.md`. Se convirtió en la máxima
prioridad de `ROADMAP.md` v2.0 (Epic 1).

---

## 2026-08-06 — Adopción del Product Design Specification como base oficial, evolución a Product Operating System

**Decisión**: el `PDS.md` entregado se adopta como núcleo permanente del sistema de
producto, sin modificar su contenido existente, y se lo rodea de 13 documentos
adicionales (visión, principios, constitución, lenguaje de diseño, filosofía de
interacción, filosofía de datos, sistema de navegación, sistema de workspace,
guías de ingeniería, base de conocimiento, backlog, roadmap, y este mismo registro de
decisiones) para formar un sistema de documentación completo.

**Contexto**: el usuario solicitó explícitamente evolucionar el PDS a un "Product
Operating System" que cualquier IA o desarrollador pueda usar durante años sin perder
la visión del producto, sin duplicar información entre documentos y con terminología
compartida.

**Alternativas evaluadas**: (a) expandir `PDS.md` mismo con secciones nuevas hasta
convertirlo en un documento único gigantesco; (b) crear los 13 documentos nuevos como
piezas independientes sin referencias cruzadas; (c) crear los 13 documentos nuevos
integrados por referencias cruzadas explícitas y un índice maestro, manteniendo
`PDS.md` íntegro como el núcleo de diseño visual/interacción.

**Motivo**: se descartó (a) porque el usuario pidió explícitamente mantener el PDS
íntegro sin alterarlo. Se descartó (b) porque el objetivo explícito era "un sistema
completamente integrado", no documentos sueltos — la integración por referencias
cruzadas es lo que permite que cada documento tenga una sola responsabilidad sin
duplicar contenido de los demás (Principio 2 de `PRODUCT_PRINCIPLES.md` aplicado a la
documentación misma).

**Consecuencias**: `DOCS_INDEX.md` pasa a ser el punto de entrada recomendado para
cualquiera que empiece a trabajar en el proyecto; `PDS.md` conserva su rol de
especificación visual/de interacción, ahora enmarcado por la visión, los principios y
las reglas constitucionales que explican *por qué* dice lo que dice.

---

## 2026-08-10 — «Espacios» se convierte en destino primario y «Pendientes» baja a Sistema

**Decisión**: la navegación primaria pasa a ser exactamente **Hoy · Inbox · Proyectos ·
Notas · Espacios** (PDS §5.3). «Pendientes» deja de ser un destino de primer nivel y baja
a la agrupación «Sistema» (sidebar escritorio y menú ⋮ móvil), junto a Panel y Papelera.
El bloque «Espacios» del sidebar (agrupación de proyectos Fase 4) se elimina en favor de
una vista `EspaciosView` como destino: el concepto de contexto de vida (Trabajo, Escuela,
Casa…) se materializa como pantalla desde la que se entra a Proyectos filtrado por
`espacioActualId`. Los atajos numéricos pasan a `1–8` (5=Espacios, 6=Pendientes).

**Contexto**: el backlog del Epic 2 (PDS §6.7) pide "solo Hoy/Inbox/Proyectos/Notas/
Espacios como destinos de primer nivel", y el PDS §5.3 lista «Espacios» como 5º destino.
El código previo tenía un 5º destino «Pendientes» y «Espacios» solo como sección del
sidebar; además «Pendientes» y «Tareas» (móvil) convivían como nombres distintos del
mismo destino.

**Alternativas evaluadas**: (a) dejar «Pendientes» como 5º destino y no crear vista de
Espacios (mínimo cambio, pero incumple PDS §5.3 y el backlog); (b) crear la vista
`EspaciosView` como promoción a pantalla completa de la sección existente, reusando
`espacios`, `espacioActualId`, `NuevoEspacioDialog` y el filtrado de `ProyectosView`
— sin tocar el modelo de datos; (c) renombrar además «Pendientes» a «Tareas» en el mismo
hito (feature 5 del backlog, se difiere a un hito propio).

**Motivo**: se eligió (b) por ser el corte incremental que cumple el AC del primer ticket
del Epic 2 sin duplicar lógica ni datos: «Espacios» ya era una entidad persistida
(Fase 4), el filtrado de contexto ya existía en `ProyectosView`, y el diálogo de alta ya
estaba resuelto. Eliminar el bloque duplicado del sidebar reduce clics y elimina una
doble fuente de verdad de navegación (validación: menos clics, menos ventanas, menos
tiempo). (c) se descarta por ahora para no mezclar dos features en un hito.

**Consecuencias**: el shortcut `3` deja de ser «Pendientes» (ahora `6`) — regresión de
memoria muscular documentada en `CHANGELOG.md` (H5) y verificada en QA real (21/21). El
filtrado de contexto multi-vista (filtrar Hoy/Inbox/Notas por el espacio activo,
feature 2 del backlog) queda como evolución posterior: hoy «Espacios» es un destino que
lleva a Proyectos filtrado, no un selector global. Modelo de datos intacto (solo
navegación/UI).

---

## 2026-08-10 — Los Espacios (Personal Workspace) ganan tabla propia en Supabase: `pnp_ctx_espacios`

**Decisión**: sincronizar los "Espacios" del usuario (Trabajo/Casa/etc., `src/types.ts
Espacio`) en una tabla nueva `pnp_ctx_espacios`, con el mismo sobre `id/user_id/
espacio_id/data/updated_at` y el mismo mecanismo de reconciliación (`sync-merge.ts`) que
ya usan pendientes/notas/proyectos/eventos, en vez de dejarlos solo en `localStorage`.

**Contexto**: una revisión pedida por el usuario ("¿por el Espacio se pierden registros
pasados?") encontró que `src/sync.tsx` nunca subía/bajaba el array `espacios` — cada
dispositivo tenía su propia copia local, inconsistente con las demás. Los pendientes y
proyectos sí sincronizaban (incluido su `espacioId`), así que un proyecto asignado a
"Trabajo" en el celular llegaba a la laptop, pero el objeto Espacio "Trabajo" no: el
selector de la laptop no lo listaba y ese proyecto solo aparecía bajo "Todos" ahí, nunca
filtrable. Percibido por el usuario como pérdida de datos, aunque nada se borraba.

**Alternativas evaluadas**: (a) guardar `espacios` dentro del `config` jsonb de
`pnp_espacios` (la cuenta compartida) en vez de una tabla propia — se descartó porque ese
campo ya se usa para `columnas` del Kanban y mezclar una colección con forma de lista
dentro de un jsonb de configuración rompe el patrón de reconciliación por ítem
(`reconciliar()` opera sobre arrays de entidades con `id`/`modificado`, no sobre blobs);
(b) tabla nueva con el mismo sobre genérico que las otras cuatro entidades de dominio,
reusando `mergeProyecto` como plantilla para un `mergeEspacio` nuevo.

**Motivo**: se eligió (b) por consistencia arquitectónica — es exactamente el patrón ya
validado por pendientes/notas/proyectos/eventos, sin inventar un mecanismo nuevo de
reconciliación ni tocar el modelo de datos del cliente (`Espacio` no cambia). Nombre de
tabla `pnp_ctx_espacios` (no `pnp_espacios_personales` ni reusar `pnp_espacios`) para
dejar la distinción con la cuenta compartida explícita también en el esquema SQL, no solo
en comentarios de código.

**Consecuencias**: proyectos ya provisionados en Supabase deben re-ejecutar
`supabase_setup.sql` (idempotente) para que `pnp_ctx_espacios` exista antes de que la
sincronización de Espacios tenga efecto — hasta entonces, el comportamiento previo
(Espacios solo locales) continúa sin romperse, simplemente sin sincronizar. Ningún dato
existente se migra ni se toca: los Espacios ya creados en cada dispositivo se suben en la
primera sincronización posterior a la actualización, igual que cualquier alta pendiente.

---

## 2026-08-12 — El Espacio "General" se modela como id reservado, no como fila real de `espacios`

**Decisión**: para que los pendientes sin proyecto y los proyectos sin `espacioId` dejen de
ser invisibles al activar un Espacio real, "General" se implementa como un valor especial de
`espacioActualId` (`ESPACIO_GENERAL_ID = 'general'`, `src/types.ts`) que el filtro de contexto
reconoce, en vez de crear una fila real en `espacios`/`pnp_ctx_espacios`.

**Contexto**: revisión pedida por el usuario ("que ningún registro se pierda... que todos los
pendientes se guarden en un espacio") detectó que `enEspacio()`/`enEspacioProyecto()`
(`src/lib/app-utils.ts`) ocultaban por diseño, sin aviso, todo lo que no resolvía a un
`Espacio` real vía `proyecto.espacioId` — la causa más probable de que el usuario sintiera que
perdía pendientes al usar el selector de Espacio (H6/H7).

**Alternativas evaluadas**: (a) fila real de "General" en `espacios` (y en `pnp_ctx_espacios`
vía sync), creada por cada usuario o sembrada automáticamente; (b) id reservado tratado
especialmente por el filtro de contexto, sin fila ni sincronización.

**Motivo**: se eligió (b). Una fila real exige decidir cómo se siembra para cuentas nuevas y
existentes (migración de datos), cómo se comporta si el usuario la borra o renombra, y cómo
se replica entre dispositivos sin colisionar con el `id` real que cada cuenta ya podría tener.
El id reservado no tiene ninguno de esos problemas: es un valor constante en el código, igual
en todos los dispositivos sin sincronizar nada, y no puede borrarse ni duplicarse por
construcción. El costo es que el filtro de contexto (`app-utils.ts`) debe conocer el caso
especial explícitamente — aceptable porque ya era el único lugar con esa responsabilidad.

**Consecuencias**: "General" aparece en los tres selectores (sidebar escritorio, menú "⋮"
móvil, vista Espacios) sin tocar el esquema de Supabase ni requerir una migración. Si en el
futuro se necesita que el usuario personalice el nombre/icono de "General", habrá que migrar
a la alternativa (a) — se documenta acá para no repetir la discusión.

---

## Cómo agregar una entrada nueva

Toda decisión que afecte modelo de datos, arquitectura de navegación, un principio o
una regla constitucional de este sistema se registra acá, en el momento en que se toma
— nunca reconstruida de memoria después. Formato: fecha, título de una línea, y las
cuatro secciones (Contexto, Alternativas evaluadas, Motivo, Consecuencias) como en las
entradas de arriba. Ver Principio 19 de `PRODUCT_PRINCIPLES.md` y Artículo 14 de
`PRODUCT_CONSTITUTION.md`.
