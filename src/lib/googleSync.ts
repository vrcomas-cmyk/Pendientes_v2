import { sincronizarEventosGoogle, type EventoGCal, type RespuestaSync } from '@/lib/googleCalendar'

const DIA = 86400000
/** Ventana de la sincronización completa: Google fija el alcance al pedir el primer `syncToken`. */
export const VENTANA_ANTES_DIAS = 60
export const VENTANA_DESPUES_DIAS = 400

export type CacheGoogle = Map<string, EventoGCal>

const clave = (cuentaId: string, id: string) => cuentaId + '/' + id

/** Aplica una respuesta incremental a la copia local (función pura sobre el mapa recibido):
    las cuentas con sync completa se vacían primero; las canceladas se eliminan (tombstones). */
export function aplicarCambios(cache: CacheGoogle, resp: Pick<RespuestaSync, 'cambios' | 'completos' | 'leidas'>): CacheGoogle {
  const sig: CacheGoogle = new Map(cache)
  // Cuentas que ya no se leen (dirección «solo enviar» o desconectadas): sus eventos salen de la copia.
  if (resp.leidas) { const leidas = new Set(resp.leidas); for (const [k, e] of sig) if (!leidas.has(e.cuentaId)) sig.delete(k) }
  const completas = new Set(resp.completos)
  if (completas.size) for (const [k, e] of sig) if (completas.has(e.cuentaId)) sig.delete(k)
  for (const c of resp.cambios) {
    const k = clave(c.cuentaId, c.id)
    if (c.cancelado) { sig.delete(k); continue }
    sig.set(k, { id: c.id, cuentaId: c.cuentaId, email: c.email, titulo: c.titulo ?? '(sin título)', inicio: c.inicio, fin: c.fin, todoElDia: !!c.todoElDia, uid: c.uid, ocupado: c.ocupado })
  }
  return sig
}

/** Eventos de Google de un día según la copia en memoria (vacío si aún no se ha sincronizado). Sirve
    para avisar de cruces en formularios sin hacer una petición nueva. */
export function googleDelDia(fecha: string): EventoGCal[] {
  return enRango(cache, new Date(fecha + 'T00:00:00').toISOString(), new Date(fecha + 'T23:59:59').toISOString())
}

/** Eventos de la copia local que tocan [desdeISO, hastaISO]. */
export function enRango(cache: CacheGoogle, desdeISO: string, hastaISO: string): EventoGCal[] {
  const d = new Date(desdeISO).getTime(), h = new Date(hastaISO).getTime()
  return [...cache.values()].filter(e => {
    if (!e.inicio) return false
    const ini = e.todoElDia ? new Date(e.inicio + 'T00:00:00').getTime() : new Date(e.inicio).getTime()
    const fin = e.fin ? (e.todoElDia ? new Date(e.fin + 'T00:00:00').getTime() : new Date(e.fin).getTime()) : ini
    return ini <= h && Math.max(fin, ini + 1) > d
  })
}

/** Los tokens viven SOLO en memoria, igual que la copia: si se persistieran, al recargar la página
    se pediría un delta sin tener la copia base y faltarían eventos. Cada carga hace una sync completa. */
let tokens: Record<string, string> = {}

export function ventanaSync(ahora = Date.now()): { desde: string; hasta: string } {
  return { desde: new Date(ahora - VENTANA_ANTES_DIAS * DIA).toISOString(), hasta: new Date(ahora + VENTANA_DESPUES_DIAS * DIA).toISOString() }
}

let cache: CacheGoogle = new Map()
let ultimaVentana: { desde: string; hasta: string } | null = null

type ResultadoSync = { eventos: CacheGoogle; errores?: Record<string, string>; ventana: { desde: string; hasta: string } }

let enCurso: Promise<ResultadoSync> | null = null
let ultimoOk = 0
let sinSoporteDesde = 0
const EDAD_MAX_MS = 15_000          // dentro de este margen se reutiliza la copia sin pedir nada al servidor
const REINTENTO_SIN_SOPORTE_MS = 5 * 60_000

/** ¿Ya hay una copia completa en memoria? Si no, la primera sincronización baja toda la ventana
    (−60/+400 días) y tarda; la UI debe pintar rápido por rango mientras esta se calienta. */
export function cacheCaliente(): boolean { return ultimoOk > 0 }

async function ejecutarSync(): Promise<ResultadoSync> {
  const ventana = ultimaVentana ?? ventanaSync()
  const tokensPrevios = tokens
  const resp = await sincronizarEventosGoogle(tokensPrevios, ventana.desde, ventana.hasta)
  if (!resp || !Array.isArray(resp.cambios)) throw new Error('Respuesta de sincronización inválida')
  ultimaVentana = ventana
  cache = aplicarCambios(cache, resp)
  // Cuentas con error conservan su token anterior; las desconectadas se descartan al no venir.
  const sig: Record<string, string> = {}
  for (const [id, t] of Object.entries(tokensPrevios)) if (t && resp.errores?.[id]) sig[id] = t
  tokens = Object.assign(sig, resp.tokens)
  ultimoOk = Date.now()
  return { eventos: cache, errores: resp.errores, ventana }
}

/** Trae los cambios desde la última sincronización y devuelve la copia completa. Varias llamadas
    simultáneas (calendario + panel lateral) comparten UNA sola petición; dentro de `EDAD_MAX_MS`
    se reutiliza la copia; si el servidor no soporta la acción (función sin redesplegar) falla al
    instante durante unos minutos para que el llamador use el listado por rango sin esperar. */
export async function sincronizarIncremental(): Promise<ResultadoSync> {
  if (enCurso) return enCurso
  if (ultimoOk && Date.now() - ultimoOk < EDAD_MAX_MS) return { eventos: cache, ventana: ultimaVentana ?? ventanaSync() }
  if (sinSoporteDesde && Date.now() - sinSoporteDesde < REINTENTO_SIN_SOPORTE_MS) throw new Error('Sincronización incremental no disponible')
  enCurso = ejecutarSync()
    .catch(err => { if (!ultimoOk) sinSoporteDesde = Date.now(); throw err })
    .finally(() => { enCurso = null })
  return enCurso
}

/** Reinicia la copia en memoria y los tokens (p. ej. al desconectar una cuenta). */
export function reiniciarSyncGoogle() { cache = new Map(); ultimaVentana = null; tokens = {}; ultimoOk = 0; enCurso = null; sinSoporteDesde = 0 }
