import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";

vi.mock("@/lib/supabase", () => ({
  getConfig: () => ({ url: "", anon: "" }),
  isConfigured: () => false,
  saveConfig: vi.fn(),
  getSupabase: () => null,
}));

const iso = new Date().toISOString();
const guardados = <T,>(clave: string): T[] => JSON.parse(localStorage.getItem(clave) || "[]");
const hoyIso = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const pendienteBase = (extra: object = {}) => ({ id: "p1", titulo: "Preparar informe", solicitante: "", responsable: "", descripcion: "", prioridad: "Media", estado: "pendiente", fechaLimite: "", proyecto: "", etiquetas: [], subtareas: [], comentarios: [], adjuntos: [], origenNota: null, creado: iso, modificado: iso, fechaCompletado: null, ...extra });

function renderApp(seed: { pendientes?: unknown[]; notas?: unknown[]; eventos?: unknown[] } = {}) {
  window.innerWidth = 1280;
  window.dispatchEvent(new Event("resize"));
  localStorage.setItem("sb_modo_local", "1");
  localStorage.setItem("pn_pendientes", JSON.stringify(seed.pendientes ?? []));
  localStorage.setItem("pn_notas", JSON.stringify(seed.notas ?? []));
  localStorage.setItem("pn_eventos", JSON.stringify(seed.eventos ?? []));
  return render(<App />);
}

beforeEach(() => { localStorage.clear(); window.innerWidth = 1280; });

describe("Nuevo pendiente: modo rápido (Título → Tab → Descripción → Enter)", () => {
  it("abre en modo rápido: solo Título y Descripción; Tab baja a la descripción y Enter captura", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole("button", { name: /Nuevo pendiente/ }));
    const dlg = await screen.findByRole("dialog");
    expect(within(dlg).queryByText(/Quién lo solicita/i)).toBeNull(); // el formulario completo no se muestra
    await user.type(within(dlg).getByPlaceholderText("¿Qué hay que hacer?"), "Llamar a Liz");
    await user.tab();
    expect(document.activeElement?.tagName).toBe("TEXTAREA");
    await user.keyboard("Confirmar la cotización{Enter}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(guardados<{ titulo: string; descripcion: string }>("pn_pendientes").some(p => p.titulo === "Llamar a Liz" && p.descripcion === "Confirmar la cotización")).toBe(true));
  });

  it("«Más opciones» muestra el formulario completo y recuerda la elección", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole("button", { name: /Nuevo pendiente/ }));
    const dlg = await screen.findByRole("dialog");
    await user.click(within(dlg).getByRole("button", { name: "Más opciones" }));
    expect(await within(dlg).findByText(/Quién lo solicita/i)).toBeTruthy();
    expect(localStorage.getItem("pn_modal_rapido")).toBe("0");
  });
});

