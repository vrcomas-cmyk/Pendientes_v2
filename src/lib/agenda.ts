import { agendarPendiente, actualizarEventoAgenda, eliminarEventoAgenda, type EventoGCal } from '@/lib/googleCalendar'
import type { Pendiente, EventoCalendario } from '@/types'

/** Eventos remotos de Google que YA están representados localmente (pendiente agendado o
    `EventoCalendario` con espejo) — se filtran para no duplicar el chip: el local es el que se
    puede editar/mover, el remoto solo se muestra cuando no tiene equivalente local (ej. se creó
    directo en Google Calendar, fuera de la app). */
export function sinDuplicarLocal(eventosGoogle: EventoGCal[], pendientes: Pendiente[], eventos: EventoCalendario[]): EventoGCal[] {
  const idsLocales = new Set<string>()
  for (const p of pendientes) if (p.googleEventos) for (const eid of Object.values(p.googleEventos)) idsLocales.add(eid)
  for (const e of eventos) if (e.googleEventos) for (const eid of Object.values(e.googleEventos)) idsLocales.add(eid)
  return deduplicarGoogle(eventosGoogle.filter(e => !idsLocales.has(e.id)))
}

/** Un mismo evento compartido aparece una vez por cada cuenta conectada que lo tiene. Se colapsa por
    iCalUID (o, sin él, por título+inicio+fin) conservando la primera cuenta. */
export function deduplicarGoogle(eventos: EventoGCal[]): EventoGCal[] {
  const vistos = new Set<string>()
  return eventos.filter(e => {
    const clave = (e.uid || `${e.titulo}|${e.inicio}|${e.fin}`) + '|' + (e.inicio ?? '')
    if (vistos.has(clave)) return false
    vistos.add(clave)
    return true
  })
}

export interface ResumenCuentaGoogle { cuentaId: string; hoy: number; horasHoy: number; proximos7: number; siguientes: EventoGCal[] }

/** Resumen por cuenta de los eventos de Google ya cargados: cuántos hoy (y horas ocupadas, sin contar
    todo-el-día ni «disponible»), cuántos en los próximos 7 días y los 3 siguientes que aún no terminan. */
export function resumirGoogle(eventos: EventoGCal[], cuentaIds: string[], ahora = new Date()): ResumenCuentaGoogle[] {
  const ini = new Date(ahora); ini.setHours(0, 0, 0, 0)
  const finHoy = new Date(ini); finHoy.setDate(finHoy.getDate() + 1)
  const fin7 = new Date(ini); fin7.setDate(fin7.getDate() + 8) // hoy + 7 días siguientes
  const rango = (e: EventoGCal) => {
    const a = new Date(e.todoElDia ? e.inicio + 'T00:00:00' : e.inicio!)
    const b = e.fin ? new Date(e.todoElDia ? e.fin + 'T00:00:00' : e.fin) : a
    return { a, b: b > a ? b : new Date(a.getTime() + 1) }
  }
  return cuentaIds.map(cuentaId => {
    const propios = eventos.filter(e => e.cuentaId === cuentaId && e.inicio)
    let hoy = 0, ms = 0, prox = 0
    for (const e of propios) {
      const { a, b } = rango(e)
      if (a < finHoy && b > ini) { hoy++; if (!e.todoElDia && e.ocupado !== false) ms += Math.min(b.getTime(), finHoy.getTime()) - Math.max(a.getTime(), ini.getTime()) }
      if (a < fin7 && b > ini) prox++
    }
    const siguientes = propios.filter(e => rango(e).b > ahora && rango(e).a < fin7)
      .sort((x, y) => rango(x).a.getTime() - rango(y).a.getTime()).slice(0, 3)
    return { cuentaId, hoy, horasHoy: Math.round((ms / 3600000) * 10) / 10, proximos7: prox, siguientes }
  })
}

/** `normalizar` da 08:00 y ≤5 min a todo pendiente con fecha pero SIN hora elegida: es un marcador de
    «sin hora», no un bloque real. Si se contara, cada pendiente del día chocaría con los demás. */
export const esHoraPorDefecto = (hora?: string, duracionMin?: number): boolean => hora === '08:00' && (duracionMin ?? 0) <= 5

/** Reparte en columnas los bloques que se solapan en el tiempo (como el calendario de Google): los
    que no se cruzan con nadie ocupan todo el ancho; los que sí, se colocan lado a lado.
    `ini`/`fin` en minutos; devuelve para cada id su columna y cuántas columnas tiene su grupo. */
