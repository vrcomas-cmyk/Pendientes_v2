import { describe, it, expect } from 'vitest'
import { enEspacio } from '@/lib/app-utils'
import type { Pendiente } from '@/types'

// RED (E2-F2): `enEspacio` todavía NO existe en `@/lib/app-utils` → este archivo no compila
// y vitest reporta el error de import ("enEspacio is not exported") en el run. ESO es RED válido.
// Cuando F4 lo implemente con esta firma, los seis casos deben pasar:
//
//   enEspacio(
//     p: Pick<Pendiente, 'proyectoId'>,
//     espacioActualId: string | null,
//     proyectos: Record<string, { espacioId?: string }>,
//   ): boolean
//
//   Semántica: espacioActualId === null = «Todos» (nada se filtra); con un espacio activo,
//   el pendiente aparece SOLO si su `proyectoId` resuelve a un proyecto con
//   `espacioId === espacioActualId`.

const p = (proyectoId?: string): Pick<Pendiente, 'proyectoId'> => ({ proyectoId })
const porId = (m: Record<string, { espacioId?: string }>) => m

describe('enEspacio — helper puro de filtro de contexto por espacio (E2-F2)', () => {
  it('espacioActualId null («Todos») incluye cualquier pendiente', () => {
    expect(enEspacio(p('p1'), null, porId({}))).toBe(true)
    expect(enEspacio(p(undefined), null, porId({}))).toBe(true)
  })

  it('pendiente sin proyectoId queda fuera con un espacio activo', () => {
    expect(enEspacio(p(undefined), 'esp-trabajo', porId({}))).toBe(false)
  })

  it('proyecto que no tiene espacioId (Espacio General implícito) queda fuera con un espacio activo', () => {
    expect(enEspacio(p('p-general'), 'esp-trabajo', porId({ 'p-general': {} }))).toBe(false)
  })

  it('proyecto con espacioId === espacioActualId entra', () => {
    expect(enEspacio(p('p1'), 'esp-trabajo', porId({ p1: { espacioId: 'esp-trabajo' } }))).toBe(true)
  })

  it('proyecto con espacioId distinto al activo queda fuera', () => {
    expect(enEspacio(p('p1'), 'esp-trabajo', porId({ p1: { espacioId: 'esp-casa' } }))).toBe(false)
  })

  it('proyectoId que no resuelve en el map de proyectos queda fuera', () => {
    expect(enEspacio(p('p-inexistente'), 'esp-trabajo', porId({}))).toBe(false)
  })
})