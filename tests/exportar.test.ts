import { describe, it, expect } from "vitest";
import { generarICS, generarMarkdown, generarHTMLImprimible } from "@/lib/exportar";
import type { Pendiente, Nota, Proyecto, EventoCalendario } from "@/types";

function pendiente(datos: Partial<Pendiente>): Pendiente {
  return {
    id: "p1", titulo: "Título", solicitante: "", responsable: "", descripcion: "",
    prioridad: "Media", estado: "pendiente", fechaLimite: "", proyecto: "", etiquetas: [],
    subtareas: [], comentarios: [], adjuntos: [], origenNota: null,
    creado: "2026-01-01T00:00:00.000Z", modificado: "2026-01-01T00:00:00.000Z", fechaCompletado: null,
    ...datos,
  };
}
function evento(datos: Partial<EventoCalendario>): EventoCalendario {
  return {
    id: "e1", titulo: "Evento", fecha: "2026-08-10", hora: "10:00", duracionMin: 30,
    creado: "2026-01-01T00:00:00.000Z", modificado: "2026-01-01T00:00:00.000Z",
    ...datos,
  };
}

describe("generarICS", () => {
  it("incluye la cabecera y el cierre de VCALENDAR", () => {
    const ics = generarICS([], []);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("END:VCALENDAR");
  });
  it("pendiente con hora genera DTSTART/DTEND con hora, sumando duracionMin", () => {
    const ics = generarICS([pendiente({ fechaLimite: "2026-08-10", hora: "09:00", duracionMin: 45, titulo: "Reunión" })], []);
    expect(ics).toContain("DTSTART:20260810T090000");
    expect(ics).toContain("DTEND:20260810T094500");
    expect(ics).toContain("SUMMARY:Reunión");
  });
  it("pendiente sin hora genera evento de día completo (VALUE=DATE)", () => {
    const ics = generarICS([pendiente({ fechaLimite: "2026-08-10" })], []);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260810");
    expect(ics).toContain("DTEND;VALUE=DATE:20260811");
  });
  it("ignora pendientes borrados o sin fecha", () => {
    const ics = generarICS([pendiente({ fechaLimite: "", borrado: false }), pendiente({ fechaLimite: "2026-08-10", borrado: true })], []);
    expect(ics.match(/BEGIN:VEVENT/g)).toBeNull();
  });
  it("escapa comas, punto y coma y saltos de línea en SUMMARY/DESCRIPTION", () => {
    const ics = generarICS([pendiente({ fechaLimite: "2026-08-10", titulo: "Cotizar, urgente; ver esto", descripcion: "línea1\nlínea2" })], []);
    expect(ics).toContain("SUMMARY:Cotizar\\, urgente\\; ver esto");
    expect(ics).toContain("DESCRIPTION:línea1\\nlínea2");
  });
  it("incluye eventos de calendario sueltos", () => {
    const ics = generarICS([], [evento({ titulo: "Cita", fecha: "2026-08-12", hora: "14:30", duracionMin: 60 })]);
    expect(ics).toContain("SUMMARY:Cita");
    expect(ics).toContain("DTSTART:20260812T143000");
    expect(ics).toContain("DTEND:20260812T153000");
  });
});

describe("generarMarkdown", () => {
  it("agrupa por prioridad y marca completados con [x]", () => {
    const md = generarMarkdown([
      pendiente({ titulo: "Urgente", prioridad: "Alta" }),
      pendiente({ titulo: "Hecha", prioridad: "Alta", fechaCompletado: "2026-08-01T00:00:00.000Z" }),
    ], [], []);
    expect(md).toContain("### Alta");
    expect(md).toMatch(/- \[ \] Urgente/);
    expect(md).toMatch(/- \[x\] Hecha/);
  });
  it("excluye pendientes borrados o archivados", () => {
    const md = generarMarkdown([pendiente({ titulo: "Fuera", borrado: true }), pendiente({ titulo: "TambiénFuera", archivado: true })], [], []);
    expect(md).not.toContain("Fuera");
  });
  it("incluye notas activas con su título", () => {
    const nota: Nota = { id: "n1", titulo: "Mi nota", contenidoHTML: "<p>hola</p>", creado: "", modificado: "" };
    const md = generarMarkdown([], [nota], []);
    expect(md).toContain("## Notas");
    expect(md).toContain("### Mi nota");
    expect(md).toContain("hola");
  });
  it("resuelve el nombre del proyecto por proyectoId", () => {
    const proy: Proyecto = { id: "pr1", nombre: "Ventas", color: "azul", creado: "", modificado: "" };
    const md = generarMarkdown([pendiente({ titulo: "Cotizar", prioridad: "Media", proyectoId: "pr1" })], [], [proy]);
    expect(md).toContain("#Ventas");
  });
});

describe("generarHTMLImprimible", () => {
  it("genera un documento HTML autocontenido con las secciones por prioridad presentes", () => {
    const html = generarHTMLImprimible([pendiente({ titulo: "Algo", prioridad: "Baja" })], []);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<h2>Baja</h2>");
    expect(html).toContain("Algo");
  });
  it("escapa HTML en el título (previene inyección si el título trae < o >)", () => {
    const html = generarHTMLImprimible([pendiente({ titulo: "<script>alert(1)</script>", prioridad: "Alta" })], []);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
