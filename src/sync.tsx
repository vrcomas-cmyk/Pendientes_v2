import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { useApp } from '@/store'
import type { Nota, Pendiente, Proyecto, EventoCalendario, ColumnaKanban, Espacio } from '@/types'
import { COLUMNAS_DEFECTO } from '@/types'
import { getConfig, getSupabase, isConfigured, saveConfig } from '@/lib/supabase'
import { mergeNota, mergePendiente, mergeProyecto, mergeEvento, mergeEspacio, reconciliar, ausenciasSospechosas, type MapaSync } from '@/lib/sync-merge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react'

type EstadoSync = 'local' | 'sincronizando' | 'sincronizado' | 'offline' | 'error'
export type RolEspacio = 'padre' | 'hija'
export interface MiembroEspacio { userId: string; email: string; rol: RolEspacio }

interface SyncCtx {
  userId: string | null
  email: string | null
  estado: EstadoSync
  modoLocal: boolean
  enLinea: boolean
  porSubir: number
  espacioId: string | null
  miRol: RolEspacio | null
  miembros: MiembroEspacio[]
  recargarEspacio: () => void
  actualizarColumnas: (cols: ColumnaKanban[]) => void
  logout: () => void
  activarSync: () => void
  sincronizarAhora: () => void
}
const Ctx = createContext<SyncCtx>({
  userId: null, email: null, estado: 'local', modoLocal: true, enLinea: true, porSubir: 0,
  espacioId: null, miRol: null, miembros: [], recargarEspacio: () => {},
  actualizarColumnas: () => {},
  logout: () => {}, activarSync: () => {}, sincronizarAhora: () => {},
})
// eslint-disable-next-line react-refresh/only-export-components -- context hook shared alongside its provider
export const useSync = () => useContext(Ctx)

interface UltimoSync { pendientes: MapaSync; notas: MapaSync; proyectos: MapaSync; eventos: MapaSync; espacios: MapaSync }
const vacio = (): UltimoSync => ({ pendientes: {}, notas: {}, proyectos: {}, eventos: {}, espacios: {} })

/** Ventana (ms) durante la cual un ítem recién subido está protegido de un borrado remoto fantasma por lag de replicación. */
const GRACIA_SUBIDA = 30000

