/** Respaldo automático en IndexedDB: una segunda copia de TUS datos que sobrevive a `localStorage.clear()`
    (que otra app en el mismo origen/puerto, una limpieza del navegador o un fallo podrían ejecutar). Es una
    red de seguridad: nunca restaura sola, solo ofrece restaurar cuando detecta que faltan datos. */

export const COLECCIONES = ['pendientes', 'notas', 'proyectos', 'eventos', 'espacios', 'contactos', 'metas', 'rocas', 'etiquetas', 'plantillas', 'filtrosGuardados'] as const
export type Coleccion = (typeof COLECCIONES)[number]
export type Datos = Partial<Record<Coleccion, unknown[]>>
export type Conteo = Partial<Record<Coleccion, number>>

export interface Snapshot { id: string; fecha: string; conteo: Conteo; datos: Datos & { usuario?: string } }

/** Elementos vivos (sin los borrados a la papelera) por colección. */
export function contar(datos: Datos): Conteo {
  const c: Conteo = {}
  for (const k of COLECCIONES) c[k] = (datos[k] ?? []).filter(x => !(x as { borrado?: boolean })?.borrado).length
  return c
}
export const total = (c: Conteo): number => COLECCIONES.reduce((n, k) => n + (c[k] ?? 0), 0)

/** ¿Guardar el estado actual como respaldo «actual»? No si está vacío ni si perdió más de la mitad respecto
    al último respaldo: esa caída sospechosa se conserva intacta para poder restaurarla. */
export function debeGuardar(actual: Conteo, ultimo?: Conteo): boolean {
  const ta = total(actual)
  if (ta === 0) return false
  const tu = ultimo ? total(ultimo) : 0
  return !(tu > 0 && ta < tu * 0.5)
}

export interface Faltante { coleccion: Coleccion; antes: number; ahora: number }
/** Colecciones donde el respaldo tiene bastante más que lo que hay ahora (vacía, o menos de la mitad). */
export function faltantes(actual: Conteo, respaldo: Conteo): Faltante[] {
  const f: Faltante[] = []
  for (const k of COLECCIONES) {
    const antes = respaldo[k] ?? 0, ahora = actual[k] ?? 0
    if (antes > 0 && (ahora === 0 || ahora < antes * 0.5)) f.push({ coleccion: k, antes, ahora })
  }
  return f
}

const NOMBRES: Record<Coleccion, string> = {
  pendientes: 'pendientes', notas: 'notas', proyectos: 'proyectos', eventos: 'eventos', espacios: 'espacios', contactos: 'contactos',
  metas: 'metas', rocas: 'rocas', etiquetas: 'etiquetas', plantillas: 'plantillas', filtrosGuardados: 'filtros guardados',
}
export const describirFaltantes = (f: Faltante[]): string => f.map(x => `${x.antes} ${NOMBRES[x.coleccion]}`).join(', ')

/* ---- IndexedDB (todo opcional: si no existe o falla, el respaldo simplemente no actúa) ---- */
const DB = 'pendientes-pro-respaldo'
const STORE = 'snapshots'
const MAX_DIARIOS = 7

function abrir(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const req = indexedDB.open(DB, 1)
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: 'id' }) }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch { resolve(null) }
  })
}
const pedir = <T,>(r: IDBRequest<T>): Promise<T | undefined> => new Promise(res => { r.onsuccess = () => res(r.result); r.onerror = () => res(undefined) })

export async function leerSnapshots(): Promise<Snapshot[]> {
  const db = await abrir()
  if (!db) return []
  try {
    const todos = (await pedir(db.transaction(STORE).objectStore(STORE).getAll())) as Snapshot[] | undefined
    return (todos ?? []).sort((a, b) => b.fecha.localeCompare(a.fecha))
  } catch { return [] } finally { db.close() }
}

/** Guarda el respaldo «actual» y el del día (se conservan los últimos 7 días). Devuelve false si no pudo. */
export async function guardarSnapshot(datos: Datos & { usuario?: string }, ahora = new Date()): Promise<boolean> {
  const db = await abrir()
  if (!db) return false
  try {
    const fecha = ahora.toISOString()
    const base = { fecha, conteo: contar(datos), datos }
    const dia = `dia-${fecha.slice(0, 10)}`
    const tx = db.transaction(STORE, 'readwrite')
    const st = tx.objectStore(STORE)
    st.put({ id: 'actual', ...base })
    st.put({ id: dia, ...base })
    const ids = ((await pedir(st.getAllKeys())) as string[] | undefined ?? []).filter(k => String(k).startsWith('dia-')).sort()
    for (const k of ids.slice(0, Math.max(0, ids.length - MAX_DIARIOS))) st.delete(k)
    await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error) })
    return true
  } catch { return false } finally { db.close() }
}
