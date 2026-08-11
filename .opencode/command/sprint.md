---
description: Lanza al equipo completo en su loop de desarrollo (producto → plan → tests → código → review → documentar). Uso: /sprint "objetivo o feature a implementar"
agent: team
---

El usuario quiere un **sprint del equipo** para el siguiente objetivo:

> $ARGUMENTS

Actúa como Team Lead y ejecuta el loop completo del manual `.opencode/instructions/team.md`
(F0→F8), delegando en los especialistas (producto, planificador, tester, desarrollador, revisor,
documentador) y verificando que `lint → build → test` queden verdes.

1. Lee tu memoria (`memory/team.md`), la bitácora (`memory/LOG.md`), `AGENTS.md` y el manual.
2. Abre el plan con `todowrite` y arranca por el ticket más prioritario.
3. Respeta la doctrina (solo incremental, retrocompatibilidad, reusar antes de crear).
4. Al final entrega el resumen: implementado, archivos tocados, resultados de lint/build/test,
   tests añadidos y estado de la memoria del equipo.