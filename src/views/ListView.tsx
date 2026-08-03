import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/store'
import type { Pendiente, Adjunto } from '@/types'
import { ESTADOS, PROYECTO_COLORES } from '@/types'
import type { FiltroFecha } from '@/types'
export type { FiltroFecha } from '@/types'
import { googleCalendarUrl, hoyISO, progresoSub, vencido, describirRepeticion, activo } from '@/lib/app-utils'
import { useIsMobile } from '@/hooks/use-is-mobile'
import TaskRow from '@/components/TaskRow'
import PosponerMenu from '@/components/PosponerMenu'
import AdjuntosUI, { Miniatura } from '@/components/AdjuntosUI'
import { subirAdjunto } from '@/lib/adjuntos'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, StickyNote, Search, SlidersHorizontal, ChevronLeft, CalendarPlus, Send, User, Calendar, ImagePlus, X } from 'lucide-react'

function TaskDetail({ detalle, onBack, mobile }: { detalle: Pendiente; onBack: () => void; mobile: boolean }) {
  const { abrirModal, eliminarPendiente, toggleSubtarea, setNotaActualId, agregarComentario, actualizarPendiente, proyectos } = useApp()
  const proyectoDetalle = detalle.proyectoId ? proyectos.find(x => x.id === detalle.proyectoId) : null
  const [com, setCom] = useState('')
  const [comImgs, setComImgs] = useState<Adjunto[]>([])
  const sub = progresoSub(detalle)
  const gcal = googleCalendarUrl(detalle.titulo, detalle.fechaLimite, detalle.hora, detalle.descripcion)
  const enviarCom = () => {
    if (!com.trim() && !comImgs.length) return
    agregarComentario(detalle.id, com, comImgs)
    setCom(''); setComImgs([])
  }
  const adjuntarImagenCom = async (file: File) => {
    try { const a = await subirAdjunto(file, detalle.id); setComImgs(prev => [...prev, a]) }
    catch { /* noop */ }
  }
  const onPasteCom = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items || []
    for (const it of items) {
      if (it.type.startsWith('image/')) { const f = it.getAsFile(); if (f) adjuntarImagenCom(f) }
    }
  }
  const elegirImagenCom = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'
    inp.onchange = () => { const f = inp.files?.[0]; if (f) adjuntarImagenCom(f) }
    inp.click()
  }

  return (
    <div className="flex h-full flex-col">
      {mobile && (
        <div className="flex items-center gap-2 border-b p-2">
          <Button size="sm" variant="ghost" onClick={onBack} className="px-2"><ChevronLeft size={18} /> Volver</Button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-5 scroll-thin">
        <div className="flex items-start justify-between gap-2">
          <h2 className={'text-lg font-bold ' + (detalle.estado === 'completado' ? 'linea-completada' : '')}>{detalle.titulo}</h2>
          <div className="flex shrink-0 gap-1">
            <PosponerMenu id={detalle.id} variant="secondary" />
            <Button size="sm" variant="secondary" onClick={() => abrirModal(detalle.id)}><Pencil size={13} className="mr-1" />Editar</Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { eliminarPendiente(detalle.id); onBack() }}><Trash2 size={13} /></Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <span className={'rounded-full px-2 py-0.5 ' + ESTADOS[detalle.estado].badge}>{ESTADOS[detalle.estado].label}</span>
          <Badge variant="secondary">Prioridad: {detalle.prioridad}</Badge>
          {proyectoDetalle
            ? <Badge variant="secondary"><span className={'mr-1 inline-block h-2 w-2 rounded-full ' + (PROYECTO_COLORES[proyectoDetalle.color]?.dot || '')} />{proyectoDetalle.nombre}</Badge>
            : detalle.proyecto && <Badge variant="secondary">📁 {detalle.proyecto}</Badge>}
          {detalle.repetir && <Badge variant="secondary">🔁 {describirRepeticion(detalle.repetir)}</Badge>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-muted-foreground">Solicita:</span> {detalle.solicitante || '—'}</div>
          <div><span className="text-muted-foreground">Responsable:</span> {detalle.responsable || '—'}</div>
          <div><span className="text-muted-foreground">Fecha límite:</span> {detalle.fechaLimite || '—'}{detalle.hora ? ' ' + detalle.hora : ''} {vencido(detalle) && <span className="text-red-500">(vencido)</span>}</div>
          <div><span className="text-muted-foreground">Creado:</span> {new Date(detalle.creado).toLocaleDateString()}</div>
        </div>

        {gcal && (
          <a href={gcal} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10">
            <CalendarPlus size={14} /> Agregar a Google Calendar
          </a>
        )}

        {detalle.descripcion && <div className="mt-3 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{detalle.descripcion}</div>}
        {detalle.origenNota && (
          <button onClick={() => setNotaActualId(detalle.origenNota!.notaId)} className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
            <StickyNote size={13} /> Esta tarea vive también en una nota
          </button>
        )}

        {/* Subtareas */}
        <div className="mt-4">
          <div className="mb-1 text-xs font-bold">Subtareas {sub && `(${sub.hechas}/${sub.total})`}</div>
          {sub && <div className="mb-2 h-1.5 w-full rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: sub.pct + '%' }} /></div>}
          <div className="space-y-1">
            {detalle.subtareas.map(s => (
              <div key={s.id} className="flex items-start gap-2 rounded-md border px-2 py-1.5 text-sm">
                <Checkbox checked={s.completada} onCheckedChange={() => toggleSubtarea(detalle.id, s.id)} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className={s.completada ? 'linea-completada' : ''}>{s.texto}</span>
                  {(s.responsable || s.fechaLimite) && (
                    <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      {s.responsable && <span className="inline-flex items-center gap-0.5"><User size={9} />{s.responsable}</span>}
                      {s.fechaLimite && <span className="inline-flex items-center gap-0.5"><Calendar size={9} />{s.fechaLimite}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!detalle.subtareas.length && <p className="text-xs text-muted-foreground">Sin subtareas.</p>}
          </div>
          {sub && sub.hechas < sub.total && <p className="mt-1 text-[10px] text-amber-600">⚠ No se puede completar hasta terminar las subtareas.</p>}
        </div>

        {/* Adjuntos */}
        <div className="mt-4">
          <div className="mb-1 text-xs font-bold">Adjuntos</div>
          <AdjuntosUI adjuntos={detalle.adjuntos || []} taskId={detalle.id} onChange={a => actualizarPendiente(detalle.id, { adjuntos: a })} />
        </div>

        {detalle.etiquetas.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">{detalle.etiquetas.map(e => <span key={e} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">#{e}</span>)}</div>
        )}

        {/* Comentarios + historial */}
        <div className="mt-4">
          <div className="mb-1 text-xs font-bold">Comentarios e historial</div>
          <div className="space-y-1">
            {(detalle.comentarios || []).map((c, i) => (
              <div key={i} className="rounded bg-muted p-1.5 text-xs">
                <div><b>{c.autor}:</b> {c.texto} <span className="text-muted-foreground">· {new Date(c.fecha).toLocaleString()}</span></div>
                {c.adjuntos && c.adjuntos.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">{c.adjuntos.map(a => <Miniatura key={a.id} a={a} />)}</div>
                )}
              </div>
            ))}
            {!(detalle.comentarios || []).length && <p className="text-xs text-muted-foreground">Aún no hay comentarios.</p>}
          </div>
          {comImgs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {comImgs.map(a => (
                <div key={a.id} className="relative">
                  <Miniatura a={a} />
                  <button onClick={() => setComImgs(prev => prev.filter(x => x.id !== a.id))} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Input value={com} onChange={e => setCom(e.target.value)} onPaste={onPasteCom} onKeyDown={e => { if (e.key === 'Enter') enviarCom() }} placeholder="Comenta… (pega una captura con Ctrl+V)" className="h-8 text-xs" />
            <Button size="sm" variant="secondary" onClick={elegirImagenCom} title="Adjuntar captura"><ImagePlus size={13} /></Button>
            <Button size="sm" onClick={enviarCom}><Send size={13} /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const LS_FILTROS = 'pn_lista_filtros'
interface FiltrosGuardados { fEstado: string; fPrioridad: string; fResp: string; orden: string; grupo: string; verSub: boolean }
const filtrosPorDefecto: FiltrosGuardados = { fEstado: 'todos', fPrioridad: 'todos', fResp: 'todos', orden: 'creacion_desc', grupo: 'ninguno', verSub: true }
function cargarFiltros(): FiltrosGuardados {
  try { const raw = localStorage.getItem(LS_FILTROS); if (raw) return { ...filtrosPorDefecto, ...JSON.parse(raw) } } catch { /* noop */ }
  return filtrosPorDefecto
}

export default function ListView({ filtroFecha, setFiltroFecha }: { filtroFecha: FiltroFecha; setFiltroFecha: (f: FiltroFecha) => void }) {
  const { pendientes, personas, toggleSubtarea, abrirModal } = useApp()
  const isMobile = useIsMobile()
  const [q, setQ] = useState('')
  const [fEstado, setFEstado] = useState(() => cargarFiltros().fEstado)
  const [fPrioridad, setFPrioridad] = useState(() => cargarFiltros().fPrioridad)
  const [fResp, setFResp] = useState(() => cargarFiltros().fResp)
  const [orden, setOrden] = useState(() => cargarFiltros().orden)
  const [grupo, setGrupo] = useState(() => cargarFiltros().grupo)
  const [verSub, setVerSub] = useState(() => cargarFiltros().verSub)
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [mostrarArchivados, setMostrarArchivados] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(LS_FILTROS, JSON.stringify({ fEstado, fPrioridad, fResp, orden, grupo, verSub })) } catch { /* noop */ }
  }, [fEstado, fPrioridad, fResp, orden, grupo, verSub])

  const hayFiltrosActivos = q !== '' || fEstado !== 'todos' || fPrioridad !== 'todos' || fResp !== 'todos' || filtroFecha !== 'todos'
  const limpiarFiltros = () => { setQ(''); setFEstado('todos'); setFPrioridad('todos'); setFResp('todos'); setFiltroFecha('todos') }

  const pasaFecha = (p: Pendiente) => {
    const h = hoyISO()
    if (filtroFecha === 'abiertos') return p.estado !== 'completado'
    if (filtroFecha === 'vencidos') return vencido(p)
    if (filtroFecha === 'hoy') return p.fechaLimite === h
    if (filtroFecha === 'semana') {
      if (!p.fechaLimite) return false
      const diff = (new Date(p.fechaLimite + 'T00:00').getTime() - new Date(h + 'T00:00').getTime()) / 86400000
      return diff >= 0 && diff <= 7
    }
    return true
  }

  const filtrados = useMemo(() => {
    const ql = q.toLowerCase()
    const rank = { Alta: 0, Media: 1, Baja: 2 } as Record<string, number>
    return pendientes
      .filter(p => {
        if (ql && !(p.titulo + ' ' + p.descripcion + ' ' + p.solicitante + ' ' + p.responsable + ' ' + p.etiquetas.join(' ')).toLowerCase().includes(ql)) return false
        if (fEstado !== 'todos' && p.estado !== fEstado) return false
        if (fPrioridad !== 'todos' && p.prioridad !== fPrioridad) return false
        if (fResp !== 'todos' && p.responsable !== fResp) return false
        if (mostrarArchivados) return !!p.archivado
        if (!activo(p)) return false
        return pasaFecha(p)
      })
      .sort((a, b) => {
        if (orden === 'fecha_asc') return (a.fechaLimite || '9999').localeCompare(b.fechaLimite || '9999')
        if (orden === 'prioridad') return rank[a.prioridad] - rank[b.prioridad]
        if (orden === 'titulo') return a.titulo.localeCompare(b.titulo)
        return new Date(b.creado).getTime() - new Date(a.creado).getTime()
      })
  }, [pendientes, q, fEstado, fPrioridad, fResp, orden, filtroFecha, mostrarArchivados]) // eslint-disable-line react-hooks/exhaustive-deps

  const grupos = useMemo(() => {
    if (grupo === 'ninguno') return null
    const g: Record<string, Pendiente[]> = {}
    filtrados.forEach(p => {
      const k = grupo === 'estado' ? ESTADOS[p.estado].label : grupo === 'prioridad' ? p.prioridad : (p.responsable || 'Sin responsable')
      ;(g[k] = g[k] || []).push(p)
    })
    return g
  }, [filtrados, grupo])

  // Si el pendiente seleccionado quedó fuera de los filtros actuales, se deja de mostrar
  // su detalle (derivado, no vía efecto, para no encadenar renders).
  const detalleId2 = detalleId && filtrados.some(p => p.id === detalleId) ? detalleId : null
  const detalle = pendientes.find(p => p.id === detalleId2) || null

  if (isMobile && detalle) {
    return <div className="h-full rounded-xl border bg-card"><TaskDetail detalle={detalle} mobile onBack={() => setDetalleId(null)} /></div>
  }

  // Subtareas mostradas bajo cada pendiente, diferenciadas
  const subtareasDe = (p: Pendiente) =>
    verSub && p.subtareas.length > 0 ? (
      <div className="ml-7 space-y-0.5 border-l-2 border-dashed border-muted pl-2">
        {p.subtareas.map(s => (
          <div key={s.id} className="flex items-center gap-2 py-0.5 text-xs">
            <Checkbox checked={s.completada} onCheckedChange={() => toggleSubtarea(p.id, s.id)} onClick={e => e.stopPropagation()} className="h-3.5 w-3.5" />
            <span className="rounded bg-muted px-1 text-[9px] uppercase text-muted-foreground">sub</span>
            <span className={'flex-1 truncate ' + (s.completada ? 'linea-completada' : '')}>{s.texto}</span>
            {s.responsable && <span className="text-[10px] text-muted-foreground">👤{s.responsable}</span>}
            {s.fechaLimite && <span className="text-[10px] text-muted-foreground">📅{s.fechaLimite}</span>}
          </div>
        ))}
      </div>
    ) : null

  const itemConSub = (p: Pendiente) => (
    <div key={p.id} className="space-y-0.5">
      <TaskRow p={p} seleccionado={p.id === detalleId} onClick={() => setDetalleId(p.id)} modoArchivados={mostrarArchivados} />
      {subtareasDe(p)}
    </div>
  )

  const chips: { f: FiltroFecha; label: string }[] = [
    { f: 'todos', label: 'Todos' }, { f: 'abiertos', label: 'Abiertos' },
    { f: 'vencidos', label: '⚠ Vencidos' }, { f: 'hoy', label: 'Hoy' }, { f: 'semana', label: 'Semana' },
  ]

  const filtrosAvanzados = (
    <div className="flex flex-wrap gap-2">
      <Select value={fEstado} onValueChange={setFEstado}><SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Estado: todos</SelectItem><SelectItem value="pendiente">Pendiente</SelectItem><SelectItem value="en_progreso">En progreso</SelectItem><SelectItem value="bloqueado">Bloqueado</SelectItem><SelectItem value="completado">Completado</SelectItem></SelectContent></Select>
      <Select value={fPrioridad} onValueChange={setFPrioridad}><SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Prioridad: todas</SelectItem><SelectItem value="Alta">Alta</SelectItem><SelectItem value="Media">Media</SelectItem><SelectItem value="Baja">Baja</SelectItem></SelectContent></Select>
      <Select value={fResp} onValueChange={setFResp}><SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Responsable: todos</SelectItem>{personas.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
      <Select value={orden} onValueChange={setOrden}><SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="creacion_desc">Recientes</SelectItem><SelectItem value="fecha_asc">Por fecha límite</SelectItem><SelectItem value="prioridad">Por prioridad</SelectItem><SelectItem value="titulo">A–Z</SelectItem></SelectContent></Select>
      <Select value={grupo} onValueChange={setGrupo}><SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ninguno">Agrupar: no</SelectItem><SelectItem value="estado">Por estado</SelectItem><SelectItem value="prioridad">Por prioridad</SelectItem><SelectItem value="responsable">Por responsable</SelectItem></SelectContent></Select>
      <button onClick={() => setVerSub(v => !v)} className={'rounded-md border px-2 text-xs ' + (verSub ? 'border-primary bg-primary/10 text-primary' : '')}>Subtareas</button>
    </div>
  )

  const listado = (
    <div className="flex-1 space-y-1 overflow-y-auto pr-1 scroll-thin">
      {!filtrados.length && (
        <div className="flex flex-col items-center gap-2 p-6 text-center text-xs text-muted-foreground">
          <p>Sin pendientes que coincidan.</p>
          <div className="flex gap-2">
            {hayFiltrosActivos && <Button size="sm" variant="secondary" onClick={limpiarFiltros}>Limpiar filtros</Button>}
            <Button size="sm" onClick={() => abrirModal()}>Crear pendiente</Button>
          </div>
        </div>
      )}
      {grupos
        ? Object.entries(grupos).map(([k, items]) => (
            <div key={k}>
              <div className="mb-1 mt-2 text-[11px] font-bold uppercase text-muted-foreground">{k} ({items.length})</div>
              <div className="space-y-1">{items.map(itemConSub)}</div>
            </div>
          ))
        : filtrados.map(itemConSub)}
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar..." className="h-8 pl-8 text-xs" />
          </div>
          <Button size="sm" variant={filtrosAbiertos || hayFiltrosActivos ? 'default' : 'secondary'} className="relative h-8 shrink-0 md:hidden" onClick={() => setFiltrosAbiertos(v => !v)}>
            <SlidersHorizontal size={14} />
            {hayFiltrosActivos && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />}
          </Button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{filtrados.length} resultado{filtrados.length === 1 ? '' : 's'}</span>
          {hayFiltrosActivos && <button onClick={limpiarFiltros} className="font-medium text-primary hover:underline">Limpiar filtros</button>}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scroll-thin">
          {chips.map(c => (
            <button key={c.f} disabled={mostrarArchivados} onClick={() => setFiltroFecha(c.f)}
              className={'shrink-0 rounded-full border px-2.5 py-1 text-[11px] disabled:opacity-40 ' + (!mostrarArchivados && filtroFecha === c.f ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>{c.label}</button>
          ))}
          <button onClick={() => setMostrarArchivados(v => !v)}
            className={'shrink-0 rounded-full border px-2.5 py-1 text-[11px] ' + (mostrarArchivados ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>🗄 Archivados</button>
        </div>
        <div className="hidden md:block">{filtrosAvanzados}</div>
        {filtrosAbiertos && <div className="md:hidden">{filtrosAvanzados}</div>}
      </div>

      {isMobile ? listado : (
        <div className="flex min-h-0 flex-1 gap-3">
          <div className="flex w-2/5 min-w-[260px] max-w-md flex-col">{listado}</div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-card">
            {detalle ? <TaskDetail detalle={detalle} mobile={false} onBack={() => setDetalleId(null)} /> : <div className="p-8 text-center text-sm text-muted-foreground">Selecciona un pendiente para ver el detalle.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
