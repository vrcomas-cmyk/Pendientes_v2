import { describe, it, expect } from 'vitest'
import { contar, debeGuardar, faltantes, describirFaltantes, total } from '@/lib/respaldo-local'

const it_ = (n: number, borrado = false) => Array.from({ length: n }, (_, i) => ({ id: 'x' + i, borrado }))

describe('respaldo local (red de seguridad)', () => {
  it('cuenta solo lo vivo (no la papelera)', () => {
    expect(contar({ pendientes: [...it_(3), ...it_(2, true)], rocas: it_(1) })).toMatchObject({ pendientes: 3, rocas: 1, notas: 0 })
  })
  it('no guarda un estado vacío ni una caída de más de la mitad (se conserva el respaldo bueno)', () => {
    const bueno = contar({ pendientes: it_(10), rocas: it_(3) })
    expect(debeGuardar(contar({}), bueno)).toBe(false)
    expect(debeGuardar(contar({ pendientes: it_(2) }), bueno)).toBe(false)
    expect(debeGuardar(contar({ pendientes: it_(9), rocas: it_(3) }), bueno)).toBe(true)
    expect(debeGuardar(contar({ pendientes: it_(1) }), undefined)).toBe(true)
  })
  it('detecta qué colecciones faltan y las describe', () => {
    const bueno = contar({ pendientes: it_(10), rocas: it_(3), notas: it_(4) })
    const ahora = contar({ pendientes: it_(10), notas: it_(1) })
    const f = faltantes(ahora, bueno)
    expect(f.map(x => x.coleccion).sort()).toEqual(['notas', 'rocas'])
    expect(describirFaltantes(f)).toContain('3 rocas')
    expect(faltantes(bueno, bueno)).toEqual([])
    expect(total(bueno)).toBe(17)
  })
})
