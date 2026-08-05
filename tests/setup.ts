import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Limpia el DOM entre tests para evitar contaminación entre casos.
afterEach(() => {
  cleanup();
});

// Polyfill mínimo de matchMedia (Radix/shadcn lo consultan en init).
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Silenciamos console.error a menos que se active debug (algunos componentes de Radix
// emiten warnings esperados en tests). Para verlos,Define `process.env.DEBUG=1`.
if (!process.env.DEBUG) {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0]?.toString?.() ?? "";
    if (/^Not implemented: .*dismiss/i.test(first)) return;
    orig.apply(console, args as never);
  };
}

// jsdom no implementa ResizeObserver ni IntersectionObserver.
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = RO;
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = RO;

// `crypto.randomUUID` sí está disponible en Node 18+ y jsdom; no hace falta polyfill.
// Pero `structuredClone` también está en Node 18+ — no tocamos.

// Pequeño helper para esperar microtasks en tests con debounce (ej. guardado de notas).
export function flushPromises(ms = 0): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Re-exportamos `vi` para que los tests lo importen desde aquí si lo prefieren.
export { vi };
