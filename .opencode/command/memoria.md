---
description: Muestra la memoria de un agente (o de todos) del equipo de desarrollo. Uso: /memoria tester o /memoria
agent: build
---

Muestra el contenido de la carpeta `.opencode/memory/`.

- Si recibes un nombre de agente como argumento (p.ej. `tester`), muestra el contenido completo de
  `.opencode/memory/<agente>.md` sin resumir ni recortar.
- Si no recibes argumentos, lista los archivos con un extracto corto de la última entrada de cada uno
  y del `LOG.md`.

No des consejos ni ejecutes acciones: solo entrega la información de la memoria.