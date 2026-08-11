import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "@/App";

// Tests RED (TDD) — «Selector de Espacio activo en móvil» (PRODUCT_BACKLOG.md EPIC 2).
// Hoy el menú «⋮» de móvil no tiene forma de cambiar `espacioActualId`: solo existe el
// dropdown colapsable en el sidebar de escritorio. Estos tests fallan hasta que el menú
// móvil gane una entrada «Espacio: …» con submenú de espacios + «Todos».

vi.mock("@/lib/supabase", () => ({
  getConfig: () => ({ url: "", anon: "" }),
  isConfigured: () => false,
  saveConfig: vi.fn(),
  getSupabase: () => null,
}));

const iso = new Date().toISOString();
const espTrabajo = { id: "esp-trabajo", nombre: "Trabajo", icono: "🏢", color: "azul", creado: iso, modificado: iso };
const espCasa = { id: "esp-casa", nombre: "Casa", icono: "🏠", color: "esmeralda", creado: iso, modificado: iso };

function renderAppMobile(seed: { espacios?: unknown[]; proyectos?: unknown[] } = {}) {
  window.innerWidth = 400;
  window.dispatchEvent(new Event("resize"));
  localStorage.setItem("sb_modo_local", "1");
  localStorage.setItem("pn_pendientes", "[]");
  localStorage.setItem("pn_notas", "[]");
  localStorage.setItem("pn_proyectos", JSON.stringify(seed.proyectos ?? []));
  localStorage.setItem("pn_espacios", JSON.stringify(seed.espacios ?? []));
  return render(<App />);
}

beforeEach(() => {
  localStorage.clear();
  window.innerWidth = 400;
});

describe("Selector de Espacio activo en móvil (TDD, tests RED)", () => {
  it("el menú «⋮» de móvil incluye una entrada de Espacio activo con las opciones «Todos» y cada espacio", async () => {
    renderAppMobile({ espacios: [espTrabajo, espCasa] });
    const abrirMenu = await screen.findByLabelText("Más opciones");
    fireEvent.click(abrirMenu);

    const entradaEspacio = await screen.findByLabelText(/Espacio activo/i);
    fireEvent.click(entradaEspacio);

    await waitFor(() => expect(screen.getByText("Trabajo")).toBeTruthy());
    expect(screen.getByText("Casa")).toBeTruthy();
    expect(screen.getByText("Todos")).toBeTruthy();
  });

  it("elegir un espacio en móvil actualiza el filtro y se refleja en el propio punto de entrada", async () => {
    renderAppMobile({ espacios: [espTrabajo, espCasa] });
    const abrirMenu = await screen.findByLabelText("Más opciones");
    fireEvent.click(abrirMenu);
    fireEvent.click(await screen.findByLabelText(/Espacio activo/i));
    fireEvent.click(await screen.findByText("Trabajo"));

    fireEvent.click(await screen.findByLabelText("Más opciones"));
    expect(await screen.findByLabelText(/Espacio activo: 🏢 Trabajo/i)).toBeTruthy();
  });
});
