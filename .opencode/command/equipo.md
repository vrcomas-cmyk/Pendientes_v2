---
description: Muestra el roster del equipo de desarrollo (roles, memoria y cómo lanzar el loop). Uso: /equipo
agent: build
---

Presenta el **Equipo de Desarrollo** de Pendientes Pro leyendo `.opencode/instructions/team.md`.

Incluye en tu respuesta:
1. La tabla de roles y responsabilidades.
2. Dónde vive cada memoria (`.opencode/memory/*.md`).
3. Cómo arrancar el loop: `/sprint "objetivo"` y de qué es responsable cada comando.
4. El pipeline de CI: `npm run lint` → `npm run build` → `npm run test`.

No ejecutes cambios: solo informa.