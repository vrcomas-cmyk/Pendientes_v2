import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { AppProvider, useApp } from "@/store";
import type { Roca } from "@/types";

const iso = new Date().toISOString();
const wrapper = ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>;

beforeEach(() => { localStorage.clear(); });

describe("respaldo completo (export/import)", () => {
  it("restaurar un respaldo trae también rocas con su bitácora, metas, proyectos y eventos", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const roca: Roca = {
      id: "r1", nombre: "Soporte a usuarios", etiquetaActividad: "Ayudas generadas", fechaInicio: "2026-10-01", fechaFin: "2026-12-31",
      actividades: [{ id: "a1", fecha: "2026-10-05", descripcion: "Me pidieron un reporte", creado: iso, modificado: iso }], creado: iso, modificado: iso,
    };
    act(() => {
      result.current.reemplazarTodo([], [], "Yo", [], [{ id: "e1", titulo: "Junta", fecha: "2026-10-26", hora: "10:00", duracionMin: 30, creado: iso, modificado: iso }], [], [], [roca],
        { metas: [{ id: "m1", nombre: "Meta", icono: "🎯", color: "azul", creado: iso, modificado: iso }] });
    });
    expect(result.current.rocas.map(r => r.nombre)).toEqual(["Soporte a usuarios"]);
    expect(result.current.rocas[0].actividades).toHaveLength(1);
    expect(result.current.eventos.map(e => e.titulo)).toEqual(["Junta"]);
    expect(result.current.metas.map(m => m.nombre)).toEqual(["Meta"]);
  });

  it("un respaldo antiguo (solo pendientes y notas) NO borra rocas ni metas existentes", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => { result.current.crearRoca("Mi roca"); result.current.crearMeta("Mi meta"); });
    act(() => { result.current.reemplazarTodo([], [], "Yo"); });
    expect(result.current.rocas.map(r => r.nombre)).toEqual(["Mi roca"]);
    expect(result.current.metas.map(m => m.nombre)).toEqual(["Mi meta"]);
  });
});
