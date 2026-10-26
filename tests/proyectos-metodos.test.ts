import { describe, it, expect } from 'vitest'
import { estancamiento, dividirSprint, barrasGantt } from '@/lib/proyectos'
import type { Pendiente, Proyecto } from '@/types'

const proy = (extra: Partial<Proyecto> = {}): Proyecto => ({ id: 'pr', nombre: 'P', color: 'blue', creado: '', modificado: '', ...extra })
const pend = (id: string, extra: Partial<Pendiente> = {}) => ({
  id, titulo: id, proyectoId: 'pr', estado: 'pendiente', fechaLimite: '', creado: '2026-10-01T10:00:00Z', modificado: '2026-10-01T10:00:00Z', fechaCompletado: null, ...extra,
}) as Pendiente
const ahora = new Date('2026-10-25T12:00:00')

describe('estancamiento', () => {
  it('avisa con trabajo abierto y sin actividad en el umbral', () => {
    expect(estancamiento(proy(), [pend('a')], 'hecho', ahora)).toMatchObject({ estancado: true, abiertos: 1 })
  })
  it('no avisa si hubo actividad reciente', () => {
    expect(estancamiento(proy(), [pend('a', { modificado: '2026-10-20T10:00:00Z' })], 'hecho', ahora).estancado).toBe(false)
  })
  it('no avisa sin trabajo abierto (todo completado), aunque esté inactivo', () => {
    expect(estancamiento(proy(), [pend('a', { estado: 'hecho' })], 'hecho', ahora).estancado).toBe(false)
  })
  it('respeta umbral configurable y la pausa', () => {
    const p = [pend('a', { modificado: '2026-10-20T10:00:00Z' })]
    expect(estancamiento(proy({ estancamientoDias: 3 }), p, 'hecho', ahora).estancado).toBe(true)
    expect(estancamiento(proy({ estancamientoDias: 3, pausadoHasta: '2026-11-01' }), p, 'hecho', ahora).estancado).toBe(false)
  })
  it('una fecha vencida por sí sola no cuenta como estancamiento', () => {
    const p = [pend('a', { fechaLimite: '2026-09-01', modificado: '2026-10-24T10:00:00Z' })]
    expect(estancamiento(proy(), p, 'hecho', ahora).estancado).toBe(false)
  })
})

describe('scrum y gantt', () => {
  it('divide sprint y backlog sin duplicar', () => {
    const items = [pend('a', { fechaLimite: '2026-10-28' }), pend('b', { fechaLimite: '2026-10-29', estado: 'hecho' }), pend('c'), pend('d', { fechaLimite: '2026-12-01' })]
    const r = dividirSprint(items, { inicio: '2026-10-26', fin: '2026-10-30' }, 'hecho')
    expect(r.enSprint.map(p => p.id)).toEqual(['a', 'b'])
    expect(r.backlog.map(p => p.id)).toEqual(['c', 'd'])
    expect(r).toMatchObject({ hechos: 1, total: 2, porcentaje: 50 })
  })
  it('gantt: usa inicio planeado o creación; sin fecha límite va aparte', () => {
    const { barras, sinFecha } = barrasGantt([pend('a', { fechaLimite: '2026-10-10', fechaInicio: '2026-10-05' }), pend('b', { fechaLimite: '2026-10-20' }), pend('c')])
    expect(barras.map(b => [b.p.id, b.inicio, b.fin])).toEqual([['b', '2026-10-01', '2026-10-20'], ['a', '2026-10-05', '2026-10-10']])
    expect(sinFecha.map(p => p.id)).toEqual(['c'])
  })
  it('gantt: inicio posterior al fin no invierte la barra', () => {
    expect(barrasGantt([pend('a', { fechaLimite: '2026-10-02', fechaInicio: '2026-10-09' })]).barras[0]).toMatchObject({ inicio: '2026-10-02', fin: '2026-10-02' })
  })
})
