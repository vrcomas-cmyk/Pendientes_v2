import { describe, it, expect } from "vitest";
import { reconciliar, contenidoIgual, jsonEstable, type MapaSync } from "@/lib/sync-merge";

interface It { id: string; modificado: string; titulo: string; extra?: { b: number; a: number }; borrado?: boolean }
const mergeLocal = (l: It) => ({ merged: l, conflicto: false });
const mk = (id: string, extra: Partial<It> = {}): It => ({ id, titulo: "T" + id, modificado: "2026-10-26T10:00:00Z", extra: { b: 2, a: 1 }, ...extra });

/** Imita a Postgres jsonb: reordena las claves (por longitud y luego alfabéticamente) al leer. */
const comoJsonb = <T,>(v: T): T => {
  const rec = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(rec);
    if (x && typeof x === "object") {
      const o = x as Record<string, unknown>;
      return Object.fromEntries(Object.keys(o).sort((p, q) => p.length - q.length || (p < q ? -1 : 1)).map(k => [k, rec(o[k])]));
    }
    return x;
  };
  return rec(v) as T;
};

describe("comparación de contenido", () => {
  it("no depende del orden de las claves (jsonb las reordena)", () => {
    const local = mk("a");
    expect(JSON.stringify(local)).not.toBe(JSON.stringify(comoJsonb(local)));
    expect(contenidoIgual(local, comoJsonb(local))).toBe(true);
    expect(jsonEstable({ b: 1, a: [2, { d: 1, c: undefined }] })).toBe(jsonEstable({ a: [2, { d: 1 }], b: 1 }));
  });
  it("sigue detectando diferencias reales (valores y orden de arreglos)", () => {
    expect(contenidoIgual(mk("a"), mk("a", { titulo: "otro" }))).toBe(false);
    expect(jsonEstable([1, 2])).not.toBe(jsonEstable([2, 1]));
  });
});

// Mini-simulación de dos dispositivos contra una nube, con la misma lógica de pull() + flush() de sync.tsx.
interface Cliente { local: It[]; last: MapaSync }
function pull(c: Cliente, nube: Map<string, It>, soft: boolean) {
  const remote = [...nube.values()].map(comoJsonb);
  const r = reconciliar(c.local, remote, c.last, mergeLocal, undefined, soft ? { restaurarActivos: true } : undefined);
  c.local = r.resultado; c.last = r.nextLast;
}
function flush(c: Cliente, nube: Map<string, It>): number {
  const sucios = c.local.filter(x => c.last[x.id] !== x.modificado);
  sucios.forEach(x => { nube.set(x.id, JSON.parse(JSON.stringify(x))); c.last[x.id] = x.modificado });
  const ids = new Set(c.local.map(x => x.id));
  for (const id of Object.keys(c.last).filter(id => !ids.has(id))) nube.delete(id); // «lo borré aquí»
  return sucios.length;
}

describe("convergencia entre dispositivos", () => {
  const rocas = ["r1", "r2", "r3", "r4"].map(id => mk(id));
  const montar = () => {
    const nube = new Map<string, It>(rocas.map(r => [r.id, r]));
    const holder: Cliente = { local: rocas.map(r => ({ ...r })), last: Object.fromEntries(rocas.map(r => [r.id, r.modificado])) };
    // Dispositivo con estado «roto»: su marca de sincronizado conoce los ids pero perdió los datos locales.
    const perdedor: Cliente = { local: [], last: Object.fromEntries(rocas.map(r => [r.id, r.modificado])) };
    return { nube, holder, perdedor };
  };

  it("con la lógica antigua, el estado roto de UN dispositivo borra los elementos activos de la nube y luego de todos los demás", () => {
    const { nube, holder, perdedor } = montar();
    for (let i = 0; i < 6; i++) {
      pull(perdedor, nube, false); flush(perdedor, nube);
      pull(holder, nube, false); flush(holder, nube);
    }
    expect(nube.size).toBe(0);          // la nube quedó vacía
    expect(holder.local).toHaveLength(0); // y el dispositivo sano aceptó el «borrado»
  });

  it("con la corrección el elemento activo se restaura en el dispositivo que lo perdió y todo se estabiliza", () => {
    const { nube, holder, perdedor } = montar();
    let subidas = 0, borrados = 0;
    for (let i = 0; i < 6; i++) {
      pull(perdedor, nube, true); const antes = nube.size; subidas += flush(perdedor, nube); borrados += antes - nube.size;
      pull(holder, nube, true); subidas += flush(holder, nube);
    }
    expect(borrados).toBe(0);
    expect(nube.size).toBe(4);
    expect(perdedor.local.map(x => x.id).sort()).toEqual(["r1", "r2", "r3", "r4"]);
    expect(subidas).toBe(0); // y nadie re-sube lo que ya está igual en la nube
  });

  it("si la nube pierde elementos activos, el dispositivo que los tiene los vuelve a subir en vez de aceptar el «borrado»", () => {
    const { nube, holder } = montar();
    nube.clear(); // alguien (o un fallo) vació la nube
    for (let i = 0; i < 4; i++) { pull(holder, nube, true); flush(holder, nube); }
    expect(nube.size).toBe(4);
    expect(holder.local).toHaveLength(4);
  });

  it("lo que SÍ está en la papelera (borrado) se borra físicamente de la nube cuando se purga en local", () => {
    const enPapelera = mk("p1", { borrado: true });
    const nube = new Map<string, It>([[enPapelera.id, enPapelera]]);
    const c: Cliente = { local: [], last: { p1: enPapelera.modificado } }; // purgado en local
    pull(c, nube, true); flush(c, nube);
    expect(nube.has("p1")).toBe(false);
    expect(c.local).toEqual([]);
  });

  it("sin re-subidas infinitas: un elemento igual al de la nube queda marcado como sincronizado", () => {
    const x = mk("z1");
    const nube = new Map<string, It>([[x.id, x]]);
    const c: Cliente = { local: [{ ...x }], last: {} };
    let subidas = 0;
    for (let i = 0; i < 5; i++) { pull(c, nube, true); subidas += flush(c, nube); }
    expect(subidas).toBeLessThanOrEqual(1);
  });
});
