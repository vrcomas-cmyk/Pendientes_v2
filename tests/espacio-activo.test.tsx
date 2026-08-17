import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UIProvider, useUI } from '@/ui-store'
import { normalizar, hoyISO } from '@/lib/app-utils'
import App from '@/App'

// RED (E2-F2): «Selector Espacio activo + filtro de contexto» (PDS §5.3 / EspaciosView).
// HOY NO existe la sección «Espacio activo» en el sidebar, `enEspacio` no se aplica en
// InboxView ni TodayView, y `espacioActualId` (ui-store) no persiste en `pn_espacio_activo`.
// TODOS los tests fallan hoy. Se vuelven verdes cuando F4 implemente la feature:
//   1. Selector en sidebar escritorio (entre destinos primarios y «Sistema»), Radix DropdownMenu.
//   2. Filtro de contexto por espacio en Hoy (lista `pendientes` de TodayView) e Inbox.
//   3. Persistencia en localStorage `pn_espacio_activo` (escribir + restaurar al montar).
//   4. Guardia defensiva: id de espacio inexistente → se muestra «Todos» sin crash.
//
// La app corre en modo local cuando `getSupabase()` devuelve null y `sb_modo_local='1'`
// (misma técnica que tests/navegacion.test.tsx). jsdom default innerWidth=1024 → layout escritorio.

vi.mock('@/lib/supabase', () => ({
  getConfig: () => ({ url: '', anon: '' }),
  isConfigured: () => false,
  saveConfig: vi.fn(),
  getSupabase: () => null,
}))

const iso = new Date().toISOString()
const hoy = hoyISO()

const espTrabajo = { id: 'esp-trabajo', nombre: 'Trabajo', icono: '🏢', color: 'azul', creado: iso, modificado: iso }
const espCasa = { id: 'esp-casa', nombre: 'Casa', icono: '🏠', color: 'esmeralda', creado: iso, modificado: iso }

const proyectos = [
  { id: 'p-reporte', nombre: 'Reporte mensual', color: 'azul', espacioId: 'esp-trabajo', creado: iso, modificado: iso },
  { id: 'p-presupuesto', nombre: 'Presupuesto anual', color: 'ambar', espacioId: 'esp-trabajo', creado: iso, modificado: iso },
  { id: 'p-casa', nombre: 'Remodelación', color: 'esmeralda', espacioId: 'esp-casa', creado: iso, modificado: iso },
  { id: 'p-general', nombre: 'Proyecto general', color: 'rosa', creado: iso, modificado: iso },
]

const pnd = (titulo: string, proyectoId?: string, fechaLimite = '') =>
  normalizar({ titulo, proyectoId, fechaLimite, estado: 'pendiente' })

// Sin fecha → caen en Inbox (y en «Sin fecha / Bandeja» de Hoy).
const pendientesInbox = [
  pnd('Llamar al proveedor', 'p-reporte'),
  pnd('Comprar focos', 'p-casa'),
  pnd('Leer un rato', 'p-general'),
  pnd('Ideas sueltas'),
]
// Con fecha hoy → sección «Para hoy» de TodayView.
const pendientesHoy = [
  pnd('Revisar contrato', 'p-reporte', hoy),
  pnd('Pintar la sala', 'p-casa', hoy),
]

function renderApp(seed: { espacios?: unknown[]; proyectos?: unknown[]; pendientes?: unknown[] } = {}) {
  localStorage.setItem('sb_modo_local', '1')
  localStorage.setItem('pn_pendientes', JSON.stringify(seed.pendientes ?? []))
  localStorage.setItem('pn_notas', '[]')
  localStorage.setItem('pn_proyectos', JSON.stringify(seed.proyectos ?? []))
  localStorage.setItem('pn_espacios', JSON.stringify(seed.espacios ?? []))
  return render(<App />)
}

const navSidebar = () => screen.getByRole('navigation', { name: /Navegación principal/i })

// Abre el selector de la sección «Espacio activo». Radix espera pointerdown (y click) en el trigger.
async function abrirSelector(nav: HTMLElement, etiqueta: RegExp = /Espacio activo: .+/) {
  const user = userEvent.setup()
  const sel = within(nav).getByRole('button', { name: etiqueta })
  await user.click(sel)
  return sel
}

async function elegirEnMenu(menu: HTMLElement, texto: string | RegExp) {
  const user = userEvent.setup()
  const item = within(menu).getByText(texto).closest('[role="menuitem"]') as HTMLElement
  await user.click(item)
  return item
}

/** Activa un espacio "de verdad" navegando por la vista Espacios (F2.1 ya funciona):
    fija `espacioActualId` en el store y entra en Proyectos. Aísla el RED al filtro/sidebar. */
async function activarEspacio(main: HTMLElement, nombre: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /^Espacios$/ }))
  await waitFor(() => expect(within(main).getByRole('heading', { name: /^Espacios$/ })).toBeTruthy())
  await user.click(within(main).getByText(nombre))
  // ProyectosView tiene DOS headings "Proyectos" (header de vista + título del panel de lista).
  await waitFor(() => expect(within(main).getAllByRole('heading', { name: /^Proyectos$/ }).length).toBeGreaterThan(0))
}

