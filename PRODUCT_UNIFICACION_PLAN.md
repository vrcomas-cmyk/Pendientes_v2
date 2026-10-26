# Unificación de Pendientes Pro — propuesta de producto y arquitectura

Fecha: 2026-10-25  
Estado: base de trabajo; implementar en hitos pequeños y verificables.

## Objetivo

Que capturar, organizar y revisar trabajo personal, laboral y escolar se sienta como una interacción continua. El usuario puede empezar con una nota, convertir partes en pendientes, asociarlos a proyectos/estudio/rocas y decidir cuáles ocupan tiempo real en la agenda. Las vistas son perspectivas sobre datos relacionados; no copias que el usuario tenga que mantener a mano.

Pregunta de validación del producto: **«¿Esta mejora hace que el usuario necesite menos clics, menos ventanas y menos tiempo para organizar su día?»**

## Lo que ya existe en este repositorio

- Notas HTML con extracción de viñetas a pendientes y relación `origenNota`.
- Pendientes con subtareas, prioridades, fechas, hora/duración, recurrencia, proyecto, ponderación y modo individual/equipo.
- Proyectos, Espacios visuales, Metas y planes importables de estudio.
- Eventos propios de agenda (`EventoCalendario`) y espejado opcional a Google Calendar.
- OAuth independiente para Google Calendar, varias cuentas, lectura de eventos por rango y escritura de eventos propios.
- Sincronización Supabase y funcionamiento local/offline-first.

No partir de cero ni reemplazar el modelo. La integración de Calendar actual lista eventos por rango bajo demanda y espeja eventos salientes. No mantiene todavía un espejo incremental de cambios externos. La autenticación de la app y la autorización de Calendar también son flujos distintos.

## Modelo de experiencia propuesto

### Una captura, varios resultados

Un cuadro universal de captura acepta texto libre y ofrece una decisión rápida — Nota, Pendiente o Evento — sin obligar a escoger antes de escribir. Desde una nota, seleccionar texto/viñeta permite crear uno o varios pendientes, una minuta o un evento; la entidad resultante conserva la referencia a su fuente. Quick-add sigue siendo la ruta más rápida para un pendiente simple; el detalle se expande solo cuando hace falta.

### Una sola agenda

Una agenda combinada muestra eventos de Google, eventos propios y pendientes programados, con marca de origen y edición/acciones contextuales. Vistas Día, Semana, Mes y Año reutilizan el mismo rango/filtros. Solo se envían a Google los pendientes que el usuario marque explícitamente como agendados; tener fecha límite por sí sola no crea un evento. Al programar, comparar intervalos y mostrar conflictos con eventos opacos/ocupados; permitir continuar conscientemente o cambiar el horario. Los eventos de todo el día no se comparan como bloques horarios ficticios.

### Proyectos, rocas y estudio como contexto

Proyecto sigue siendo el contenedor operativo de pendientes. El método (lista, Kanban, Scrum o Gantt) es una vista/configuración del proyecto, no otro conjunto de tareas. Añadir método como campo opcional y persistir la configuración de columnas/fechas de forma compatible. Para Scrum, iteraciones y capacidad requieren diseño posterior; Gantt necesita fechas/inicio/dependencias verificables.

Una roca es un objetivo trimestral/de temporada con actividades diarias registradas como entradas de bitácora y enlaces opcionales a pendientes/proyectos. No convertir cada nota de actividad en tarea obligatoria. El encuadre de una materia pertenece a un espacio/proyecto escolar y puede estructurarse como materias, evaluación/ponderación, fechas, entregas y progreso; aprovechar importación y `ponderacion` antes de crear otro sistema.

## Reglas de integración de datos

1. Agregar campos opcionales; nunca renombrar ni borrar campos existentes sin migración aprobada.
2. Cada acción debe tener una fuente de verdad y una referencia, no crear copias independientes. Para Google, guardar IDs externos y estado de sincronización.
3. Reutilizar `Nota`, `Pendiente`, `EventoCalendario`, `Proyecto`, `Espacio`, `Meta` y la sincronización existente donde encajen.
4. Las rocas y bitácoras probablemente necesitan entidades aditivas propias; decidir almacenamiento cloud/local y merge antes de UI.
5. Los datos externos deben indicar origen, última sincronización y error; no ocultar fallos o presentar datos viejos como actuales.
6. Sin IA que clasifique o cree información por cuenta propia. Acciones sugeridas siempre confirmables.

## Hitos recomendados

### Hito 0 — Base unificada de captura y enlaces

Auditar captura actual, añadir captura universal o extender la existente para nota/pendiente/evento con teclado, y hacer evidentes las acciones de convertir viñeta/selección. Mantener IDs y `origenNota`. Ninguna integración externa nueva. Criterio: capturar y convertir sin cambiar repetidamente de módulo.

