import { describe, it, expect } from 'vitest'
import { parsearEventoRapido } from '@/lib/captura'
import { hoyISO } from '@/lib/app-utils'

describe('parsearEventoRapido', () => {
  it('extrae hora en formato 24h y duración en horas', () => {
    const e = parsearEventoRapido('Junta con Liz >2026-11-02 15:30 por 2h')!
    expect(e).toMatchObject({ titulo: 'Junta con Liz', fecha: '2026-11-02', hora: '15:30', duracionMin: 120 })
  })
  it('entiende 3pm y 12am', () => {
    expect(parsearEventoRapido('Comida >2026-11-02 3pm')!.hora).toBe('15:00')
    expect(parsearEventoRapido('Medianoche >2026-11-02 12am')!.hora).toBe('00:00')
  })
  it('sin fecha usa hoy; sin hora la deja vacía; duración por defecto 60', () => {
    const e = parsearEventoRapido('Revisión')!
    expect(e).toMatchObject({ fecha: hoyISO(), hora: '', duracionMin: 60 })
  })
  it('"a las 9" y minutos', () => {
    const e = parsearEventoRapido('Dentista >2026-11-02 a las 9 por 45min')!
    expect(e).toMatchObject({ hora: '09:00', duracionMin: 45 })
  })
  it('rechaza horas inválidas y texto vacío', () => {
    expect(parsearEventoRapido('Algo 25:99')!.hora).toBe('')
    expect(parsearEventoRapido('   ')).toBeNull()
  })
})
