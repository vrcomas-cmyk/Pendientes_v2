import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";

// Tests RED (TDD) — EPIC 2 «Agrupación Sistema» (PRODUCT_BACKLOG.md): en escritorio,
// Ajustes/Datos (exportar-importar)/Ayuda viven hoy como TRES puntos de entrada sueltos
// en el sidebar (botón «Ajustes», bloque completo de exportar/importar, e ícono de Ayuda
// en el header). Deben quedar detrás de UN solo punto de entrada «Sistema».

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

describe("Agrupación Sistema en escritorio (TDD, tests RED)", () => {
  it("el sidebar tiene un único punto de entrada «Sistema», no botones sueltos de Ajustes/Exportar/Ayuda", async () => {
    renderApp();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    expect(within(nav).getByRole("button", { name: /Sistema/i })).toBeTruthy();
    expect(within(nav).queryByRole("button", { name: "Ajustes" })).toBeNull();
    expect(within(nav).queryByRole("button", { name: /Exportar JSON/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ayuda y atajos" })).toBeNull();
  });

  it("el menú «Sistema» abre Ajustes", async () => {
    renderApp();
    const user = userEvent.setup();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    await user.click(within(nav).getByRole("button", { name: /Sistema/i }));
    const menu = await screen.findByRole("menu");
    await user.click(within(menu).getByText("Ajustes"));
    await waitFor(() => expect(screen.getByRole("heading", { name: /^Ajustes$/ })).toBeTruthy());
  });

  it("el menú «Sistema» abre Ayuda y atajos", async () => {
    renderApp();
    const user = userEvent.setup();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    await user.click(within(nav).getByRole("button", { name: /Sistema/i }));
    const menu = await screen.findByRole("menu");
    await user.click(within(menu).getByText(/Ayuda y atajos/i));
    await waitFor(() => expect(screen.getByRole("heading", { name: /Atajos y sintaxis/i })).toBeTruthy());
  });

  it("el menú «Sistema» exporta JSON", async () => {
    renderApp();
    const user = userEvent.setup();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    await user.click(within(nav).getByRole("button", { name: /Sistema/i }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText(/Exportar JSON/i)).toBeTruthy();
    expect(within(menu).getByText(/Importar JSON/i)).toBeTruthy();
  });

  it("el atajo de teclado ? sigue abriendo Ayuda sin pasar por el menú", async () => {
    renderApp();
    await screen.findByRole("navigation", { name: /Navegación principal/i });
    fireEvent.keyDown(window, { key: "?" });
    await waitFor(() => expect(screen.getByRole("heading", { name: /Atajos y sintaxis/i })).toBeTruthy());
  });
});

describe("Agrupación Sistema en móvil (TDD, tests RED)", () => {
  function renderAppMobile() {
    window.innerWidth = 400;
    window.dispatchEvent(new Event("resize"));
    return renderApp();
  }

  it("el header móvil ya no tiene un ícono de Ayuda suelto: vive dentro del menú «⋮»", async () => {
    renderAppMobile();
    expect(screen.queryByRole("button", { name: "Ayuda y atajos" })).toBeNull();
    const abrirMenu = await screen.findByLabelText("Más opciones");
    fireEvent.click(abrirMenu);
    expect(await screen.findByText(/Ayuda y atajos/i)).toBeTruthy();
  });
});