### Hito 1 — Agenda integrada utilizable

Consolidar vistas Día/Semana/Mes/Año (año como resumen mensual, sin cargar eventos anuales masivos), y unificar los feeds existentes de Google + pendientes + eventos de app. Detectar solapes mediante intervalos locales y duración. Selector explícito «Enviar a Google Calendar» al crear/programar. Manejar zona horaria, eventos de día completo, duplicados de cuentas y estados de error. Scope Google mínimo: separar lectura (`calendar.events.readonly`) y escritura en autorización contextual; no solicitar scopes mayores sin necesidad.

### Hito 2 — Login Google y calendario bidireccional

Ofrecer Google como proveedor de inicio de sesión Supabase además del método manual existente. Enlazar identidad al usuario existente con flujo seguro para evitar cuentas duplicadas; login Google no equivale a permiso de Calendar. Mantener OAuth Calendar para acceso por cuenta y tokens solo servidor. Añadir sincronización incremental con `syncToken` por calendario/cuenta, paginación, tombstones/cancelaciones y recuperación HTTP 410 mediante sincronización completa. Definir precedencia de edición, evitar loops de espejo y conservar eventos privados con el mínimo dato necesario.

### Hito 3 — Resúmenes por correo

Preferencias por usuario: hora local/zona, días, diario, semanal, exclusiones y pausa. Diario incluye pendientes abiertos de ese día y eventos del calendario. Semanal (lunes-domingo) incluye sección por día y absorbe la sección diaria del lunes: una sola entrega el lunes, nunca dos. Las tareas/eventos del propio día aparecen dentro de su día de semana. Envío idempotente con registro por usuario/rango/plantilla, reintentos y baja sencilla. Requiere cron/cola backend y proveedor transaccional de correo; no usar el navegador/service worker para garantizar envíos.

### Hito 4 — Proyectos por método y aviso de estancamiento

Campo aditivo de metodología y vistas que transformen el mismo conjunto de pendientes. Definir estancamiento de forma configurable (ej. sin actividad X días y trabajo abierto) y notificar dentro de la app primero. Correo opcional, umbral configurable, exclusiones de vacaciones/espera. No inferir estancamiento solo por fecha vencida.

### Hito 5 — Rocas y registro de actividad

Crear roca con ámbito laboral/personal/estudio, periodo y estado; bitácora diaria con fecha, duración opcional, descripción y vínculos a pendientes/proyecto. Timeline e informe de contribuciones con filtro por roca/periodo. Evitar que “actividad hecha” duplique el completado de un pendiente.

### Hito 6 — Encuadres académicos

Importar/crear materias, temario/encuadre, criterios ponderados, entregas y calificaciones con trazabilidad al documento de origen. Validar sumas y fechas; crear pendientes/eventos enlazados, no duplicados. Conservar importación actual y permitir corrección manual.

## Dependencias externas y límites

- Google OAuth y sincronización silenciosa necesitan consentimiento, scopes adecuados, credenciales/secrets de Cloud/Supabase y revisión del estado Testing/Production.
- Login Gmail y permisos de Calendar son consentimientos separados. Vincular ambos de forma segura requiere configurar el proveedor Google de Supabase Auth y diseñar unión de identidades.
- Correos programados necesitan proveedor de envío, dominio remitente autenticado, secretos, cron y políticas de reintento. Cron en Supabase puede invocar Edge Functions con `pg_cron`/`pg_net`; validar disponibilidad y configuración del proyecto desplegado.
- La PWA permite captura offline; el envío de correos y lectura/escritura remota dependen de backend/conectividad. Mostrar estado de sincronización.

## Skills consultadas

Se consultó la skill local `pwa-development` para las restricciones de offline/service worker. No se encontró una skill instalada específica para diseño de producto, Google Calendar o correo programado; la guía de hitos se apoya en documentación primaria enlazada abajo. Evitar instalar skills externas solo por nombre sin revisar alcance y seguridad.

## Referencias web (documentación primaria)

- Google OAuth web server: acceso offline, refresh tokens, estado anti-CSRF y consentimiento incremental: https://developers.google.com/identity/protocols/oauth2/web-server
- Google Calendar incremental sync: https://developers.google.com/workspace/calendar/api/guides/sync
- Google Calendar Events list: paginación, recurrencias, cancelaciones, ventana temporal y expiración de `syncToken` (410): https://developers.google.com/calendar/api/v3/reference/events/list
- Google Calendar scopes y principio de mínimo privilegio: https://developers.google.com/workspace/calendar/api/auth
- Google Calendar push notifications: webhook HTTPS y canales por recurso/calendario: https://developers.google.com/workspace/calendar/api/guides/push
- Supabase programación de Edge Functions con Cron: https://supabase.com/docs/guides/functions/schedule-functions