export function asignarColumnas(items: { id: string; ini: number; fin: number }[]): Map<string, { col: number; cols: number }> {
  const orden = [...items].sort((a, b) => a.ini - b.ini || a.fin - b.fin)
  const res = new Map<string, { col: number; cols: number }>()
  let grupo: { id: string; ini: number; fin: number; col: number }[] = []
  let finGrupo = -Infinity
  const cerrar = () => { const cols = grupo.reduce((m, g) => Math.max(m, g.col + 1), 0); for (const g of grupo) res.set(g.id, { col: g.col, cols }); grupo = [] }
  for (const it of orden) {
    if (it.ini >= finGrupo) { cerrar(); finGrupo = -Infinity }
    const ocupadas = new Set(grupo.filter(g => g.fin > it.ini).map(g => g.col))
    let col = 0
    while (ocupadas.has(col)) col++
    grupo.push({ ...it, col })
    finGrupo = Math.max(finGrupo, it.fin)
  }
  cerrar()
  return res
}

export interface ConflictoAgenda { origen: 'pendiente' | 'evento' | 'google'; titulo: string; inicio: Date; fin: Date; id: string }

const aFecha = (fecha: string, hora: string) => new Date(`${fecha}T${hora}:00`)

/** Eventos/pendientes que se solapan con el intervalo [fecha hora, +duracionMin) en hora LOCAL.
    Los límites son exclusivos (uno que termina a las 10:00 no choca con otro que empieza a las
    10:00); los eventos de todo el día de Google no se tratan como bloques horarios; se omiten
    pendientes completados/archivados/borrados y el propio elemento (`excluirId`). */
export function buscarConflictos(
  cand: { fecha: string; hora: string; duracionMin: number },
  fuentes: { pendientes: Pendiente[]; eventos: EventoCalendario[]; google: EventoGCal[]; idCompletado?: string },
  excluirId?: string,
): ConflictoAgenda[] {
  if (!cand.fecha || !cand.hora) return []
  const ini = aFecha(cand.fecha, cand.hora)
  const fin = new Date(ini.getTime() + Math.max(1, cand.duracionMin) * 60000)
  if (isNaN(ini.getTime())) return []
  const choca = (a: Date, b: Date) => a < fin && b > ini
  const out: ConflictoAgenda[] = []
  for (const p of fuentes.pendientes) {
    if (p.id === excluirId || p.borrado || p.archivado || p.estado === fuentes.idCompletado || !p.fechaLimite || !p.hora || esHoraPorDefecto(p.hora, p.duracionMin)) continue
    const a = aFecha(p.fechaLimite, p.hora), b = new Date(a.getTime() + (p.duracionMin || 15) * 60000)
    if (choca(a, b)) out.push({ origen: 'pendiente', titulo: p.titulo, inicio: a, fin: b, id: p.id })
  }
  for (const e of fuentes.eventos) {
    if (e.id === excluirId || e.borrado || !e.hora) continue
    const a = aFecha(e.fecha, e.hora), b = new Date(a.getTime() + (e.duracionMin || 15) * 60000)
    if (choca(a, b)) out.push({ origen: 'evento', titulo: e.titulo, inicio: a, fin: b, id: e.id })
  }
  for (const g of fuentes.google) {
    if (g.todoElDia || g.ocupado === false || !g.inicio || !g.fin) continue
    const a = new Date(g.inicio), b = new Date(g.fin)
    if (choca(a, b)) out.push({ origen: 'google', titulo: g.titulo, inicio: a, fin: b, id: g.cuentaId + '/' + g.id })
  }
  return out.sort((x, y) => x.inicio.getTime() - y.inicio.getTime())
}

export const horaCorta = (d: Date) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')

interface AntesEspejo { hora?: string; googleEventos?: Record<string, string> }
interface DespuesEspejo { titulo: string; fecha: string; hora: string; duracionMin: number; descripcion?: string }

/** Crea, actualiza o borra el espejo en Google Calendar de un pendiente o evento suelto, según
    cómo cambió su horario. Punto único usado tanto por `TaskModal` (al editar) como por el
    calendario (al crear/mover) — antes cada uno lo manejaba a mano y por separado, lo que dejaba
    ediciones fuera de la Agenda sin reflejarse nunca en Google. */
