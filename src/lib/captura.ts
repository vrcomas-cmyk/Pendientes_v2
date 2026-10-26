import { parsearLinea, hoyISO } from '@/lib/app-utils'

export type ModoCaptura = 'pendiente' | 'nota' | 'evento'

export interface EventoRapido {
  titulo: string
  descripcion: string
  fecha: string       // YYYY-MM-DD
  hora: string        // HH:MM
  duracionMin: number
}

const DURACION_DEFECTO = 60

const pad = (n: number) => String(n).padStart(2, '0')

/** Extrae «15:30», «3pm», «3:15 pm» o «a las 9» y devuelve HH:MM (o '' si no hay hora válida). */
function extraerHora(texto: string): { hora: string; resto: string } {
  const re = /(?:\ba\s+las\s+)?\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|(?:\ba\s+las\s+)?\b(\d{1,2}):(\d{2})\b|\ba\s+las\s+(\d{1,2})\b/i
  const m = texto.match(re)
  if (!m) return { hora: '', resto: texto }
  let h: number, min: number
  if (m[3]) { h = +m[1]; min = m[2] ? +m[2] : 0; const pm = m[3].toLowerCase() === 'pm'; if (h < 1 || h > 12) return { hora: '', resto: texto }; h = (h % 12) + (pm ? 12 : 0) }
  else if (m[4]) { h = +m[4]; min = +m[5] }
  else { h = +m[6]; min = 0 }
  if (h > 23 || min > 59) return { hora: '', resto: texto }
  return { hora: `${pad(h)}:${pad(min)}`, resto: texto.replace(m[0], ' ') }
}

/** Extrae «por 90min», «por 2h» o «por 1.5h» y devuelve minutos (0 si no hay duración). */
function extraerDuracion(texto: string): { duracionMin: number; resto: string } {
  const m = texto.match(/\bpor\s+(\d+(?:[.,]\d+)?)\s*(h|hr|hrs|horas?|min|m)\b/i)
  if (!m) return { duracionMin: 0, resto: texto }
  const n = parseFloat(m[1].replace(',', '.'))
  const minutos = /^h/i.test(m[2]) ? Math.round(n * 60) : Math.round(n)
  if (minutos < 5 || minutos > 24 * 60) return { duracionMin: 0, resto: texto }
  return { duracionMin: minutos, resto: texto.replace(m[0], ' ') }
}

/** «Junta con Liz mañana 3pm por 1h» → evento. Reusa la sintaxis de fecha de `parsearLinea`
    (`>mañana`, `hoy`, `>viernes`, `>2026-11-02`); sin fecha asume hoy y sin hora, 08:00 (lo
    resuelve `crearEvento`). Devuelve null si no queda un título. */
export function parsearEventoRapido(raw: string): EventoRapido | null {
  const { hora, resto: sinHora } = extraerHora(raw)
  const { duracionMin, resto } = extraerDuracion(sinHora)
  const p = parsearLinea(resto.replace(/#"[^"]+"|#\S+/g, ''))
  if (!p) return null
  return {
    titulo: p.titulo,
    descripcion: p.descripcion,
    fecha: p.fechaLimite || hoyISO(),
    hora,
    duracionMin: duracionMin || DURACION_DEFECTO,
  }
}
