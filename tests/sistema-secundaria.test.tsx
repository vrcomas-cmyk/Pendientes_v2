import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";

// Tests RED (TDD) — «Panel/Contactos/Metas salen de Sistema a filas directas».
// Hoy, antes de este cambio, Panel y Papelera vivían dentro del menú «Sistema» junto a
// Contactos/Metas/Equipo. Se sacan Pendientes, Panel, Contactos y Metas a filas directas del
// sidebar (bajo «Trabajo»); Papelera y Equipo se quedan en el menú «Sistema».

vi.mock("@/lib/supabase", () => ({
  getConfig: () => ({ url: "", anon: "" }),
  isConfigured: () => false,
  saveConfig: vi.fn(),
  getSupabase: () => null,
}));

function renderApp() {
  localStorage.setItem("sb_modo_local", "1");
  localStorage.setItem("pn_pendientes", "[]");
  localStorage.setItem("pn_notas", "[]");
  localStorage.setItem("pn_proyectos", "[]");
  localStorage.setItem("pn_espacios", "[]");
  return render(<App />);
}

beforeEach(() => {
  localStorage.clear();
  window.innerWidth = 1024;
});

describe("Pendientes/Panel/Contactos/Metas como filas directas en escritorio (TDD, tests RED)", () => {
  it("el sidebar lista Panel, Contactos y Metas como filas directas (sin abrir el menú)", async () => {
    renderApp();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    expect(within(nav).getByRole("button", { name: "Pendientes" })).toBeTruthy();
    expect(within(nav).getByRole("button", { name: "Panel" })).toBeTruthy();
    expect(within(nav).getByRole("button", { name: "Contactos" })).toBeTruthy();
    expect(within(nav).getByRole("button", { name: "Metas" })).toBeTruthy();
  });

  it("el menú «Sistema» ya no contiene Panel, Contactos ni Metas (solo Papelera y Equipo)", async () => {
    renderApp();
    const user = userEvent.setup();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    await user.click(within(nav).getByRole("button", { name: /Sistema/i }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("Papelera")).toBeTruthy();
    expect(within(menu).getByText("Mi Equipo")).toBeTruthy();
    expect(within(menu).queryByText("Panel")).toBeNull();
    expect(within(menu).queryByText("Contactos")).toBeNull();
    expect(within(menu).queryByText("Metas")).toBeNull();
  });

  it("el menú «Sistema» abre Papelera", async () => {
    renderApp();
    const user = userEvent.setup();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    await user.click(within(nav).getByRole("button", { name: /Sistema/i }));
    const menu = await screen.findByRole("menu");
    await user.click(within(menu).getByText("Papelera"));
    const main = await screen.findByRole("main");
    await waitFor(() => expect(within(main).getAllByRole("heading", { name: /^Papelera$/ }).length).toBeGreaterThan(0));
  });

  it("el atajo numérico 7 sigue llevando a Panel y el 8 a Papelera", async () => {
    renderApp();
    const main = await screen.findByRole("main");
    fireEvent.keyDown(window, { key: "7" });
    await waitFor(() => expect(within(main).getByText("Total abiertos")).toBeTruthy());
    fireEvent.keyDown(window, { key: "8" });
    await waitFor(() => expect(within(main).getAllByRole("heading", { name: /^Papelera$/ }).length).toBeGreaterThan(0));
  });
});
