import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { normalizar } from '@/lib/app-utils'
import App from '@/App'

// RED (H11): el Espacio "General" (ver src/types.ts ESPACIO_GENERAL_ID) todavía no aparece
// en el selector de Espacio activo (desktop/móvil) ni en la vista Espacios, y ProyectosView
// sigue comparando `p.espacioId === espacioActualId` directo (sin pasar por `enEspacioProyecto`)
// así que "General" no filtra nada. Estos tests fallan hoy porque no existe la fila/entrada
// «🗂️ General» en ninguna de las tres superficies. Se vuelven verdes cuando H11 la conecte.

vi.mock('@/lib/supabase', () => ({
  getConfig: () => ({ url: '', anon: '' }),
  isConfigured: () => false,
  saveConfig: vi.fn(),
  getSupabase: () => null,
}))

const iso = new Date().toISOString()

const espTrabajo = { id: 'esp-trabajo', nombre: 'Trabajo', icono: '🏢', color: 'azul', creado: iso, modificado: iso }

const proyectos = [
  { id: 'p-reporte', nombre: 'Reporte mensual', color: 'azul', espacioId: 'esp-trabajo', creado: iso, modificado: iso },
  { id: 'p-general', nombre: 'Proyecto general', color: 'rosa', creado: iso, modificado: iso },
]

const pnd = (titulo: string, proyectoId?: string, fechaLimite = '') =>
  normalizar({ titulo, proyectoId, fechaLimite, estado: 'pendiente' })

const pendientesInbox = [
  pnd('Llamar al proveedor', 'p-reporte'),
  pnd('Leer un rato', 'p-general'),
  pnd('Ideas sueltas'),
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

beforeEach(() => {
  localStorage.clear()
  window.innerWidth = 1024
})

describe('Espacio "General" seleccionable en el sidebar de escritorio (H11, tests RED)', () => {
  it('el dropdown lista «🗂️ General» entre «Todos» y los espacios reales', async () => {
    renderApp({ espacios: [espTrabajo], proyectos })
    const nav = await screen.findByRole('navigation', { name: /Navegación principal/i })
    await abrirSelector(nav)
    const menu = await screen.findByRole('menu')
    const items = within(menu).getAllByRole('menuitem')
    expect(items[0].textContent).toContain('Todos')
    expect(items[1].textContent).toContain('General')
    expect(within(menu).getByText('Trabajo')).toBeTruthy()
  })

  it('elegir «General» en Inbox muestra solo lo que no tiene Espacio real (proyecto sin espacioId o sin proyecto)', async () => {
    renderApp({ espacios: [espTrabajo], proyectos, pendientes: pendientesInbox })
    const main = await screen.findByRole('main')
    const nav = navSidebar()
    await abrirSelector(nav)
    const menu = await screen.findByRole('menu')
    await elegirEnMenu(menu, 'General')
    await waitFor(() => expect(localStorage.getItem('pn_espacio_activo')).toBe('general'))
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^Inbox/ }))
    await waitFor(() => expect(within(main).getByRole('heading', { name: /^Inbox$/ })).toBeTruthy())
    expect(within(main).getAllByText('Leer un rato').length).toBeGreaterThan(0)
    expect(within(main).getAllByText('Ideas sueltas').length).toBeGreaterThan(0)
    expect(within(main).queryAllByText('Llamar al proveedor').length).toBe(0)
  })
})

describe('Espacio "General" en la vista Espacios (H11, tests RED)', () => {
  it('muestra una tarjeta «🗂️ General» junto a «Todos» y activa el filtro General al entrar a Proyectos', async () => {
    renderApp({ espacios: [espTrabajo], proyectos })
    const main = await screen.findByRole('main')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^Espacios$/ }))
    await waitFor(() => expect(within(main).getByRole('heading', { name: /^Espacios$/ })).toBeTruthy())
    await user.click(within(main).getByText('General'))
    await waitFor(() => expect(within(main).getAllByRole('heading', { name: /^Proyectos$/ }).length).toBeGreaterThan(0))
    expect(within(main).getByText('Proyecto general')).toBeTruthy()
    expect(within(main).queryByText('Reporte mensual')).toBeNull()
  })
})
