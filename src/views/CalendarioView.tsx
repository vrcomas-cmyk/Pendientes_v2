import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import { useSync } from '@/sync'
import type { EventoCalendario } from '@/types'
import { activo, hoyISO, isoAFechaLegible, nombreMes } from '@/lib/app-utils'
import { columnaDe, colorColumna, idColumnaCompletado } from '@/lib/columnas'
import { listarCuentasGoogle, listarEventosRango, type CuentaGoogle, type EventoGCal } from '@/lib/googleCalendar'
import { sincronizarIncremental, enRango, cacheCaliente } from '@/lib/googleSync'
import { sincronizarEspejoGoogle, sinDuplicarLocal, buscarConflictos, horaCorta, asignarColumnas, pendientesAgendables } from '@/lib/agenda'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import MenuContextoPendiente from '@/components/MenuContextoPendiente'
import { ChevronLeft, ChevronRight, GripVertical, X, CalendarOff, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { parsearEventoRapido } from '@/lib/captura'
import CampoFecha from '@/components/CampoFecha'

type ModoCal = 'dia' | 'semana' | 'mes' | 'anio'
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
  const { pendientes: todosPendientes, eventos: todosEventos, proyectos, actualizarPendiente, crearPendiente, crearEvento, actualizarEvento, eliminarEvento, columnas } = useApp()
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
  const [nuevoModo, setNuevoModo] = useState<'evento' | 'pendiente' | 'existente'>('evento')
  const [nuevoPendienteId, setNuevoPendienteId] = useState('')
  // Selección por arrastre sobre la rejilla (como el calendario de referencia): índices de cuartos de hora.
  const [sel, setSel] = useState<{ iso: string; a: number; b: number } | null>(null)
  const selRef = useRef(sel)
  const arrastroRef = useRef(false)
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [nuevoDuracion, setNuevoDuracion] = useState('30')
  const [nuevoEnviar, setNuevoEnviar] = useState(false)
  const [editando, setEditando] = useState<EventoCalendario | null>(null)
  const [verGoogle, setVerGoogle] = useState<EventoGCal | null>(null)
  const [cargandoGoogle, setCargandoGoogle] = useState(false)
  const [eventoAEliminar, setEventoAEliminar] = useState<EventoCalendario | null>(null)

  const conectado = cuentas.length > 0
  const puedeEnviar = cuentas.some(c => (c.direccion ?? 'ambas') !== 'leer') // alguna cuenta acepta escritura
  const cambiarModo = (m: ModoCal) => { setModoVista(m); try { localStorage.setItem('pn_calendario_modo', m) } catch { /* noop */ } }

  useEffect(() => {
    if (modoLocal) { Promise.resolve().then(() => setCuentas([])); return }
    let vivo = true
    listarCuentasGoogle().then(r => { if (vivo) setCuentas(r.cuentas) }).catch(() => { if (vivo) setCuentas([]) })
    return () => { vivo = false }
  }, [modoLocal])

  const diasVisibles = useMemo(() => {
    if (modoVista === 'anio') return [] // resumen anual: no se cargan eventos de Google de todo el año
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
    const porRango = () => listarEventosRango(desdeISO, hastaISO).then(r => setEventosGoogle(r.eventos)).catch(() => setEventosGoogle([]))
    // Camino principal: copia incremental por syncToken (solo baja lo que cambió). Si la Edge Function
    // aún no soporta la acción, falla, o el rango visible queda fuera de la ventana sincronizada,
    // se cae al listado por rango de siempre.
    // Primera carga (copia fría): pinta ya con el listado por rango y calienta la copia en segundo plano.
    if (!cacheCaliente()) {
      porRango().finally(() => setCargandoGoogle(false))
      sincronizarIncremental().catch(() => { /* sin soporte: se mantiene el listado por rango */ })
      return
    }
    sincronizarIncremental()
      .then(r => {
        if (desdeISO < r.ventana.desde || hastaISO > r.ventana.hasta) return porRango()
        const vivas = new Set(cuentas.map(c => c.id))
        setEventosGoogle(enRango(r.eventos, desdeISO, hastaISO).filter(e => vivas.has(e.cuentaId)))
        if (r.errores) Object.values(r.errores).forEach(m => toast.error(m))
      })
      .catch(porRango)
      .finally(() => setCargandoGoogle(false))
  }
  useEffect(refrescarGoogle, [conectado, claveRango]) // eslint-disable-line react-hooks/exhaustive-deps

  // Eventos remotos que ya están representados localmente (pendiente agendado o EventoCalendario
  // con espejo): se ocultan para no duplicar el chip — el local es el editable/movible.
  const eventosGoogleVisibles = useMemo(() => sinDuplicarLocal(eventosGoogle, pendientes, eventos), [eventosGoogle, pendientes, eventos])

  const fuentesConflicto = { pendientes, eventos, google: eventosGoogleVisibles, idCompletado }
  const conflictosNuevo = useMemo(
    () => (nuevo ? buscarConflictos({ fecha: nuevo.fecha, hora: nuevo.hora, duracionMin: Number(nuevoDuracion) || 30 }, fuentesConflicto) : []),
    [nuevo, nuevoDuracion, pendientes, eventos, eventosGoogleVisibles, idCompletado], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const conflictosEdicion = useMemo(
    () => (editando ? buscarConflictos({ fecha: editando.fecha, hora: editando.hora, duracionMin: editando.duracionMin }, fuentesConflicto, editando.id) : []),
    [editando, pendientes, eventos, eventosGoogleVisibles, idCompletado], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const describir = (c: { titulo: string; inicio: Date; fin: Date; origen: string }) =>
    `${c.origen === 'google' ? '🔒 ' : ''}${c.titulo} (${horaCorta(c.inicio)}–${horaCorta(c.fin)})`

  const avisarErrores = (errores?: Record<string, string>) => {
    if (!errores) return
    Object.entries(errores).forEach(([cid, msg]) => toast.error(`${cuentas.find(c => c.id === cid)?.email || 'una cuenta'}: ${msg}`))
  }

  const pasoDias = modoVista === 'dia' ? 1 : modoVista === 'semana' ? 7 : 0
  const navegar = (dir: -1 | 1) => {
    if (modoVista === 'anio') {
      const [a, m] = fecha.split('-').map(Number)
      setFecha(fechaISO(new Date(a + dir, m - 1, 1)))
    } else if (modoVista === 'mes') {
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
      const previo = { fechaLimite: p.fechaLimite, hora: p.hora, duracionMin: p.duracionMin }
      const choques = buscarConflictos({ fecha: fechaDestino, hora: horaDestino, duracionMin: duracion }, fuentesConflicto, p.id)
      actualizarPendiente(p.id, { fechaLimite: fechaDestino, hora: horaDestino, duracionMin: duracion })
      if (choques.length) toast.warning('Se cruza con: ' + choques.slice(0, 3).map(describir).join(', '), {
        action: { label: 'Deshacer', onClick: () => actualizarPendiente(p.id, previo) },
      })
      // Solo se actualiza en Google si el usuario ya lo había enviado allá (decisión explícita).
      if (!conectado || !p.googleEventos || !Object.keys(p.googleEventos).length) return
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
      const choques = buscarConflictos({ fecha: fechaDestino, hora: horaDestino, duracionMin: ev.duracionMin }, fuentesConflicto, ev.id)
      actualizarEvento(ev.id, { fecha: fechaDestino, hora: horaDestino })
      if (choques.length) toast.warning('Se cruza con: ' + choques.slice(0, 3).map(describir).join(', '), {
        action: { label: 'Deshacer', onClick: () => actualizarEvento(ev.id, { fecha: ev.fecha, hora: ev.hora }) },
      })
      if (!conectado || !ev.googleEventos || !Object.keys(ev.googleEventos).length) return
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

  const abrirNuevo = (fechaSlot: string, horaSlot: string, duracion = 30, modo: 'evento' | 'pendiente' | 'existente' = 'evento') => {
    setNuevo({ fecha: fechaSlot, hora: horaSlot }); setNuevoTitulo(''); setNuevoDuracion(String(duracion)); setNuevoEnviar(false)
    setNuevoModo(modo); setNuevoPendienteId('')
  }
  const aHora = (idx: number) => { const m = HORA_INICIO * 60 + idx * 15; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }

  // Arrastrar sobre la rejilla elige el rango (inicio–fin) y abre el alta con esa duración.
  useEffect(() => { selRef.current = sel }, [sel])
  useEffect(() => {
    if (!sel) return
    const terminar = () => {
      const s = selRef.current
      setSel(null)
      if (!s || s.a === s.b) return // un clic simple lo resuelve onClick (30 min)
      arrastroRef.current = true
      const ini = Math.min(s.a, s.b), n = Math.abs(s.b - s.a) + 1
      abrirNuevo(s.iso, aHora(ini), n * 15)
    }
    window.addEventListener('mouseup', terminar, { once: true })
    return () => window.removeEventListener('mouseup', terminar)
  }, [!!sel]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pendientes que aún no ocupan un horario real (sin fecha o con el marcador 08:00/≤5 min): candidatos a «agendar».
  const agendables = nuevo && nuevoModo === 'existente' ? pendientesAgendables(pendientes, idCompletado) : [] // solo se calcula con el diálogo abierto en ese modo

  const espejar = async (id: string, datos: { titulo: string; fecha: string; hora: string; duracionMin: number; descripcion?: string }, proyectoId?: string) => {
    if (!conectado || !nuevoEnviar) return
    setSincronizando(true)
    try {
      const origenCuentaId = proyectos.find(x => x.id === proyectoId)?.cuentaGoogleId
      const r = await sincronizarEspejoGoogle({}, datos, origenCuentaId)
      actualizarPendiente(id, { googleEventos: r.googleEventos })
      avisarErrores(r.errores)
      refrescarGoogle()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo enviar a Google Calendar') }
    finally { setSincronizando(false) }
  }

  /** Alta rápida desde el calendario: evento, pendiente nuevo o agendar uno que ya existe. */
  const crearDesdeDialogo = async () => {
    if (!nuevo) return
    const dur = Number(nuevoDuracion) || 30
    if (nuevoModo === 'existente') {
      const p = pendientes.find(x => x.id === nuevoPendienteId)
      if (!p) return
      actualizarPendiente(p.id, { fechaLimite: nuevo.fecha, hora: nuevo.hora, duracionMin: dur })
      toast.success(`«${p.titulo}» agendado el ${isoAFechaLegible(nuevo.fecha)} a las ${nuevo.hora}`)
      setNuevo(null)
      await espejar(p.id, { titulo: p.titulo, fecha: nuevo.fecha, hora: nuevo.hora, duracionMin: dur, descripcion: p.descripcion }, p.proyectoId)
      return
    }
    const texto = nuevoTitulo.trim()
    if (!texto) return
    // Escribir «Junta 3pm por 1h» o «>viernes» ajusta hora/duración/fecha; si el texto no las menciona, manda lo elegido.
    const ev = parsearEventoRapido(texto)
    const titulo = ev?.titulo || texto
    const fecha = ev?.conFecha ? ev.fecha : nuevo.fecha
    const hora = ev?.conHora ? ev.hora : nuevo.hora
    const duracionMin = ev?.conDuracion ? ev.duracionMin : dur
    setNuevo(null)
    if (nuevoModo === 'pendiente') {
      const p = crearPendiente({ titulo, descripcion: ev?.descripcion || '', fechaLimite: fecha, hora, duracionMin })
      toast.success(`Pendiente creado para el ${isoAFechaLegible(fecha)} a las ${hora}`)
      await espejar(p.id, { titulo, fecha, hora, duracionMin })
      return
    }
    const creado = crearEvento({ titulo, descripcion: ev?.descripcion || undefined, fecha, hora, duracionMin })
    if (!conectado || !nuevoEnviar) return
    setSincronizando(true)
    try {
      const r = await sincronizarEspejoGoogle({}, { titulo, fecha, hora, duracionMin })
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
    if (!conectado || !antes?.googleEventos || !Object.keys(antes.googleEventos).length) return
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
    if (modoVista === 'anio') return fecha.slice(0, 4)
    const [a, m] = fecha.split('-').map(Number); return `${nombreMes(m - 1)} ${a}`
  }

  const anchoMinCol = modoVista === 'semana' ? 120 : undefined

  const renderColumnaDia = (iso: string) => {
    const { pends, evs, gs } = bloquesDelDia(iso)
    // Bloques que se cruzan: lado a lado en columnas en vez de apilados uno sobre otro (ilegibles).
    const lanes = asignarColumnas([
      ...pends.map(p => ({ id: 'p' + p.id, ini: minDesdeInicio(p.hora!), fin: minDesdeInicio(p.hora!) + Math.max(p.duracionMin || 15, 20) })),
      ...evs.map(e => ({ id: 'e' + e.id, ini: minDesdeInicio(e.hora), fin: minDesdeInicio(e.hora) + Math.max(e.duracionMin, 20) })),
    ])
    const carril = (id: string): React.CSSProperties => {
      const l = lanes.get(id) ?? { col: 0, cols: 1 }
      return { left: `calc(${(l.col / l.cols) * 100}% + 4px)`, width: `calc(${100 / l.cols}% - 8px)` }
    }
    return (
      <div key={iso} className="relative flex-1" style={{ height: (HORA_FIN - HORA_INICIO) * PX_HORA, minWidth: anchoMinCol }}>
        <div className="absolute inset-0 flex flex-col">
          {horas.map(h => (
            <div key={h} style={{ height: PX_HORA }} className="border-b">
              {CUARTOS.map(q => {
                const idx = (h - HORA_INICIO) * 4 + q / 15
                return (
                  <div key={q} style={{ height: PX_HORA / 4 }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => mover(iso, `${String(h).padStart(2, '0')}:${String(q).padStart(2, '0')}`, e)}
                    onMouseDown={e => { if (e.button === 0) setSel({ iso, a: idx, b: idx }) }}
                    onMouseEnter={() => setSel(s => (s && s.iso === iso ? { ...s, b: idx } : s))}
                    onClick={() => { if (arrastroRef.current) { arrastroRef.current = false; return } abrirNuevo(iso, `${String(h).padStart(2, '0')}:${String(q).padStart(2, '0')}`) }}
                    className="select-none hover:bg-accent/40" />
                )
              })}
            </div>
          ))}
        </div>
        {sel && sel.iso === iso && (
          <div className="pointer-events-none absolute inset-x-1 rounded bg-primary/25 ring-1 ring-primary/60"
            style={{ top: (Math.min(sel.a, sel.b) * PX_HORA) / 4, height: ((Math.abs(sel.b - sel.a) + 1) * PX_HORA) / 4 }} />
        )}
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
                className="absolute cursor-grab overflow-hidden rounded-lg border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[11px] active:cursor-grabbing"
                style={{ top: topPx(p.hora!), height: altoPx(p.duracionMin || 15), ...carril('p' + p.id) }}>
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
                className="absolute cursor-grab overflow-hidden rounded-lg border border-accent2/50 bg-accent2/15 px-1.5 py-0.5 text-[11px] active:cursor-grabbing"
                style={{ top: topPx(e.hora), height: altoPx(e.duracionMin), ...carril('e' + e.id) }}>
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
          {(['dia', 'semana', 'mes', 'anio'] as ModoCal[]).map(m => (
            <button key={m} onClick={() => cambiarModo(m)}
              className={'rounded-md px-3 py-1 text-xs font-medium capitalize ' + (modoVista === m ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
              {m === 'anio' ? 'año' : m}
            </button>
          ))}
        </Card>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navegar(-1)}><ChevronLeft size={15} /></Button>
          <Button variant="secondary" size="sm" onClick={() => setFecha(hoyISO())}>Hoy</Button>
          <Button size="sm" onClick={() => { const d = new Date(); abrirNuevo(fecha, `${String(Math.min(HORA_FIN - 1, Math.max(HORA_INICIO, d.getHours() + 1))).padStart(2, '0')}:00`) }} aria-label="Nuevo en el calendario">
            <Plus size={14} className="mr-1" /> Nuevo
          </Button>
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

      {modoVista === 'anio' ? (
        <Card className="min-h-0 flex-1 overflow-y-auto p-3 scroll-thin">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }, (_, mi) => {
              const anio = Number(fecha.slice(0, 4))
              const primero = new Date(anio, mi, 1)
              const nDias = new Date(anio, mi + 1, 0).getDate()
              const total = (iso: string) => pendientes.filter(p => p.fechaLimite === iso).length + eventos.filter(e => e.fecha === iso).length
              const prefijo = `${anio}-${String(mi + 1).padStart(2, '0')}`
              const delMes = pendientes.filter(p => p.fechaLimite?.startsWith(prefijo)).length + eventos.filter(e => e.fecha.startsWith(prefijo)).length
              return (
                <div key={mi}>
                  <button onClick={() => { setFecha(`${prefijo}-01`); cambiarModo('mes') }} className="mb-1 flex w-full items-baseline justify-between text-left text-xs font-bold capitalize hover:text-primary">
                    <span>{nombreMes(mi)}</span><span className="text-[10px] font-normal text-muted-foreground">{delMes} elemento{delMes === 1 ? '' : 's'}</span>
                  </button>
                  <div className="grid grid-cols-7 gap-0.5 text-center text-[9px]">
                    {DIAS_CORTOS.map(d => <div key={d} className="text-muted-foreground">{d[0]}</div>)}
                    {Array.from({ length: primero.getDay() }, (_, i) => <div key={'v' + i} />)}
                    {Array.from({ length: nDias }, (_, i) => {
                      const iso = `${prefijo}-${String(i + 1).padStart(2, '0')}`
                      const n = total(iso)
                      return (
                        <button key={iso} onClick={() => irADia(iso)} title={n ? `${n} elemento${n === 1 ? '' : 's'}` : undefined}
                          className={'rounded py-0.5 ' + (iso === hoyISO() ? 'ring-1 ring-primary ' : '') + (n === 0 ? 'hover:bg-accent' : n < 3 ? 'bg-primary/20 hover:bg-primary/30' : 'bg-primary/50 text-primary-foreground hover:bg-primary/60')}>
                          {i + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : modoVista === 'mes' ? (
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
          <DialogHeader><DialogTitle className="text-base">Nuevo en el calendario</DialogTitle></DialogHeader>
          {nuevo && (
            <div className="space-y-3">
              <div role="tablist" aria-label="Qué crear" className="flex gap-1">
                {([['evento', 'Evento'], ['pendiente', 'Pendiente'], ['existente', 'Agendar existente']] as const).map(([id, label]) => (
                  <button key={id} role="tab" aria-selected={nuevoModo === id} onClick={() => setNuevoModo(id)}
                    className={'rounded-full px-3 py-1 text-xs font-medium ' + (nuevoModo === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent')}>{label}</button>
                ))}
              </div>
              {nuevoModo === 'existente' ? (
                <select autoFocus value={nuevoPendienteId} onChange={e => setNuevoPendienteId(e.target.value)} aria-label="Pendiente a agendar"
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="">Elige un pendiente…</option>
                  {agendables.map(p => <option key={p.id} value={p.id}>{p.titulo.slice(0, 70)}</option>)}
                </select>
              ) : (
                <Input autoFocus value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)}
                  placeholder={nuevoModo === 'evento' ? 'Ej: Junta con el equipo   (admite «3pm por 1h», «>viernes»)' : 'Ej: Enviar cotización'}
                  onKeyDown={e => { if (e.key === 'Enter') crearDesdeDialogo() }} />
              )}
              <div className="grid grid-cols-2 gap-2">
                <CampoFecha value={nuevo.fecha} onChange={v => setNuevo({ ...nuevo, fecha: v })} placeholder="Fecha" />
                <Input type="time" value={nuevo.hora} onChange={e => setNuevo({ ...nuevo, hora: e.target.value })} aria-label="Hora" />
              </div>
              <Select value={nuevoDuracion} onValueChange={setNuevoDuracion}>
                <SelectTrigger aria-label="Duración"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...new Set(['15', '30', '45', '60', '90', '120', nuevoDuracion])].sort((x, y) => Number(x) - Number(y)).map(m => (
                    <SelectItem key={m} value={m}>{Number(m) % 60 === 0 ? `${Number(m) / 60} h` : Number(m) > 60 ? `${Math.floor(Number(m) / 60)} h ${Number(m) % 60} min` : `${m} min`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {conectado && puedeEnviar && (
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={nuevoEnviar} onChange={e => setNuevoEnviar(e.target.checked)} />
                  Enviar también a Google Calendar
                </label>
              )}
              {conflictosNuevo.length > 0 && (
                <div role="alert" className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-semibold">Se cruza con {conflictosNuevo.length === 1 ? '1 elemento' : `${conflictosNuevo.length} elementos`}:</p>
                  <ul className="list-disc pl-4">{conflictosNuevo.slice(0, 4).map(c => <li key={c.origen + c.id}>{describir(c)}</li>)}</ul>
                  <p className="mt-1 text-[11px]">Puedes cambiar el horario, o crearlo de todos modos.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNuevo(null)}>Cancelar</Button>
            <Button onClick={crearDesdeDialogo} disabled={nuevoModo === 'existente' ? !nuevoPendienteId : !nuevoTitulo.trim()}>
              {conflictosNuevo.length ? 'Crear de todos modos' : nuevoModo === 'existente' ? 'Agendar' : nuevoModo === 'pendiente' ? 'Crear pendiente' : 'Crear evento'}
            </Button>
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
              {conflictosEdicion.length > 0 && (
                <div role="alert" className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-semibold">Se cruza con:</p>
                  <ul className="list-disc pl-4">{conflictosEdicion.slice(0, 4).map(c => <li key={c.origen + c.id}>{describir(c)}</li>)}</ul>
                </div>
              )}
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
