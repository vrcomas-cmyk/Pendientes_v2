import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/googleCalendar', () => ({ agendarPendiente: vi.fn(), actualizarEventoAgenda: vi.fn(), eliminarEventoAgenda: vi.fn() }))

import { buscarConflictos } from '@/lib/agenda'
import type { Pendiente, EventoCalendario } from '@/types'
import type { EventoGCal } from '@/lib/googleCalendar'

const ev = (id: string, fecha: string, hora: string, duracionMin: number, extra: Partial<EventoCalendario> = {}): EventoCalendario =>
  ({ id, titulo: 'E' + id, fecha, hora, duracionMin, creado: '', modificado: '', ...extra })
const pend = (id: string, fechaLimite: string, hora: string, duracionMin: number, extra: Partial<Pendiente> = {}) =>
  ({ id, titulo: 'P' + id, fechaLimite, hora, duracionMin, estado: 'pendiente', ...extra }) as Pendiente
const g = (id: string, inicio: string, fin: string, todoElDia = false): EventoGCal =>
  ({ id, cuentaId: 'c1', email: 'a@b.c', titulo: 'G' + id, inicio, fin, todoElDia })

const vacio = { pendientes: [], eventos: [], google: [] }

describe('buscarConflictos', () => {
  it('detecta solape parcial', () => {
    const r = buscarConflictos({ fecha: '2026-11-02', hora: '10:30', duracionMin: 60 }, { ...vacio, eventos: [ev('1', '2026-11-02', '10:00', 60)] })
    expect(r.map(c => c.id)).toEqual(['1'])
  })
  it('límites exclusivos: terminar a las 10:00 no choca con empezar a las 10:00', () => {
    const f = { ...vacio, eventos: [ev('1', '2026-11-02', '09:00', 60)] }
    expect(buscarConflictos({ fecha: '2026-11-02', hora: '10:00', duracionMin: 30 }, f)).toEqual([])
    expect(buscarConflictos({ fecha: '2026-11-02', hora: '08:30', duracionMin: 30 }, f)).toEqual([])
  })
  it('ignora completados, archivados, borrados y a sí mismo', () => {
    const f = { ...vacio, idCompletado: 'hecho', pendientes: [
      pend('a', '2026-11-02', '10:00', 60, { estado: 'hecho' }), pend('b', '2026-11-02', '10:00', 60, { archivado: true }),
      pend('c', '2026-11-02', '10:00', 60, { borrado: true }), pend('d', '2026-11-02', '10:00', 60),
    ] }
    expect(buscarConflictos({ fecha: '2026-11-02', hora: '10:15', duracionMin: 30 }, f).map(c => c.id)).toEqual(['d'])
    expect(buscarConflictos({ fecha: '2026-11-02', hora: '10:15', duracionMin: 30 }, f, 'd')).toEqual([])
  })
  it('no trata eventos de todo el día de Google como bloques', () => {
    const f = { ...vacio, google: [g('1', '2026-11-02', '2026-11-03', true)] }
    expect(buscarConflictos({ fecha: '2026-11-02', hora: '10:00', duracionMin: 30 }, f)).toEqual([])
  })
  it('compara Google con intervalos reales (instantes)', () => {
    const ini = new Date('2026-11-02T10:00:00'), fin = new Date('2026-11-02T11:00:00')
    const f = { ...vacio, google: [g('1', ini.toISOString(), fin.toISOString())] }
    expect(buscarConflictos({ fecha: '2026-11-02', hora: '10:45', duracionMin: 30 }, f).map(c => c.origen)).toEqual(['google'])
  })
  it('sin hora no hay conflicto', () => {
    expect(buscarConflictos({ fecha: '2026-11-02', hora: '', duracionMin: 30 }, { ...vacio, eventos: [ev('1', '2026-11-02', '10:00', 60)] })).toEqual([])
  })
})

import { deduplicarGoogle } from '@/lib/agenda'

describe('Google: duplicados y eventos libres', () => {
  it('colapsa el mismo evento compartido entre cuentas (iCalUID)', () => {
    const a = { ...g('1', '2026-11-02T10:00:00Z', '2026-11-02T11:00:00Z'), uid: 'u1' }
    const b = { ...g('2', '2026-11-02T10:00:00Z', '2026-11-02T11:00:00Z'), uid: 'u1', cuentaId: 'c2' }
    const c = { ...g('3', '2026-11-03T10:00:00Z', '2026-11-03T11:00:00Z'), uid: 'u1' } // otra instancia
    expect(deduplicarGoogle([a, b, c]).map(e => e.id)).toEqual(['1', '3'])
  })
  it('un evento marcado «disponible» no genera conflicto', () => {
    const ini = new Date('2026-11-02T10:00:00'), fin = new Date('2026-11-02T11:00:00')
    const libre = { ...g('1', ini.toISOString(), fin.toISOString()), ocupado: false }
    expect(buscarConflictos({ fecha: '2026-11-02', hora: '10:15', duracionMin: 30 }, { ...vacio, google: [libre] })).toEqual([])
  })
})

import { resumirGoogle } from '@/lib/agenda'

