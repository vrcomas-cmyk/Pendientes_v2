# Docs Index — Product Operating System de Pendientes Pro

Punto de entrada único al sistema de documentación de producto. Si sos una IA o una
persona nueva en este proyecto y leés un solo archivo antes que todos los demás, que
sea este.

## Cómo está organizado el sistema

```
                         PRODUCT_VISION.md
                       (qué es, por qué existe)
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
PRODUCT_PRINCIPLES.md  PRODUCT_CONSTITUTION.md    DECISIONS_LOG.md
 (cómo se decide,        (qué está prohibido,      (por qué se decidió
  ponderable)              absoluto)                 lo que se decidió)
        │                       │
        └───────────┬───────────┘
                     │
      ┌──────────────┼──────────────┬───────────────┬─────────────────┐
      │              │              │               │                 │
DESIGN_LANGUAGE  INTERACTION_   DATA_          NAVIGATION_       WORKSPACE_
   .md          PHILOSOPHY.md  PHILOSOPHY.md    SYSTEM.md         SYSTEM.md
(por qué se ve  (cómo se       (qué es una      (arquitectura     (Espacios,
 así)            comporta)      Entidad)          de navegación)    widgets,
      │              │              │               │               layouts)
      └──────────────┴──────────────┴───────────────┴─────────────────┘
                                     │
                                  PDS.md
                    (especificación completa: crítica,
                  scorecard, widgets, layout, design system,
                    motion, microinteracciones, flujos)
                                     │
                     ┌───────────────┼───────────────┐
                     │               │               │
          ENGINEERING_GUIDELINES  PRODUCT_BACKLOG   ROADMAP.md
                .md                  .md            (cuándo)
          (cómo se construye)    (qué falta hacer)
                                     │
                            KNOWLEDGE_BASE.md
                    (memoria viva — preguntas y respuestas
                       que enlazan a todo lo anterior)
```

## Qué leer según lo que necesitás hacer

| Si necesitás... | Empezá por |
|---|---|
| Entender por qué el producto existe y hacia dónde va | `PRODUCT_VISION.md` |
| Saber si una idea nueva es coherente con el producto | `PRODUCT_PRINCIPLES.md` → `PRODUCT_CONSTITUTION.md` |
| Diseñar una pantalla o componente nuevo | `DESIGN_LANGUAGE.md` → `PDS.md` §6 (Design System) |
| Diseñar una interacción o animación nueva | `INTERACTION_PHILOSOPHY.md` → `PDS.md` §7-8 |
| Modelar un tipo de contenido nuevo | `DATA_PHILOSOPHY.md` |
| Decidir dónde vive algo en la navegación | `NAVIGATION_SYSTEM.md` |
| Diseñar un widget o entender el concepto de Workspace | `WORKSPACE_SYSTEM.md` |
| Entender por qué algo ya se decidió así | `KNOWLEDGE_BASE.md` → `DECISIONS_LOG.md` |
| Saber qué está pendiente de construir | `PRODUCT_BACKLOG.md` → `ROADMAP.md` |
| Implementar algo sin escribir código específico todavía | `ENGINEERING_GUIDELINES.md` |
| Ver la especificación completa de diseño visual/interacción | `PDS.md` (el núcleo) |

## Los 14 documentos

1. **[`PRODUCT_VISION.md`](./PRODUCT_VISION.md)** — Qué es, qué problema resuelve, qué
   no pretende ser, diferenciación competitiva, promesa, horizonte a 5-10 años.
2. **[`PRODUCT_PRINCIPLES.md`](./PRODUCT_PRINCIPLES.md)** — 20 principios ponderables,
   cada uno con descripción, justificación, ejemplo, cuándo aplica y cuándo no.
3. **[`PRODUCT_CONSTITUTION.md`](./PRODUCT_CONSTITUTION.md)** — 15 reglas absolutas, sin
   excepción salvo enmienda formal registrada en el log de decisiones.
4. **[`DESIGN_LANGUAGE.md`](./DESIGN_LANGUAGE.md)** — Personalidad, tono, emociones,
   ritmo, filosofía de color/tipografía/movimiento — el porqué detrás de los tokens.
5. **[`INTERACTION_PHILOSOPHY.md`](./INTERACTION_PHILOSOPHY.md)** — Cómo se comporta el
   producto ante cualquier interacción, presente o futura.
6. **[`DATA_PHILOSOPHY.md`](./DATA_PHILOSOPHY.md)** — El modelo conceptual "todo es una
   Entidad": Entidades, relaciones, representaciones, vistas, reglas.