/** ¿Dos listas tienen exactamente el mismo contenido? (sin importar el orden) */
function mismaLista<T extends { id: string }>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false
  const mapa = new Map(a.map(x => [x.id, JSON.stringify(x)]))
  for (const x of b) {
    if (mapa.get(x.id) !== JSON.stringify(x)) return false
  }
  return true
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const app = useApp()
  // Referencia SIEMPRE al día del estado. Los handlers de realtime / intervalo /
  // visibilitychange viven en un efecto con deps [session], así que capturan `app`
  // del login. Sin esta ref, flush() vería una lista vieja de pendientes y borraría
  // de la nube todo lo creado después de iniciar sesión. Ver bug "pendiente eliminado".
  const appRef = useRef(app)
  appRef.current = app
  const [listo, setListo] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [estado, setEstado] = useState<EstadoSync>('local')
  const [enLinea, setEnLinea] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [porSubir, setPorSubir] = useState(0)
  const [modoLocal, setModoLocal] = useState(() => { try { return localStorage.getItem('sb_modo_local') === '1' } catch { return false } })
  const [config, setConfig] = useState(() => isConfigured())
  const [espacioId, setEspacioId] = useState<string | null>(null)
  const [miRol, setMiRol] = useState<RolEspacio | null>(null)
  const [miembros, setMiembros] = useState<MiembroEspacio[]>([])

  const last = useRef<UltimoSync>(vacio())
  const sincronizando = useRef(false)
  const sincPendiente = useRef(false)
  const silenciar = useRef(0)
  // id -> timestamp de la última subida a la nube. Protege contra el
  // read-after-write lag: si leemos la nube justo después de crear/subir un
  // pendiente y aún no aparece, NO lo tratamos como borrado remoto.
  const subidoReciente = useRef<Map<string, number>>(new Map())
  // id -> nº de lecturas remotas CONSECUTIVAS en las que un ítem conocido no
  // apareció. Solo se acepta el borrado tras confirmarlo en 2 lecturas seguidas
  // (una sola ausencia puede ser lag de replicación, no un borrado real).
  const ausenciaP = useRef<Map<string, number>>(new Map())
  const ausenciaN = useRef<Map<string, number>>(new Map())
  const ausenciaPr = useRef<Map<string, number>>(new Map())
  const ausenciaEv = useRef<Map<string, number>>(new Map())
  const ausenciaEsp = useRef<Map<string, number>>(new Map())
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const rtTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Si este dispositivo/navegador tiene el almacenamiento local vacío (perfil nuevo, caché
  // borrada), `store.tsx` siembra 2 tareas de ejemplo antes de que la primera descarga (pull)
  // alcance a traer los datos reales de la nube. Sin esta bandera, el efecto de "subir cambios"
  // podía disparar con esos datos de ejemplo ANTES del primer pull y subirlos como pendientes
  // nuevos — duplicando la semilla en la nube cada vez que alguien abre la app desde un
  // dispositivo/perfil sin datos locales. Se activa una sola vez, al terminar el primer pull.
  const primerPullListo = useRef(false)

  const userId = session?.user?.id || null
  const email = session?.user?.email || null
  const espacioRef = useRef<string | null>(null)
  espacioRef.current = espacioId
  // La marca de "última sincronización" se guarda por ESPACIO, no por cuenta: si cada cuenta de un
  // mismo espacio llevara su propia marca, la reconciliación de sync-merge.ts interpretaría como
  // "borrado remoto" lo que otra cuenta hermana simplemente aún no había subido.
  const claveLast = (eid: string) => 'pnp_lastsync_' + eid

  const cargarLast = (eid: string) => {
    // `{ ...vacio(), ...guardado }` migra espacios que sincronizaron antes de que existiera alguna
    // colección nueva (ej. `proyectos`): sin este merge, esa clave queda `undefined` y el resto del
    // código revienta al hacer `Object.keys(last.current.proyectos)`, cortando la sincronización a
    // medias — un borrado se aplica local pero nunca termina de subirse a la nube.
    try { last.current = { ...vacio(), ...JSON.parse(localStorage.getItem(claveLast(eid)) || '{}') } }
    catch { last.current = vacio() }
  }
  const guardarLast = () => { if (espacioRef.current) { try { localStorage.setItem(claveLast(espacioRef.current), JSON.stringify(last.current)) } catch { /* noop */ } } }

  /** Resuelve el espacio de trabajo del usuario (creándolo como "padre" si es la primera vez) y
      carga la lista de cuentas asociadas. Se ejecuta al iniciar sesión y cuando se invita/canjea/
      quita una cuenta. */
  const cargarEspacio = async (): Promise<string | null> => {
    const sb = getSupabase()
    if (!sb) return null
    const { data: eid, error } = await sb.rpc('pnp_espacio_actual')
    if (error || !eid) { setEspacioId(null); setMiRol(null); setMiembros([]); return null }
    const [{ data: filas }, { data: espacio }] = await Promise.all([
      sb.from('pnp_espacio_miembros').select('user_id, email, rol').eq('espacio_id', eid),
      sb.from('pnp_espacios').select('config').eq('id', eid).single(),
    ])
    const lista: MiembroEspacio[] = (filas || []).map(f => ({ userId: f.user_id as string, email: f.email as string, rol: f.rol as RolEspacio }))
    setEspacioId(eid as string)
    setMiRol(lista.find(m => m.userId === userId)?.rol ?? null)
    setMiembros(lista)
    const colsGuardadas = (espacio?.config as { columnas?: ColumnaKanban[] } | null)?.columnas
    appRef.current.setColumnas(colsGuardadas?.length ? colsGuardadas : COLUMNAS_DEFECTO)
    return eid as string
  }

  /** Refresca solo las columnas del espacio (sin recargar espacio/miembros completos) — la usa el
      handler de realtime cuando otra cuenta del mismo espacio las cambia. */
  const recargarColumnas = async () => {
    const sb = getSupabase()
    if (!sb || !espacioRef.current) return
    const { data } = await sb.from('pnp_espacios').select('config').eq('id', espacioRef.current).single()
    const cols = (data?.config as { columnas?: ColumnaKanban[] } | null)?.columnas
    appRef.current.setColumnas(cols?.length ? cols : COLUMNAS_DEFECTO)
  }

  /** Guarda las columnas del Kanban: en el espacio compartido si hay sincronización activa (así
      todas las cuentas del espacio las ven), o en este dispositivo si se trabaja en modo local.
      `store.tsx` (`appRef`) sigue siendo la única fuente de verdad para renderizar — aquí solo se
      decide DÓNDE persistir, mismo puente que ya usa `reemplazarTodo`. */
  const actualizarColumnas = (cols: ColumnaKanban[]) => {
    // `store.tsx` persiste `columnas` en localStorage por su cuenta (mismo efecto que pendientes/
    // notas/proyectos) — en modo local o sin espacio, con esto ya basta.
    appRef.current.setColumnas(cols)
    if (modoLocal || !espacioRef.current) return
    const sb = getSupabase()
    if (!sb) return
    sb.from('pnp_espacios').update({ config: { columnas: cols } }).eq('id', espacioRef.current)
      .then(({ error }) => { if (error) toast.error('No se pudieron guardar las columnas: ' + error.message) })
  }

  /* ---- sesión + auth ---- */
  useEffect(() => {
    const sb = getSupabase()
    if (!sb) { setListo(true); return } // eslint-disable-line react-hooks/set-state-in-effect -- no Supabase configured, unblock the ready gate immediately
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setListo(true) })
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [config])

  /* ---- al iniciar sesión: resolver espacio, cargar marca y sincronizar ---- */
  useEffect(() => {
    if (!session || !userId) return
    let vivo = true
    cargarEspacio().then(eid => { if (vivo && eid) { cargarLast(eid); sincronizar() } }) // eslint-disable-line react-hooks/set-state-in-effect -- async resolution, not a synchronous render-time setState
    return () => { vivo = false }
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- subir cambios locales (debounce) ---- */
  useEffect(() => {
    if (!session || !primerPullListo.current) return
    recalcularPendientes()
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => { sincronizar() }, 1000)
  }, [app.pendientes, app.notas, app.proyectos, app.eventos, app.espacios]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- online / offline ---- */
  useEffect(() => {
    const on = () => { setEnLinea(true); if (session) sincronizar() }
    const off = () => { setEnLinea(false); setEstado('offline') }
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- realtime + red de seguridad periódica ---- */
  useEffect(() => {
    if (!session) return
    const sb = getSupabase()
    if (!sb) return
    const onRemote = () => {
      if (Date.now() < silenciar.current) return
      clearTimeout(rtTimer.current)
      rtTimer.current = setTimeout(() => sincronizar(), 700)
    }
    const ch = sb.channel('rt-pnp')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pnp_pendientes' }, onRemote)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pnp_notas' }, onRemote)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pnp_proyectos' }, onRemote)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pnp_eventos' }, onRemote)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pnp_ctx_espacios' }, onRemote)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pnp_espacios' }, () => { recargarColumnas() })
      .subscribe()
    const intervalo = setInterval(() => { if (navigator.onLine) sincronizar() }, 60000)
    const onVis = () => { if (document.visibilityState === 'visible' && session) sincronizar() }
    document.addEventListener('visibilitychange', onVis)
    return () => { sb.removeChannel(ch); clearInterval(intervalo); document.removeEventListener('visibilitychange', onVis) }
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  function recalcularPendientes() {
    const L = last.current
    const { pendientes, notas, proyectos, eventos, espacios } = appRef.current
    const dP = pendientes.filter(p => L.pendientes[p.id] !== p.modificado).length
    const localPids = new Set(pendientes.map(p => p.id))
    const delP = Object.keys(L.pendientes).filter(id => !localPids.has(id)).length
    const dN = notas.filter(n => L.notas[n.id] !== n.modificado).length
    const localNids = new Set(notas.map(n => n.id))
    const delN = Object.keys(L.notas).filter(id => !localNids.has(id)).length
    const dPr = proyectos.filter(p => L.proyectos[p.id] !== p.modificado).length
    const localPrids = new Set(proyectos.map(p => p.id))
    const delPr = Object.keys(L.proyectos).filter(id => !localPrids.has(id)).length
    const dEv = eventos.filter(e => L.eventos[e.id] !== e.modificado).length
    const localEvids = new Set(eventos.map(e => e.id))
    const delEv = Object.keys(L.eventos).filter(id => !localEvids.has(id)).length
    const dEsp = espacios.filter(e => L.espacios[e.id] !== e.modificado).length
    const localEspids = new Set(espacios.map(e => e.id))
    const delEsp = Object.keys(L.espacios).filter(id => !localEspids.has(id)).length
    setPorSubir(dP + delP + dN + delN + dPr + delPr + dEv + delEv + dEsp + delEsp)
  }

  async function flush() {
    if (!session || !userId || !espacioRef.current || !navigator.onLine) { if (!navigator.onLine) setEstado('offline'); return }
    const sb = getSupabase()
    if (!sb) return
    const eid = espacioRef.current
    const L = last.current
    const { pendientes, notas, proyectos, eventos, espacios } = appRef.current
    // Defensa: NUNCA borrar de la nube algo subido hace muy poco. Si un ítem
    // recién creado desaparece de la lista local por cualquier carrera de estado,
    // no debe propagarse como borrado. Un borrado real del usuario se aplica igual
    // pasada la ventana de gracia.
    const recienSubido = (id: string) => (subidoReciente.current.get(id) ?? 0) >= Date.now() - GRACIA_SUBIDA
    const dirtyP = pendientes.filter(p => L.pendientes[p.id] !== p.modificado)
    const localPids = new Set(pendientes.map(p => p.id))
    const delP = Object.keys(L.pendientes).filter(id => !localPids.has(id) && !recienSubido(id))
    const dirtyN = notas.filter(n => L.notas[n.id] !== n.modificado)
    const localNids = new Set(notas.map(n => n.id))
    const delN = Object.keys(L.notas).filter(id => !localNids.has(id) && !recienSubido(id))
    const dirtyPr = proyectos.filter(p => L.proyectos[p.id] !== p.modificado)
    const localPrids = new Set(proyectos.map(p => p.id))
    const delPr = Object.keys(L.proyectos).filter(id => !localPrids.has(id) && !recienSubido(id))
    const dirtyEv = eventos.filter(e => L.eventos[e.id] !== e.modificado)
    const localEvids = new Set(eventos.map(e => e.id))
    const delEv = Object.keys(L.eventos).filter(id => !localEvids.has(id) && !recienSubido(id))
    const dirtyEsp = espacios.filter(e => L.espacios[e.id] !== e.modificado)
    const localEspids = new Set(espacios.map(e => e.id))
    const delEsp = Object.keys(L.espacios).filter(id => !localEspids.has(id) && !recienSubido(id))
    if (!dirtyP.length && !delP.length && !dirtyN.length && !delN.length && !dirtyPr.length && !delPr.length && !dirtyEv.length && !delEv.length && !dirtyEsp.length && !delEsp.length) { setEstado('sincronizado'); recalcularPendientes(); return }
    setEstado('sincronizando')
    const ahora = Date.now()
    try {
      if (dirtyP.length) { const { error } = await sb.from('pnp_pendientes').upsert(dirtyP.map(p => ({ id: p.id, user_id: userId, espacio_id: eid, data: p, updated_at: p.modificado }))); if (error) throw error; dirtyP.forEach(p => { L.pendientes[p.id] = p.modificado; subidoReciente.current.set(p.id, ahora) }) }
      // OJO: no se hace `delete L.pendientes[id]` aquí aunque el DELETE haya sido exitoso. Supabase
      // puede tener un breve retraso de lectura-después-de-escritura: un pull() disparado segundos
      // después (por ejemplo por el propio evento realtime de este borrado) a veces todavía ve la
      // fila. Si ya hubiéramos olvidado el id aquí, ese pull() lo trataría como "alta remota nueva"
      // y lo resucitaría. Dejar el id en `L.pendientes` mantiene `conocido = true` en reconciliar(),
      // así que una lectura fantasma sigue tratándose como "borrado pendiente de confirmar" — el
      // propio pull() lo limpia solo de `L.pendientes` en cuanto la nube confirme que ya no existe.
      if (delP.length) { const { error } = await sb.from('pnp_pendientes').delete().in('id', delP); if (error) throw error; delP.forEach(id => { subidoReciente.current.delete(id) }) }
      if (dirtyN.length) { const { error } = await sb.from('pnp_notas').upsert(dirtyN.map(n => ({ id: n.id, user_id: userId, espacio_id: eid, data: n, updated_at: n.modificado }))); if (error) throw error; dirtyN.forEach(n => { L.notas[n.id] = n.modificado; subidoReciente.current.set(n.id, ahora) }) }
      if (delN.length) { const { error } = await sb.from('pnp_notas').delete().in('id', delN); if (error) throw error; delN.forEach(id => { subidoReciente.current.delete(id) }) }
      if (dirtyPr.length) { const { error } = await sb.from('pnp_proyectos').upsert(dirtyPr.map(p => ({ id: p.id, user_id: userId, espacio_id: eid, data: p, updated_at: p.modificado }))); if (error) throw error; dirtyPr.forEach(p => { L.proyectos[p.id] = p.modificado; subidoReciente.current.set(p.id, ahora) }) }
      if (delPr.length) { const { error } = await sb.from('pnp_proyectos').delete().in('id', delPr); if (error) throw error; delPr.forEach(id => { subidoReciente.current.delete(id) }) }
      if (dirtyEv.length) { const { error } = await sb.from('pnp_eventos').upsert(dirtyEv.map(e => ({ id: e.id, user_id: userId, espacio_id: eid, data: e, updated_at: e.modificado }))); if (error) throw error; dirtyEv.forEach(e => { L.eventos[e.id] = e.modificado; subidoReciente.current.set(e.id, ahora) }) }
      if (delEv.length) { const { error } = await sb.from('pnp_eventos').delete().in('id', delEv); if (error) throw error; delEv.forEach(id => { subidoReciente.current.delete(id) }) }
      // `pnp_ctx_espacios` en su propio try/catch, igual que en pull(): si la tabla no
      // existe todavía (migración de H7 no corrida), no debe impedir que pendientes/
      // notas/proyectos/eventos terminen de subir ni que `guardarLast()` se ejecute.
      try {
        if (dirtyEsp.length) { const { error } = await sb.from('pnp_ctx_espacios').upsert(dirtyEsp.map(e => ({ id: e.id, user_id: userId, espacio_id: eid, data: e, updated_at: e.modificado }))); if (error) throw error; dirtyEsp.forEach(e => { L.espacios[e.id] = e.modificado; subidoReciente.current.set(e.id, ahora) }) }
        if (delEsp.length) { const { error } = await sb.from('pnp_ctx_espacios').delete().in('id', delEsp); if (error) throw error; delEsp.forEach(id => { subidoReciente.current.delete(id) }) }
      } catch { /* tabla no provisionada aún: se reintenta en el próximo ciclo, sin bloquear el resto */ }
      guardarLast()
      silenciar.current = Date.now() + 2500
      setEstado('sincronizado')
      recalcularPendientes()
    } catch {
      setEstado(navigator.onLine ? 'error' : 'offline')
    }
  }

  async function pull() {
    if (!session || !navigator.onLine) return
    const sb = getSupabase()
    if (!sb) return
    setEstado('sincronizando')
    try {
      const [{ data: rp, error: ep }, { data: rn, error: en }, { data: rpr, error: epr }, { data: rev, error: eev }] = await Promise.all([
        sb.from('pnp_pendientes').select('data'),
        sb.from('pnp_notas').select('data'),
        sb.from('pnp_proyectos').select('data'),
        sb.from('pnp_eventos').select('data'),
      ])
      if (ep || en || epr || eev) throw (ep || en || epr || eev)
      // `pnp_ctx_espacios` se pide APARTE y con su propio try/catch: es una tabla nueva
      // (H7) que puede no existir todavía si el proyecto de Supabase no corrió la última
      // versión de `supabase_setup.sql`. Si fallara dentro del `Promise.all` de arriba,
      // un solo error tumbaría el pull ENTERO — pendientes/notas/proyectos/eventos
      // dejarían de bajar de la nube por culpa de una tabla que ni siquiera es crítica
      // todavía. Con esto, sin la tabla, Espacios simplemente no sincroniza (como antes
      // de H7) y el resto sigue funcionando.
      let remoteEsp: Espacio[] = []
      try {
        const { data: resp, error: eesp } = await sb.from('pnp_ctx_espacios').select('data')
        if (eesp) throw eesp
        remoteEsp = (resp || []).map(r => (r as { data: Espacio }).data)
      } catch { /* tabla no provisionada aún: se reintenta en el próximo ciclo */ }
      // A partir de aquí ya tenemos el estado real de la nube: recién ahora es seguro dejar que
      // el efecto de "subir cambios" empiece a operar (ver comentario en `primerPullListo`).
      primerPullListo.current = true
      const remoteP = (rp || []).map(r => (r as { data: Pendiente }).data)
      const remoteN = (rn || []).map(r => (r as { data: Nota }).data)
      const remotePr = (rpr || []).map(r => (r as { data: Proyecto }).data)
      const remoteEv = (rev || []).map(r => (r as { data: EventoCalendario }).data)
      const L = last.current
      const limite = Date.now() - GRACIA_SUBIDA
      // Purga entradas viejas para que el mapa no crezca sin límite.
      subidoReciente.current.forEach((t, id) => { if (t < limite) subidoReciente.current.delete(id) })
      const remotePids = new Set(remoteP.map(p => p.id))
      const remoteNids = new Set(remoteN.map(n => n.id))
      const remotePrids = new Set(remotePr.map(p => p.id))
      const remoteEvids = new Set(remoteEv.map(e => e.id))
      const remoteEspids = new Set(remoteEsp.map(e => e.id))
      // Cuenta ausencias remotas consecutivas de ítems conocidos; resetea si reaparecen.
      const contarAusencias = (local: { id: string }[], remoteIds: Set<string>, lastMap: MapaSync, cont: Map<string, number>) => {
        const vivos = new Set(local.map(x => x.id))
        cont.forEach((_n, id) => { if (!vivos.has(id) || remoteIds.has(id)) cont.delete(id) })
        for (const it of local) {
          if (lastMap[it.id] !== undefined && !remoteIds.has(it.id)) cont.set(it.id, (cont.get(it.id) ?? 0) + 1)
          else cont.delete(it.id)
        }
      }
      const { pendientes, notas, proyectos, eventos, espacios, reemplazarTodo } = appRef.current
      // Circuito de seguridad (H12, incidente real: ~60 pendientes ya sincronizados
      // desaparecieron de golpe de Supabase por un fallo de lectura —no un borrado real—
      // y se purgaron también en local). Si de golpe faltan muchos ids ya conocidos, la
      // colección entera queda protegida este ciclo: no se cuenta ausencia (no avanza el
      // reloj de "2 ausencias") ni se purga nada, y se avisa al usuario.
      const sospechosoP = ausenciasSospechosas(pendientes, remotePids, L.pendientes)
      const sospechosoN = ausenciasSospechosas(notas, remoteNids, L.notas)
      const sospechosoPr = ausenciasSospechosas(proyectos, remotePrids, L.proyectos)
      const sospechosoEv = ausenciasSospechosas(eventos, remoteEvids, L.eventos)
      const sospechosoEsp = ausenciasSospechosas(espacios, remoteEspids, L.espacios)
      if (sospechosoP || sospechosoN || sospechosoPr || sospechosoEv || sospechosoEsp) {
        toast.warning('Sincronización interrumpida: la nube devolvió muchos elementos ausentes de golpe. No se borró nada localmente; se reintentará solo.')
      }
      if (!sospechosoP) contarAusencias(pendientes, remotePids, L.pendientes, ausenciaP.current)
      if (!sospechosoN) contarAusencias(notas, remoteNids, L.notas, ausenciaN.current)
      if (!sospechosoPr) contarAusencias(proyectos, remotePrids, L.proyectos, ausenciaPr.current)
      if (!sospechosoEv) contarAusencias(eventos, remoteEvids, L.eventos, ausenciaEv.current)
      if (!sospechosoEsp) contarAusencias(espacios, remoteEspids, L.espacios, ausenciaEsp.current)
      // Protegido = recién subido (lag) O aún sin confirmar el borrado (menos de 2 ausencias
      // seguidas) O ausencias sospechosas de golpe (fallo de lectura, no borrado real).
      const protegidoP = (id: string) => sospechosoP || (subidoReciente.current.get(id) ?? 0) >= limite || (ausenciaP.current.get(id) ?? 0) < 2
      const protegidoN = (id: string) => sospechosoN || (subidoReciente.current.get(id) ?? 0) >= limite || (ausenciaN.current.get(id) ?? 0) < 2
      const protegidoPr = (id: string) => sospechosoPr || (subidoReciente.current.get(id) ?? 0) >= limite || (ausenciaPr.current.get(id) ?? 0) < 2
      const protegidoEv = (id: string) => sospechosoEv || (subidoReciente.current.get(id) ?? 0) >= limite || (ausenciaEv.current.get(id) ?? 0) < 2
      const protegidoEsp = (id: string) => sospechosoEsp || (subidoReciente.current.get(id) ?? 0) >= limite || (ausenciaEsp.current.get(id) ?? 0) < 2
      const resP = reconciliar(pendientes, remoteP, L.pendientes, mergePendiente, protegidoP)
      const resN = reconciliar(notas, remoteN, L.notas, mergeNota, protegidoN)
      const resPr = reconciliar(proyectos, remotePr, L.proyectos, mergeProyecto, protegidoPr)
      const resEv = reconciliar(eventos, remoteEv, L.eventos, mergeEvento, protegidoEv)
      const resEsp = reconciliar(espacios, remoteEsp, L.espacios, mergeEspacio, protegidoEsp)
      L.pendientes = resP.nextLast
      L.notas = resN.nextLast
      L.proyectos = resPr.nextLast
      L.eventos = resEv.nextLast
      L.espacios = resEsp.nextLast
      guardarLast()
      // Solo reemplazar el estado si el contenido REALMENTE cambió (evita refrescos que borran lo que escribes)
      const cambioP = !mismaLista(pendientes, resP.resultado)
      const cambioN = !mismaLista(notas, resN.resultado)
      const cambioPr = !mismaLista(proyectos, resPr.resultado)
      const cambioEv = !mismaLista(eventos, resEv.resultado)
      const cambioEsp = !mismaLista(espacios, resEsp.resultado)
      if (cambioP || cambioN || cambioPr || cambioEv || cambioEsp) reemplazarTodo(resP.resultado, resN.resultado, undefined, resPr.resultado, resEv.resultado, resEsp.resultado)
      const conf = resP.conflictos.length + resN.conflictos.length + resPr.conflictos.length + resEv.conflictos.length + resEsp.conflictos.length
      if (conf > 0) toast.info(`Se combinaron cambios de otro dispositivo en ${conf} elemento(s)`)
      recalcularPendientes()
    } catch {
      setEstado(navigator.onLine ? 'error' : 'offline')
    }
  }

  async function sincronizar() {
    // Serializa TODO: pull y flush nunca se traslapan (evita borrar lo recién creado por una lectura a destiempo)
    if (sincronizando.current) { sincPendiente.current = true; return }
    sincronizando.current = true
    try { await pull(); await flush() }
    finally {
      sincronizando.current = false
      if (sincPendiente.current) { sincPendiente.current = false; sincronizar() }
    }
  }

  const logout = () => { getSupabase()?.auth.signOut(); setSession(null); setEstado('local'); last.current = vacio(); setEspacioId(null); setMiRol(null); setMiembros([]) }
  const activarSync = () => { try { localStorage.removeItem('sb_modo_local') } catch { /* noop */ } setModoLocal(false) }
  const usarLocal = () => { try { localStorage.setItem('sb_modo_local', '1') } catch { /* noop */ } setModoLocal(true) }
  const recargarEspacio = () => { cargarEspacio() }

  const ctx: SyncCtx = {
    userId, email, estado, modoLocal: modoLocal || !config, enLinea, porSubir,
    espacioId, miRol, miembros, recargarEspacio, actualizarColumnas,
    logout, activarSync, sincronizarAhora: sincronizar,
  }

  if (!listo) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>
  if (!config && !modoLocal) return <ConfigScreen onSaved={() => setConfig(true)} onLocal={usarLocal} />
  if (config && !session && !modoLocal) return <AuthScreen onLocal={usarLocal} />
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