const irAVista = async (nombre: string) => {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: new RegExp('^' + nombre) }))
}

beforeEach(() => {
  localStorage.clear()
  window.innerWidth = 1024
})

describe('E2-F2 — Selector «Espacio activo» + filtro de contexto (TDD, tests RED)', () => {
  it('el sidebar muestra la sección «Espacio activo: Todos ▾» entre los destinos primarios y «Sistema»', async () => {
    renderApp({ espacios: [espTrabajo, espCasa], proyectos })
    const nav = await screen.findByRole('navigation', { name: /Navegación principal/i })
    const selector = within(nav).getByRole('button', { name: /Espacio activo: Todos/i })
    const botonEspacios = within(nav).getByRole('button', { name: /^Espacios$/ })
    // Dos nodos dicen "Sistema" desde la Agrupación Sistema (EPIC 2): el encabezado de
    // sección (div, el que interesa acá) y el botón que abre el menú Ajustes/Datos/Ayuda
    // (span). Se filtra al div para no ambigüar con `getByText`.
    const sistema = within(nav).getAllByText('Sistema', { exact: true }).find(el => el.tagName === 'DIV')!
    // Orden: ... Espacios → «Espacio activo» → ... → «Sistema»
    expect(botonEspacios.compareDocumentPosition(selector) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(selector.compareDocumentPosition(sistema) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('al abrir el selector, el dropdown lista «📋 Todos» al tope y una fila por espacio con su nº de proyectos activos', async () => {
    renderApp({ espacios: [espTrabajo, espCasa], proyectos })
    const nav = await screen.findByRole('navigation', { name: /Navegación principal/i })
    abrirSelector(nav)
    const menu = await screen.findByRole('menu')
    const items = within(menu).getAllByRole('menuitem')
    expect(items[0].textContent).toContain('Todos')
    expect(within(menu).getByText('Trabajo')).toBeTruthy()
    expect(within(menu).getByText('Casa')).toBeTruthy()
    // Trabajo: p-reporte + p-presupuesto = 2 activos · Casa: p-casa = 1 activo
    const filaTrabajo = within(menu).getByText('Trabajo').closest('[role="menuitem"]') as HTMLElement
    expect(within(filaTrabajo).getByText(/2/)).toBeTruthy()
    const filaCasa = within(menu).getByText('Casa').closest('[role="menuitem"]') as HTMLElement
    expect(within(filaCasa).getByText(/1/)).toBeTruthy()
  })

  it('elegir un espacio en el selector persiste `pn_espacio_activo` y NO cambia de vista (sigo en Hoy)', async () => {
    renderApp({ espacios: [espTrabajo, espCasa], proyectos, pendientes: pendientesHoy })
    const main = await screen.findByRole('main')
    await waitFor(() => expect(within(main).getByText(/📆 Para hoy/)).toBeTruthy())
    const nav = navSidebar()
    abrirSelector(nav)
    const menu = await screen.findByRole('menu')
    await elegirEnMenu(menu, 'Casa')
    await waitFor(() => expect(localStorage.getItem('pn_espacio_activo')).toBe('esp-casa'))
    // La elección no navegó: sigue montada TodayView y NO la vista Espacios
    expect(within(main).getByText(/📆 Para hoy/)).toBeTruthy()
    expect(within(main).queryByRole('heading', { name: /^Espacios$/ })).toBeNull()
  })

  it('Inbox filtra por el espacio activo: solo salen pendientes del espacio seleccionado', async () => {
    renderApp({ espacios: [espTrabajo, espCasa], proyectos, pendientes: pendientesInbox })
    const main = await screen.findByRole('main')
    await activarEspacio(main, 'Trabajo')
    irAVista('Inbox')
    await waitFor(() => expect(within(main).getByRole('heading', { name: /^Inbox$/ })).toBeTruthy())
    // p-reporte → Trabajo: SÍ aparece
    expect(within(main).getAllByText('Llamar al proveedor').length).toBeGreaterThan(0)
    // p-casa → otro espacio, p-general → sin espacio (General), sin proyectoId → NO aparecen
    expect(within(main).queryAllByText('Comprar focos').length).toBe(0)
    expect(within(main).queryAllByText('Leer un rato').length).toBe(0)
    expect(within(main).queryAllByText('Ideas sueltas').length).toBe(0)
  })

  it('Hoy respeta el espacio activo en su lista `pendientes` (todas las secciones derivan de ahí)', async () => {
    renderApp({ espacios: [espTrabajo, espCasa], proyectos, pendientes: pendientesHoy })
    const main = await screen.findByRole('main')
    await activarEspacio(main, 'Trabajo')
    irAVista('Hoy')
    await waitFor(() => expect(within(main).getByText(/📆 Para hoy/)).toBeTruthy())
    // `normalizar` asigna hora 08:00 a las tareas con fecha hoy → aparecen en «Para hoy» Y en la
    // «Cronología»; por eso usamos getAllByText/queryAllByText (robusto a duplicados).
    expect(within(main).getAllByText('Revisar contrato').length).toBeGreaterThan(0) // p-reporte → Trabajo
    expect(within(main).queryAllByText('Pintar la sala').length).toBe(0)            // p-casa → otro espacio
  })

  // Regresión: "Pendientes" (ListView) era la única vista primaria que no respetaba el Espacio
  // activo — un pendiente de un proyecto fuera del espacio aparecía acá igual, pero el proyecto
  // ni siquiera se veía en Proyectos para poder encontrarlo ahí (reporte real de usuario).
  it('Pendientes (Lista) respeta el espacio activo, igual que Hoy e Inbox', async () => {
    renderApp({ espacios: [espTrabajo, espCasa], proyectos, pendientes: pendientesInbox })
    const main = await screen.findByRole('main')
    await activarEspacio(main, 'Trabajo')
    await irAVista('Pendientes')
    await waitFor(() => expect(within(main).getByPlaceholderText('Buscar...')).toBeTruthy())
    expect(within(main).getAllByText('Llamar al proveedor').length).toBeGreaterThan(0) // p-reporte → Trabajo
    expect(within(main).queryAllByText('Comprar focos').length).toBe(0)                // p-casa → otro espacio
    expect(within(main).queryAllByText('Leer un rato').length).toBe(0)                 // p-general → sin espacio
    expect(within(main).queryAllByText('Ideas sueltas').length).toBe(0)                // sin proyectoId
  })

  it('elegir «📋 Todos» en el selector desactiva el filtro de contexto (Inbox muestra todo)', async () => {
    renderApp({ espacios: [espTrabajo, espCasa], proyectos, pendientes: pendientesInbox })
    const main = await screen.findByRole('main')
    await activarEspacio(main, 'Trabajo')
    await irAVista('Inbox')
    await waitFor(() => expect(within(main).getByRole('heading', { name: /^Inbox$/ })).toBeTruthy())
    // Wait for sidebar selector to reflect the active space
    const nav = navSidebar()
    await waitFor(() => expect(within(nav).getByRole('button', { name: /Espacio activo:.*Trabajo/i })).toBeTruthy())
    await abrirSelector(nav, /Espacio activo:.*Trabajo/i)
    const menu = await screen.findByRole('menu')
    await elegirEnMenu(menu, 'Todos')
    await waitFor(() => expect(within(main).getAllByText('Comprar focos').length).toBeGreaterThan(0))
    expect(within(main).getAllByText('Llamar al proveedor').length).toBeGreaterThan(0)
    expect(within(main).getAllByText('Leer un rato').length).toBeGreaterThan(0)
    expect(within(main).getAllByText('Ideas sueltas').length).toBeGreaterThan(0)
  })

  it('al remontar la app se restaura el espacio activo en el selector', async () => {
    const primera = renderApp({ espacios: [espTrabajo, espCasa], proyectos })
    const nav = await screen.findByRole('navigation', { name: /Navegación principal/i })
    await abrirSelector(nav)
    const menu = await screen.findByRole('menu')
    await elegirEnMenu(menu, 'Trabajo')
    await waitFor(() => expect(localStorage.getItem('pn_espacio_activo')).toBe('esp-trabajo'))
    primera.unmount()
    renderApp({ espacios: [espTrabajo, espCasa], proyectos })
    const nav2 = await screen.findByRole('navigation', { name: /Navegación principal/i })
    await waitFor(() => expect(within(nav2).getByRole('button', { name: /Espacio activo:.*Trabajo/i })).toBeTruthy())
  })

  it('guardia: si `pn_espacio_activo` apunta a un espacio inexistente, el selector muestra «Todos» sin crash', async () => {
    localStorage.setItem('pn_espacio_activo', 'esp-fantasma')
    renderApp({ espacios: [espTrabajo], proyectos })
    const nav = await screen.findByRole('navigation', { name: /Navegación principal/i })
    await waitFor(() => expect(within(nav).getByRole('button', { name: /Espacio activo:.*Todos/i })).toBeTruthy())
  })
})

/* ---- Persistencia a nivel de UIProvider (test de unidad) ---- */
function HarnessEspacio() {
  const ui = useUI()
  return (
    <div>
      <span data-testid="activo">{ui.espacioActualId ?? '(null)'}</span>
      <button onClick={() => ui.setEspacioActualId('esp-casa')}>set-casa</button>
    </div>
  )
}

describe('UIProvider — persistencia de `espacioActualId` (E2-F2)', () => {
  it('setEspacioActualId escribe `pn_espacio_activo` y un UIProvider nuevo lo restaura', () => {
    const primero = render(
      <UIProvider>
        <HarnessEspacio />
      </UIProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'set-casa' }))
    expect(screen.getByTestId('activo').textContent).toBe('esp-casa')
    expect(localStorage.getItem('pn_espacio_activo')).toBe('esp-casa')
    primero.unmount()
    render(
      <UIProvider>
        <HarnessEspacio />
      </UIProvider>,
    )
    expect(screen.getByTestId('activo').textContent).toBe('esp-casa')
  })
})