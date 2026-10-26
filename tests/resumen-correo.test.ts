import { describe, it, expect } from 'vitest'
import { enZona, semanaDe, envioPendiente, construirResumen, type PrefsResumen } from '../supabase/functions/_shared/resumen'

const prefs = (extra: Partial<PrefsResumen> = {}): PrefsResumen => ({
  activo: true, diario: true, semanal: true, hora_local: '07:00', zona: 'America/Mexico_City', dias: [1, 2, 3, 4, 5], ...extra,
})
// 2026-10-26 es lunes. México (sin horario de verano en 2026) = UTC-6.
const LUNES_8AM_MX = new Date('2026-10-26T14:00:00Z')
const MARTES_8AM_MX = new Date('2026-10-27T14:00:00Z')

describe('zona horaria', () => {
  it('calcula fecha/hora locales en la zona del usuario, no la del servidor', () => {
    expect(enZona(new Date('2026-10-27T03:30:00Z'), 'America/Mexico_City')).toEqual({ fecha: '2026-10-26', hora: '21:30', diaSemana: 1 })
    expect(enZona(new Date('2026-10-27T03:30:00Z'), 'Asia/Tokyo')).toMatchObject({ fecha: '2026-10-27', hora: '12:30', diaSemana: 2 })
  })
  it('semana lunes–domingo', () => {
    expect(semanaDe('2026-10-25')).toMatchObject({ lunes: '2026-10-19', domingo: '2026-10-25' }) // domingo cierra la semana
    expect(semanaDe('2026-10-26')).toMatchObject({ lunes: '2026-10-26', domingo: '2026-11-01' })
  })
})

describe('envioPendiente', () => {
  it('el lunes con semanal activo envía SOLO el semanal (no además el diario)', () => {
    expect(envioPendiente(prefs(), LUNES_8AM_MX)).toEqual({ tipo: 'semanal', clave: '2026-10-26' })
  })
  it('el lunes con semanal apagado envía el diario', () => {
    expect(envioPendiente(prefs({ semanal: false }), LUNES_8AM_MX)).toEqual({ tipo: 'diario', clave: '2026-10-26' })
  })
  it('otros días: diario solo si el día está seleccionado', () => {
    expect(envioPendiente(prefs(), MARTES_8AM_MX)).toEqual({ tipo: 'diario', clave: '2026-10-27' })
    expect(envioPendiente(prefs({ dias: [3] }), MARTES_8AM_MX)).toBeNull()
  })
  it('respeta la hora local mínima, la pausa y el apagado', () => {
    expect(envioPendiente(prefs({ hora_local: '09:00' }), MARTES_8AM_MX)).toBeNull()
    expect(envioPendiente(prefs({ pausado_hasta: '2026-10-27' }), MARTES_8AM_MX)).toBeNull()
    expect(envioPendiente(prefs({ pausado_hasta: '2026-10-26' }), MARTES_8AM_MX)).not.toBeNull()
    expect(envioPendiente(prefs({ activo: false }), MARTES_8AM_MX)).toBeNull()
    expect(envioPendiente(prefs({ diario: false, semanal: false }), MARTES_8AM_MX)).toBeNull()
  })
  it('la misma ejecución repetida produce la misma clave (base de la idempotencia)', () => {
    expect(envioPendiente(prefs(), MARTES_8AM_MX)).toEqual(envioPendiente(prefs(), new Date(MARTES_8AM_MX.getTime() + 3600_000)))
  })
})

describe('construirResumen', () => {
  const pendientes = [
    { titulo: 'Entregar reporte', hora: '10:00', fechaLimite: '2026-10-26', prioridad: 'Alta' },
    { titulo: 'Comprar <focos>', fechaLimite: '2026-10-28' },
    { titulo: 'Fuera de la semana', fechaLimite: '2026-11-05' },
  ]
  const eventos = [{ titulo: 'Junta', fecha: '2026-10-26', hora: '09:00', duracionMin: 60 }]

  it('diario: solo el día, ordenado por hora, con baja', () => {
    const r = construirResumen({ tipo: 'diario', fecha: '2026-10-26', pendientes, eventos, urlBaja: 'https://x/baja?t=1' })
    expect(r.texto.indexOf('Junta')).toBeLessThan(r.texto.indexOf('Entregar reporte'))
    expect(r.texto).not.toContain('focos')
    expect(r.html).toContain('Dejar de recibir')
    expect(r.vacio).toBe(false)
  })
  it('semanal: agrupa por día lun–dom e incluye el lunes en su sección, escapando HTML', () => {
    const r = construirResumen({ tipo: 'semanal', fecha: '2026-10-26', pendientes, eventos })
    expect(r.asunto).toContain('26/10 – 01/11')
    expect(r.texto).toMatch(/lunes 26\/10[\s\S]*Junta[\s\S]*miércoles 28\/10[\s\S]*focos/)
    expect(r.texto).not.toContain('Fuera de la semana')
    expect(r.html).toContain('Comprar &lt;focos&gt;')
  })
  it('sin nada: marca vacío', () => {
    expect(construirResumen({ tipo: 'diario', fecha: '2026-10-30', pendientes: [], eventos: [] }).vacio).toBe(true)
  })
})

