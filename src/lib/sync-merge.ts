import type { Nota, Pendiente, Proyecto } from '@/types'

export interface ItemBase { id: string; modificado: string }
export type MapaSync = Record<string, string>

export function unionBy<T>(arr: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const it of arr) { const k = key(it); if (!seen.has(k)) { seen.add(k); out.push(it) } }
  return out
}

const CAMPOS_ESCALARES: (keyof Pendiente)[] = ['titulo', 'descripcion', 'estado', 'prioridad', 'responsable', 'solicitante', 'fechaLimite', 'hora', 'proyecto', 'repetir', 'duracionMin', 'ponderacion', 'modalidad']
// `googleEventos` (mapa cuentaId -> eventId) no es un campo escalar comparable: no se incluye
// aquí ni se une a mano — al no ser información que el usuario edite a propósito, basta con que
// "gane" el lado más reciente, que es justo lo que hace `merged = {...newer}` más abajo.

/** Fusiona dos versiones del mismo pendiente sin perder comentarios ni adjuntos. */
export function mergePendiente(local: Pendiente, remote: Pendiente): { merged: Pendiente; conflicto: boolean } {
  const localNewer = (local.modificado || '') >= (remote.modificado || '')
  const newer = localNewer ? local : remote
  const merged: Pendiente = { ...newer }
  // Historial y colecciones: nunca se pierden -> unión + ORDEN DETERMINISTA
  // (el orden idéntico en ambos dispositivos evita re-sincronización infinita)
  merged.comentarios = unionBy([...(local.comentarios || []), ...(remote.comentarios || [])], c => c.id || (c.fecha + '|' + c.autor + '|' + c.texto))
    .sort((a, b) => (a.fecha + '|' + a.texto) < (b.fecha + '|' + b.texto) ? -1 : 1)
  merged.adjuntos = unionBy([...(local.adjuntos || []), ...(remote.adjuntos || [])], a => a.id)
    .sort((a, b) => a.id < b.id ? -1 : 1)
  const subNuevo = localNewer ? local.subtareas : remote.subtareas
  const subViejo = localNewer ? remote.subtareas : local.subtareas
  // Unión "más reciente primero": determinista entre dispositivos y conserva el orden del usuario
  merged.subtareas = unionBy([...(subNuevo || []), ...(subViejo || [])], s => s.id)
  merged.etiquetas = [...new Set([...(local.etiquetas || []), ...(remote.etiquetas || [])])].sort()
  merged.modificado = (local.modificado || '') > (remote.modificado || '') ? local.modificado : remote.modificado
  // ¿Ambos tocaron campos escalares de forma distinta? -> hubo conflicto (se resolvió por más reciente)
  const conflicto = CAMPOS_ESCALARES.some(c => (local[c] ?? '') !== (remote[c] ?? ''))
  return { merged, conflicto }
}

export function mergeNota(local: Nota, remote: Nota): { merged: Nota; conflicto: boolean } {
  const localNewer = (local.modificado || '') >= (remote.modificado || '')
  const conflicto = local.contenidoHTML !== remote.contenidoHTML || local.titulo !== remote.titulo
  return { merged: localNewer ? local : remote, conflicto }
}

export function mergeProyecto(local: Proyecto, remote: Proyecto): { merged: Proyecto; conflicto: boolean } {
  const localNewer = (local.modificado || '') >= (remote.modificado || '')
  const conflicto = local.nombre !== remote.nombre || local.color !== remote.color || local.cuentaGoogleId !== remote.cuentaGoogleId
  return { merged: localNewer ? local : remote, conflicto }
}

function sinVolatil<T extends ItemBase>(x: T): string {
  const clon = { ...x } as Record<string, unknown>
  delete clon.modificado
  return JSON.stringify(clon)
}
export function contenidoIgual<T extends ItemBase>(a: T, b: T): boolean {
  return sinVolatil(a) === sinVolatil(b)
}

export interface ResultadoReconcilia<T> {
  resultado: T[]
  nextLast: MapaSync
  conflictos: string[]
}

/**
 * Combina el estado local con el de la nube según el último estado sincronizado.
 * Maneja: edición concurrente, altas locales sin subir, y borrados de ambos lados.
 */
export function reconciliar<T extends ItemBase>(
  local: T[],
  remote: T[],
  last: MapaSync,
  merge: (l: T, r: T) => { merged: T; conflicto: boolean },
  /**
   * Devuelve `true` si el id se acaba de subir a la nube y todavía puede no
   * reflejarse en una lectura (read-after-write lag). Esos ítems NUNCA se
   * tratan como borrado remoto, para no perder pendientes recién creados.
   */
  protegido?: (id: string) => boolean,
): ResultadoReconcilia<T> {
  const mapL = new Map(local.map(x => [x.id, x]))
  const mapR = new Map(remote.map(x => [x.id, x]))
  const ids = new Set<string>([...mapL.keys(), ...mapR.keys()])
  const resultado: T[] = []
  const nextLast: MapaSync = {}
  const conflictos: string[] = []

  for (const id of ids) {
    const l = mapL.get(id)
    const r = mapR.get(id)
    const conocido = last[id] !== undefined

    if (l && r) {
      const dirtyAntes = !conocido || l.modificado !== last[id]
      const cambioRemoto = !conocido || r.modificado !== last[id]
      const { merged, conflicto } = merge(l, r)
      resultado.push(merged)
      if (contenidoIgual(merged, r)) nextLast[id] = r.modificado // ya igual a la nube
      // si no, queda "sucio" (fuera de nextLast) y flush lo reenvía
      if (conflicto && dirtyAntes && cambioRemoto && conocido) conflictos.push(id)
    } else if (r && !l) {
      if (conocido) {
        // lo borramos localmente y aún sigue en la nube -> conservar marca para que flush lo borre allá
        nextLast[id] = last[id]
      } else {
        // alta remota nueva -> traerla
        resultado.push(r)
        nextLast[id] = r.modificado
      }
    } else if (l && !r) {
      if (conocido) {
        const dirty = l.modificado !== last[id]
        if (dirty) resultado.push(l) // editado local tras borrado remoto -> gana la edición y se re-sube
        else if (protegido?.(id)) { resultado.push(l); nextLast[id] = last[id] } // ausencia incierta (lag / recién subido): conservar SIN re-subir ni borrar hasta confirmar
        // si no estaba sucio ni protegido: aceptar borrado remoto (no se agrega, no entra a nextLast)
      } else {
        resultado.push(l) // alta local aún no subida
      }
    }
  }
  return { resultado, nextLast, conflictos }
}