7. **[`NAVIGATION_SYSTEM.md`](./NAVIGATION_SYSTEM.md)** — Los 4 niveles de navegación:
   primaria, Espacio, Perspectivas, detalle.
8. **[`WORKSPACE_SYSTEM.md`](./WORKSPACE_SYSTEM.md)** — Workspaces, layouts, widgets,
   paneles, contextos, personalización, persistencia — el diferenciador central.
9. **[`PDS.md`](./PDS.md)** — El núcleo: crítica brutal, scorecard, evolución, sistema
   de widgets, layout universal, design system, motion, 100+ microinteracciones, user
   flows. **No se modifica su contenido existente** — todo lo demás lo enmarca.
10. **[`ENGINEERING_GUIDELINES.md`](./ENGINEERING_GUIDELINES.md)** — Reglas de
    ingeniería sin código: componentes, modularidad, feature flags, offline-first,
    accesibilidad, observabilidad.
11. **[`KNOWLEDGE_BASE.md`](./KNOWLEDGE_BASE.md)** — Memoria viva en formato
    pregunta-respuesta, se actualiza cada vez que surge una pregunta nueva sin
    respuesta documentada.
12. **[`PRODUCT_BACKLOG.md`](./PRODUCT_BACKLOG.md)** — Epic → Feature → Story, con
    impacto/esfuerzo/prioridad/dependencias/estado.
13. **[`ROADMAP.md`](./ROADMAP.md)** — v2.0 a v4.0, cada una con objetivos,
    funcionalidades, cambios de UX/técnicos, riesgos, criterios de éxito.
14. **[`DECISIONS_LOG.md`](./DECISIONS_LOG.md)** — Registro cronológico de toda
    decisión significativa, con contexto, alternativas y consecuencias.

## Terminología compartida (glosario canónico)

Todo documento de este sistema usa estos términos con el mismo significado exacto —
ninguno se redefine localmente:

| Término | Significado | Definido en |
|---|---|---|
| **Entidad** | Unidad base de dato (Tarea, Nota, Evento, Proyecto, Archivo) con campos comunes (`id`, `creado`, `modificado`, `etiquetas`, `comentarios`, `borrado`) | `DATA_PHILOSOPHY.md` |
| **Espacio (workspace)** | Agrupación de vida (Trabajo, Personal...) que filtra transversalmente la navegación — **distinto** del Espacio de sincronización (cuenta compartida) del código real | `NAVIGATION_SYSTEM.md` §2, `DECISIONS_LOG.md` |
| **Perspectiva** | Criterio de filtro/orden guardado con nombre, local a una vista | `NAVIGATION_SYSTEM.md` §3 |
| **Panel** | Superficie anclada, no exclusiva, convive con el resto de la pantalla | `INTERACTION_PHILOSOPHY.md`, `PDS.md` §5 |
| **Overlay** | Superficie exclusiva (diálogo, paleta de comandos, sheet) — sujeta a la regla de un solo overlay a la vez | `PDS.md` §5.4, `PRODUCT_CONSTITUTION.md` Art. 8 |
| **Widget** | Superficie flotante opcional, nunca la única vía de acceso a un dato | `PDS.md` §4, `WORKSPACE_SYSTEM.md` |
| **Workspace** | La combinación activa de Espacio + Layout de widgets + Perspectivas guardadas | `WORKSPACE_SYSTEM.md` |
| **Contexto** | El estado combinado de Espacio + Vista/Perspectiva + Entidad abierta en un momento dado | `WORKSPACE_SYSTEM.md` §Contextos |

## Regla de integración de este sistema

1. **Ningún documento repite contenido que ya vive en otro** — enlaza con
   `[texto](./ARCHIVO.md)` o cita el archivo por nombre.
2. **`PDS.md` es el núcleo inmutable de esta ronda** — los 13 documentos que lo rodean
   lo enmarcan (por qué, cuándo, con qué reglas), nunca lo contradicen ni lo duplican.
3. **Toda decisión nueva significativa se registra en `DECISIONS_LOG.md`** en el
   momento en que se toma.
4. **Toda pregunta recurrente sin respuesta documentada se agrega a
   `KNOWLEDGE_BASE.md`** la primera vez que se responde.
5. **Ninguna función pasa de `PRODUCT_BACKLOG.md` a implementación** sin haber
   verificado que no viola ningún Artículo de `PRODUCT_CONSTITUTION.md`.
