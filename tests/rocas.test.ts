import { describe, it, expect } from 'vitest'
import { trimestreDe, mergeRoca, resumenRoca, informeRocaMarkdown, actividadesDelPeriodo } from '@/lib/rocas'
import type { Roca, ActividadRoca } from '@/types'

const act = (id: string, fecha: string, extra: Partial<ActividadRoca> = {}): ActividadRoca =>
  ({ id, fecha, descripcion: 'Ayuda ' + id, creado: fecha + 'T10:00:00Z', modificado: fecha + 'T10:00:00Z', ...extra })
const roca = (extra: Partial<Roca> = {}): Roca => ({
  id: 'r1', nombre: 'Soporte', fechaInicio: '2026-10-01', fechaFin: '2026-12-31', actividades: [],
  creado: '2026-10-01T00:00:00Z', modificado: '2026-10-01T00:00:00Z', ...extra,
})

describe('rocas', () => {
  it('trimestreDe devuelve el trimestre natural', () => {
    expect(trimestreDe('2026-10-25')).toEqual({ inicio: '2026-10-01', fin: '2026-12-31' })
    expect(trimestreDe('2026-02-10')).toEqual({ inicio: '2026-01-01', fin: '2026-03-31' })
  })
  it('cuenta solo actividades vigentes dentro del periodo', () => {
    const r = roca({ objetivo: 4, actividades: [act('a', '2026-10-05'), act('b', '2026-10-05', { creado: '2026-10-05T11:00:00Z' }), act('c', '2027-01-02'), act('d', '2026-11-01', { borrado: true })] })
    expect(resumenRoca(r)).toMatchObject({ total: 2, dias: 1, porcentaje: 50 })
    expect(actividadesDelPeriodo(r).map(a => a.id)).toEqual(['b', 'a'])
  })
  it('mergeRoca conserva las actividades de ambos dispositivos', () => {
    const local = roca({ modificado: '2026-10-06T00:00:00Z', actividades: [act('a', '2026-10-05'), act('l', '2026-10-06')] })
    const remote = roca({ modificado: '2026-10-07T00:00:00Z', actividades: [act('a', '2026-10-05'), act('r', '2026-10-07')] })
    const { merged } = mergeRoca(local, remote)
    expect(merged.actividades.map(a => a.id).sort()).toEqual(['a', 'l', 'r'])
    expect(merged.modificado).toBe('2026-10-07T00:00:00Z')
  })
  it('mergeRoca propaga el borrado de una actividad (tombstone más reciente)', () => {
    const viejo = roca({ actividades: [act('a', '2026-10-05')] })
    const borrada = roca({ modificado: '2026-10-08T00:00:00Z', actividades: [act('a', '2026-10-05', { borrado: true, modificado: '2026-10-08T00:00:00Z' })] })
    expect(mergeRoca(viejo, borrada).merged.actividades[0].borrado).toBe(true)
    expect(mergeRoca(borrada, viejo).merged.actividades[0].borrado).toBe(true)
  })
  it('informe markdown agrupa por día con la etiqueta personalizada', () => {
    const r = roca({ etiquetaActividad: 'Ayudas generadas', objetivo: 10, actividades: [act('a', '2026-10-05', { solicitante: 'Liz' }), act('b', '2026-10-06')] })
    const md = informeRocaMarkdown(r)
    expect(md).toContain('**Ayudas generadas: 2 de 10 (20%)**')
    expect(md).toContain('## 05/10/2026')
    expect(md).toContain('_(pidió: Liz)_')
    expect(md.indexOf('05/10/2026')).toBeLessThan(md.indexOf('06/10/2026'))
  })
})
