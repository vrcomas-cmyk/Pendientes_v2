import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import App from "@/App";

// Tests RED para el ticket F2.1 (TDD): «Espacios» pasa a ser el 5º destino primario
// (Hoy · Inbox · Proyectos · Notas · Espacios) y «Pendientes» baja a VISTAS_SISTEMA.
// Hoy NO existe `EspaciosView` ni la vista `'espacios'`, así que TODOS estos tests
// fallan (RED). Se vuelven verdes cuando la Fase 4 implemente la feature.
//
// La app corre en modo local si `getSupabase()` devuelve null y `sb_modo_local='1'`
// (ver el gate de `SyncProvider` en src/sync.tsx) — así `App` se renderiza completa
// sin tocar Supabase.

vi.mock("@/lib/supabase", () => ({
  getConfig: () => ({ url: "", anon: "" }),
  isConfigured: () => false,
  saveConfig: vi.fn(),
  getSupabase: () => null,
}));

const iso = new Date().toISOString();

const espTrabajo = { id: "esp-trabajo", nombre: "Trabajo", icono: "🏢", color: "azul", creado: iso, modificado: iso };
const espCasa = { id: "esp-casa", nombre: "Casa", icono: "🏠", color: "esmeralda", creado: iso, modificado: iso };

const proyectos = [
  { id: "p-reporte", nombre: "Reporte mensual", color: "azul", espacioId: "esp-trabajo", creado: iso, modificado: iso },
  { id: "p-presupuesto", nombre: "Presupuesto anual", color: "ambar", espacioId: "esp-trabajo", creado: iso, modificado: iso },
  { id: "p-archivado", nombre: "Archivado interno", color: "gris", espacioId: "esp-trabajo", archivado: true, creado: iso, modificado: iso },
  { id: "p-casa", nombre: "Remodelación", color: "esmeralda", espacioId: "esp-casa", creado: iso, modificado: iso },
  { id: "p-general", nombre: "Proyecto general", color: "rosa", creado: iso, modificado: iso },
];

/** Renderiza `<App />` en modo local (jsdom innerWidth=1024 -> layout escritorio).
    `seed` permite precargar espacios/proyectos en localStorage, que es lo que lee
    `AppProvider` al montar. */
function renderApp(seed: { espacios?: unknown[]; proyectos?: unknown[] } = {}) {
  localStorage.setItem("sb_modo_local", "1");
  localStorage.setItem("pn_pendientes", "[]");
  localStorage.setItem("pn_notas", "[]");
  localStorage.setItem("pn_proyectos", JSON.stringify(seed.proyectos ?? []));
  localStorage.setItem("pn_espacios", JSON.stringify(seed.espacios ?? []));
  return render(<App />);
}

// Espera a que la vista destino muestre su heading. Se usa getAllByRole porque ProyectosView
// ya tenía DOS headings llamados "Proyectos" (header de vista + título del panel de lista)
// mucho antes de F2.1 — la navegación es correcta aunque haya más de una coincidencia.
async function irA(main: HTMLElement, vista: "espacios" | "proyectos", titulo: string) {
  await waitFor(() =>
    expect(within(main).getAllByRole("heading", { name: new RegExp(titulo) }).length).toBeGreaterThan(0),
  );
}

// El atajo numérico del ticket: `5` navega a Espacios (hoy selecciona Proyectos → RED).
function pulsarNumero(n: string) {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: n, bubbles: true }));
}

beforeEach(() => {
  localStorage.clear();
});

describe("F2.1 — «Espacios» como 5º destino primario (TDD, tests RED)", () => {
  it("el sidebar de escritorio lista los 5 destinos primarios en orden: Hoy, Inbox, Proyectos, Notas, Espacios", async () => {
    renderApp();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    // Filtramos las etiquetas exactas de los destinos primarios sobre TODOS los botones del
    // sidebar (en orden de aparición en el DOM) y exigimos la secuencia exacta del PDS.
    const esperado = ["Hoy", "Inbox", "Proyectos", "Notas", "Espacios"];
    const etiquetas = within(nav)
      .getAllByRole("button")
      .map(b => b.textContent!.trim())
      .filter(t => (esperado as string[]).includes(t));
    expect(etiquetas).toEqual(esperado);
  });

  it("«Pendientes» ya no es destino primario: queda agrupado bajo el encabezado «Sistema»", async () => {
    renderApp();
    const nav = await screen.findByRole("navigation", { name: /Navegación principal/i });
    const sistema = within(nav).getAllByText("Sistema", { exact: true })[0];
    const pendientes = within(nav).getByRole("button", { name: "Pendientes" });
    // El botón «Pendientes» debe venir DESPUÉS del encabezado «Sistema» (bit FOLLOWING de
    // compareDocumentPosition). Hoy está entre los primarios (antes de Sistema) → falla.
    expect(sistema.compareDocumentPosition(pendientes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("el atajo numérico 5 muestra la vista Espacios con título, «Todos» y tarjetas de espacio", async () => {
    renderApp({ espacios: [espTrabajo, espCasa] });
    const main = await screen.findByRole("main");
    pulsarNumero("5");
    // Hoy el 5 selecciona 'proyectos' (redirige a ProyectosView); el título "Espacios"
    // nunca aparece → RED. Tras F4 selecciona 'espacios' y esto pasa.
    await irA(main, "espacios", "^Espacios$");
    expect(within(main).getByText("Todos")).toBeTruthy();
    expect(within(main).getByText("Trabajo")).toBeTruthy();
    expect(within(main).getByText("Casa")).toBeTruthy();
  });

  it("clic en la tarjeta de un espacio navega a Proyectos filtrados solo a ese espacio", async () => {
    renderApp({ espacios: [espTrabajo, espCasa], proyectos });
    const main = await screen.findByRole("main");
    pulsarNumero("5");
    await irA(main, "espacios", "^Espacios$");

    fireEvent.click(within(main).getByText("Trabajo"));
    await irA(main, "proyectos", "^Proyectos$");

    // Solo proyectos de "Trabajo" (p-reporte, p-presupuesto); no los de "Casa" ni General.
    expect(within(main).getByText("Reporte mensual")).toBeTruthy();
    expect(within(main).getByText("Presupuesto anual")).toBeTruthy();
    expect(within(main).queryByText("Remodelación")).toBeNull();
    expect(within(main).queryByText("Proyecto general")).toBeNull();
  });

  it("la tarjeta de un espacio muestra el nº de proyectos activos (sin archivados)", async () => {
    renderApp({ espacios: [espTrabajo, espCasa], proyectos });
    const main = await screen.findByRole("main");
    pulsarNumero("5");
    await irA(main, "espacios", "^Espacios$");

    // "Trabajo" tiene 3 proyectos pero 1 archivado → la tarjeta debe decir 2.
    // "Casa" tiene 1 proyecto activo → la tarjeta debe decir 1.
    const tarjetaTrabajo = within(main).getByText("Trabajo").closest("button") as HTMLElement;
    expect(within(tarjetaTrabajo).getByText("2")).toBeTruthy();
    const tarjetaCasa = within(main).getByText("Casa").closest("button") as HTMLElement;
    expect(within(tarjetaCasa).getByText("1")).toBeTruthy();
  });
});