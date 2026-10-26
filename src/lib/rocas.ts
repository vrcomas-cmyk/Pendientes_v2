import type { Roca, ActividadRoca } from '@/types'

/** Rango del trimestre natural que contiene `fecha` (YYYY-MM-DD). Es solo el valor sugerido: la
    roca guarda fechas libres, así que un periodo atípico se edita a mano. */
export function trimestreDe(fecha: string): { inicio: string; fin: string } {
  const [a, m] = fecha.split('-').map(Number)
  const q = Math.floor((m - 1) / 3)
  const mesIni = q * 3 + 1
  const ultimoDia = new Date(a, mesIni + 2, 0).getDate()
  const p = (n: number) => String(n).padStart(2, '0')
  return { inicio: `${a}-${p(mesIni)}-01`, fin: `${a}-${p(mesIni + 2)}-${p(ultimoDia)}` }
}

export const actividadesActivas = (r: Roca): ActividadRoca[] => (r.actividades || []).filter(a => !a.borrado)

/** Actividades vigentes dentro del periodo (límites incluidos), de la más reciente a la más antigua. */
export function actividadesDelPeriodo(r: Roca, desde = r.fechaInicio, hasta = r.fechaFin): ActividadRoca[] {
  return actividadesActivas(r)
    .filter(a => a.fecha >= desde && a.fecha <= hasta)
    .sort((x, y) => y.fecha.localeCompare(x.fecha) || y.creado.localeCompare(x.creado))
}

export function resumenRoca(r: Roca): { total: number; objetivo?: number; porcentaje?: number; dias: number } {
  const acts = actividadesDelPeriodo(r)
  const total = acts.length
  return {
    total,
    objetivo: r.objetivo,
    porcentaje: r.objetivo ? Math.min(100, Math.round((total / r.objetivo) * 100)) : undefined,
    dias: new Set(acts.map(a => a.fecha)).size,
  }
}

/** Une dos versiones de una roca sin perder bitácora: las actividades se combinan por id (gana la
    de `modificado` más reciente, incluidos los tombstones `borrado`); los campos de la roca, por
    last-write-wins. Así dos dispositivos que registraron actividades distintas conservan ambas. */
export function mergeRoca(local: Roca, remote: Roca): { merged: Roca; conflicto: boolean } {
  const localNewer = (local.modificado || '') >= (remote.modificado || '')
  const base = localNewer ? local : remote
  const porId = new Map<string, ActividadRoca>()
  for (const a of [...(remote.actividades || []), ...(local.actividades || [])]) {
    const previa = porId.get(a.id)
    if (!previa || (a.modificado || '') >= (previa.modificado || '')) porId.set(a.id, a)
  }
  const actividades = [...porId.values()].sort((x, y) => x.creado.localeCompare(y.creado))
  const conflicto = local.nombre !== remote.nombre || local.fechaInicio !== remote.fechaInicio || local.fechaFin !== remote.fechaFin || local.objetivo !== remote.objetivo || local.borrado !== remote.borrado
  const modificado = (local.modificado || '') > (remote.modificado || '') ? local.modificado : remote.modificado
  return { merged: { ...base, actividades, modificado }, conflicto }
}

const fmt = (iso: string) => iso.split('-').reverse().join('/')

/** Informe en Markdown del periodo, para enseñarlo o pegarlo: totales y bitácora por día. */
export function informeRocaMarkdown(r: Roca): string {
  const etiqueta = r.etiquetaActividad || 'Actividades'
  const res = resumenRoca(r)
  const acts = actividadesDelPeriodo(r).reverse()
  const L: string[] = [`# ${r.nombre}`, `Periodo: ${fmt(r.fechaInicio)} – ${fmt(r.fechaFin)}`]
  if (r.descripcion) L.push('', r.descripcion)
  L.push('', `**${etiqueta}: ${res.total}${res.objetivo ? ` de ${res.objetivo} (${res.porcentaje}%)` : ''}** en ${res.dias} día(s) con registro.`)
  let dia = ''
  for (const a of acts) {
    if (a.fecha !== dia) { dia = a.fecha; L.push('', `## ${fmt(dia)}`) }
    L.push(`- ${a.descripcion}${a.solicitante ? ` _(pidió: ${a.solicitante})_` : ''}`)
  }
  if (!acts.length) L.push('', '_Sin registros en el periodo._')
  return L.join('\n') + '\n'
}
