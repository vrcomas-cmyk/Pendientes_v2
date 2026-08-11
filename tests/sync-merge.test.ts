import { describe, it, expect } from "vitest";
import {
  unionBy,
  mergePendiente,
  mergeNota,
  mergeProyecto,
  mergeEvento,
  mergeEspacio,
  contenidoIgual,
  reconciliar,
  type MapaSync,
} from "@/lib/sync-merge";
import type { Pendiente, Nota, Proyecto, EventoCalendario, Espacio } from "@/types";

function pendientePatch(p: Partial<Pendiente> & { id: string }): Pendiente {
  return {
    titulo: "",
    solicitante: "",
    responsable: "",
    descripcion: "",
    prioridad: "Media",
    estado: "pendiente",
    fechaLimite: "",
    proyecto: "",
    etiquetas: [],
    subtareas: [],
    comentarios: [],
    adjuntos: [],
    origenNota: null,
    creado: "2026-01-01T00:00:00.000Z",
    modificado: "2026-01-01T00:00:00.000Z",
    fechaCompletado: null,
    ...p,
  };
}

describe("unionBy", () => {
  it("dedupe por clave (conserva el primero visto)", () => {
    const a = [{ id: "1" }, { id: "2" }, { id: "1" }];
    const r = unionBy(a, (x) => x.id);
    expect(r).toEqual([{ id: "1" }, { id: "2" }]);
  });
});

describe("mergePendiente", () => {
  it("gana el más reciente y no pierde comentarios/adjuntos/subtareas/etiquetas", () => {
    const viejo = "2026-01-01";
    const nuevo = "2026-01-02";
    const localA = pendientePatch({ id: "p1", titulo: "Loc", modificado: nuevo });
    const remoteA = pendientePatch({ id: "p1", titulo: "Rem", modificado: viejo });
    const r = mergePendiente(localA, remoteA);
    expect(r.merged.titulo).toBe("Loc");
    expect(r.conflicto).toBe(true);
  });

  it("une comentarios por id y los ordena deterministamente por fecha+texto", () => {
    const local = pendientePatch({
      id: "p1",
      modificado: "2026-01-01T10:00:00Z",
      comentarios: [
        { id: "c1", texto: "hola", autor: "A", fecha: "2026-01-01T09:00:00Z" },
        { id: "c2", texto: "mundo", autor: "B", fecha: "2026-01-01T09:01:00Z" },
      ],
    });
    const remote = pendientePatch({
      id: "p1",
      modificado: "2026-01-01T10:00:00Z",
      comentarios: [
        { id: "c2", texto: "mundo", autor: "B", fecha: "2026-01-01T09:01:00Z" },
        { id: "c3", texto: "nuevo", autor: "C", fecha: "2026-01-01T09:02:00Z" },
      ],
    });
    const r = mergePendiente(local, remote);
    expect(r.merged.comentarios.map((c) => c.id).sort()).toEqual(["c1", "c2", "c3"]);
  });

  it("une adjuntos por id (sin duplicar)", () => {
    const local = pendientePatch({
      id: "p1",
      adjuntos: [
        { id: "a1", nombre: "x.pdf", tipo: "application/pdf", tamano: 100 },
        { id: "a2", nombre: "y.pdf", tipo: "application/pdf", tamano: 200 },
      ],
    });
    const remote = pendientePatch({
      id: "p1",
      adjuntos: [
        { id: "a2", nombre: "y.pdf", tipo: "application/pdf", tamano: 200 },
        { id: "a3", nombre: "z.pdf", tipo: "application/pdf", tamano: 300 },
      ],
    });
    const r = mergePendiente(local, remote);
    expect(r.merged.adjuntos.map((a) => a.id).sort()).toEqual(["a1", "a2", "a3"]);
  });

  it("une subtareas por id (gana el lado más reciente para sus campos escalares)", () => {
    const local = pendientePatch({
      id: "p1",
      modificado: "2026-01-02",
      subtareas: [
        { id: "s1", texto: "A (local editado)", completada: true },
      ],
    });
    const remote = pendientePatch({
      id: "p1",
      modificado: "2026-01-01",
      subtareas: [
        { id: "s1", texto: "A (remoto)", completada: false },
        { id: "s2", texto: "B (solo remoto)", completada: false },
      ],
    });
    const r = mergePendiente(local, remote);
    // El lado más reciente (local) va primero en la unión → gana para s1.
    const s1 = r.merged.subtareas.find((s) => s.id === "s1");
    expect(s1?.texto).toBe("A (local editado)");
    expect(s1?.completada).toBe(true);
    expect(r.merged.subtareas.map((s) => s.id).sort()).toEqual(["s1", "s2"]);
  });

  it("une etiquetas deduplicando y ordenando", () => {
    const local = pendientePatch({ id: "p1", etiquetas: ["a", "b"] });
    const remote = pendientePatch({ id: "p1", etiquetas: ["b", "c"] });
    const r = mergePendiente(local, remote);
    expect(r.merged.etiquetas).toEqual(["a", "b", "c"]);
  });

  it("merged.modificado = el mayor de los dos", () => {
    const local = pendientePatch({ id: "p1", modificado: "2026-01-01" });
    const remote = pendientePatch({ id: "p1", modificado: "2026-01-05" });
    const r = mergePendiente(local, remote);
    expect(r.merged.modificado).toBe("2026-01-05");
  });

  it("no hay conflicto si los campos escalares coinciden", () => {
    const local = pendientePatch({ id: "p1", titulo: "X", modificado: "2026-01-01" });
    const remote = pendientePatch({ id: "p1", titulo: "X", modificado: "2026-01-01" });
    const r = mergePendiente(local, remote);
    expect(r.conflicto).toBe(false);
  });
});

