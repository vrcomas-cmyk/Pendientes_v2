import type { Pendiente, Proyecto } from '@/types'

export const ESTANCAMIENTO_DEFECTO = 14
const DIA = 86400000

const abierto = (p: Pendiente, idCompletado: string) => !p.borrado && !p.archivado && p.estado !== idCompletado

export function pendientesDeProyecto(pendientes: Pendiente[], proyectoId: string): Pendiente[] {
  return pendientes.filter(p => p.proyectoId === proyectoId && !p.borrado && !p.archivado)
}

/** Última actividad real del proyecto: el cambio más reciente en sus pendientes (incluye completar). */
export function ultimaActividad(pendientes: Pendiente[], proyectoId: string): string | null {
  let max = ''
  for (const p of pendientes) {
    if (p.proyectoId !== proyectoId || p.borrado) continue
    for (const f of [p.modificado, p.fechaCompletado || '']) if (f > max) max = f
  }
  return max || null
}

/** Estancado = hay trabajo abierto Y no hubo actividad en `estancamientoDias` días. NO se infiere
    por fechas vencidas. Un proyecto en pausa (`pausadoHasta` futuro) o archivado no avisa. */
export function estancamiento(
  proyecto: Proyecto, pendientes: Pendiente[], idCompletado: string, ahora = new Date(),
): { estancado: boolean; diasSinActividad: number; abiertos: number } {
  const abiertos = pendientes.filter(p => p.proyectoId === proyecto.id && abierto(p, idCompletado)).length
  const ult = ultimaActividad(pendientes, proyecto.id)
  const dias = ult ? Math.floor((ahora.getTime() - new Date(ult).getTime()) / DIA) : 0
  const hoy = ahora.getFullYear() + '-' + String(ahora.getMonth() + 1).padStart(2, '0') + '-' + String(ahora.getDate()).padStart(2, '0')
  const enPausa = !!proyecto.pausadoHasta && proyecto.pausadoHasta >= hoy
  const umbral = proyecto.estancamientoDias && proyecto.estancamientoDias > 0 ? proyecto.estancamientoDias : ESTANCAMIENTO_DEFECTO
  return { estancado: !proyecto.archivado && !enPausa && abiertos > 0 && ult !== null && dias >= umbral, diasSinActividad: dias, abiertos }
}

/** Scrum como perspectiva: «en el sprint» = pendiente cuya fecha límite cae dentro de la ventana
    del sprint; el resto del trabajo abierto es backlog. No se copia ni duplica nada. */
export function dividirSprint(items: Pendiente[], sprint: { inicio: string; fin: string }, idCompletado: string) {
  const enSprint = items.filter(p => p.fechaLimite && p.fechaLimite >= sprint.inicio && p.fechaLimite <= sprint.fin)
  const backlog = items.filter(p => !enSprint.includes(p) && p.estado !== idCompletado)
  const hechos = enSprint.filter(p => p.estado === idCompletado).length
  return { enSprint, backlog, hechos, total: enSprint.length, porcentaje: enSprint.length ? Math.round((hechos / enSprint.length) * 100) : 0 }
}

export function diasEntre(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / DIA)
}

export interface BarraGantt { p: Pendiente; inicio: string; fin: string }

/** Barras del Gantt: inicio = `fechaInicio` o fecha de creación; fin = `fechaLimite`. Sin fecha
    límite no hay barra verificable (se devuelven aparte). Si fin < inicio se usa el inicio. */
export function barrasGantt(items: Pendiente[]): { barras: BarraGantt[]; sinFecha: Pendiente[] } {
  const barras: BarraGantt[] = []
  const sinFecha: Pendiente[] = []
  for (const p of items) {
    if (!p.fechaLimite) { sinFecha.push(p); continue }
    const inicio = p.fechaInicio || p.creado.slice(0, 10)
    barras.push({ p, inicio: inicio <= p.fechaLimite ? inicio : p.fechaLimite, fin: p.fechaLimite })
  }
  barras.sort((a, b) => a.inicio.localeCompare(b.inicio) || a.fin.localeCompare(b.fin))
  return { barras, sinFecha }
}