describe("Calendario como módulo independiente", () => {
  it("aparece en la navegación principal con su selector de vistas", async () => {
    const user = userEvent.setup();
    renderApp();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    await user.click(within(nav).getByRole("button", { name: /^Calendario/ }));
    expect(await screen.findByText("semana", { exact: true })).toBeTruthy();
    await user.click(within(nav).getByRole("button", { name: /^Pendientes/ }));
    const main = await screen.findByRole("main");
    expect(within(main).queryByRole("button", { name: /^Calendario$/ })).toBeNull(); // ya no hay modo Calendario dentro de Pendientes
  });

  it("«Nuevo» crea un pendiente con hora desde el calendario (tipo Pendiente)", async () => {
    const user = userEvent.setup();
    renderApp();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    await user.click(within(nav).getByRole("button", { name: /^Calendario/ }));
    await user.click(await screen.findByRole("button", { name: "Nuevo en el calendario" }));
    const dlg = await screen.findByRole("dialog");
    await user.click(within(dlg).getByRole("tab", { name: "Pendiente" }));
    await user.type(within(dlg).getByPlaceholderText(/Enviar cotización/), "Enviar propuesta 3pm por 1h");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      const p = guardados<{ titulo: string; hora: string; duracionMin: number }>("pn_pendientes").find(x => x.titulo === "Enviar propuesta");
      expect(p).toMatchObject({ hora: "15:00", duracionMin: 60 });
    });
  });

  it("«Agendar existente» le pone fecha y hora a un pendiente que ya existía", async () => {
    const user = userEvent.setup();
    renderApp({ pendientes: [pendienteBase()] });
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    await user.click(within(nav).getByRole("button", { name: /^Calendario/ }));
    await user.click(await screen.findByRole("button", { name: "Nuevo en el calendario" }));
    const dlg = await screen.findByRole("dialog");
    await user.click(within(dlg).getByRole("tab", { name: "Agendar existente" }));
    await user.selectOptions(within(dlg).getByLabelText("Pendiente a agendar"), "p1");
    fireEvent.change(within(dlg).getByLabelText("Hora"), { target: { value: "11:30" } });
    await user.click(within(dlg).getByRole("button", { name: /^Agendar/ }));
    await waitFor(() => expect(guardados<{ id: string; hora: string }>("pn_pendientes").find(x => x.id === "p1")).toMatchObject({ hora: "11:30" }));
    expect(guardados<{ id: string; fechaLimite: string }>("pn_pendientes").find(x => x.id === "p1")!.fechaLimite).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("Pendientes: título en negritas y descripción aparte", () => {
  it("el título va en <strong> y la descripción en una línea gris debajo", async () => {
    renderApp({ pendientes: [pendienteBase({ titulo: "Entregar reporte", descripcion: "Incluir cierre de ventas", fechaLimite: hoyIso() })] });
    const titulos = await screen.findAllByText("Entregar reporte");
    expect(titulos.some(t => t.tagName === "STRONG")).toBe(true);
    expect((await screen.findAllByText("Incluir cierre de ventas")).length).toBeGreaterThan(0);
  });
});

describe("Notas: cerrar y reabrir", () => {
  const nota = (id: string, titulo: string, extra: object = {}) => ({ id, titulo, contenidoHTML: `<div>${titulo} contenido</div>`, creado: iso, modificado: iso, ...extra });

  it("una nota cerrada no sale en «Notas recientes» ni en la lista de abiertas, pero sí en «Cerradas»", async () => {
    const user = userEvent.setup();
    renderApp({ notas: [nota("n1", "Minuta abierta"), nota("n2", "Minuta terminada", { cerrada: true })] });
    expect((await screen.findAllByText("Minuta abierta")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Minuta terminada")).toBeNull(); // Hoy → Notas recientes
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    await user.click(within(nav).getByRole("button", { name: /^Notas/ }));
    const main = await screen.findByRole("main");
    expect(await within(main).findByText("Minuta abierta")).toBeTruthy(); // la vista Notas carga en diferido
    expect(within(main).queryByText("Minuta terminada")).toBeNull();
    await user.click(within(main).getByRole("tab", { name: /Cerradas \(1\)/ }));
    expect(await within(main).findByText("Minuta terminada")).toBeTruthy();
  });

  it("al cerrar una nota se marca como cerrada y desaparece de abiertas", async () => {
    const user = userEvent.setup();
    renderApp({ notas: [nota("n1", "Minuta abierta")] });
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    await user.click(within(nav).getByRole("button", { name: /^Notas/ }));
    const main = await screen.findByRole("main");
    await user.click(await within(main).findByText("Minuta abierta"));
    await user.click(await within(main).findByRole("button", { name: /Cerrar/ }));
    await waitFor(() => expect(guardados<{ id: string; cerrada?: boolean }>("pn_notas").find(n => n.id === "n1")?.cerrada).toBe(true));
    expect(within(main).queryByText("Minuta abierta")).toBeNull();
  });
});