describe("mergeNota", () => {
  it("gana el más reciente por modificado", () => {
    const local: Nota = { id: "n1", titulo: "Loc", contenidoHTML: "<p>L</p>", creado: "2026-01-01", modificado: "2026-01-02" };
    const remote: Nota = { id: "n1", titulo: "Rem", contenidoHTML: "<p>R</p>", creado: "2026-01-01", modificado: "2026-01-01" };
    const r = mergeNota(local, remote);
    expect(r.merged.titulo).toBe("Loc");
    expect(r.conflicto).toBe(true);
  });
  it("no hay conflicto si título y HTML coinciden", () => {
    const local: Nota = { id: "n1", titulo: "X", contenidoHTML: "<p>x</p>", creado: "2026-01-01", modificado: "2026-01-02" };
    const remote: Nota = { id: "n1", titulo: "X", contenidoHTML: "<p>x</p>", creado: "2026-01-01", modificado: "2026-01-01" };
    const r = mergeNota(local, remote);
    expect(r.conflicto).toBe(false);
  });
});

describe("mergeProyecto", () => {
  it("gana el más reciente; conflicto si nombre o color cambian", () => {
    const local: Proyecto = { id: "pr1", nombre: "Loc", color: "rojo", creado: "", modificado: "2026-01-02" };
    const remote: Proyecto = { id: "pr1", nombre: "Rem", color: "azul", creado: "", modificado: "2026-01-01" };
    const r = mergeProyecto(local, remote);
    expect(r.merged.nombre).toBe("Loc");
    expect(r.conflicto).toBe(true);
  });
});

describe("mergeEvento", () => {
  it("gana el más reciente; conflicto si titulo/fecha/hora/duracion cambian", () => {
    const local: EventoCalendario = { id: "e1", titulo: "L", fecha: "2026-01-01", hora: "10:00", duracionMin: 30, creado: "", modificado: "2026-01-02" };
    const remote: EventoCalendario = { id: "e1", titulo: "R", fecha: "2026-01-01", hora: "10:00", duracionMin: 30, creado: "", modificado: "2026-01-01" };
    const r = mergeEvento(local, remote);
    expect(r.merged.titulo).toBe("L");
    expect(r.conflicto).toBe(true);
  });
});

describe("mergeEspacio", () => {
  it("gana el más reciente; conflicto si nombre/icono/color cambian", () => {
    const local: Espacio = { id: "esp1", nombre: "Trabajo", icono: "🏢", color: "azul", creado: "", modificado: "2026-01-02" };
    const remote: Espacio = { id: "esp1", nombre: "Oficina", icono: "🏢", color: "rojo", creado: "", modificado: "2026-01-01" };
    const r = mergeEspacio(local, remote);
    expect(r.merged.nombre).toBe("Trabajo");
    expect(r.conflicto).toBe(true);
  });
  it("sin conflicto si son iguales salvo `modificado`", () => {
    const local: Espacio = { id: "esp1", nombre: "Trabajo", icono: "🏢", color: "azul", creado: "", modificado: "2026-01-02" };
    const remote: Espacio = { id: "esp1", nombre: "Trabajo", icono: "🏢", color: "azul", creado: "", modificado: "2026-01-01" };
    const r = mergeEspacio(local, remote);
    expect(r.conflicto).toBe(false);
  });
});

