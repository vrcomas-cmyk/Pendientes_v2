import type { Nota, Pendiente, Proyecto, EventoCalendario, Espacio, Contacto } from '@/types'

export interface ItemBase { id: string; modificado: string }
export type MapaSync = Record<string, string>

export function unionBy<T>(arr: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const it of arr) { const k = key(it); if (!seen.has(k)) { seen.add(k); out.push(it) } }
  return out
}

// `proyectoId` está en la lista (no solo `proyecto`, el nombre-espejo): sin él, mover una tarea
// de proyecto en dos dispositivos a la vez no se detectaba como conflicto y la asignación más
// vieja se perdía sin avisar al usuario (ver AUDITORIA/CHANGELOG, reparación de pertenencia).
const CAMPOS_ESCALARES: (keyof Pendiente)[] = ['titulo', 'descripcion', 'estado', 'prioridad', 'responsable', 'solicitante', 'fechaLimite', 'hora', 'proyecto', 'proyectoId', 'repetir', 'duracionMin', 'ponderacion', 'modalidad', 'archivado', 'borrado']
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
  const merged: Nota = { ...(localNewer ? local : remote) }
  // Fase 7: mismo criterio de unión que `mergePendiente` para los campos que Nota ganó — nunca se
  // pierden comentarios/etiquetas por sincronizar desde otro dispositivo.
  merged.comentarios = unionBy([...(local.comentarios || []), ...(remote.comentarios || [])], c => c.id || (c.fecha + '|' + c.autor + '|' + c.texto))
    .sort((a, b) => (a.fecha + '|' + a.texto) < (b.fecha + '|' + b.texto) ? -1 : 1)
  merged.etiquetas = [...new Set([...(local.etiquetas || []), ...(remote.etiquetas || [])])].sort()
  merged.modificado = (local.modificado || '') > (remote.modificado || '') ? local.modificado : remote.modificado
  return { merged, conflicto }
}

export function mergeProyecto(local: Proyecto, remote: Proyecto): { merged: Proyecto; conflicto: boolean } {
  const localNewer = (local.modificado || '') >= (remote.modificado || '')
  const conflicto = local.nombre !== remote.nombre || local.color !== remote.color || local.cuentaGoogleId !== remote.cuentaGoogleId
  return { merged: localNewer ? local : remote, conflicto }
}

export function mergeEvento(local: EventoCalendario, remote: EventoCalendario): { merged: EventoCalendario; conflicto: boolean } {
  const localNewer = (local.modificado || '') >= (remote.modificado || '')
  const conflicto = local.titulo !== remote.titulo || local.fecha !== remote.fecha || local.hora !== remote.hora || local.duracionMin !== remote.duracionMin
  return { merged: localNewer ? local : remote, conflicto }
}

/** Espacio (contexto de vida del Personal Workspace, ej. "Trabajo"/"Casa" — NO confundir con
    el espacio de cuenta compartida de `sync.tsx`): mismo criterio last-write-wins que
    `mergeProyecto`, sin colecciones que unir. */
export function mergeEspacio(local: Espacio, remote: Espacio): { merged: Espacio; conflicto: boolean } {
  const localNewer = (local.modificado || '') >= (remote.modificado || '')
  const conflicto = local.nombre !== remote.nombre || local.icono !== remote.icono || local.color !== remote.color
  return { merged: localNewer ? local : remote, conflicto }
}

/** Contacto (Fase 1c del plan de Contactos/Equipos, ver workspace-doctrine): mismo criterio
    last-write-wins que `mergeEspacio` — sin colecciones internas que unir todavía. */
export function mergeContacto(local: Contacto, remote: Contacto): { merged: Contacto; conflicto: boolean } {
  const localNewer = (local.modificado || '') >= (remote.modificado || '')
  const conflicto = local.nombre !== remote.nombre || local.email !== remote.email || local.telefono !== remote.telefono || local.color !== remote.color || local.borrado !== remote.borrado
  return { merged: localNewer ? local : remote, conflicto }
}

/** JSON estable: claves ordenadas recursivamente (las matrices conservan su orden) y sin claves `undefined`.
    Postgres `jsonb` NO conserva el orden de las claves, así que comparar con `JSON.stringify` directo hacía que
    un elemento idéntico en local y en la nube pareciera distinto: nunca se marcaba como sincronizado y se
    re-subía en CADA ciclo (cientos de POST por hora), y los borrados de otros dispositivos nunca «pegaban». */