export async function sincronizarEspejoGoogle(
  antes: AntesEspejo,
  despues: DespuesEspejo,
  origenCuentaId?: string,
  soloEstaCuenta?: boolean,
): Promise<{ googleEventos?: Record<string, string>; errores?: Record<string, string> }> {
  const teniaEspejo = !!antes.googleEventos && Object.keys(antes.googleEventos).length > 0

  if (!despues.hora) {
    if (teniaEspejo) await eliminarEventoAgenda(antes.googleEventos!)
    return { googleEventos: undefined }
  }

  if (!teniaEspejo) {
    const r = await agendarPendiente(despues.fecha, despues.hora, despues.duracionMin, despues.titulo, despues.descripcion, origenCuentaId, soloEstaCuenta)
    return { googleEventos: r.eventos, errores: r.errores }
  }

  const r = await actualizarEventoAgenda(antes.googleEventos!, despues.fecha, despues.hora, despues.duracionMin, despues.titulo, despues.descripcion, origenCuentaId)
  return { googleEventos: r.eventos, errores: r.errores }
}

export interface ItemAgenda {
  k: 'p' | 'e' | 'g'
  id: string
  hora: string        // 'HH:MM' o '' si es de todo el día
  titulo: string
  min: number
  todoElDia: boolean
  choca: boolean
  origen: string      // «Pendiente», «Evento» o el correo de la cuenta de Google
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const isoLocal = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

/** Una sola agenda por día con TODO junto: pendientes con hora, eventos propios y eventos de Google
    (también los de todo el día, incluso los que abarcan varios días), cada uno con su origen y aviso
    de cruce. Los espejados en Google no se repiten y los duplicados entre cuentas se colapsan. */
export function agruparAgenda(
  dias: string[],
  f: { pendientes: Pendiente[]; eventos: EventoCalendario[]; google: EventoGCal[]; idCompletado?: string },
): { fecha: string; items: ItemAgenda[] }[] {
  const google = deduplicarGoogle(sinDuplicarLocal(f.google, f.pendientes, f.eventos))
  const fuentes = { pendientes: f.pendientes, eventos: f.eventos, google, idCompletado: f.idCompletado }
  const choca = (fecha: string, hora: string, min: number, id: string) => buscarConflictos({ fecha, hora, duracionMin: min }, fuentes, id).length > 0

  return dias.map(fecha => {
    const items: ItemAgenda[] = []
    for (const p of f.pendientes) {
      if (p.fechaLimite !== fecha || !p.hora || esHoraPorDefecto(p.hora, p.duracionMin) || p.estado === f.idCompletado) continue
      items.push({ k: 'p', id: p.id, hora: p.hora, titulo: p.titulo, min: p.duracionMin || 15, todoElDia: false, choca: choca(fecha, p.hora, p.duracionMin || 15, p.id), origen: 'Pendiente' })
    }
    for (const e of f.eventos) {
      if (e.borrado || e.fecha !== fecha || !e.hora) continue
      items.push({ k: 'e', id: e.id, hora: e.hora, titulo: e.titulo, min: e.duracionMin || 15, todoElDia: false, choca: choca(fecha, e.hora, e.duracionMin || 15, e.id), origen: 'Evento' })
    }
    for (const g of google) {
      if (!g.inicio) continue
      const gid = g.cuentaId + '/' + g.id
      if (g.todoElDia) {
        // `fin` es exclusivo: un evento de todo el día del 5 al 6 termina el 7 en Google.
        const ini10 = g.inicio.slice(0, 10)
        const siguiente = new Date(ini10 + 'T00:00:00'); siguiente.setDate(siguiente.getDate() + 1)
        const finExclusivo = g.fin ? g.fin.slice(0, 10) : isoLocal(siguiente)
        if (fecha >= ini10 && fecha < finExclusivo) {
          items.push({ k: 'g', id: gid, hora: '', titulo: g.titulo, min: 0, todoElDia: true, choca: false, origen: g.email })
        }
        continue
      }
      const ini = new Date(g.inicio)
      if (isoLocal(ini) !== fecha) continue
      const hora = horaCorta(ini)
      const min = g.fin ? Math.max(1, Math.round((new Date(g.fin).getTime() - ini.getTime()) / 60000)) : 30
      items.push({ k: 'g', id: gid, hora, titulo: g.titulo, min, todoElDia: false, choca: g.ocupado !== false && choca(fecha, hora, min, gid), origen: g.email })
    }
    items.sort((a, b) => Number(b.todoElDia) - Number(a.todoElDia) || a.hora.localeCompare(b.hora))
    return { fecha, items }
  })
}
