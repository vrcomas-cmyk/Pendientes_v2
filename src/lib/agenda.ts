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
  return eventosGoogle.filter(e => !idsLocales.has(e.id))
}

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
