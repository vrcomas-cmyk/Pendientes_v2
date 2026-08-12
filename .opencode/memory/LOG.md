# LOG — Bitácora del Equipo de Desarrollo

Formato: `fecha | agente | acción | estado`

## Historial
2026-08-09 | sistema | Creación del equipo: 7 agentes, memoria por rol, loop F0→F8, comandos /sprint /equipo /memoria | ✓ hecho |
2026-08-09 | team+especialistas | H1 «Minuta: viñetas anidadas → subtareas» implementado y verificado (lint/build/155 tests) | ✓ cerrado |
2026-08-09 | team+especialistas | H4 «Confirmación antes de descartar una edición» implementado y verificado (lint/build/185 tests + QA Playwright 21/21); Epic 1 completo | ✓ cerrado |
2026-08-10 | team+especialistas | H5 «Espacios como 5º destino primario, Pendientes a Sistema» implementado (lint/build/190 tests + QA Playwright 21/21); Epic 2 lote inicial | ✓ cerrado |
2026-08-10 | Claude Code (fuera de opencode) | H6 «Selector de Espacio activo en móvil» implementado + 3 aserciones preexistentes corregidas (lint/build/207 tests) | ✓ cerrado |
2026-08-10 | Claude Code (fuera de opencode) | H7 «Sincronización de Espacios entre dispositivos» implementado: mergeEspacio + tabla pnp_ctx_espacios (lint/build/209 tests) | ✓ cerrado |
2026-08-11 | Claude Code (fuera de opencode) | H7b «Fix: migración pendiente de H7 rompía toda la sincronización» — pnp_ctx_espacios aislado en su propio try/catch (lint/build/209 tests) | ✓ cerrado |
2026-08-11 | Claude Code (fuera de opencode) | Migración H7 aplicada vía MCP Supabase (proyecto real); H7c: supabase_setup.sql actualizado a la función pnp_canjear_invitacion real desplegada | ✓ cerrado |
2026-08-11 | Claude Code (fuera de opencode) | H8 «Agrupación Sistema»: Ajustes/Datos/Ayuda detrás de un solo menú en escritorio y móvil (lint/build/215 tests); backlog corregido | ✓ cerrado |
2026-08-11 | Claude Code (fuera de opencode) | H9 «Panel/Papelera a navegación secundaria»: movidas al menú Sistema en escritorio (lint/build/219 tests) | ✓ cerrado |
2026-08-11 | Claude Code (fuera de opencode) | H10 «Nombrado consistente entre plataformas» (fix corto='Tareas'→'Pendientes') — EPIC 2 completo (lint/build/219 tests) | ✓ cerrado |
2026-08-12 | Claude Code (fuera de opencode) | Auditoría de pérdida de datos pedida por el usuario: sync confirmado sólido; hallazgo real fue de visibilidad (pendientes sin proyecto/proyectos sin espacio invisibles en Hoy/Inbox con Espacio activo). H11 «Espacio "General" real y seleccionable» implementado como fix (lint/build/229 tests) | ✓ cerrado |
2026-08-12 | Claude Code (fuera de opencode) | INCIDENTE REAL: usuario reportó ~60 pendientes perdidos (Supabase Y local). Causa: espacio_id nullable en la base real (desfase esquema-repo) → 4 filas huérfanas invisibles por RLS; pull() purgó también en local tras 2 "ausencias" que eran fallo de lectura, no borrado. H12: backfill + espacio_id NOT NULL en Supabase (MCP, con confirmación del usuario) + ausenciasSospechosas() en sync-merge.ts como circuito de seguridad en pull() (lint/build/233 tests) | ✓ cerrado |