export function jsonEstable(v: unknown): string {
  if (v === undefined) return 'null'
  if (Array.isArray(v)) return '[' + v.map(jsonEstable).join(',') + ']'
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return '{' + Object.keys(o).filter(k => o[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + jsonEstable(o[k])).join(',') + '}'
  }
  return JSON.stringify(v)
}

function sinVolatil<T extends ItemBase>(x: T): string {
  const clon = { ...x } as Record<string, unknown>
  delete clon.modificado
  return jsonEstable(clon)
}
export function contenidoIgual<T extends ItemBase>(a: T, b: T): boolean {
  return sinVolatil(a) === sinVolatil(b)
}

export interface ResultadoReconcilia<T> {
  resultado: T[]
  nextLast: MapaSync
  conflictos: string[]
}

/** Circuito de seguridad contra purga masiva (H12, incidente real: ~60 pendientes ya
 * sincronizados desaparecieron de golpe de Supabase por una lectura fallida — no un
 * borrado real — y `pull()` los purgó también en local tras 2 ausencias consecutivas.
 * Un borrado legítimo del usuario suele ser de a uno o pocos ítems a la vez; que MUCHOS
 * ids ya conocidos (sincronizados antes, `last[id] !== undefined`) falten de golpe en la
 * misma lectura es mucho más probable que sea un fallo (sesión, RLS, tabla vacía por
 * error) que ~60 borrados simultáneos. `pull()` usa esto para decidir si esa vuelta debe
 * abstenerse de purgar nada local (ver `protegido` en `reconciliar`). */
export function ausenciasSospechosas(
  local: { id: string }[],
  remoteIds: Set<string>,
  last: MapaSync,
  umbral = 5,
): boolean {
  let ausentes = 0
  for (const it of local) {
    if (last[it.id] !== undefined && !remoteIds.has(it.id)) ausentes++
  }
  return ausentes >= umbral
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
  /**
   * `restaurarActivos`: para colecciones que se borran SIEMPRE con `borrado: true` (pendientes, notas, eventos,
   * contactos, rocas). Si un elemento ya conocido falta en local pero la nube lo tiene ACTIVO (no `borrado`), no
   * se interpreta como «lo borré aquí» (eso lo haría borrarlo de la nube y otro dispositivo lo volvería a subir:
   * el vaivén de «aparece y desaparece»); se trae de vuelta. Solo se borra físicamente lo que ya está en la
   * papelera (`borrado: true`).
   */
  opciones?: { restaurarActivos?: boolean },
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
      if (conocido && opciones?.restaurarActivos && !(r as { borrado?: boolean }).borrado) {
        // faltaba en local pero en la nube sigue activo: restaurarlo en vez de borrarlo de la nube
        resultado.push(r)
        nextLast[id] = r.modificado
      } else if (conocido) {
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
        if (opciones?.restaurarActivos && !(l as { borrado?: boolean }).borrado) {
          // Un elemento ACTIVO nunca se borra físicamente en estas colecciones (se manda a la papelera con
          // `borrado`): que falte en la nube es una pérdida de la nube, no un borrado. Se conserva y se re-sube.
          resultado.push(l)
        } else if (dirty) resultado.push(l) // editado local tras borrado remoto -> gana la edición y se re-sube
        else if (protegido?.(id)) { resultado.push(l); nextLast[id] = last[id] } // ausencia incierta (lag / recién subido): conservar SIN re-subir ni borrar hasta confirmar
        // si no estaba sucio ni protegido: aceptar borrado remoto (no se agrega, no entra a nextLast)
      } else {
        resultado.push(l) // alta local aún no subida
      }
    }
  }
  return { resultado, nextLast, conflictos }
}

/** Auto-reparación cuando `ausenciasSospechosas` salta: «olvida» (borra de `mapa`) la marca de ya
    sincronizado de cada elemento local que la nube no devolvió, para que el siguiente `flush()` los
    vuelva a subir (upsert idempotente). Devuelve los ids restaurados. Nunca toca los datos locales. */
export function olvidarAusentes(local: { id: string }[], remoteIds: Set<string>, mapa: MapaSync): string[] {
  const ids: string[] = []
  for (const it of local) {
    if (mapa[it.id] !== undefined && !remoteIds.has(it.id)) { delete mapa[it.id]; ids.push(it.id) }
  }
  return ids
}
