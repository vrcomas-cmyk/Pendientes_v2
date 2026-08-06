import { toast } from 'sonner'
import type { Pendiente, Prioridad } from '@/types'

export function uid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + '-' + Math.random().toString(16).slice(2)
}

export function hoyISO(): string {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

/** `idCompletado`: id de la columna del Kanban marcada `esCompletado` (`useApp().columnas`) — con
    columnas moldeables ya no es el literal fijo `'completado'`. Se mantiene ese valor por defecto
    para no romper llamadas que todavía no lo pasan explícitamente. */
export function vencido(p: Pendiente, idCompletado: string = 'completado'): boolean {
  return !!p.fechaLimite && p.estado !== idCompletado && p.fechaLimite < hoyISO()
}

export function progresoSub(p: Pendiente): { hechas: number; total: number; pct: number } | null {
  if (!p.subtareas?.length) return null
  const hechas = p.subtareas.filter(s => s.completada).length
  return { hechas, total: p.subtareas.length, pct: Math.round((hechas / p.subtareas.length) * 100) }
}

const DIAS_SEMANA: Record<string, number> = { domingo: 0, lunes: 1, martes: 2, 'miércoles': 3, miercoles: 3, jueves: 4, viernes: 5, 'sábado': 6, sabado: 6 }

function fechaRelativa(dias: number): string {
  const d = new Date(); d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Extrae una fecha de un texto: `>mañana`, `>viernes`, `>+5d`, `>2w`, `>2026-06-20`, o `hoy`/`mañana` sueltos */
function extraerFecha(text: string): { fecha?: string; resto: string } {
  let resto = text
  let fecha: string | undefined
  const aplicar = (tok: string): string | undefined => {
    tok = tok.toLowerCase()
    if (/^\d{4}-\d{2}-\d{2}$/.test(tok)) return tok
    if (tok === 'hoy') return fechaRelativa(0)
    if (tok === 'mañana' || tok === 'manana') return fechaRelativa(1)
    if (tok === 'pasado') return fechaRelativa(2)
    let m = tok.match(/^\+?(\d+)d$/); if (m) return fechaRelativa(+m[1])
    m = tok.match(/^\+?(\d+)[ws]$/); if (m) return fechaRelativa(+m[1] * 7)
    if (tok in DIAS_SEMANA) { const d = new Date(); const diff = (DIAS_SEMANA[tok] - d.getDay() + 7) % 7 || 7; return fechaRelativa(diff) }
    return undefined
  }
  const mGt = resto.match(/>\s*([^\s:]+)/)
  if (mGt) { const f = aplicar(mGt[1]); if (f) { fecha = f; resto = resto.replace(mGt[0], '') } }
  if (!fecha) {
    const mBare = resto.match(/\b(hoy|mañana|manana)\b/i)
    if (mBare) { fecha = aplicar(mBare[1]); resto = resto.replace(mBare[0], '') }
  }
  return { fecha, resto }
}

/** Fecha límite sugerida según prioridad: Alta=1 día, Media=3 días, Baja=7 días */
export function fechaPorPrioridad(prioridad: Prioridad): string {
  return fechaRelativa(prioridad === 'Alta' ? 1 : prioridad === 'Baja' ? 7 : 3)
}

function isoLocal(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
/** Fecha (ISO local) sumando `dias` a hoy. */
export function isoMasDias(dias: number): string {
  const d = new Date(); d.setDate(d.getDate() + dias); return isoLocal(d)
}
/** Próximo sábado (fin de semana) en ISO local. */
export function isoProximoFinDeSemana(): string {
  const d = new Date(); const diff = (6 - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + diff); return isoLocal(d)
}

export interface LineaParseada {
  titulo: string
  descripcion: string
  responsable: string
  prioridad?: Prioridad
  fechaLimite?: string
  repetir?: string
}

const NOMBRES_DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const UNIDAD_RE = /^(d(?:ias?)?|s(?:em(?:anas?)?)?|m(?:es(?:es)?)?)$/i
function normalizarUnidad(u: string): 'd' | 's' | 'm' {
  const c = u.toLowerCase()[0]
  return c === 's' || c === 'm' ? c : 'd'
}
const RE_REPETICION_CANTIDAD = /\*\s*cada(!)?\s*(\d+)\s*(d(?:ias?)?|s(?:em(?:anas?)?)?|m(?:es(?:es)?)?)\b/i
const RE_REPETICION_DIAS = /\*\s*cada(!)?\s*((?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)(?:\s*(?:,|y)\s*(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo))*)\b/i

/** Extrae `*cada 3d`, `*cada! 7d`, `*cada 2 semanas` o `*cada lunes y jueves` → regla normalizada ('7d', '!7d', 'w:1,4') */
export function parsearRepeticion(texto: string): { regla?: string; resto: string } {
  let resto = texto
  let m = resto.match(RE_REPETICION_CANTIDAD)
  if (m && UNIDAD_RE.test(m[3])) {
    const desde = m[1] ? '!' : ''
    resto = resto.replace(m[0], '')
    return { regla: `${desde}${m[2]}${normalizarUnidad(m[3])}`, resto }
  }
  m = resto.match(RE_REPETICION_DIAS)
  if (m) {
    const desde = m[1] ? '!' : ''
    const dias = [...new Set(m[2].split(/\s*(?:,|y)\s*/).map(d => NOMBRES_DIAS.indexOf(d.toLowerCase().replace('miercoles', 'miércoles').replace('sabado', 'sábado'))))].filter(d => d >= 0).sort()
    resto = resto.replace(m[0], '')
    if (dias.length) return { regla: `${desde}w:${dias.join(',')}`, resto }
  }
  return { resto }
}

/** Texto legible de una regla de recurrencia: "cada lunes", "cada 2 semanas (desde que se completa)" */
export function describirRepeticion(regla: string): string {
  const desde = regla.startsWith('!')
  const cuerpo = desde ? regla.slice(1) : regla
  let texto: string
  if (cuerpo.startsWith('w:')) {
    const dias = cuerpo.slice(2).split(',').map(Number)
    texto = 'cada ' + dias.map(d => NOMBRES_DIAS[d]).join(' y ')
  } else {
    const n = parseInt(cuerpo, 10)
    const unidad = cuerpo.slice(String(n).length)
    if (unidad === 'd' && n === 1) texto = 'cada día'
    else {
      const nombre = unidad === 's' ? (n === 1 ? 'semana' : 'semanas') : unidad === 'm' ? (n === 1 ? 'mes' : 'meses') : (n === 1 ? 'día' : 'días')
      texto = `cada ${n} ${nombre}`
    }
  }
  return desde ? texto + ' (desde que se completa)' : texto
}

/** Siguiente fecha ISO local para una regla de recurrencia, contada a partir de `base` (ISO). */
export function siguienteFecha(regla: string, base: string): string {
  const cuerpo = regla.startsWith('!') ? regla.slice(1) : regla
  const baseISO = base || hoyISO()
  if (cuerpo.startsWith('w:')) {
    const dias = cuerpo.slice(2).split(',').map(Number).filter(n => !Number.isNaN(n))
    const d = new Date(baseISO + 'T00:00')
    for (let i = 1; i <= 7; i++) {
      const nd = new Date(d); nd.setDate(nd.getDate() + i)
      if (!dias.length || dias.includes(nd.getDay())) return isoLocal(nd)
    }
    return isoLocal(d)
  }
  const n = parseInt(cuerpo, 10) || 1
  const unidad = cuerpo.slice(String(n).length)
  const dias = unidad === 's' ? n * 7 : unidad === 'm' ? n * 30 : n
  const d = new Date(baseISO + 'T00:00'); d.setDate(d.getDate() + dias)
  return isoLocal(d)
}

/** «- Título: descripción @Resp1 @Resp2 !alta >mañana *cada lunes» → campos del pendiente */
export function parsearLinea(raw: string): LineaParseada | null {
  let t = String(raw).trim().replace(/^\s*[-*+•]\s*/, '').replace(/^\[[ xX]\]\s*/, '').trim()
  if (!t) return null
  const rep = parsearRepeticion(t); t = rep.resto
  let prioridad: Prioridad | undefined
  t = t.replace(/!(alta|media|baja)\b/i, (_m, p: string) => { prioridad = (p[0].toUpperCase() + p.slice(1).toLowerCase()) as Prioridad; return '' })
  const resps: string[] = []
  t = t.replace(/@([\p{L}\d._-]+)/gu, (_m, n: string) => { resps.push(n); return '' })
  const ef = extraerFecha(t); t = ef.resto
  t = t.replace(/\s{2,}/g, ' ').trim()
  const idx = t.indexOf(':')
  let titulo = t, descripcion = ''
  if (idx > 0) { titulo = t.slice(0, idx).trim(); descripcion = t.slice(idx + 1).trim() }
  if (!titulo) return null
  return { titulo, descripcion, responsable: resps.join(', '), prioridad, fechaLimite: ef.fecha, repetir: rep.regla }
}

export function esBullet(texto: string): boolean {
  return /^\s*[-*+•]\s+\S/.test(texto)
}

/* Persistencia segura: localStorage si existe, memoria si no */
const mem: Record<string, string> = {}
let avisoQuotaMostrado = false
export const storage = {
  get(k: string): string | null {
    try { const v = localStorage.getItem(k); if (v !== null) return v } catch { /* noop */ }
    return mem[k] ?? null
  },
  set(k: string, v: string) {
    mem[k] = v
    try { localStorage.setItem(k, v) }
    catch (e) {
      const esQuota = e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)
      if (esQuota && !avisoQuotaMostrado) {
        avisoQuotaMostrado = true
        toast.error('Se llenó el almacenamiento local: los últimos cambios podrían no guardarse. Borra adjuntos/notas grandes o exporta y limpia datos.')
      }
    }
  },
}

/** Horario por defecto al agendar: solo fecha (sin hora) → 08:00, bloque de 5 min; hora sin
    duración → 15 min. Sin fecha no se toca nada (no se agenda solo). */
export function defaultsHorario(fecha: string, hora: string, duracionMin?: number): { hora: string; duracionMin?: number } {
  if (!fecha) return { hora, duracionMin }
  if (!hora) return { hora: '08:00', duracionMin: 5 }
  if (!duracionMin) return { hora, duracionMin: 15 }
  return { hora, duracionMin }
}

export function normalizar(p: Partial<Pendiente>): Pendiente {
  const base: Pendiente = {
    id: uid(), titulo: '', solicitante: '', responsable: '', descripcion: '',
    prioridad: 'Media', estado: 'pendiente', fechaLimite: '', hora: '', proyecto: '',
    etiquetas: [], subtareas: [], comentarios: [], adjuntos: [], origenNota: null,
    creado: new Date().toISOString(), modificado: new Date().toISOString(), fechaCompletado: null,
    ...p,
  }
  const { hora, duracionMin } = defaultsHorario(base.fechaLimite, base.hora || '', base.duracionMin)
  return { ...base, hora, duracionMin }
}

/** Construye un enlace de Google Calendar con el evento prellenado */
export function googleCalendarUrl(titulo: string, fecha: string, hora?: string, descripcion?: string): string | null {
  if (!fecha) return null
  const limpiar = (s: string) => s.replace(/[-:]/g, '')
  let start: string, end: string
  if (hora) {
    const ini = new Date(`${fecha}T${hora}:00`)
    const fin = new Date(ini.getTime() + 60 * 60 * 1000) // 1 hora
    const fmt = (d: Date) => limpiar(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`)
    start = fmt(ini); end = fmt(fin)
  } else {
    const d = fecha.replace(/-/g, '')
    const sig = new Date(`${fecha}T00:00:00`); sig.setDate(sig.getDate() + 1)
    start = d
    end = `${sig.getFullYear()}${String(sig.getMonth() + 1).padStart(2, '0')}${String(sig.getDate()).padStart(2, '0')}`
  }
  const params = new URLSearchParams({ action: 'TEMPLATE', text: titulo, dates: `${start}/${end}` })
  if (descripcion) params.set('details', descripcion)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Pendiente "activo": no archivado ni borrado. Usado para excluir de las vistas normales
    los archivados (estilo Gmail) y los borrados suaves que viven en la Papelera. */
export function activo(p: Pendiente): boolean {
  return !p.archivado && !p.borrado
}

/** Fecha flexible desde texto pegado de Excel: `dd/mm/aaaa`, `dd-mm-aaaa`, `aaaa-mm-dd`,
    `dd/mm/aa`. Devuelve ISO (aaaa-mm-dd) o '' si no reconoce el formato. */
export function parsearFechaFlexible(texto: string): string {
  const t = String(texto || '').trim()
  if (!t) return ''
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return isoDesdePartes(+m[1], +m[2], +m[3])
  m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (m) {
    let anio = +m[3]
    if (anio < 100) anio += anio < 70 ? 2000 : 1900
    return isoDesdePartes(anio, +m[2], +m[1])
  }
  // Excel a veces exporta fechas como número de serie (días desde 1899-12-30)
  m = t.match(/^\d{4,6}$/)
  if (m) {
    const serie = +t
    const base = new Date(Date.UTC(1899, 11, 30))
    base.setUTCDate(base.getUTCDate() + serie)
    return isoDesdePartes(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate())
  }
  return ''
}

function isoDesdePartes(anio: number, mes: number, dia: number): string {
  if (!anio || mes < 1 || mes > 12 || dia < 1 || dia > 31) return ''
  const d = new Date(anio, mes - 1, dia)
  if (d.getFullYear() !== anio || d.getMonth() !== mes - 1 || d.getDate() !== dia) return ''
  return anio + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0')
}

/** Hora flexible desde texto pegado de Excel: `10:00`, `10:00 am/pm`, `22:00`, `10 am`.
    Devuelve 'HH:MM' o '' si no reconoce el formato. */
export function parsearHoraFlexible(texto: string): string {
  const t = String(texto || '').trim().toLowerCase()
  if (!t) return ''
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)?$/)
  if (!m) return ''
  let h = +m[1]
  const min = m[2] ? +m[2] : 0
  const suf = m[3]?.replace(/\./g, '')
  if (suf === 'pm' && h < 12) h += 12
  if (suf === 'am' && h === 12) h = 0
  if (h > 23 || min > 59) return ''
  return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0')
}

export function descargar(nombre: string, contenido: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nombre; a.click()
  URL.revokeObjectURL(url)
}
