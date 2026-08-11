import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { UIProvider, useUI } from '@/ui-store'

// H4 — Epic 1 «Confirmación antes de descartar una edición en curso»:
// si el TaskModal tiene cambios sin guardar (guardia sucia) y se intenta cerrar
// o abrir otro overlay, el UIProvider interpone el overlay 'confirmar-cierre' y
// aplaza la acción pendiente hasta que se confirme (`confirmarDescartes`) o se
// cancele (`cancelarDescartes`).

function Harness() {
  const ui = useUI()
  return (
    <div>
      <span data-testid="overlay">{ui.overlay}</span>
      <span data-testid="modal-open">{String(ui.modal.open)}</span>
      <button onClick={() => ui.abrirModal()}>abrirModal</button>
      <button onClick={() => ui.abrirPeek('p-k')}>abrirPeek</button>
      <button onClick={() => ui.abrirPaleta()}>abrirPaleta</button>
      <button onClick={() => ui.cerrarModal()}>cerrarModal</button>
      <button onClick={() => ui.registrarGuardia(() => true)}>guardia-sucia</button>
      <button onClick={() => ui.registrarGuardia(() => false)}>guardia-limpia</button>
      <button onClick={() => ui.registrarGuardia(null)}>guardia-null</button>
      <button onClick={() => ui.confirmarDescartes()}>confirmarDescartes</button>
      <button onClick={() => ui.cancelarDescartes()}>cancelarDescartes</button>
    </div>
  )
}

function renderizar() {
  return render(
    <UIProvider>
      <Harness />
    </UIProvider>,
  )
}

const overlay = () => screen.getByTestId('overlay').textContent
const modalOpen = () => screen.getByTestId('modal-open').textContent
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

describe('UIProvider — guardia de confirmación antes de descartar una edición (H4)', () => {
  it('sin guardia registrada, cerrarModal cierra el modal directo a "ninguno"', () => {
    renderizar()
    click('abrirModal')
    expect(overlay()).toBe('modal')
    click('cerrarModal')
    expect(overlay()).toBe('ninguno')
  })

  it('con guardia que devuelve false, cerrarModal cierra directo sin confirmación', () => {
    renderizar()
    click('guardia-limpia')
    click('abrirModal')
    click('cerrarModal')
    expect(overlay()).toBe('ninguno')
  })

  it('con guardia sucia y modal abierto, abrirPaleta se aplaza a confirmar-cierre y confirmar abre la paleta', async () => {
    renderizar()
    click('guardia-sucia')
    click('abrirModal')
    click('abrirPaleta')
    expect(overlay()).toBe('confirmar-cierre')
    click('confirmarDescartes')
    await waitFor(() => expect(overlay()).toBe('paleta'))
  })

  it('con guardia sucia y modal abierto, abrirPeek se aplaza y tras confirmar abre el peek', async () => {
    renderizar()
    click('guardia-sucia')
    click('abrirModal')
    click('abrirPeek')
    expect(overlay()).toBe('confirmar-cierre')
    click('confirmarDescartes')
    await waitFor(() => expect(overlay()).toBe('peek'))
  })

  it('cancelarDescartes vuelve a modal y no ejecuta la acción pendiente (la paleta no abre)', async () => {
    renderizar()
    click('guardia-sucia')
    click('abrirModal')
    click('abrirPaleta')
    expect(overlay()).toBe('confirmar-cierre')
    click('cancelarDescartes')
    await waitFor(() => expect(overlay()).toBe('modal'))
  })

  it('candado: con confirmar-cierre activo, abrirPaleta y cerrarModal son no-op', () => {
    renderizar()
    click('guardia-sucia')
    click('abrirModal')
    click('abrirPaleta')
    expect(overlay()).toBe('confirmar-cierre')
    click('abrirPaleta')
    expect(overlay()).toBe('confirmar-cierre')
    click('cerrarModal')
    expect(overlay()).toBe('confirmar-cierre')
  })

  it('confirmarDescartes y cancelarDescartes sin pendiente (null) son no-op seguros', () => {
    renderizar()
    click('confirmarDescartes')
    expect(overlay()).toBe('ninguno')
    click('cancelarDescartes')
    expect(overlay()).toBe('ninguno')
  })

  it('modal.open sigue true mientras el overlay es confirmar-cierre (el formulario queda detrás)', async () => {
    renderizar()
    click('guardia-sucia')
    click('abrirModal')
    click('abrirPaleta')
    expect(overlay()).toBe('confirmar-cierre')
    expect(modalOpen()).toBe('true')
    click('cancelarDescartes')
    await waitFor(() => expect(overlay()).toBe('modal'))
    expect(modalOpen()).toBe('true')
  })
})