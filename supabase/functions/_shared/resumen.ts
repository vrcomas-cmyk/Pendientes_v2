// Lógica PURA de los resúmenes por correo (Hito 3). Sin APIs de Deno ni de navegador, para poder
// usarla igual desde la Edge Function `resumen-correo` y desde las pruebas de Vitest.

export interface PrefsResumen {
  activo: boolean
  diario: boolean
  semanal: boolean
  hora_local: string          // 'HH:MM' en la zona del usuario
  zona: string                // IANA, ej. 'America/Mexico_City'
  dias: number[]              // días del DIARIO (0=domingo … 6=sábado); el semanal siempre es el lunes
  pausado_hasta?: string | null // 'YYYY-MM-DD' inclusive: no se envía nada hasta esa fecha
}

export interface ItemPendiente { titulo: string; hora?: string; fechaLimite: string; prioridad?: string; proyecto?: string }
export interface ItemEvento { titulo: string; fecha: string; hora: string; duracionMin: number; origen?: 'google'; todoElDia?: boolean }

const p2 = (n: number) => String(n).padStart(2, '0')

/** Fecha, hora y día de la semana locales de `ahora` en la zona dada (no depende de la zona del servidor). */
export function enZona(ahora: Date, zona: string): { fecha: string; hora: string; diaSemana: number } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(ahora)
  const g = (t: string) => partes.find(p => p.type === t)?.value ?? ''
  const dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return { fecha: `${g('year')}-${g('month')}-${g('day')}`, hora: `${g('hour')}:${g('minute')}`, diaSemana: dias.indexOf(g('weekday')) }
}

export function sumarDias(iso: string, n: number): string {
  const [a, m, d] = iso.split('-').map(Number)
  const f = new Date(Date.UTC(a, m - 1, d + n))
  return `${f.getUTCFullYear()}-${p2(f.getUTCMonth() + 1)}-${p2(f.getUTCDate())}`
}

/** Semana lunes–domingo que contiene `iso`. */
export function semanaDe(iso: string): { lunes: string; domingo: string; dias: string[] } {
  const [a, m, d] = iso.split('-').map(Number)
  const dow = new Date(Date.UTC(a, m - 1, d)).getUTCDay() // 0=dom
  const lunes = sumarDias(iso, -((dow + 6) % 7))
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
  return { lunes, domingo: dias[6], dias }
}

export type Envio = { tipo: 'diario' | 'semanal'; clave: string }

/** ¿Toca enviar algo ahora? Devuelve el tipo y su clave de idempotencia, o null.
    - Pausa, preferencia apagada u hora aún no alcanzada → nada. Si el cron se retrasa, se envía
      igual más tarde ese mismo día (la hora es un mínimo, no una ventana exacta).
    - Lunes con semanal activo: UN solo correo (el semanal, que ya incluye el día); nunca además el diario.
    - Resto de días: diario si el día está en `dias`. */