import { eventosGoogleAItems } from '../supabase/functions/_shared/resumen'

describe('Google Calendar en el correo', () => {
  const MX = 'America/Mexico_City'
  it('convierte los eventos con hora a la zona del usuario y los de todo el día a un item por día', () => {
    const items = eventosGoogleAItems([
      { id: 'a', summary: 'Junta', start: { dateTime: '2026-10-26T21:00:00Z' }, end: { dateTime: '2026-10-26T22:30:00Z' } }, // 15:00 MX
      { id: 'b', summary: 'Congreso', start: { date: '2026-10-27' }, end: { date: '2026-10-29' } }, // 27 y 28
    ], MX, '2026-10-26', '2026-11-01')
    expect(items.map(i => [i.titulo, i.fecha, i.hora, i.todoElDia ?? false])).toEqual([
      ['Junta', '2026-10-26', '15:00', false], ['Congreso', '2026-10-27', '', true], ['Congreso', '2026-10-28', '', true],
    ])
    expect(items[0]).toMatchObject({ duracionMin: 90, origen: 'google' })
  })
  it('un evento nocturno cae en el día LOCAL, no en el UTC', () => {
    const [it] = eventosGoogleAItems([{ id: 'n', summary: 'Cena', start: { dateTime: '2026-10-27T03:30:00Z' } }], MX, '2026-10-26', '2026-10-26')
    expect(it).toMatchObject({ fecha: '2026-10-26', hora: '21:30' })
  })
  it('omite cancelados, los espejados por la app, los duplicados entre cuentas y los fuera de rango', () => {
    const base = { start: { dateTime: '2026-10-26T20:00:00Z' } }
    const items = eventosGoogleAItems([
      { id: 'c', status: 'cancelled', summary: 'X', ...base },
      { id: 'm', summary: 'Espejado', ...base },
      { id: 'd1', iCalUID: 'u', summary: 'Compartido', ...base },
      { id: 'd2', iCalUID: 'u', summary: 'Compartido', ...base },
      { id: 'f', summary: 'Fuera', start: { dateTime: '2026-12-01T20:00:00Z' } },
    ], MX, '2026-10-26', '2026-11-01', new Set(['m']))
    expect(items.map(i => i.titulo)).toEqual(['Compartido'])
  })
  it('el correo los junta con los de la app (todo el día primero), etiqueta el origen y no queda vacío solo por Google', () => {
    const google = eventosGoogleAItems([{ id: 'g', summary: 'Festivo', start: { date: '2026-10-26' }, end: { date: '2026-10-27' } }], MX, '2026-10-26', '2026-10-26')
    const r = construirResumen({ tipo: 'diario', fecha: '2026-10-26', pendientes: [{ titulo: 'Reporte', hora: '10:00', fechaLimite: '2026-10-26', proyecto: 'Ventas' }], eventos: [{ titulo: 'Junta', fecha: '2026-10-26', hora: '09:00', duracionMin: 30 }, ...google] })
    expect(r.texto.indexOf('Festivo')).toBeLessThan(r.texto.indexOf('Junta'))
    expect(r.texto).toContain('Reporte · Ventas')
    expect(r.html).toContain('Google Calendar')
    expect(construirResumen({ tipo: 'diario', fecha: '2026-10-26', pendientes: [], eventos: google }).vacio).toBe(false)
  })
  it('incluye una sección de vencidos y notas de aviso', () => {
    const r = construirResumen({ tipo: 'diario', fecha: '2026-10-26', pendientes: [], eventos: [], vencidos: [{ titulo: 'Pagar', fechaLimite: '2026-10-20', proyecto: 'Casa' }], notas: ['No se pudo leer Google Calendar (a@b.c).'] })
    expect(r.texto).toContain('Vencidos (1)')
    expect(r.texto).toContain('Pagar · Casa (venció el 20/10)')
    expect(r.texto).toContain('No se pudo leer Google Calendar')
    expect(r.vacio).toBe(false)
  })
})
