import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import { useSync } from '@/sync'
import type { EventoCalendario } from '@/types'
import { activo, hoyISO, nombreMes } from '@/lib/app-utils'
import { columnaDe, colorColumna, idColumnaCompletado } from '@/lib/columnas'
import { listarCuentasGoogle, listarEventosRango, type CuentaGoogle, type EventoGCal } from '@/lib/googleCalendar'
import { sincronizarEspejoGoogle, sinDuplicarLocal } from '@/lib/agenda'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import MenuContextoPendiente from '@/components/MenuContextoPendiente'
import { ChevronLeft, ChevronRight, GripVertical, X, CalendarOff } from 'lucide-react'
import { toast } from 'sonner'

type ModoCal = 'dia' | 'semana' | 'mes'
const HORA_INICIO = 6
const HORA_FIN = 22
const PX_HORA = 48
const CUARTOS = [0, 15, 30, 45]
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const COLORES_CUENTA = ['bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-emerald-500']
function colorDeCuenta(cuentaId: string): string {
  let h = 0
  for (let i = 0; i < cuentaId.length; i++) h = (h * 31 + cuentaId.charCodeAt(i)) >>> 0
  return COLORES_CUENTA[h % COLORES_CUENTA.length]
}

function fechaISO(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
function sumarDias(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return fechaISO(d)
}
function inicioSemana(iso: string): string {
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() - d.getDay()); return fechaISO(d)
}
function horaDeISO(iso: string): string {
  const d = new Date(iso)
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}
function minDesdeInicio(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return (h - HORA_INICIO) * 60 + m
}
function diferenciaMin(iniISO?: string, finISO?: string): number {
  if (!iniISO || !finISO) return 30
  return Math.max(15, Math.round((new Date(finISO).getTime() - new Date(iniISO).getTime()) / 60000))
}
const topPx = (hora: string) => (minDesdeInicio(hora) / 60) * PX_HORA
const altoPx = (duracionMin: number) => Math.max(16, (duracionMin / 60) * PX_HORA)

/** Calendario integral: día/semana/mes, crear y mover pendientes agendados y eventos sueltos sin
    salir de la app. Reemplaza la antigua Agenda (solo-hoy) y el mes de solo-lectura de OtherViews.
    Sigue reflejando todo en Google Calendar (vía `sincronizarEspejoGoogle`), pero ahora la fuente
    de verdad para editar/mover es la app: los eventos ya no viven solo en Google. */
