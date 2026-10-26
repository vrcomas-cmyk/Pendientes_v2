import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "@/App";

vi.mock("@/lib/supabase", () => ({
  getConfig: () => ({ url: "", anon: "" }),
  isConfigured: () => false,
  saveConfig: vi.fn(),
  getSupabase: () => null,
}));

const hoy = (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const iso = new Date().toISOString();

function renderMovil() {
  window.innerWidth = 400;
  window.dispatchEvent(new Event("resize"));
  localStorage.setItem("sb_modo_local", "1");
  localStorage.setItem("pn_pendientes", "[]");
  localStorage.setItem("pn_notas", "[]");
  localStorage.setItem("pn_eventos", JSON.stringify([
    { id: "ev1", titulo: "Junta de equipo", fecha: hoy, hora: "15:00", duracionMin: 60, creado: iso, modificado: iso },
    { id: "ev2", titulo: "Revisión con Liz", fecha: hoy, hora: "15:30", duracionMin: 60, creado: iso, modificado: iso },
  ]));
  return render(<App />);
}

beforeEach(() => { localStorage.clear(); window.innerWidth = 400; });

describe("Agenda del día en móvil (hoja inferior)", () => {
  it("el botón «Agenda del día» abre una hoja con los eventos del día y marca el cruce", async () => {
    renderMovil();
    fireEvent.click(await screen.findByLabelText("Agenda del día"));
    const hoja = await screen.findByRole("dialog");
    await waitFor(() => expect(within(hoja).getByText("Junta de equipo")).toBeTruthy());
    expect(within(hoja).getByText("Revisión con Liz")).toBeTruthy();
    expect(within(hoja).getAllByLabelText(/Se cruza con otro elemento/i).length).toBe(2);
  });

  it("se cierra con el asa y no deja la agenda montada", async () => {
    renderMovil();
    fireEvent.click(await screen.findByLabelText("Agenda del día"));
    const hoja = await screen.findByRole("dialog");
    fireEvent.click(within(hoja).getByLabelText("Cerrar", { selector: "button" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("«Abrir calendario completo» cierra la hoja y abre Pendientes en modo calendario", async () => {
    renderMovil();
    fireEvent.click(await screen.findByLabelText("Agenda del día"));
    fireEvent.click(await screen.findByText("Abrir calendario completo"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(await screen.findByText("semana", { exact: true })).toBeTruthy(); // selector Día/Semana/Mes/Año del calendario
  });
});
