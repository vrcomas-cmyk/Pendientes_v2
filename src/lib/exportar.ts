import type { Pendiente, Nota, Proyecto, EventoCalendario } from '@/types'

// ============================================================================
// Fase 12.1 — Exportación a ICS, Markdown y HTML imprimible.
// ============================================================================

function pad2(n: number): string { return String(n).padStart(2, '0') }

/** Escapa texto para un campo ICS (RFC 5545 §3.3.11): `\`, `;`, `,` y saltos de línea. */
function escaparICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function fechaHoraICS(fecha: string, hora: string): string {
  return fecha.replace(/-/g, '') + 'T' + hora.replace(':', '') + '00'
}
function soloFechaICS(fecha: string): string { return fecha.replace(/-/g, '') }

function dtstampAhora(): string {
  const d = new Date()
  return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) + 'T'
    + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + pad2(d.getUTCSeconds()) + 'Z'
}

function sumarMinutosISO(fecha: string, hora: string, min: number): { fecha: string; hora: string } {
  const d = new Date(fecha + 'T' + hora + ':00')
  d.setMinutes(d.getMinutes() + min)
  return { fecha: d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()), hora: pad2(d.getHours()) + ':' + pad2(d.getMinutes()) }
}

/** Un VEVENT por pendiente agendado (fecha + hora) o de fecha completa (solo fecha), y uno por
    cada evento de calendario suelto. `DTSTAMP`/hora son "floating" (sin zona horaria) — igual que
    hace la mayoría de generadores ICS simples para recordatorios locales, ver `Cambios.md`
    "no quiero IA/infra compleja por ahora". */
export function generarICS(pendientes: Pendiente[], eventos: EventoCalendario[]): string {
  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pendientes Pro//ES', 'CALSCALE:GREGORIAN']

  pendientes.filter(p => !p.borrado && p.fechaLimite).forEach(p => {
    lineas.push('BEGIN:VEVENT', 'UID:pendiente-' + p.id + '@pendientespro', 'DTSTAMP:' + dtstampAhora())
    if (p.hora) {
      const fin = sumarMinutosISO(p.fechaLimite, p.hora, p.duracionMin || 30)
      lineas.push('DTSTART:' + fechaHoraICS(p.fechaLimite, p.hora), 'DTEND:' + fechaHoraICS(fin.fecha, fin.hora))
    } else {
      const [a, m, d] = p.fechaLimite.split('-').map(Number)
      const fin = new Date(a, m - 1, d + 1)
      lineas.push('DTSTART;VALUE=DATE:' + soloFechaICS(p.fechaLimite), 'DTEND;VALUE=DATE:' + soloFechaICS(fin.getFullYear() + '-' + pad2(fin.getMonth() + 1) + '-' + pad2(fin.getDate())))
    }
    lineas.push('SUMMARY:' + escaparICS(p.titulo))
    if (p.descripcion) lineas.push('DESCRIPTION:' + escaparICS(p.descripcion))
    lineas.push('END:VEVENT')
  })

  eventos.filter(e => !e.borrado).forEach(e => {
    const fin = sumarMinutosISO(e.fecha, e.hora, e.duracionMin || 30)
    lineas.push(
      'BEGIN:VEVENT', 'UID:evento-' + e.id + '@pendientespro', 'DTSTAMP:' + dtstampAhora(),
      'DTSTART:' + fechaHoraICS(e.fecha, e.hora), 'DTEND:' + fechaHoraICS(fin.fecha, fin.hora),
      'SUMMARY:' + escaparICS(e.titulo),
    )
    if (e.descripcion) lineas.push('DESCRIPTION:' + escaparICS(e.descripcion))
    lineas.push('END:VEVENT')
  })

  lineas.push('END:VCALENDAR')
  return lineas.join('\r\n')
}

/** Checklist en Markdown, agrupado por prioridad — sirve para pegar en cualquier lado que
    entienda Markdown (issues de GitHub, Notion, un correo). */
export function generarMarkdown(pendientes: Pendiente[], notas: Nota[], proyectos: Proyecto[]): string {
  const activos = pendientes.filter(p => !p.borrado && !p.archivado)
  const porPrioridad = (prio: string) => activos.filter(p => p.prioridad === prio)
  const nombreProyecto = (p: Pendiente) => p.proyectoId ? proyectos.find(pr => pr.id === p.proyectoId)?.nombre : p.proyecto || null

  const lineas: string[] = [`# Pendientes Pro — exportado ${new Date().toLocaleDateString('es-MX')}`, '']
  lineas.push('## Pendientes', '')
  for (const prio of ['Alta', 'Media', 'Baja']) {
    const items = porPrioridad(prio)
    if (!items.length) continue
    lineas.push(`### ${prio}`, '')
    items.forEach(p => {
      const proy = nombreProyecto(p)
      const partes = [p.fechaLimite ? `vence ${p.fechaLimite}` : null, proy ? `#${proy}` : null].filter(Boolean)
      lineas.push(`- [${p.fechaCompletado ? 'x' : ' '}] ${p.titulo}${partes.length ? ' (' + partes.join(', ') + ')' : ''}`)
    })
    lineas.push('')
  }

  const notasActivas = notas.filter(n => !n.borrado)
  if (notasActivas.length) {
    lineas.push('## Notas', '')
    notasActivas.forEach(n => {
      lineas.push(`### ${n.titulo}`, '')
      lineas.push(n.contenidoHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), '')
    })
  }
  return lineas.join('\n')
}

/** HTML autocontenido pensado para imprimir (Ctrl+P) — sin CSS externo, sin JS, agrupado igual
    que el Markdown para que ambos exports cuenten la misma historia. */
export function generarHTMLImprimible(pendientes: Pendiente[], proyectos: Proyecto[]): string {
  const activos = pendientes.filter(p => !p.borrado && !p.archivado)
  const nombreProyecto = (p: Pendiente) => p.proyectoId ? proyectos.find(pr => pr.id === p.proyectoId)?.nombre : p.proyecto || null
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const filas = (prio: string) => activos.filter(p => p.prioridad === prio).map(p => {
    const proy = nombreProyecto(p)
    const hecho = !!p.fechaCompletado
    return `<tr class="${hecho ? 'hecho' : ''}"><td>${hecho ? '☑' : '☐'}</td><td>${esc(p.titulo)}</td><td>${esc(proy || '')}</td><td>${p.fechaLimite || ''}</td></tr>`
  }).join('')

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Pendientes Pro — exportado</title>
<style>
  body { font-family: system-ui, sans-serif; color: #1a1a1a; margin: 2rem; }
  h1 { font-size: 1.3rem; } h2 { font-size: 1rem; margin-top: 1.5rem; border-bottom: 1px solid #ddd; padding-bottom: .25rem; }
  table { width: 100%; border-collapse: collapse; font-size: .85rem; margin-top: .5rem; }
  td { padding: .3rem .4rem; border-bottom: 1px solid #eee; }
  tr.hecho td { color: #888; text-decoration: line-through; }
  @media print { body { margin: 0.5in; } }
</style></head><body>
<h1>Pendientes Pro — exportado ${new Date().toLocaleDateString('es-MX')}</h1>
${['Alta', 'Media', 'Baja'].map(prio => {
  const f = filas(prio)
  return f ? `<h2>${prio}</h2><table><tbody>${f}</tbody></table>` : ''
}).join('')}
</body></html>`
}