export default function CalendarioView() {
  const { pendientes: todosPendientes, eventos: todosEventos, proyectos, actualizarPendiente, crearEvento, actualizarEvento, eliminarEvento, columnas } = useApp()
  const { abrirPeek } = useUI()
  const idCompletado = idColumnaCompletado(columnas)
  const { modoLocal } = useSync()
  const pendientes = useMemo(() => todosPendientes.filter(activo), [todosPendientes])
  const eventos = useMemo(() => todosEventos.filter(e => !e.borrado), [todosEventos])

  const [modoVista, setModoVista] = useState<ModoCal>(() => { try { return (localStorage.getItem('pn_calendario_modo') as ModoCal) || 'semana' } catch { return 'semana' } })
  const [fecha, setFecha] = useState(hoyISO())
  const [cuentas, setCuentas] = useState<CuentaGoogle[]>([])
  const [eventosGoogle, setEventosGoogle] = useState<EventoGCal[]>([])
  const [sincronizando, setSincronizando] = useState(false)
  const [nuevo, setNuevo] = useState<{ fecha: string; hora: string } | null>(null)
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [nuevoDuracion, setNuevoDuracion] = useState('30')
  const [editando, setEditando] = useState<EventoCalendario | null>(null)
  const [verGoogle, setVerGoogle] = useState<EventoGCal | null>(null)
  const [cargandoGoogle, setCargandoGoogle] = useState(false)
  const [eventoAEliminar, setEventoAEliminar] = useState<EventoCalendario | null>(null)

  const conectado = cuentas.length > 0
  const cambiarModo = (m: ModoCal) => { setModoVista(m); try { localStorage.setItem('pn_calendario_modo', m) } catch { /* noop */ } }

  useEffect(() => {
    if (modoLocal) { Promise.resolve().then(() => setCuentas([])); return }
    let vivo = true
    listarCuentasGoogle().then(r => { if (vivo) setCuentas(r.cuentas) }).catch(() => { if (vivo) setCuentas([]) })
    return () => { vivo = false }
  }, [modoLocal])

  const diasVisibles = useMemo(() => {
    if (modoVista === 'dia') return [fecha]
    if (modoVista === 'semana') { const ini = inicioSemana(fecha); return Array.from({ length: 7 }, (_, i) => sumarDias(ini, i)) }
    const [anio, mes] = fecha.split('-').map(Number)
    const primerDia = new Date(anio, mes - 1, 1)
    const inicioGrid = sumarDias(fechaISO(primerDia), -primerDia.getDay())
    return Array.from({ length: 42 }, (_, i) => sumarDias(inicioGrid, i))
  }, [modoVista, fecha])

  const claveRango = diasVisibles[0] + '|' + diasVisibles[diasVisibles.length - 1]

  const refrescarGoogle = () => {
    if (!conectado || !diasVisibles.length) { Promise.resolve().then(() => setEventosGoogle([])); return }
    const desdeISO = new Date(diasVisibles[0] + 'T00:00:00').toISOString()
    const hastaISO = new Date(diasVisibles[diasVisibles.length - 1] + 'T23:59:59').toISOString()
    Promise.resolve().then(() => setCargandoGoogle(true))
    listarEventosRango(desdeISO, hastaISO).then(r => setEventosGoogle(r.eventos)).catch(() => setEventosGoogle([])).finally(() => setCargandoGoogle(false))
  }
  useEffect(refrescarGoogle, [conectado, claveRango]) // eslint-disable-line react-hooks/exhaustive-deps

  // Eventos remotos que ya están representados localmente (pendiente agendado o EventoCalendario
  // con espejo): se ocultan para no duplicar el chip — el local es el editable/movible.
  const eventosGoogleVisibles = useMemo(() => sinDuplicarLocal(eventosGoogle, pendientes, eventos), [eventosGoogle, pendientes, eventos])

  const avisarErrores = (errores?: Record<string, string>) => {
    if (!errores) return
    Object.entries(errores).forEach(([cid, msg]) => toast.error(`${cuentas.find(c => c.id === cid)?.email || 'una cuenta'}: ${msg}`))
  }

  const pasoDias = modoVista === 'dia' ? 1 : modoVista === 'semana' ? 7 : 0
  const navegar = (dir: -1 | 1) => {
    if (modoVista === 'mes') {
      const [a, m] = fecha.split('-').map(Number)
      setFecha(fechaISO(new Date(a, m - 1 + dir, 1)))
    } else setFecha(f => sumarDias(f, dir * pasoDias))
  }
  const irADia = (iso: string) => { setFecha(iso); cambiarModo('dia') }

  const mover = async (fechaDestino: string, horaDestino: string, e: React.DragEvent) => {
    e.preventDefault()
    const pid = e.dataTransfer.getData('text/pendiente-id')
    const eid = e.dataTransfer.getData('text/evento-id')
    if (pid) {
      const p = pendientes.find(x => x.id === pid); if (!p) return
      const duracion = p.duracionMin || 15
      actualizarPendiente(p.id, { fechaLimite: fechaDestino, hora: horaDestino, duracionMin: duracion })
      if (!conectado) return
      const origenCuentaId = proyectos.find(x => x.id === p.proyectoId)?.cuentaGoogleId
      setSincronizando(true)
      try {
        const r = await sincronizarEspejoGoogle({ hora: p.hora, googleEventos: p.googleEventos }, { titulo: p.titulo, fecha: fechaDestino, hora: horaDestino, duracionMin: duracion, descripcion: p.descripcion }, origenCuentaId)
        actualizarPendiente(p.id, { googleEventos: r.googleEventos })
        avisarErrores(r.errores)
        refrescarGoogle()
      } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo mover en Google Calendar') }
      finally { setSincronizando(false) }
      return
    }
    if (eid) {
      const ev = eventos.find(x => x.id === eid); if (!ev) return
      actualizarEvento(ev.id, { fecha: fechaDestino, hora: horaDestino })
      if (!conectado) return
      setSincronizando(true)
      try {
        const r = await sincronizarEspejoGoogle({ hora: ev.hora, googleEventos: ev.googleEventos }, { titulo: ev.titulo, fecha: fechaDestino, hora: horaDestino, duracionMin: ev.duracionMin, descripcion: ev.descripcion }, ev.cuentaGoogleId, ev.soloEstaCuenta)
        actualizarEvento(ev.id, { googleEventos: r.googleEventos })
        avisarErrores(r.errores)
        refrescarGoogle()
      } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo mover en Google Calendar') }
      finally { setSincronizando(false) }
    }
  }

  const abrirNuevo = (fechaSlot: string, horaSlot: string) => { setNuevo({ fecha: fechaSlot, hora: horaSlot }); setNuevoTitulo(''); setNuevoDuracion('30') }

  const crearEventoSuelto = async () => {
    const titulo = nuevoTitulo.trim()
    if (!titulo || !nuevo) return
    const duracionMin = Number(nuevoDuracion) || 30
    const creado = crearEvento({ titulo, fecha: nuevo.fecha, hora: nuevo.hora, duracionMin })
    setNuevo(null)
    if (!conectado) return
    setSincronizando(true)
    try {
      const r = await sincronizarEspejoGoogle({}, { titulo, fecha: nuevo.fecha, hora: nuevo.hora, duracionMin })
      actualizarEvento(creado.id, { googleEventos: r.googleEventos })
      avisarErrores(r.errores)
      refrescarGoogle()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo crear en Google Calendar') }
    finally { setSincronizando(false) }
  }

  const guardarEdicion = async () => {
    if (!editando) return
    const antes = eventos.find(x => x.id === editando.id)
    actualizarEvento(editando.id, { titulo: editando.titulo, hora: editando.hora, duracionMin: editando.duracionMin })
    setEditando(null)
    if (!conectado || !antes) return
    setSincronizando(true)
    try {
      const r = await sincronizarEspejoGoogle({ hora: antes.hora, googleEventos: antes.googleEventos }, { titulo: editando.titulo, fecha: editando.fecha, hora: editando.hora, duracionMin: editando.duracionMin, descripcion: editando.descripcion }, editando.cuentaGoogleId, editando.soloEstaCuenta)
      actualizarEvento(editando.id, { googleEventos: r.googleEventos })
      avisarErrores(r.errores)
      refrescarGoogle()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo actualizar en Google Calendar') }
    finally { setSincronizando(false) }
  }

  const eliminarEventoSuelto = async (ev: EventoCalendario) => {
    if (ev.googleEventos && Object.keys(ev.googleEventos).length) {
      setSincronizando(true)
      try { await sincronizarEspejoGoogle({ hora: ev.hora, googleEventos: ev.googleEventos }, { titulo: ev.titulo, fecha: '', hora: '', duracionMin: 0 }) }
      catch { /* noop */ } finally { setSincronizando(false) }
    }
    eliminarEvento(ev.id)
    setEditando(null)
  }
  const borrarEdicion = () => { if (editando) setEventoAEliminar(editando) }

  const backlog = pendientes.filter(p => !p.fechaLimite && p.estado !== idCompletado)
  const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)

  const bloquesDelDia = (iso: string) => ({
    pends: pendientes.filter(p => p.fechaLimite === iso && p.hora),
    evs: eventos.filter(e => e.fecha === iso && e.hora),
    gs: eventosGoogleVisibles.filter(e => e.inicio && !e.todoElDia && fechaISO(new Date(e.inicio)) === iso),
  })
  const todoElDiaDe = (iso: string) => eventosGoogleVisibles.filter(e => e.todoElDia && e.inicio?.slice(0, 10) === iso)

  const etiquetaRango = () => {
    if (modoVista === 'dia') { const d = new Date(fecha + 'T00:00:00'); return `${DIAS_CORTOS[d.getDay()]} ${d.getDate()} de ${nombreMes(d.getMonth())}` }
    if (modoVista === 'semana') { const ini = diasVisibles[0], fin = diasVisibles[6]; return `${ini.slice(8)} – ${fin.slice(8)} de ${nombreMes(Number(fin.slice(5, 7)) - 1)} ${fin.slice(0, 4)}` }
    const [a, m] = fecha.split('-').map(Number); return `${nombreMes(m - 1)} ${a}`
  }

  const anchoMinCol = modoVista === 'semana' ? 120 : undefined

  const renderColumnaDia = (iso: string) => {
    const { pends, evs, gs } = bloquesDelDia(iso)
    return (
      <div key={iso} className="relative flex-1" style={{ height: (HORA_FIN - HORA_INICIO) * PX_HORA, minWidth: anchoMinCol }}>
        <div className="absolute inset-0 flex flex-col">
          {horas.map(h => (
            <div key={h} style={{ height: PX_HORA }} className="border-b">
              {CUARTOS.map(q => (
                <div key={q} style={{ height: PX_HORA / 4 }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => mover(iso, `${String(h).padStart(2, '0')}:${String(q).padStart(2, '0')}`, e)}
                  onClick={() => abrirNuevo(iso, `${String(h).padStart(2, '0')}:${String(q).padStart(2, '0')}`)}
                  className="hover:bg-accent/40" />
              ))}
            </div>
          ))}
        </div>
        {gs.map(ev => (
          <div key={ev.cuentaId + '/' + ev.id} onClick={() => setVerGoogle(ev)}
            className="absolute left-1 right-1 flex cursor-pointer items-center gap-1 overflow-hidden rounded bg-muted px-1.5 text-[10px] text-muted-foreground hover:bg-muted-foreground/20"
            style={{ top: topPx(horaDeISO(ev.inicio!)), height: altoPx(diferenciaMin(ev.inicio, ev.fin)) }}>
            <span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + colorDeCuenta(ev.cuentaId)} title={ev.email} /> 🔒 {ev.titulo}
          </div>
        ))}
        {pends.map(p => (
          <ContextMenu key={p.id}>
            <ContextMenuTrigger asChild>
              <div draggable onDragStart={e => e.dataTransfer.setData('text/pendiente-id', p.id)}
                onClick={() => abrirPeek(p.id)}
                className="absolute left-1 right-1 cursor-grab overflow-hidden rounded-lg border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[11px] active:cursor-grabbing"
                style={{ top: topPx(p.hora!), height: altoPx(p.duracionMin || 15) }}>
                <span className="font-medium">{p.titulo}</span>
              </div>
            </ContextMenuTrigger>
            <MenuContextoPendiente p={p} />
          </ContextMenu>
        ))}
        {evs.map(e => (
          <ContextMenu key={e.id}>
            <ContextMenuTrigger asChild>
              <div draggable onDragStart={ev => ev.dataTransfer.setData('text/evento-id', e.id)}
                onClick={() => setEditando(e)}
                className="absolute left-1 right-1 cursor-grab overflow-hidden rounded-lg border border-accent2/50 bg-accent2/15 px-1.5 py-0.5 text-[11px] active:cursor-grabbing"
                style={{ top: topPx(e.hora), height: altoPx(e.duracionMin) }}>
                <span className="font-medium">{e.titulo}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-40">
              <ContextMenuItem onClick={() => setEditando(e)}>Editar</ContextMenuItem>
              <ContextMenuItem className="text-destructive" onClick={() => setEventoAEliminar(e)}>Eliminar</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Card className="flex items-center gap-1 p-1 w-fit">
          {(['dia', 'semana', 'mes'] as ModoCal[]).map(m => (
            <button key={m} onClick={() => cambiarModo(m)}
              className={'rounded-md px-3 py-1 text-xs font-medium capitalize ' + (modoVista === m ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
              {m}
            </button>
          ))}
        </Card>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navegar(-1)}><ChevronLeft size={15} /></Button>
          <Button variant="secondary" size="sm" onClick={() => setFecha(hoyISO())}>Hoy</Button>
          <span className="min-w-[10rem] text-center text-sm font-bold capitalize">{etiquetaRango()}</span>
          <Button variant="secondary" size="sm" onClick={() => navegar(1)}><ChevronRight size={15} /></Button>
          {cargandoGoogle && <span className="text-[11px] text-muted-foreground">Cargando Google Calendar…</span>}
        </div>
      </div>

      {!conectado && (
        <div className="flex items-center gap-1.5 rounded-lg bg-muted p-2 text-[11px] text-muted-foreground">
          <CalendarOff size={13} className="shrink-0" /> Sin cuentas de Google Calendar conectadas: los pendientes y eventos se agendan igual, solo que no se reflejan afuera.
        </div>
      )}

      {modoVista === 'mes' ? (
        <Card className="min-h-0 flex-1 overflow-y-auto p-2 scroll-thin">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">
            {DIAS_CORTOS.map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {diasVisibles.map(iso => {
              const { pends, evs, gs } = bloquesDelDia(iso)
              const todoDia = todoElDiaDe(iso)
              const chips = [...pends.map(p => ({ id: p.id, titulo: p.titulo, cls: colorColumna(columnaDe(columnas, p.estado)).badge + (p.estado === idCompletado ? ' line-through opacity-50' : ''), tipo: 'p' as const })),
                ...evs.map(e => ({ id: e.id, titulo: e.titulo, cls: 'bg-accent2/20 text-foreground', tipo: 'e' as const })),
                ...gs.map(g => ({ id: g.cuentaId + '/' + g.id, titulo: g.titulo, cls: 'bg-muted text-muted-foreground', tipo: 'g' as const })),
                ...todoDia.map(g => ({ id: g.cuentaId + '/' + g.id, titulo: g.titulo, cls: 'bg-muted text-muted-foreground', tipo: 'g' as const }))]
              const esHoy = iso === hoyISO()
              const delMes = iso.slice(5, 7) === fecha.slice(5, 7)
              return (
                <div key={iso} onClick={() => irADia(iso)}
                  className={'min-h-[76px] cursor-pointer rounded border p-1 text-[10px] ' + (esHoy ? 'border-primary bg-primary/10' : 'bg-card') + (delMes ? '' : ' opacity-40')}>
                  <div className={'font-bold ' + (esHoy ? 'text-primary' : '')}>{Number(iso.slice(8))}</div>
                  {chips.slice(0, 3).map(c => {
                    const chip = (
                      <div onClick={e => {
                        e.stopPropagation()
                        if (c.tipo === 'p') abrirPeek(c.id)
                        else if (c.tipo === 'e') { const ev = evs.find(x => x.id === c.id); if (ev) setEditando(ev) }
                        else { const g = [...gs, ...todoDia].find(x => x.cuentaId + '/' + x.id === c.id); if (g) setVerGoogle(g) }
                      }}
                        className={'mt-0.5 truncate rounded px-1 ' + c.cls}>
                        {c.tipo === 'g' ? '🔒 ' : ''}{c.titulo}
                      </div>
                    )
                    if (c.tipo === 'p') {
                      const p = pends.find(x => x.id === c.id)
                      if (!p) return <div key={c.tipo + c.id}>{chip}</div>
                      return (
                        <ContextMenu key={c.tipo + c.id}>
                          <ContextMenuTrigger asChild>{chip}</ContextMenuTrigger>
                          <MenuContextoPendiente p={p} />
                        </ContextMenu>
                      )
                    }
                    if (c.tipo === 'e') {
                      const e = evs.find(x => x.id === c.id)
                      if (!e) return <div key={c.tipo + c.id}>{chip}</div>
                      return (
                        <ContextMenu key={c.tipo + c.id}>
                          <ContextMenuTrigger asChild>{chip}</ContextMenuTrigger>
                          <ContextMenuContent className="w-40">
                            <ContextMenuItem onClick={() => setEditando(e)}>Editar</ContextMenuItem>
                            <ContextMenuItem className="text-destructive" onClick={() => setEventoAEliminar(e)}>Eliminar</ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      )
                    }
                    return <div key={c.tipo + c.id}>{chip}</div>
                  })}
                  {chips.length > 3 && <div className="text-muted-foreground">+{chips.length - 3} más</div>}
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        <div className="flex min-h-0 flex-1 gap-2">
          {modoVista === 'dia' && (
            <Card className="w-56 shrink-0 space-y-1.5 overflow-y-auto p-2 scroll-thin">
              <h3 className="px-1 text-xs font-bold text-muted-foreground">Sin fecha</h3>
              {backlog.map(p => (
                <ContextMenu key={p.id}>
                  <ContextMenuTrigger asChild>
                    <div draggable onDragStart={e => e.dataTransfer.setData('text/pendiente-id', p.id)}
                      className="flex cursor-grab items-center gap-1.5 rounded-lg border bg-background p-2 text-xs active:cursor-grabbing">
                      <GripVertical size={12} className="shrink-0 text-muted-foreground" /> <span className="truncate">{p.titulo}</span>
                    </div>
                  </ContextMenuTrigger>
                  <MenuContextoPendiente p={p} />
                </ContextMenu>
              ))}
              {!backlog.length && <p className="px-1 text-xs text-muted-foreground">Nada pendiente sin fecha.</p>}
            </Card>
          )}
          <Card className="min-h-0 flex-1 overflow-auto p-2 scroll-thin">
            <div style={{ minWidth: anchoMinCol ? 48 + diasVisibles.length * anchoMinCol : undefined }}>
              {diasVisibles.some(iso => todoElDiaDe(iso).length > 0) && (
                <div className="mb-1 flex gap-2 border-b pb-1" style={{ marginLeft: modoVista === 'semana' ? 48 : 0 }}>
                  {diasVisibles.map(iso => (
                    <div key={iso} className="flex-1 space-y-0.5" style={{ minWidth: anchoMinCol }}>
                      {todoElDiaDe(iso).map(ev => (
                        <div key={ev.cuentaId + ev.id} onClick={() => setVerGoogle(ev)} className="cursor-pointer truncate rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted-foreground/20">🔒 {ev.titulo}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {modoVista === 'semana' && (
                <div className="mb-1 flex gap-2" style={{ marginLeft: 48 }}>
                  {diasVisibles.map(iso => {
                    const d = new Date(iso + 'T00:00:00'); const esHoy = iso === hoyISO()
                    return <div key={iso} className={'flex-1 text-center text-[11px] font-bold ' + (esHoy ? 'text-primary' : 'text-muted-foreground')} style={{ minWidth: anchoMinCol }}>{DIAS_CORTOS[d.getDay()]} {d.getDate()}</div>
                  })}
                </div>
              )}
              <div className="flex">
                <div className="w-12 shrink-0">
                  {horas.map(h => <div key={h} style={{ height: PX_HORA }} className="text-[11px] text-muted-foreground">{String(h).padStart(2, '0')}:00</div>)}
                </div>
                <div className="flex flex-1 gap-2">
                  {diasVisibles.map(iso => renderColumnaDia(iso))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {sincronizando && <div className="fixed bottom-4 right-4 z-30 rounded-full bg-card px-3 py-1.5 text-xs shadow-lg">Sincronizando con Google Calendar…</div>}

      <Dialog open={!!nuevo} onOpenChange={o => { if (!o) setNuevo(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Nuevo evento {nuevo ? `· ${nuevo.hora}` : ''}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input autoFocus value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} placeholder="Ej: Junta con el equipo" onKeyDown={e => { if (e.key === 'Enter') crearEventoSuelto() }} />
            <Select value={nuevoDuracion} onValueChange={setNuevoDuracion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNuevo(null)}>Cancelar</Button>
            <Button onClick={crearEventoSuelto} disabled={!nuevoTitulo.trim()}>Crear evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editando} onOpenChange={o => { if (!o) setEditando(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Editar evento</DialogTitle></DialogHeader>
          {editando && (
            <div className="space-y-3">
              <Input autoFocus value={editando.titulo} onChange={e => setEditando({ ...editando, titulo: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="time" value={editando.hora} onChange={e => setEditando({ ...editando, hora: e.target.value })} />
                <Select value={String(editando.duracionMin)} onValueChange={v => setEditando({ ...editando, duracionMin: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1.5 horas</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex items-center sm:justify-between">
            <Button variant="ghost" size="sm" className="text-destructive" onClick={borrarEdicion}><X size={14} className="mr-1" /> Eliminar</Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button>
              <Button onClick={guardarEdicion}>Guardar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!verGoogle} onOpenChange={o => { if (!o) setVerGoogle(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-1.5 text-base">🔒 {verGoogle?.titulo}</DialogTitle></DialogHeader>
          {verGoogle && (
            <div className="space-y-1.5 text-sm">
              <div className="text-muted-foreground">
                {verGoogle.todoElDia ? 'Todo el día' : verGoogle.inicio && (
                  <>
                    {new Date(verGoogle.inicio).toLocaleDateString([], { day: 'numeric', month: 'long' })}
                    {' · '}{new Date(verGoogle.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {verGoogle.fin && ` – ${new Date(verGoogle.fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={'h-1.5 w-1.5 rounded-full ' + colorDeCuenta(verGoogle.cuentaId)} /> {verGoogle.email}
              </div>
              <p className="text-[11px] text-muted-foreground">Creado directo en Google Calendar — para editarlo o moverlo, hazlo desde ahí.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setVerGoogle(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!eventoAEliminar}
        onOpenChange={o => { if (!o) setEventoAEliminar(null) }}
        titulo="Eliminar evento"
        descripcion={`"${eventoAEliminar?.titulo || ''}" se eliminará${eventoAEliminar?.googleEventos && Object.keys(eventoAEliminar.googleEventos).length ? ' también de Google Calendar' : ''}.`}
        onConfirmar={() => { if (eventoAEliminar) eliminarEventoSuelto(eventoAEliminar) }}
      />
    </div>
  )
}
