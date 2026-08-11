import { describe, it, expect } from 'vitest'
import { overlayReducer, esOverlay } from '@/lib/overlay'
import type { AccionOverlay, TipoOverlay } from '@/lib/overlay'

describe('overlayReducer — regla de exclusividad (PDS §5.4): un solo overlay modal a la vez', () => {
  it('estado inicial es "ninguno"', () => {
    expect(overlayReducer('ninguno', { tipo: 'cerrar', overlay: 'modal' })).toBe('ninguno')
  })

  it('abrir un overlay desde ninguno lo activa', () => {
    expect(overlayReducer('ninguno', { tipo: 'abrir', overlay: 'modal' })).toBe('modal')
    expect(overlayReducer('ninguno', { tipo: 'abrir', overlay: 'peek' })).toBe('peek')
    expect(overlayReducer('ninguno', { tipo: 'abrir', overlay: 'paleta' })).toBe('paleta')
  })

  it('abrir otro overlay reemplaza al activo (cierra el anterior)', () => {
    expect(overlayReducer('modal', { tipo: 'abrir', overlay: 'paleta' })).toBe('paleta')
    expect(overlayReducer('peek', { tipo: 'abrir', overlay: 'modal' })).toBe('modal')
    expect(overlayReducer('paleta', { tipo: 'abrir', overlay: 'peek' })).toBe('peek')
    // paleta sobre paleta se mantiene (no-op de apertura)
    expect(overlayReducer('paleta', { tipo: 'abrir', overlay: 'paleta' })).toBe('paleta')
  })

  it('cerrar solo desactiva cuando coincide con el overlay activo', () => {
    expect(overlayReducer('modal', { tipo: 'cerrar', overlay: 'modal' })).toBe('ninguno')
    expect(overlayReducer('peek', { tipo: 'cerrar', overlay: 'peek' })).toBe('ninguno')
    expect(overlayReducer('paleta', { tipo: 'cerrar', overlay: 'paleta' })).toBe('ninguno')
  })

  it('cerrar un overlay distinto al activo no altera el estado', () => {
    expect(overlayReducer('modal', { tipo: 'cerrar', overlay: 'paleta' })).toBe('modal')
    expect(overlayReducer('peek', { tipo: 'cerrar', overlay: 'modal' })).toBe('peek')
    expect(overlayReducer('paleta', { tipo: 'cerrar', overlay: 'peek' })).toBe('paleta')
  })

  it('secuencias completas mantienen la invariante de un solo overlay', () => {
    // modal -> paleta -> cerrar paleta -> peek -> modal -> cerello modal
    let s = overlayReducer('ninguno', { tipo: 'abrir', overlay: 'modal' })
    s = overlayReducer(s, { tipo: 'abrir', overlay: 'paleta' })
    expect(s).toBe('paleta')
    s = overlayReducer(s, { tipo: 'cerrar', overlay: 'paleta' })
    expect(s).toBe('ninguno')
    s = overlayReducer(s, { tipo: 'abrir', overlay: 'peek' })
    s = overlayReducer(s, { tipo: 'abrir', overlay: 'modal' })
    expect(s).toBe('modal')
  })

  it('esOverlay solo es true cuando hay un overlay activo', () => {
    expect(esOverlay('ninguno')).toBe(false)
    expect(esOverlay('modal')).toBe(true)
    expect(esOverlay('peek')).toBe(true)
    expect(esOverlay('paleta')).toBe(true)
  })

  it('abrir confirmar-cierre desde ninguno lo activa', () => {
    expect(overlayReducer('ninguno', { tipo: 'abrir', overlay: 'confirmar-cierre' })).toBe('confirmar-cierre')
  })

  it('abrir confirmar-cierre reemplaza al modal activo (la edición se interrumpe)', () => {
    expect(overlayReducer('modal', { tipo: 'abrir', overlay: 'confirmar-cierre' })).toBe('confirmar-cierre')
  })

  it('cerrar confirmar-cierre desactiva el overlay (vuelve a ninguno)', () => {
    expect(overlayReducer('confirmar-cierre', { tipo: 'cerrar', overlay: 'confirmar-cierre' })).toBe('ninguno')
  })

  it('con confirmar-cierre activo, cerrar paleta o peek no altera el estado (exclusividad)', () => {
    expect(overlayReducer('confirmar-cierre', { tipo: 'cerrar', overlay: 'paleta' })).toBe('confirmar-cierre')
    expect(overlayReducer('confirmar-cierre', { tipo: 'cerrar', overlay: 'peek' })).toBe('confirmar-cierre')
  })

  it('con confirmar-cierre activo, cerrar modal resuelve el cierre pendiente a ninguno', () => {
    expect(overlayReducer('confirmar-cierre', { tipo: 'cerrar', overlay: 'modal' })).toBe('ninguno')
  })

  it('esOverlay considera confirmar-cierre como overlay activo', () => {
    expect(esOverlay('confirmar-cierre')).toBe(true)
  })

  it('el espacio de estados de AccionOverlay/TipoOverlay es acotado', () => {
    const overlays: TipoOverlay[] = ['ninguno', 'modal', 'peek', 'paleta', 'confirmar-cierre']
    overlays.forEach(o => expect(['ninguno', 'modal', 'peek', 'paleta', 'confirmar-cierre']).toContain(o))
    const accion: AccionOverlay = { tipo: 'abrir', overlay: 'modal' }
    expect(accion.overlay).toBe('modal')
  })
})