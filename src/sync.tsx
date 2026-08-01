import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { useApp } from '@/store'
import type { Nota, Pendiente, Proyecto } from '@/types'
import { getConfig, getSupabase, isConfigured, saveConfig } from '@/lib/supabase'
import { mergeNota, mergePendiente, mergeProyecto, reconciliar, type MapaSync } from '@/lib/sync-merge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Cloud, CloudOff, RefreshCw, LogOut, Loader2 } from 'lucide-react'

type EstadoSync = 'local' | 'sincronizando' | 'sincronizado' | 'offline' | 'error'

interface SyncCtx {
  email: string | null
  estado: EstadoSync
  modoLocal: boolean
  enLinea: boolean
  porSubir: number
  logout: () => void
  activarSync: () => void
  sincronizarAhora: () => void
}
const Ctx = createContext<SyncCtx>({
  email: null, estado: 'local', modoLocal: true, enLinea: true, porSubir: 0,
  logout: () => {}, activarSync: () => {}, sincronizarAhora: () => {},
})
// eslint-disable-next-line react-refresh/only-export-components -- context hook shared alongside its provider
export const useSync = () => useContext(Ctx)

interface UltimoSync { pendientes: MapaSync; notas: MapaSync; proyectos: MapaSync }
const vacio = (): UltimoSync => ({ pendientes: {}, notas: {}, proyectos: {} })

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
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const rtTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const userId = session?.user?.id || null
  const email = session?.user?.email || null
  const claveLast = (uid: string) => 'pnp_lastsync_' + uid

  const cargarLast = (uid: string) => {
    try { last.current = JSON.parse(localStorage.getItem(claveLast(uid)) || '') || vacio() } catch { last.current = vacio() }
  }
  const guardarLast = () => { if (userId) { try { localStorage.setItem(claveLast(userId), JSON.stringify(last.current)) } catch { /* noop */ } } }

  /* ---- sesión + auth ---- */
  useEffect(() => {
    const sb = getSupabase()
    if (!sb) { setListo(true); return } // eslint-disable-line react-hooks/set-state-in-effect -- no Supabase configured, unblock the ready gate immediately
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setListo(true) })
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [config])

  /* ---- al iniciar sesión: cargar marca y sincronizar ---- */
  useEffect(() => {
    if (!session || !userId) return
    cargarLast(userId)
    sincronizar()
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- subir cambios locales (debounce) ---- */
  useEffect(() => {
    if (!session) return
    recalcularPendientes()
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => { sincronizar() }, 1000)
  }, [app.pendientes, app.notas, app.proyectos]) // eslint-disable-line react-hooks/exhaustive-deps

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
      .subscribe()
    const intervalo = setInterval(() => { if (navigator.onLine) sincronizar() }, 60000)
    const onVis = () => { if (document.visibilityState === 'visible' && session) sincronizar() }
    document.addEventListener('visibilitychange', onVis)
    return () => { sb.removeChannel(ch); clearInterval(intervalo); document.removeEventListener('visibilitychange', onVis) }
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  function recalcularPendientes() {
    const L = last.current
    const { pendientes, notas, proyectos } = appRef.current
    const dP = pendientes.filter(p => L.pendientes[p.id] !== p.modificado).length
    const localPids = new Set(pendientes.map(p => p.id))
    const delP = Object.keys(L.pendientes).filter(id => !localPids.has(id)).length
    const dN = notas.filter(n => L.notas[n.id] !== n.modificado).length
    const localNids = new Set(notas.map(n => n.id))
    const delN = Object.keys(L.notas).filter(id => !localNids.has(id)).length
    const dPr = proyectos.filter(p => L.proyectos[p.id] !== p.modificado).length
    const localPrids = new Set(proyectos.map(p => p.id))
    const delPr = Object.keys(L.proyectos).filter(id => !localPrids.has(id)).length
    setPorSubir(dP + delP + dN + delN + dPr + delPr)
  }

  async function flush() {
    if (!session || !userId || !navigator.onLine) { if (!navigator.onLine) setEstado('offline'); return }
    const sb = getSupabase()
    if (!sb) return
    const L = last.current
    const { pendientes, notas, proyectos } = appRef.current
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
    if (!dirtyP.length && !delP.length && !dirtyN.length && !delN.length && !dirtyPr.length && !delPr.length) { setEstado('sincronizado'); recalcularPendientes(); return }
    setEstado('sincronizando')
    const ahora = Date.now()
    try {
      if (dirtyP.length) { const { error } = await sb.from('pnp_pendientes').upsert(dirtyP.map(p => ({ id: p.id, user_id: userId, data: p, updated_at: p.modificado }))); if (error) throw error; dirtyP.forEach(p => { L.pendientes[p.id] = p.modificado; subidoReciente.current.set(p.id, ahora) }) }
      if (delP.length) { const { error } = await sb.from('pnp_pendientes').delete().in('id', delP); if (error) throw error; delP.forEach(id => { delete L.pendientes[id]; subidoReciente.current.delete(id) }) }
      if (dirtyN.length) { const { error } = await sb.from('pnp_notas').upsert(dirtyN.map(n => ({ id: n.id, user_id: userId, data: n, updated_at: n.modificado }))); if (error) throw error; dirtyN.forEach(n => { L.notas[n.id] = n.modificado; subidoReciente.current.set(n.id, ahora) }) }
      if (delN.length) { const { error } = await sb.from('pnp_notas').delete().in('id', delN); if (error) throw error; delN.forEach(id => { delete L.notas[id]; subidoReciente.current.delete(id) }) }
      if (dirtyPr.length) { const { error } = await sb.from('pnp_proyectos').upsert(dirtyPr.map(p => ({ id: p.id, user_id: userId, data: p, updated_at: p.modificado }))); if (error) throw error; dirtyPr.forEach(p => { L.proyectos[p.id] = p.modificado; subidoReciente.current.set(p.id, ahora) }) }
      if (delPr.length) { const { error } = await sb.from('pnp_proyectos').delete().in('id', delPr); if (error) throw error; delPr.forEach(id => { delete L.proyectos[id]; subidoReciente.current.delete(id) }) }
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
      const [{ data: rp, error: ep }, { data: rn, error: en }, { data: rpr, error: epr }] = await Promise.all([
        sb.from('pnp_pendientes').select('data'),
        sb.from('pnp_notas').select('data'),
        sb.from('pnp_proyectos').select('data'),
      ])
      if (ep || en || epr) throw (ep || en || epr)
      const remoteP = (rp || []).map(r => (r as { data: Pendiente }).data)
      const remoteN = (rn || []).map(r => (r as { data: Nota }).data)
      const remotePr = (rpr || []).map(r => (r as { data: Proyecto }).data)
      const L = last.current
      const limite = Date.now() - GRACIA_SUBIDA
      // Purga entradas viejas para que el mapa no crezca sin límite.
      subidoReciente.current.forEach((t, id) => { if (t < limite) subidoReciente.current.delete(id) })
      const remotePids = new Set(remoteP.map(p => p.id))
      const remoteNids = new Set(remoteN.map(n => n.id))
      const remotePrids = new Set(remotePr.map(p => p.id))
      // Cuenta ausencias remotas consecutivas de ítems conocidos; resetea si reaparecen.
      const contarAusencias = (local: { id: string }[], remoteIds: Set<string>, lastMap: MapaSync, cont: Map<string, number>) => {
        const vivos = new Set(local.map(x => x.id))
        cont.forEach((_n, id) => { if (!vivos.has(id) || remoteIds.has(id)) cont.delete(id) })
        for (const it of local) {
          if (lastMap[it.id] !== undefined && !remoteIds.has(it.id)) cont.set(it.id, (cont.get(it.id) ?? 0) + 1)
          else cont.delete(it.id)
        }
      }
      const { pendientes, notas, proyectos, reemplazarTodo } = appRef.current
      contarAusencias(pendientes, remotePids, L.pendientes, ausenciaP.current)
      contarAusencias(notas, remoteNids, L.notas, ausenciaN.current)
      contarAusencias(proyectos, remotePrids, L.proyectos, ausenciaPr.current)
      // Protegido = recién subido (lag) O aún sin confirmar el borrado (menos de 2 ausencias seguidas).
      const protegidoP = (id: string) => (subidoReciente.current.get(id) ?? 0) >= limite || (ausenciaP.current.get(id) ?? 0) < 2
      const protegidoN = (id: string) => (subidoReciente.current.get(id) ?? 0) >= limite || (ausenciaN.current.get(id) ?? 0) < 2
      const protegidoPr = (id: string) => (subidoReciente.current.get(id) ?? 0) >= limite || (ausenciaPr.current.get(id) ?? 0) < 2
      const resP = reconciliar(pendientes, remoteP, L.pendientes, mergePendiente, protegidoP)
      const resN = reconciliar(notas, remoteN, L.notas, mergeNota, protegidoN)
      const resPr = reconciliar(proyectos, remotePr, L.proyectos, mergeProyecto, protegidoPr)
      L.pendientes = resP.nextLast
      L.notas = resN.nextLast
      L.proyectos = resPr.nextLast
      guardarLast()
      // Solo reemplazar el estado si el contenido REALMENTE cambió (evita refrescos que borran lo que escribes)
      const cambioP = !mismaLista(pendientes, resP.resultado)
      const cambioN = !mismaLista(notas, resN.resultado)
      const cambioPr = !mismaLista(proyectos, resPr.resultado)
      if (cambioP || cambioN || cambioPr) reemplazarTodo(resP.resultado, resN.resultado, undefined, resPr.resultado)
      const conf = resP.conflictos.length + resN.conflictos.length + resPr.conflictos.length
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

  const logout = () => { getSupabase()?.auth.signOut(); setSession(null); setEstado('local'); last.current = vacio() }
  const activarSync = () => { try { localStorage.removeItem('sb_modo_local') } catch { /* noop */ } setModoLocal(false) }
  const usarLocal = () => { try { localStorage.setItem('sb_modo_local', '1') } catch { /* noop */ } setModoLocal(true) }

  const ctx: SyncCtx = { email, estado, modoLocal: modoLocal || !config, enLinea, porSubir, logout, activarSync, sincronizarAhora: sincronizar }

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
  return <span className={'inline-flex items-center gap-1 text-[11px] ' + e.cls} title={email || ''}>{e.icon} {e.txt}{porSubir > 0 && estado !== 'sincronizado' ? ` · ${porSubir}` : ''}</span>
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
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [cargando, setCargando] = useState(false)
  const enviar = async () => {
    const sb = getSupabase()
    if (!sb) return
    if (!email.trim() || pass.length < 6) { toast.error('Correo válido y contraseña de 6+ caracteres'); return }
    setCargando(true)
    try {
      if (modo === 'registro') { const { error } = await sb.auth.signUp({ email: email.trim(), password: pass }); if (error) throw error; toast.success('Cuenta creada. Si pide confirmación, revisa tu correo.') }
      else { const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pass }); if (error) throw error }
    } catch (err) { toast.error((err as Error).message || 'No se pudo continuar') } finally { setCargando(false) }
  }
  return (
    <Pantalla titulo={modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} subtitulo="Tus pendientes y notas se sincronizan en todos tus dispositivos.">
      <div className="space-y-1.5"><Label className="text-xs">Correo</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" onKeyDown={e => { if (e.key === 'Enter') enviar() }} /></div>
      <div className="space-y-1.5"><Label className="text-xs">Contraseña</Label><Input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => { if (e.key === 'Enter') enviar() }} /></div>
      <Button className="w-full" onClick={enviar} disabled={cargando}>{cargando && <Loader2 size={15} className="mr-2 animate-spin" />}{modo === 'login' ? 'Entrar' : 'Registrarme'}</Button>
      <button onClick={() => setModo(modo === 'login' ? 'registro' : 'login')} className="w-full text-center text-xs text-primary hover:underline">{modo === 'login' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Inicia sesión'}</button>
      <button onClick={onLocal} className="w-full text-center text-xs text-muted-foreground hover:underline">Usar solo en este dispositivo</button>
    </Pantalla>
  )
}

function Pantalla({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Cloud size={22} /></div>
          <h1 className="text-lg font-bold">{titulo}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{subtitulo}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

export { LogOut }
