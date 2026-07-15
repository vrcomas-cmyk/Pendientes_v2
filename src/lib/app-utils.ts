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

export function vencido(p: Pendiente): boolean {
  return !!p.fechaLimite && p.estado !== 'completado' && p.fechaLimite < hoyISO()
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

export interface LineaParseada {
  titulo: string
  descripcion: string
  responsable: string
  prioridad?: Prioridad
  fechaLimite?: string
}

/** «- Título: descripción @Resp1 @Resp2 !alta >mañana» → campos del pendiente */
export function parsearLinea(raw: string): LineaParseada | null {
  let t = String(raw).trim().replace(/^\s*[-*+•]\s*/, '').replace(/^\[[ xX]\]\s*/, '').trim()
  if (!t) return null
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
  return { titulo, descripcion, responsable: resps.join(', '), prioridad, fechaLimite: ef.fecha }
}

export function esBullet(texto: string): boolean {
  return /^\s*[-*+•]\s+\S/.test(texto)
}

/* Persistencia segura: localStorage si existe, memoria si no */
const mem: Record<string, string> = {}
export const storage = {
  get(k: string): string | null {
    try { const v = localStorage.getItem(k); if (v !== null) return v } catch { /* noop */ }
    return mem[k] ?? null
  },
  set(k: string, v: string) {
    mem[k] = v
    try { localStorage.setItem(k, v) } catch { /* noop */ }
  },
}

export function normalizar(p: Partial<Pendiente>): Pendiente {
  return {
    id: uid(), titulo: '', solicitante: '', responsable: '', descripcion: '',
    prioridad: 'Media', estado: 'pendiente', fechaLimite: '', hora: '', proyecto: '',
    etiquetas: [], subtareas: [], comentarios: [], adjuntos: [], origenNota: null,
    creado: new Date().toISOString(), modificado: new Date().toISOString(), fechaCompletado: null,
    ...p,
  }
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

export function descargar(nombre: string, contenido: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nombre; a.click()
  URL.revokeObjectURL(url)
}
