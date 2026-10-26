import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/googleCalendar', () => ({ sincronizarEventosGoogle: vi.fn() }))

import { aplicarCambios, enRango, type CacheGoogle } from '@/lib/googleSync'
import type { EventoGCal } from '@/lib/googleCalendar'

const ev = (id: string, cuentaId = 'c1', extra: Partial<EventoGCal> = {}): EventoGCal =>
  ({ id, cuentaId, email: 'a@b.c', titulo: 'T' + id, inicio: '2026-11-02T10:00:00Z', fin: '2026-11-02T11:00:00Z', todoElDia: false, ...extra })
const cambio = (id: string, cuentaId = 'c1', cancelado = false) =>
  ({ id, cuentaId, email: 'a@b.c', cancelado, titulo: 'N' + id, inicio: '2026-11-03T10:00:00Z', fin: '2026-11-03T11:00:00Z', todoElDia: false })

describe('aplicarCambios', () => {
  let base: CacheGoogle
  beforeEach(() => { base = new Map([['c1/a', ev('a')], ['c2/b', ev('b', 'c2')]]) })

  it('agrega y actualiza por cuenta/id sin mutar la copia anterior', () => {
    const r = aplicarCambios(base, { cambios: [cambio('a'), cambio('n')], completos: [] })
    expect(r.get('c1/a')?.titulo).toBe('Na')
    expect(r.has('c1/n')).toBe(true)
    expect(base.get('c1/a')?.titulo).toBe('Ta')
  })
  it('las canceladas (tombstones) se eliminan', () => {
    expect(aplicarCambios(base, { cambios: [cambio('a', 'c1', true)], completos: [] }).has('c1/a')).toBe(false)
  })
  it('una sync completa reemplaza solo a esa cuenta', () => {
    const r = aplicarCambios(base, { cambios: [cambio('x')], completos: ['c1'] })
    expect([...r.keys()].sort()).toEqual(['c1/x', 'c2/b'])
  })
  it('el mismo id en cuentas distintas no se pisa', () => {
    const r = aplicarCambios(base, { cambios: [cambio('a', 'c2')], completos: [] })
    expect(r.has('c1/a') && r.has('c2/a')).toBe(true)
  })
})

describe('enRango', () => {
  it('filtra por solape con el rango, incluidos todo-el-día', () => {
    const c: CacheGoogle = new Map([
      ['c1/a', ev('a')],
      ['c1/d', ev('d', 'c1', { inicio: '2026-11-05', fin: '2026-11-06', todoElDia: true })],
      ['c1/z', ev('z', 'c1', { inicio: '2027-01-01T10:00:00Z', fin: '2027-01-01T11:00:00Z' })],
    ])
    const ids = enRango(c, '2026-11-01T00:00:00Z', '2026-11-30T23:59:59Z').map(e => e.id).sort()
    expect(ids).toEqual(['a', 'd'])
  })
})

import { sincronizarIncremental, cacheCaliente, reiniciarSyncGoogle } from '@/lib/googleSync'
import { sincronizarEventosGoogle } from '@/lib/googleCalendar'

describe('sincronizarIncremental (rendimiento)', () => {
  const resp = { cambios: [], tokens: { c1: 't1' }, completos: ['c1'], leidas: ['c1'] }
  beforeEach(() => { reiniciarSyncGoogle(); vi.mocked(sincronizarEventosGoogle).mockReset() })

  it('llamadas simultáneas comparten una sola petición', async () => {
    vi.mocked(sincronizarEventosGoogle).mockResolvedValue(resp)
    await Promise.all([sincronizarIncremental(), sincronizarIncremental(), sincronizarIncremental()])
    expect(sincronizarEventosGoogle).toHaveBeenCalledTimes(1)
    expect(cacheCaliente()).toBe(true)
  })
  it('reutiliza la copia reciente sin volver a pedir', async () => {
    vi.mocked(sincronizarEventosGoogle).mockResolvedValue(resp)
    await sincronizarIncremental()
    await sincronizarIncremental()
    expect(sincronizarEventosGoogle).toHaveBeenCalledTimes(1)
  })
  it('si el servidor no soporta la acción, los siguientes intentos fallan al instante', async () => {
    vi.mocked(sincronizarEventosGoogle).mockRejectedValue(new Error('Acción desconocida: sync-events'))
    await expect(sincronizarIncremental()).rejects.toThrow()
    await expect(sincronizarIncremental()).rejects.toThrow(/no disponible/)
    expect(sincronizarEventosGoogle).toHaveBeenCalledTimes(1)
    expect(cacheCaliente()).toBe(false)
  })
})