/* ===================== Indicador ===================== */
export function SyncBadge() {
  const { estado, email, modoLocal, enLinea, porSubir } = useSync()
  if (modoLocal) return <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><CloudOff size={12} /> Solo este dispositivo</span>
  if (!enLinea || estado === 'offline') {
    return <span className="inline-flex items-center gap-1 text-[11px] text-amber-600" title="Trabajando sin conexión"><CloudOff size={12} /> Sin conexión{porSubir > 0 ? ` · ${porSubir} por subir` : ''}</span>
  }
  const map: Record<EstadoSync, { icon: ReactNode; txt: string; cls: string }> = {
    local: { icon: <CloudOff size={12} />, txt: 'Local', cls: 'text-muted-foreground' },
    sincronizando: { icon: <RefreshCw size={12} className="animate-spin" />, txt: 'Sincronizando…', cls: 'text-amber-600' },
    sincronizado: { icon: <Cloud size={12} />, txt: 'Sincronizado', cls: 'text-green-600' },
    offline: { icon: <CloudOff size={12} />, txt: 'Sin conexión', cls: 'text-amber-600' },
    error: { icon: <CloudOff size={12} />, txt: 'Reintentando…', cls: 'text-red-500' },
  }
  const e = map[estado]
  return (
    <span className={'inline-flex items-center gap-1 text-[11px] ' + e.cls} title={email || ''}>
      {e.icon} {e.txt}{porSubir > 0 && estado !== 'sincronizado' ? ` · ${porSubir}` : ''}
      {email && <span className="max-w-[140px] truncate text-muted-foreground">· {email}</span>}
    </span>
  )
}

