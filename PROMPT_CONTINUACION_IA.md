# Prompt para continuar Pendientes Pro con otra IA

```text
Actúa como ingeniero/a senior de producto y software trabajando en el repositorio Pendientes Pro. El usuario quiere una experiencia única para capturar notas, pendientes simples/detallados y eventos; calendario combinado con Google Calendar; correo diario/semanal; proyectos con vistas Gantt/Scrum u otras; rocas con bitácora diaria; y encuadres académicos. Tu objetivo es implementar el siguiente hito incremental de forma completa y segura, no rehacer la app.

ANTES DE CAMBIAR CÓDIGO
1. Lee AGENTS.md, PRODUCT_UNIFICACION_PLAN.md, Cambios.md, PRODUCT_CONSTITUTION.md, DATA_PHILOSOPHY.md, PDS.md y CHANGELOG.md.
2. Inspecciona el código real y los tests relevantes. La app existente incluye notas con extracción de pendientes (`origenNota`), Pendiente, EventoCalendario, Proyecto, Espacio, Meta, Agenda propia, Google OAuth independiente con cuentas múltiples, lectura de eventos por rango y escritura de eventos espejados, Supabase y offline-first. No asumas que una capacidad mencionada en documentos sigue idéntica: verifica símbolos y comportamiento actuales.
3. Elige el primer hito pendiente de PRODUCT_UNIFICACION_PLAN.md. Implementa solo ese hito (una entrega vertical); si depende de secretos o configuración externa, completa primero toda la parte local que sí se puede hacer y deja instrucciones concretas.
4. Cambios de modelo solo aditivos y opcionales. No borres ni renombres campos/tablas/APIs. Reutiliza componentes, stores, hooks y vistas existentes. Respeta React 19, TypeScript estricto y los patrones del repo.

PRODUCTO Y DATOS
- La interacción debe empezar por captura rápida y permitir convertir/referenciar sin duplicar contenido. Una nota puede originar varios pendientes/eventos; conserva origen y trazabilidad.
- Un pendiente con fecha límite NO debe enviarse por defecto a Google Calendar. Es una decisión explícita de programación. El calendario combina eventos propios, pendientes programados y eventos Google, indicando origen.
- Para conflictos, compara intervalos reales en zona horaria local y duración; trata correctamente eventos de todo el día, límites exclusivos, recurrencias, eventos cancelados y varias cuentas. Informa el conflicto y ofrece elegir horario o continuar conscientemente.
- No guardes tokens OAuth/refresh tokens/client secrets en cliente ni localStorage. Conserva el backend seguro existente y solicita solo scopes mínimos en contexto. Login Supabase Google y autorización Google Calendar son permisos separados; el enlace de identidad no debe crear usuarios duplicados.
- Los resúmenes por correo requieren cron/backend, proveedor transaccional y envíos idempotentes. El resumen semanal es lunes-domingo, agrupado por día; el lunes integra ese día y la semana en un solo correo, sin duplicar el diario. No prometas envíos fiables desde navegador/service worker.
- Los métodos Scrum/Gantt son perspectivas sobre los mismos pendientes; no clones tareas. Rocas/bitácoras y estructuras académicas deben enlazar a los objetos existentes. Evita añadir IA que clasifique o escriba datos sin confirmación.
- Mantén compatibilidad con los datos existentes, sincronización multiusuario, offline y móvil.

CALIDAD Y ENTREGA
- Sigue la doctrina de AGENTS.md y la pregunta: «¿Esta mejora hace que el usuario necesite menos clics, menos ventanas y menos tiempo para organizar su día?»
- Añade/ajusta pruebas focalizadas solo para el cambio realizado, y luego ejecuta lint, build y tests según los scripts disponibles y el orden local del proyecto. No ignores fallos preexistentes: identifícalos claramente.
- Actualiza CHANGELOG.md. Incrementa CACHE en public/sw.js solo si cambia funcionalidad visible al usuario. Si cambias el grafo de conocimiento, ejecuta graphify update . según AGENTS.md.
- Revisa el diff final, enumera archivos cambiados, decisiones y limitaciones. No despliegues ni escribas secretos. No afirmes que Google/correo funciona en producción hasta probarlo con la configuración real.
- Si hay una decisión irreversible o requisito ambiguo que bloquea el trabajo, termina el trabajo independiente primero y pregunta solo lo indispensable. No sustituyas funcionalidades existentes.

Al comenzar, informa qué hito elegiste y por qué. Al terminar, entrega resumen de comportamiento, pruebas ejecutadas y pasos externos concretos que el propietario debe configurar.
```