describe("contenidoIgual", () => {
  it("true si son idénticos excepto `modificado`", () => {
    const a = pendientePatch({ id: "p1", modificado: "2026-01-01" });
    const b = pendientePatch({ id: "p1", modificado: "2026-01-02" });
    expect(contenidoIgual(a, b)).toBe(true);
  });
  it("false si difieren en cualquier otro campo", () => {
    const a = pendientePatch({ id: "p1", titulo: "X", modificado: "2026-01-01" });
    const b = pendientePatch({ id: "p1", titulo: "Y", modificado: "2026-01-02" });
    expect(contenidoIgual(a, b)).toBe(false);
  });
});

describe("reconciliar", () => {
  const merge = (l: Pendiente, r: Pendiente) => mergePendiente(l, r);

  it("alta remota nueva → se incorpora", () => {
    const remote = [pendientePatch({ id: "r1", modificado: "2026-01-01" })];
    const r = reconciliar([], remote, {} as MapaSync, merge);
    expect(r.resultado.map((p) => p.id)).toEqual(["r1"]);
    expect(r.nextLast["r1"]).toBe("2026-01-01");
    expect(r.conflictos).toEqual([]);
  });

  it("alta local nueva (no en last) → se conserva sin marcar como subida", () => {
    const local = [pendientePatch({ id: "l1", modificado: "2026-01-01" })];
    const r = reconciliar(local, [], {} as MapaSync, merge);
    expect(r.resultado.map((p) => p.id)).toEqual(["l1"]);
    expect(r.nextLast["l1"]).toBeUndefined();
  });

  it("borrado remoto aceptado si el lado local estaba en last y NO está sucio", () => {
    const last: MapaSync = { x1: "2026-01-01" };
    // Local: sigue presente, sin modificar desde last
    const local = [pendientePatch({ id: "x1", modificado: "2026-01-01" })];
    const r = reconciliar(local, [], last, merge);
    expect(r.resultado).toEqual([]);
    expect(r.nextLast["x1"]).toBeUndefined();
  });

  it("borrado remoto rechazado si el lado local está sucio (edición gana al borrado)", () => {
    const last: MapaSync = { x1: "2026-01-01" };
    const local = [pendientePatch({ id: "x1", titulo: "Editado localmente", modificado: "2026-01-10" })];
    const r = reconciliar(local, [], last, merge);
    expect(r.resultado.map((p) => p.id)).toEqual(["x1"]);
    expect(r.resultado[0].titulo).toBe("Editado localmente");
  });

  it("ausencia incierta (protegido) preserva sin re-subir", () => {
    const last: MapaSync = { x1: "2026-01-01" };
    const local = [pendientePatch({ id: "x1", modificado: "2026-01-01" })];
    const r = reconciliar(local, [], last, merge, (id) => id === "x1");
    expect(r.resultado.map((p) => p.id)).toEqual(["x1"]);
    // Preserva la marca last (no se re-subir)
    expect(r.nextLast["x1"]).toBe("2026-01-01");
  });

  it("edición concurrente dispara conflicto", () => {
    const last: MapaSync = { x1: "2026-01-01" };
    const local = [pendientePatch({ id: "x1", titulo: "Loc", modificado: "2026-01-10" })];
    const remote = [pendientePatch({ id: "x1", titulo: "Rem", modificado: "2026-01-11" })];
    const r = reconciliar(local, remote, last, merge);
    expect(r.conflictos).toEqual(["x1"]);
  });

  it("edición remota sola (local sin cambios) no es conflicto y emite merged igual a remote", () => {
    const last: MapaSync = { x1: "2026-01-01" };
    const local = [pendientePatch({ id: "x1", titulo: "X", modificado: "2026-01-01" })];
    const remote = [pendientePatch({ id: "x1", titulo: "Editado remoto", modificado: "2026-01-05" })];
    const r = reconciliar(local, remote, last, merge);
    expect(r.conflictos).toEqual([]);
    expect(r.resultado[0].titulo).toBe("Editado remoto");
    expect(r.nextLast["x1"]).toBe("2026-01-05");
  });

  it("ídempotente: reconciliar mismo estado dos veces da mismo resultado", () => {
    const last: MapaSync = {};
    const local = [pendientePatch({ id: "x1", titulo: "A", modificado: "2026-01-01" })];
    const remote = [pendientePatch({ id: "x1", titulo: "A", modificado: "2026-01-01" })];
    const r1 = reconciliar(local, remote, last, merge);
    const r2 = reconciliar(r1.resultado, remote, r1.nextLast, merge);
    expect(r2.conflictos).toEqual([]);
    expect(r2.resultado.map((p) => p.id)).toEqual(["x1"]);
  });
});