/* ===================== Configuración ===================== */
function ConfigScreen({ onSaved, onLocal }: { onSaved: () => void; onLocal: () => void }) {
  const [url, setUrl] = useState(getConfig().url)
  const [anon, setAnon] = useState(getConfig().anon)
  const guardar = () => { if (!url.trim() || !anon.trim()) { toast.error('Faltan datos'); return } saveConfig(url, anon); onSaved() }
  return (
    <Pantalla titulo="Conectar con Supabase" subtitulo="Pega los datos de tu proyecto (una vez en este dispositivo).">
      <div className="space-y-1.5"><Label className="text-xs">Project URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" /></div>
      <div className="space-y-1.5"><Label className="text-xs">anon public key</Label><Input value={anon} onChange={e => setAnon(e.target.value)} placeholder="eyJhbGciOi..." /></div>
      <Button className="w-full" onClick={guardar}>Continuar</Button>
      <button onClick={onLocal} className="w-full text-center text-xs text-muted-foreground hover:underline">Usar solo en este dispositivo</button>
    </Pantalla>
  )
}

/* ===================== Login / registro ===================== */
function AuthScreen({ onLocal }: { onLocal: () => void }) {
  const [modo, setModo] = useState<'login' | 'registro' | 'magic'>('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const enviar = async () => {
    const sb = getSupabase()
    if (!sb) return
    const correo = email.trim().toLowerCase()
    if (modo === 'magic') {
      if (!correo) { toast.error('Escribe tu correo'); return }
      setCargando(true)
      try {
        const { error } = await sb.auth.signInWithOtp({ email: correo, options: { emailRedirectTo: window.location.origin + '/' } })
        if (error) throw error
        setEnviado(true)
      } catch (err) { toast.error((err as Error).message || 'No se pudo enviar el enlace') } finally { setCargando(false) }
      return
    }
    if (!correo || pass.length < 6) { toast.error('Correo válido y contraseña de 6+ caracteres'); return }
    setCargando(true)
    try {
      if (modo === 'registro') { const { error } = await sb.auth.signUp({ email: correo, password: pass }); if (error) throw error; toast.success('Cuenta creada. Si pide confirmación, revisa tu correo.') }
      else { const { error } = await sb.auth.signInWithPassword({ email: correo, password: pass }); if (error) throw error }
    } catch (err) { toast.error((err as Error).message || 'No se pudo continuar') } finally { setCargando(false) }
  }
  if (modo === 'magic' && enviado) {
    return (
      <Pantalla titulo="Revisa tu correo" subtitulo={`Te enviamos un enlace a ${email.trim()} para entrar sin contraseña.`}>
        <button onClick={() => { setEnviado(false); setModo('login') }} className="w-full text-center text-xs text-primary hover:underline">Volver</button>
        <button onClick={onLocal} className="w-full text-center text-xs text-muted-foreground hover:underline">Usar solo en este dispositivo</button>
      </Pantalla>
    )
  }
  return (
    <Pantalla titulo={modo === 'login' ? 'Iniciar sesión' : modo === 'registro' ? 'Crear cuenta' : 'Entrar con enlace'} subtitulo="Tus pendientes y notas se sincronizan en todos tus dispositivos.">
      <div className="space-y-1.5"><Label className="text-xs">Correo</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" onKeyDown={e => { if (e.key === 'Enter') enviar() }} /></div>
      {modo !== 'magic' && (
        <div className="space-y-1.5"><Label className="text-xs">Contraseña</Label><Input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => { if (e.key === 'Enter') enviar() }} /></div>
      )}
      <Button className="w-full" onClick={enviar} disabled={cargando}>{cargando && <Loader2 size={15} className="mr-2 animate-spin" />}{modo === 'login' ? 'Entrar' : modo === 'registro' ? 'Registrarme' : 'Enviarme un enlace'}</Button>
      {modo !== 'magic' && (
        <button onClick={() => setModo(modo === 'login' ? 'registro' : 'login')} className="w-full text-center text-xs text-primary hover:underline">{modo === 'login' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Inicia sesión'}</button>
      )}
      <button onClick={() => setModo(modo === 'magic' ? 'login' : 'magic')} className="w-full text-center text-xs text-primary hover:underline">{modo === 'magic' ? 'Entrar con contraseña' : 'Entrar con enlace por correo (sin contraseña)'}</button>
      <button onClick={onLocal} className="w-full text-center text-xs text-muted-foreground hover:underline">Usar solo en este dispositivo</button>
    </Pantalla>
  )
}

function Pantalla({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm space-y-4 rounded-2xl p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Cloud size={22} /></div>
          <h1 className="text-lg font-bold">{titulo}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{subtitulo}</p>
        </div>
        {children}
      </Card>
    </div>
  )
}
