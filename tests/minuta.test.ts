import { describe, it, expect } from "vitest";
import { parsearMinuta, subtareaDeLinea } from "@/lib/app-utils";

// H1 — «Viñetas anidadas → subtareas» (minuta universal).
// `parsearMinuta` agrupa viñetas de nivel superior (sin sangría) como pendientes y las
// viñetas indentadas (2+ espacios) como subtareas del pendiente actual de la minuta.

describe("parsearMinuta", () => {
  it("crea una entrada por viñeta de nivel superior", () => {
    const m = parsearMinuta("- Hacer tarea\n- Otra cosa");
    expect(m).toHaveLength(2);
    expect(m[0].titulo).toBe("Hacer tarea");
    expect(m[1].titulo).toBe("Otra cosa");
    expect(m[0].subtareas).toEqual([]);
  });

  it("anida las viñetas indentadas como subtareas del pendiente actual", () => {
    const m = parsearMinuta("- Estudiar\n  - Unidad 1\n  - Unidad 2\n- Gym");
    expect(m).toHaveLength(2);
    expect(m[0].titulo).toBe("Estudiar");
    expect(m[0].subtareas.map((s) => s.texto)).toEqual(["Unidad 1", "Unidad 2"]);
    expect(m[1].titulo).toBe("Gym");
    expect(m[1].subtareas).toEqual([]);
  });

  it("una viñeta de nivel superior tras subtareas corta la agrupación", () => {
    const m = parsearMinuta("- Proyecto\n  - Paso 1\n- Nuevo tema\n  - Sub A");
    expect(m).toHaveLength(2);
    expect(m[0].titulo).toBe("Proyecto");
    expect(m[0].subtareas.map((s) => s.texto)).toEqual(["Paso 1"]);
    expect(m[1].titulo).toBe("Nuevo tema");
    expect(m[1].subtareas.map((s) => s.texto)).toEqual(["Sub A"]);
  });

  it("separa título y descripción con ':' en las subtareas", () => {
    const m = parsearMinuta("- Clase\n  - Entregar: resolver ejercicios 1-5");
    expect(m[0].subtareas[0].texto).toBe("Entregar: resolver ejercicios 1-5");
  });

  it("traslada @responsable y >fecha de una subtarea anidada", () => {
    const m = parsearMinuta("- Clase\n  - Presentar reporte @Ana >mañana");
    const sub = m[0].subtareas[0];
    expect(sub.texto).toBe("Presentar reporte");
    expect(sub.responsable).toBe("Ana");
    expect(sub.fechaLimite).toBeDefined();
  });

  it("ignora la prosa (líneas sin viñeta) entre pendientes", () => {
    const m = parsearMinuta("- Tarea 1\nTexto suelto de la minuta\n- Tarea 2");
    expect(m).toHaveLength(2);
    expect(m[0].titulo).toBe("Tarea 1");
    expect(m[1].titulo).toBe("Tarea 2");
  });

  it("una primera línea indentada sin padre pasa a ser pendiente de nivel superior", () => {
    const m = parsearMinuta("  - Suelto\n- Padre");
    expect(m).toHaveLength(2);
    expect(m[0].titulo).toBe("Suelto");
  });
});

describe("subtareaDeLinea", () => {
  it("llena texto, responsable y fecha límite desde una línea parseada", () => {
    const s = subtareaDeLinea({
      titulo: "Redactar", descripcion: "borrador", responsable: "Luis",
      prioridad: "Media", fechaLimite: "2026-08-10",
    });
    expect(s.texto).toBe("Redactar: borrador");
    expect(s.responsable).toBe("Luis");
    expect(s.fechaLimite).toBe("2026-08-10");
  });
});