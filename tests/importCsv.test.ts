import { describe, it, expect } from "vitest";
import { parsearCSV, detectarFormato, mapearFilas } from "@/lib/importCsv";

describe("parsearCSV", () => {
  it("separa filas y columnas simples", () => {
    const r = parsearCSV("a,b,c\n1,2,3");
    expect(r).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
  });
  it("respeta comas dentro de comillas", () => {
    const r = parsearCSV('titulo,desc\n"Hola, mundo",normal');
    expect(r[1]).toEqual(["Hola, mundo", "normal"]);
  });
  it("desescapa comillas dobles (\"\")", () => {
    const r = parsearCSV('a\n"dijo ""hola"""');
    expect(r[1]).toEqual(['dijo "hola"']);
  });
  it("ignora líneas completamente vacías", () => {
    const r = parsearCSV("a,b\n1,2\n\n3,4");
    expect(r).toEqual([["a", "b"], ["1", "2"], ["3", "4"]]);
  });
  it("maneja CRLF", () => {
    const r = parsearCSV("a,b\r\n1,2\r\n");
    expect(r).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("detectarFormato", () => {
  it("reconoce el formato propio por Titulo+Prioridad", () => {
    expect(detectarFormato(["Titulo", "Solicitante", "Prioridad"])).toBe("propio");
  });
  it("reconoce Todoist por CONTENT", () => {
    expect(detectarFormato(["TYPE", "CONTENT", "PRIORITY"])).toBe("todoist");
  });
  it("cae a genérico si no reconoce nada", () => {
    expect(detectarFormato(["Nombre", "Nota"])).toBe("generico");
  });
});

describe("mapearFilas", () => {
  it("formato propio: mapea columnas por nombre exacto", () => {
    const headers = ["Titulo", "Solicitante", "Responsable", "Prioridad", "Estado", "FechaLimite", "Proyecto", "Subtareas", "Descripcion"];
    const filas = [["Cotizar", "Liz", "Yo", "Alta", "pendiente", "2026-08-10", "Ventas", "", "urgente"]];
    const r = mapearFilas(headers, filas, "propio");
    expect(r).toEqual([{ titulo: "Cotizar", solicitante: "Liz", responsable: "Yo", prioridad: "Alta", fechaLimite: "2026-08-10", proyecto: "Ventas", descripcion: "urgente" }]);
  });
  it("formato propio: descarta filas sin título", () => {
    const headers = ["Titulo", "Prioridad"];
    const r = mapearFilas(headers, [["", "Alta"], ["Real", "Media"]], "propio");
    expect(r).toHaveLength(1);
    expect(r[0].titulo).toBe("Real");
  });
  it("formato todoist: mapea CONTENT→titulo y traduce PRIORITY numérica", () => {
    const headers = ["TYPE", "CONTENT", "DESCRIPTION", "PRIORITY", "DATE", "RESPONSIBLE"];
    const filas = [["task", "Comprar leche", "", "1", "2026/08/10", "Yo"]];
    const r = mapearFilas(headers, filas, "todoist");
    expect(r[0].titulo).toBe("Comprar leche");
    expect(r[0].prioridad).toBe("Alta");
  });
  it("formato todoist: ignora filas que no son TYPE=task", () => {
    const headers = ["TYPE", "CONTENT", "PRIORITY"];
    const filas = [["project", "Mi proyecto", "1"], ["task", "Tarea real", "3"]];
    const r = mapearFilas(headers, filas, "todoist");
    expect(r).toHaveLength(1);
    expect(r[0].titulo).toBe("Tarea real");
  });
  it("formato genérico: usa la primera columna como título", () => {
    const r = mapearFilas(["Nombre", "Nota"], [["Algo", "detalle"]], "generico");
    expect(r).toEqual([{ titulo: "Algo", prioridad: "Media" }]);
  });
});
