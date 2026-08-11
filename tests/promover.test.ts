import { describe, it, expect } from "vitest";
import { buscarSubtarea, quitarSubtarea, pendientesDesdeSubtareas } from "@/lib/app-utils";
import type { Pendiente, Subtarea } from "@/types";

// H2 — Promoción: un pendiente con subtareas se convierte en un Proyecto real (A2) y una
// subtarea se puede promover a pendiente independiente (A3). La parte testeable es pura:
// buscar/remover subtareas recursivas y convertir subtareas → pendientes.

function sub(id: string, texto: string, extra: Partial<Subtarea> = {}): Subtarea {
  return { id, texto, completada: false, ...extra };
}

describe("buscarSubtarea", () => {
  it("encuentra una subtarea de nivel superior", () => {
    const arr = [sub("a", "A"), sub("b", "B")];
    expect(buscarSubtarea(arr, "b")?.texto).toBe("B");
  });
  it("encuentra una sub-subtarea anidada en children", () => {
    const arr = [sub("a", "A", { children: [sub("a1", "A1"), sub("a2", "A2", { children: [sub("a21", "A21")] })] })];
    expect(buscarSubtarea(arr, "a21")?.texto).toBe("A21");
  });
  it("devuelve null si no existe", () => {
    expect(buscarSubtarea([sub("a", "A")], "zz")).toBeNull();
  });
});

describe("quitarSubtarea", () => {
  it("elimina solo la subtarea indicada sin mutar el arreglo original", () => {
    const arr = [sub("a", "A"), sub("b", "B")];
    const out = quitarSubtarea(arr, "a");
    expect(out.map((s) => s.id)).toEqual(["b"]);
    expect(arr).toHaveLength(2);
  });
  it("elimina una sub-subtarea anidada y conserva a sus hermanas", () => {
    const arr = [sub("a", "A", { children: [sub("a1", "A1"), sub("a2", "A2")] })];
    const out = quitarSubtarea(arr, "a2");
    expect(out[0].children?.map((s) => s.id)).toEqual(["a1"]);
  });
});

describe("pendientesDesdeSubtareas", () => {
  const origen: Pick<Pendiente, "subtareas" | "responsable" | "prioridad" | "origenNota"> = {
    subtareas: [
      sub("s1", "Unidad 1", { responsable: "Ana", fechaLimite: "2026-08-15" }),
      sub("s2", "Práctica", { children: [sub("s21", "Paso 1"), sub("s22", "Paso 2")] }),
    ],
    responsable: "Yo",
    prioridad: "Alta",
    origenNota: { notaId: "n1" },
  };

  it("convierte cada subtarea de nivel superior en un pendiente del proyecto", () => {
    const out = pendientesDesdeSubtareas(origen, "pr1", "Estudiar");
    expect(out).toHaveLength(2);
    expect(out[0].titulo).toBe("Unidad 1");
    expect(out[0].responsable).toBe("Ana");
    expect(out[0].fechaLimite).toBe("2026-08-15");
    expect(out[1].titulo).toBe("Práctica");
    expect(out[1].responsable).toBe("Yo");
  });

  it("asigna proyecto (id + espejo), prioridad y origenNota", () => {
    const out = pendientesDesdeSubtareas(origen, "pr1", "Estudiar");
    for (const p of out) {
      expect(p.proyectoId).toBe("pr1");
      expect(p.proyecto).toBe("Estudiar");
      expect(p.prioridad).toBe("Alta");
      expect(p.origenNota).toEqual({ notaId: "n1" });
    }
  });

  it("los hijos de una subtarea pasan a ser subtareas del nuevo pendiente", () => {
    const out = pendientesDesdeSubtareas(origen, "pr1", "Estudiar");
    expect(out[1].subtareas.map((s: Subtarea) => s.texto)).toEqual(["Paso 1", "Paso 2"]);
    expect(out[1].subtareas[0].id).toBe("s21");
  });
});