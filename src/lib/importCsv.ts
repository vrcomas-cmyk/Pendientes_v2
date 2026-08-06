import type { Prioridad } from '@/types'

/** Parser CSV mínimo (RFC 4180: comillas dobles, comas y saltos de línea dentro de campos
    entrecomillados, `""` como comilla escapada). No usa librerías externas — el formato es
    simple y así se evita una dependencia nueva para algo que cabe en ~25 líneas. */
export function parsearCSV(texto: string): string[][] {
  const filas: string[][] = []
  let fila: string[] = []
  let campo = ''
  let enComillas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++ } else { enComillas = false }
      } else campo += c
    } else if (c === '"') enComillas = true
    else if (c === ',') { fila.push(campo); campo = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(campo); campo = ''
      if (fila.some(x => x !== '')) filas.push(fila)
      fila = []
    } else campo += c
  }
  if (campo || fila.length) { fila.push(campo); if (fila.some(x => x !== '')) filas.push(fila) }
  return filas
}

export interface FilaImportada {
  titulo: string
  descripcion?: string
  responsable?: string
  solicitante?: string
  prioridad: Prioridad
  fechaLimite?: string
  proyecto?: string
}

export type FormatoCSV = 'propio' | 'todoist' | 'generico'

/** Detecta si el CSV es el que produce nuestro propio "Exportar CSV" (roundtrip), uno exportado
    de Todoist (columna `CONTENT` es su firma), o un CSV genérico de origen desconocido. */
export function detectarFormato(headers: string[]): FormatoCSV {
  const h = headers.map(x => x.trim().toLowerCase())
  if (h.includes('titulo') && h.includes('prioridad')) return 'propio'
  if (h.includes('content')) return 'todoist'
  return 'generico'
}

function normalizarFecha(v: string): string {
  if (!v) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/) // MM/DD/YYYY, formato común de exports US
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  return ''
}

// Prioridad en el CSV de Todoist: 1 = P1 (más urgente) ... 4 = P4 (sin prioridad).
const PRIORIDAD_TODOIST: Record<string, Prioridad> = { '1': 'Alta', '2': 'Media', '3': 'Baja', '4': 'Baja' }

/** Mapea filas crudas (ya separadas por `parsearCSV`) a `FilaImportada` según el formato
    detectado. Filas sin título se descartan (no tiene sentido crear un pendiente vacío). */
export function mapearFilas(headers: string[], filas: string[][], formato: FormatoCSV): FilaImportada[] {
  const idx = (nombre: string) => headers.findIndex(h => h.trim().toLowerCase() === nombre)

  if (formato === 'propio') {
    const iTitulo = idx('titulo'), iSol = idx('solicitante'), iResp = idx('responsable'), iPrio = idx('prioridad'),
      iFecha = idx('fechalimite'), iProy = idx('proyecto'), iDesc = idx('descripcion')
    return filas
      .map(f => ({
        titulo: f[iTitulo] || '', solicitante: f[iSol] || undefined, responsable: f[iResp] || undefined,
        prioridad: (['Alta', 'Media', 'Baja'].includes(f[iPrio]) ? f[iPrio] : 'Media') as Prioridad,
        fechaLimite: normalizarFecha(f[iFecha] || ''), proyecto: f[iProy] || undefined, descripcion: f[iDesc] || undefined,
      }))
      .filter(r => r.titulo.trim())
  }

  if (formato === 'todoist') {
    const iType = idx('type'), iContent = idx('content'), iDesc = idx('description'), iPrio = idx('priority'), iDate = idx('date'), iResp = idx('responsible')
    return filas
      .filter(f => iType < 0 || (f[iType] || 'task').toLowerCase() === 'task') // Todoist también exporta filas de secciones/proyecto
      .map(f => ({
        titulo: f[iContent] || '', descripcion: f[iDesc] || undefined, responsable: f[iResp] || undefined,
        prioridad: PRIORIDAD_TODOIST[f[iPrio]] || 'Media',
        fechaLimite: normalizarFecha(f[iDate] || ''),
      }))
      .filter(r => r.titulo.trim())
  }

  // Genérico: sin cabeceras reconocidas, se asume que la primera columna es el título.
  return filas.map(f => ({ titulo: f[0] || '', prioridad: 'Media' as Prioridad })).filter(r => r.titulo.trim())
}