export function envioPendiente(prefs: PrefsResumen, ahora: Date): Envio | null {
  if (!prefs.activo || (!prefs.diario && !prefs.semanal)) return null
  const z = enZona(ahora, prefs.zona)
  if (prefs.pausado_hasta && z.fecha <= prefs.pausado_hasta) return null
  if (z.hora < prefs.hora_local) return null
  if (z.diaSemana === 1 && prefs.semanal) return { tipo: 'semanal', clave: z.fecha }
  if (prefs.diario && prefs.dias.includes(z.diaSemana)) return { tipo: 'diario', clave: z.fecha }
  return null
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const nombreDia = (iso: string) => { const [a, m, d] = iso.split('-').map(Number); return NOMBRES[new Date(Date.UTC(a, m - 1, d)).getUTCDay()] }
const fechaCorta = (iso: string) => iso.split('-').reverse().slice(0, 2).join('/')

interface Fila { hora: string; orden: string; texto: string; tipo: 'pendiente' | 'evento' | 'google' }
function filasDelDia(fecha: string, pendientes: ItemPendiente[], eventos: ItemEvento[]): Fila[] {
  const f: Fila[] = []
  for (const p of pendientes) {
    if (p.fechaLimite !== fecha) continue
    f.push({ hora: p.hora || '', orden: p.hora || '99:99', texto: p.titulo + (p.proyecto ? ` · ${p.proyecto}` : '') + (p.prioridad === 'Alta' ? ' (alta)' : ''), tipo: 'pendiente' })
  }
  for (const e of eventos) {
    if (e.fecha !== fecha) continue
    // Los de todo el día van primero; los demás por hora.
    f.push({ hora: e.todoElDia ? '' : e.hora || '', orden: e.todoElDia ? '00:00' : e.hora || '99:99', texto: e.todoElDia ? `${e.titulo} (todo el día)` : `${e.titulo} (${e.duracionMin} min)`, tipo: e.origen === 'google' ? 'google' : 'evento' })
  }
  return f.sort((a, b) => a.orden.localeCompare(b.orden))
}

export interface Resumen { asunto: string; html: string; texto: string; vacio: boolean }

const ETIQUETA_TIPO = { pendiente: 'pendiente', evento: 'evento', google: 'Google Calendar' } as const

export interface EventoGoogleCrudo {
  id: string
  iCalUID?: string
  status?: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

/** Convierte eventos crudos de Google Calendar a items del resumen, en la zona del usuario.
    - Omite cancelados y los que la propia app espejó (`idsEspejados`) para no repetirlos.
    - Colapsa el mismo evento compartido entre cuentas (iCalUID + inicio).
    - Los de todo el día generan un item por cada día que abarcan (fin exclusivo) dentro de [desde, hasta]. */
export function eventosGoogleAItems(gs: EventoGoogleCrudo[], zona: string, desde: string, hasta: string, idsEspejados: Set<string> = new Set()): ItemEvento[] {
  const out: ItemEvento[] = []
  const vistos = new Set<string>()
  for (const g of gs) {
    if (g.status === 'cancelled' || idsEspejados.has(g.id)) continue
    const ini = g.start?.dateTime || g.start?.date
    if (!ini) continue
    const clave = (g.iCalUID || g.id) + '|' + ini
    if (vistos.has(clave)) continue
    vistos.add(clave)
    const titulo = g.summary || '(sin título)'
    if (g.start?.dateTime) {
      const z = enZona(new Date(g.start.dateTime), zona)
      if (z.fecha < desde || z.fecha > hasta) continue
      const min = g.end?.dateTime ? Math.max(1, Math.round((new Date(g.end.dateTime).getTime() - new Date(g.start.dateTime).getTime()) / 60000)) : 30
      out.push({ titulo, fecha: z.fecha, hora: z.hora, duracionMin: min, origen: 'google' })
    } else {
      const fin = g.end?.date || sumarDias(g.start!.date!, 1)
      for (let d = g.start!.date!; d < fin; d = sumarDias(d, 1)) {
        if (d >= desde && d <= hasta) out.push({ titulo, fecha: d, hora: '', duracionMin: 0, origen: 'google', todoElDia: true })
      }
    }
  }
  return out
}

/** Construye el correo. `pendientes` debe traer solo los ABIERTOS; el semanal agrupa por día de
    lunes a domingo e incluye el día actual (lunes) en su sección. */
export function construirResumen(
  o: { tipo: 'diario' | 'semanal'; fecha: string; pendientes: ItemPendiente[]; eventos: ItemEvento[]; urlBaja?: string; vencidos?: ItemPendiente[]; notas?: string[] },
): Resumen {
  const dias = o.tipo === 'diario' ? [o.fecha] : semanaDe(o.fecha).dias
  const secciones = dias.map(d => ({ d, filas: filasDelDia(d, o.pendientes, o.eventos) }))
  const vencidos = (o.vencidos ?? []).slice().sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite))
  const total = secciones.reduce((n, s) => n + s.filas.length, 0) + vencidos.length
  const titulo = o.tipo === 'diario' ? `Tu día: ${nombreDia(o.fecha)} ${fechaCorta(o.fecha)}` : `Tu semana: ${fechaCorta(dias[0])} – ${fechaCorta(dias[6])}`
  const visibles = secciones.filter(s => o.tipo === 'diario' || s.filas.length)

  const htmlVencidos = vencidos.length
    ? `<h3 style="margin:16px 0 4px;font-size:14px;color:#b91c1c">Vencidos (${vencidos.length})</h3><ul style="margin:0;padding-left:18px">${vencidos.map(p => `<li>${esc(p.titulo)}${p.proyecto ? ` · ${esc(p.proyecto)}` : ''} <small style="color:#888">venció el ${esc(fechaCorta(p.fechaLimite))}</small></li>`).join('')}</ul>`
    : ''
  const htmlSecs = visibles.map(s => `
    <h3 style="margin:16px 0 4px;font-size:14px;text-transform:capitalize">${o.tipo === 'diario' ? 'Hoy' : esc(nombreDia(s.d))} ${esc(fechaCorta(s.d))}</h3>
    ${s.filas.length ? `<ul style="margin:0;padding-left:18px">${s.filas.map(f => `<li>${f.hora ? `<b>${esc(f.hora)}</b> ` : ''}${esc(f.texto)} <small style="color:#888">${ETIQUETA_TIPO[f.tipo]}</small></li>`).join('')}</ul>` : '<p style="color:#888;margin:0">Nada programado.</p>'}`).join('')
  const html = `<!doctype html><html><body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:auto;padding:16px;color:#222">
  <h2 style="margin:0 0 8px">${esc(titulo)}</h2>
  ${total ? '' : '<p style="color:#888">No tienes pendientes ni eventos programados.</p>'}${htmlVencidos}${htmlSecs}${(o.notas ?? []).map(n => `<p style="color:#888;font-size:12px">${esc(n)}</p>`).join('')}
  <hr style="margin:24px 0;border:none;border-top:1px solid #ddd">
  <p style="font-size:12px;color:#888">Pendientes Pro${o.urlBaja ? ` · <a href="${esc(o.urlBaja)}">Dejar de recibir estos correos</a>` : ''}</p></body></html>`

  const texto = [titulo, ...(vencidos.length ? ['', `Vencidos (${vencidos.length})`, ...vencidos.map(p => `- ${p.titulo}${p.proyecto ? ` · ${p.proyecto}` : ''} (venció el ${fechaCorta(p.fechaLimite)})`)] : []), ...visibles.flatMap(s => [
    '', `${o.tipo === 'diario' ? 'Hoy' : nombreDia(s.d)} ${fechaCorta(s.d)}`,
    ...(s.filas.length ? s.filas.map(f => `- ${f.hora ? f.hora + ' ' : ''}${f.texto}`) : ['(nada programado)']),
  ]), ...(o.notas ?? []).map(n => `\n${n}`), ...(o.urlBaja ? ['', `Dejar de recibir: ${o.urlBaja}`] : [])].join('\n')

  return { asunto: titulo, html, texto, vacio: total === 0 }
}
