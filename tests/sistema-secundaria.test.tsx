import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";

// Tests RED (TDD) — EPIC 2 «Panel/Dashboard y Papelera a navegación secundaria»
// (PRODUCT_BACKLOG.md, depende de «Agrupación Sistema», ya Hecho). Hoy Panel y Papelera
// son filas permanentes en el sidebar de escritorio, bajo el encabezado «Sistema», igual
// que «Pendientes». Deben pasar a vivir dentro del menú «Sistema» (el DropdownMenu de H8),
// dejando en el sidebar solo «Pendientes» como destino de contenido directo.

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

describe("Panel y Papelera a navegación secundaria en escritorio (TDD, tests RED)", () => {
  it("el sidebar ya no tiene filas permanentes «Panel» ni «Papelera» (solo «Pendientes» queda directo)", async () => {
    renderApp();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    expect(within(nav).queryByRole("button", { name: "Panel" })).toBeNull();
    expect(within(nav).queryByRole("button", { name: "Papelera" })).toBeNull();
    expect(within(nav).getByRole("button", { name: "Pendientes" })).toBeTruthy();
  });

  it("el menú «Sistema» abre Panel", async () => {
    renderApp();
    const user = userEvent.setup();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    await user.click(within(nav).getByRole("button", { name: /Sistema/i }));
    const menu = await screen.findByRole("menu");
    await user.click(within(menu).getByText("Panel"));
    const main = await screen.findByRole("main");
    await waitFor(() => expect(within(main).getByText("Total abiertos")).toBeTruthy());
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