describe('resumirGoogle', () => {
  const ahora = new Date('2026-11-02T09:00:00')
  const loc = (d: string, h: string) => new Date(`${d}T${h}:00`).toISOString()
  it('cuenta hoy, horas ocupadas y próximos 7 días por cuenta', () => {
    const evs = [
      g('1', loc('2026-11-02', '10:00'), loc('2026-11-02', '11:30')),
      { ...g('2', loc('2026-11-02', '12:00'), loc('2026-11-02', '13:00')), ocupado: false },
      g('3', '2026-11-02', '2026-11-03', true),
      g('4', loc('2026-11-05', '10:00'), loc('2026-11-05', '11:00')),
      g('5', loc('2026-11-20', '10:00'), loc('2026-11-20', '11:00')),
      { ...g('6', loc('2026-11-02', '10:00'), loc('2026-11-02', '12:00')), cuentaId: 'c2' },
    ]
    const [c1, c2] = resumirGoogle(evs, ['c1', 'c2'], ahora)
    expect(c1).toMatchObject({ hoy: 3, horasHoy: 1.5, proximos7: 4 })
    expect(c1.siguientes.map(e => e.id)).toEqual(['3', '1', '2'])
    expect(c2).toMatchObject({ hoy: 1, horasHoy: 2, proximos7: 1 })
  })
})

import { asignarColumnas, esHoraPorDefecto } from '@/lib/agenda'

describe('bloques por defecto y columnas del calendario', () => {
  it('08:00 con ≤5 min es un marcador «sin hora» y no genera conflictos', () => {
    expect(esHoraPorDefecto('08:00', 5)).toBe(true)
    expect(esHoraPorDefecto('08:00', 30)).toBe(false)
    expect(esHoraPorDefecto('09:00', 5)).toBe(false)
    const f = { ...vacio, pendientes: [pend('a', '2026-11-02', '08:00', 5), pend('b', '2026-11-02', '08:00', 5)] }
    expect(buscarConflictos({ fecha: '2026-11-02', hora: '08:00', duracionMin: 30 }, f)).toEqual([])
  })
  it('asignarColumnas: sin cruce = ancho completo; con cruce = lado a lado', () => {
    const r = asignarColumnas([
      { id: 'a', ini: 0, fin: 60 }, { id: 'b', ini: 30, fin: 90 }, { id: 'c', ini: 120, fin: 150 },
    ])
    expect(r.get('a')).toEqual({ col: 0, cols: 2 })
    expect(r.get('b')).toEqual({ col: 1, cols: 2 })
    expect(r.get('c')).toEqual({ col: 0, cols: 1 })
  })
  it('asignarColumnas reutiliza columnas libres dentro del mismo grupo', () => {
    const r = asignarColumnas([{ id: 'a', ini: 0, fin: 100 }, { id: 'b', ini: 10, fin: 40 }, { id: 'c', ini: 50, fin: 90 }])
    expect(r.get('b')).toEqual({ col: 1, cols: 2 })
    expect(r.get('c')).toEqual({ col: 1, cols: 2 })
  })
})

import { agruparAgenda } from '@/lib/agenda'

describe('agruparAgenda (Hoy: una sola agenda con todo)', () => {
  const loc = (d: string, h: string) => new Date(`${d}T${h}:00`).toISOString()
  const dias = ['2026-11-02', '2026-11-03', '2026-11-04']

  it('junta pendientes con hora, eventos propios y Google por día, ordenados, con origen', () => {
    const r = agruparAgenda(dias, {
      pendientes: [pend('p1', '2026-11-02', '11:00', 30), pend('p2', '2026-11-02', '08:00', 5)], // p2 = marcador «sin hora»
      eventos: [ev('e1', '2026-11-02', '09:00', 60)],
      google: [g('g1', loc('2026-11-02', '13:00'), loc('2026-11-02', '14:00')), g('g2', loc('2026-11-04', '10:00'), loc('2026-11-04', '11:00'))],
    })
    expect(r[0].items.map(i => [i.k, i.hora])).toEqual([['e', '09:00'], ['p', '11:00'], ['g', '13:00']])
    expect(r[0].items.map(i => i.origen)).toEqual(['Evento', 'Pendiente', 'a@b.c'])
    expect(r[1].items).toEqual([])
    expect(r[2].items.map(i => i.k)).toEqual(['g'])
  })
  it('los eventos de todo el día de Google aparecen primero y en cada día que abarcan (fin exclusivo)', () => {
    const r = agruparAgenda(dias, {
      pendientes: [], eventos: [ev('e1', '2026-11-02', '09:00', 60)],
      google: [g('g1', '2026-11-02', '2026-11-04', true)],
    })
    expect(r[0].items.map(i => i.todoElDia)).toEqual([true, false])
    expect(r[1].items.map(i => i.k)).toEqual(['g'])
    expect(r[2].items).toEqual([]) // el 4 es el día exclusivo
  })
  it('no repite lo ya espejado en Google ni el mismo evento de dos cuentas, y marca cruces', () => {
    const espejado = ev('e1', '2026-11-02', '10:00', 60, { googleEventos: { c1: 'x1' } })
    const r = agruparAgenda(dias, {
      pendientes: [], eventos: [espejado, ev('e2', '2026-11-02', '10:30', 60)],
      google: [
        { ...g('x1', loc('2026-11-02', '10:00'), loc('2026-11-02', '11:00')) }, // espejo de e1: se oculta
        { ...g('a', loc('2026-11-02', '15:00'), loc('2026-11-02', '16:00')), uid: 'u' },
        { ...g('b', loc('2026-11-02', '15:00'), loc('2026-11-02', '16:00')), uid: 'u', cuentaId: 'c2' },
      ],
    })
    expect(r[0].items.filter(i => i.k === 'g').length).toBe(1)
    expect(r[0].items.filter(i => i.k === 'e').every(i => i.choca)).toBe(true)
  })
})
