import { describe, it, expect } from "vitest";
import type { AppCtx } from "@/store";
import type { Pendiente } from "@/types";

// Tests de smoke para el store. La cobertura completa de acciones requiere
// render del `AppProvider` con mocks de `sonner`/`localStorage`/`sync`; la
// añadiremos como parte de la Fase 2 cuando el store gane más acciones puras.
// Por ahora validamos que el tipo `AppCtx` exporte todas las acciones
// documentadas en `src/store.tsx`, lo cual evita que refactor silenciosos
// las omitan (importante antes del refactor unificador de la Fase 1.6).

describe("smoke store", () => {
  it("el contexto del store exporta todas las acciones esperadas (compile-time check)", () => {
    // Esta prueba es de tipado: si `AppCtx` omite alguna acción, el casteo falla
    // en tiempo de compilación. Runtime: confirmamos que la fn `crearPendiente`
    // declarada como devolver `Pendiente` sigue existiendo en el tipo.
    const dummy = {
      crearPendiente: ({} as AppCtx).crearPendiente,
      actualizarPendiente: ({} as AppCtx).actualizarPendiente,
      eliminarPendiente: ({} as AppCtx).eliminarPendiente,
      archivarPendiente: ({} as AppCtx).archivarPendiente,
      desarchivarPendiente: ({} as AppCtx).desarchivarPendiente,
      toggleCompletar: ({} as AppCtx).toggleCompletar,
      toggleSubtarea: ({} as AppCtx).toggleSubtarea,
      agregarSubtarea: ({} as AppCtx).agregarSubtarea,
      agregarComentario: ({} as AppCtx).agregarComentario,
      moverEstado: ({} as AppCtx).moverEstado,
      crearNota: ({} as AppCtx).crearNota,
      actualizarNota: ({} as AppCtx).actualizarNota,
      eliminarNota: ({} as AppCtx).eliminarNota,
      crearProyecto: ({} as AppCtx).crearProyecto,
      actualizarProyecto: ({} as AppCtx).actualizarProyecto,
      eliminarProyecto: ({} as AppCtx).eliminarProyecto,
      crearEvento: ({} as AppCtx).crearEvento,
      actualizarEvento: ({} as AppCtx).actualizarEvento,
      eliminarEvento: ({} as AppCtx).eliminarEvento,
      setColumnas: ({} as AppCtx).setColumnas,
      abrirModal: ({} as AppCtx).abrirModal,
      cerrarModal: ({} as AppCtx).cerrarModal,
      abrirPeek: ({} as AppCtx).abrirPeek,
      cerrarPeek: ({} as AppCtx).cerrarPeek,
      setUsuario: ({} as AppCtx).setUsuario,
      reemplazarTodo: ({} as AppCtx).reemplazarTodo,
    } as const;
    // Cada valor del dummy es `undefined` (casteado desde `{} as AppCtx`), pero
    // el tipo está bien. Verificamos que las 26 claves existen en el objeto.
    expect(Object.keys(dummy).length).toBe(26);
  });

  it("el `crearPendiente` puede tener `fechaCompletado` asignado (typecheck)", () => {
    const p: Pendiente = {
      id: "x", titulo: "X", solicitante: "", responsable: "", descripcion: "",
      prioridad: "Media", estado: "completado", fechaLimite: "", proyecto: "",
      etiquetas: [], subtareas: [], comentarios: [], adjuntos: [], origenNota: null,
      creado: "2026-01-01", modificado: "2026-01-01", fechaCompletado: "2026-01-01",
    };
    expect(p.fechaCompletado).toBe("2026-01-01");
  });
});
