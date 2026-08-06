import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/store'
import type { Pendiente } from '@/types'
import { PROYECTO_COLORES } from '@/types'
import type { FiltroFecha } from '@/types'
export type { FiltroFecha } from '@/types'
import { hoyISO, vencido, activo, estaBloqueado } from '@/lib/app-utils'
import { columnaDe, idColumnaCompletado } from '@/lib/columnas'
import { useIsMobile } from '@/hooks/use-is-mobile'
import TaskRow from '@/components/TaskRow'
import PosponerMenu from '@/components/PosponerMenu'
import PendienteCuerpo from '@/components/PendienteCuerpo'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Trash2, Search, SlidersHorizontal, ChevronLeft, ChevronDown, Bookmark, BookmarkPlus, X } from 'lucide-react'

function TaskDetail({ detalle, onBack, mobile }: { detalle: Pendiente; onBack: () => void; mobile: boolean }) {
  const { abrirModal, eliminarPendiente, columnas } = useApp()
  const idCompletado = idColumnaCompletado(columnas)

  return (
    <div className="flex h-full flex-col">
      {mobile && (
        <div className="flex items-center gap-2 border-b p-2">
          <Button size="sm" variant="ghost" onClick={onBack} className="px-2"><ChevronLeft size={18} /> Volver</Button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-5 scroll-thin">
        <div className="flex items-start justify-between gap-2">
          <h2 className={'text-lg font-bold ' + (detalle.estado === idCompletado ? 'linea-completada' : '')}>{detalle.titulo}</h2>
          <div className="flex shrink-0 gap-1">
            <PosponerMenu id={detalle.id} variant="secondary" />
            <Button size="sm" variant="secondary" onClick={() => abrirModal(detalle.id)}><Pencil size={13} className="mr-1" />Editar</Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { eliminarPendiente(detalle.id); onBack() }}><Trash2 size={13} /></Button>
          </div>
        </div>

        <div className="mt-2">
          <PendienteCuerpo
            pendiente={detalle}
            destacarOrigenNota
            mostrarCreado
          />
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
  const { pendientes, personas, proyectos, toggleSubtarea, abrirModal, columnas, filtrosGuardados, crearFiltroGuardado, eliminarFiltroGuardado, filtroActivoId, setFiltroActivoId } = useApp()
  const idCompletado = idColumnaCompletado(columnas)
  const [gruposColapsados, setGruposColapsados] = useState<Set<string>>(new Set())
  const toggleGrupo = (k: string) => setGruposColapsados(prev => { const s = new Set(prev); if (s.has(k)) s.delete(k); else s.add(k); return s })
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
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const [guardarDlg, setGuardarDlg] = useState(false)
  const [nombreFiltro, setNombreFiltro] = useState('')
  const [atajoFiltro, setAtajoFiltro] = useState<string>('__ninguno')

  // Un atajo global (Ctrl+Shift+1-4, ver App.tsx) navega aquí y setea `filtroActivoId`: aplicamos
  // sus criterios al estado local de esta vista, que es quien realmente filtra/ordena/agrupa.
  useEffect(() => {
    if (!filtroActivoId) return
    const f = filtrosGuardados.find(x => x.id === filtroActivoId)
    if (!f) return
    setQ(f.criterios.q); setFEstado(f.criterios.fEstado); setFPrioridad(f.criterios.fPrioridad)
    setFResp(f.criterios.fResp); setOrden(f.criterios.orden); setGrupo(f.criterios.grupo)
    setFiltroFecha(f.criterios.filtroFecha)
  }, [filtroActivoId, filtrosGuardados, setFiltroFecha])

  const guardarFiltroActual = () => {
    const n = nombreFiltro.trim()
    if (!n) return
    const atajo = atajoFiltro === '__ninguno' ? undefined : (atajoFiltro as '1' | '2' | '3' | '4')
    crearFiltroGuardado(n, { q, fEstado, fPrioridad, fResp, orden, grupo, filtroFecha }, atajo)
    setGuardarDlg(false); setNombreFiltro(''); setAtajoFiltro('__ninguno')
  }

  useEffect(() => {
    try { localStorage.setItem(LS_FILTROS, JSON.stringify({ fEstado, fPrioridad, fResp, orden, grupo, verSub })) } catch { /* noop */ }
  }, [fEstado, fPrioridad, fResp, orden, grupo, verSub])

  const hayFiltrosActivos = q !== '' || fEstado !== 'todos' || fPrioridad !== 'todos' || fResp !== 'todos' || filtroFecha !== 'todos'
  const limpiarFiltros = () => { setQ(''); setFEstado('todos'); setFPrioridad('todos'); setFResp('todos'); setFiltroFecha('todos') }

  const pasaFecha = (p: Pendiente) => {
    const h = hoyISO()
    if (filtroFecha === 'abiertos') return p.estado !== idCompletado
    if (filtroFecha === 'vencidos') return vencido(p, idCompletado)
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
        if (soloDisponibles && estaBloqueado(p, pendientes, idCompletado)) return false
        return pasaFecha(p)
      })
      .sort((a, b) => {
        if (orden === 'fecha_asc') return (a.fechaLimite || '9999').localeCompare(b.fechaLimite || '9999')
        if (orden === 'prioridad') return rank[a.prioridad] - rank[b.prioridad]
        if (orden === 'titulo') return a.titulo.localeCompare(b.titulo)
        return new Date(b.creado).getTime() - new Date(a.creado).getTime()
      })
  }, [pendientes, q, fEstado, fPrioridad, fResp, orden, filtroFecha, mostrarArchivados, soloDisponibles, idCompletado]) // eslint-disable-line react-hooks/exhaustive-deps

  const grupos = useMemo(() => {
    if (grupo === 'ninguno') return null
    const g: Record<string, Pendiente[]> = {}
    filtrados.forEach(p => {
      const k = grupo === 'estado' ? columnaDe(columnas, p.estado).nombre
        : grupo === 'prioridad' ? p.prioridad
        : grupo === 'proyecto' ? (proyectos.find(pr => pr.id === p.proyectoId)?.nombre || 'Sin proyecto')
        : (p.responsable || 'Sin responsable')
      ;(g[k] = g[k] || []).push(p)
    })
    return g
  }, [filtrados, grupo, columnas, proyectos])
  // Punto de color del proyecto para el encabezado de cada grupo (solo cuando se agrupa por proyecto).
  const colorDeGrupo = (k: string): string | null => {
    if (grupo !== 'proyecto') return null
    const pr = proyectos.find(x => x.nombre === k)
    return pr ? (PROYECTO_COLORES[pr.color]?.dot || null) : null
  }

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
      <Select value={fEstado} onValueChange={setFEstado}><SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Estado: todos</SelectItem>{columnas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent></Select>
      <Select value={fPrioridad} onValueChange={setFPrioridad}><SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Prioridad: todas</SelectItem><SelectItem value="Alta">Alta</SelectItem><SelectItem value="Media">Media</SelectItem><SelectItem value="Baja">Baja</SelectItem></SelectContent></Select>
      <Select value={fResp} onValueChange={setFResp}><SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Responsable: todos</SelectItem>{personas.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
      <Select value={orden} onValueChange={setOrden}><SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="creacion_desc">Recientes</SelectItem><SelectItem value="fecha_asc">Por fecha límite</SelectItem><SelectItem value="prioridad">Por prioridad</SelectItem><SelectItem value="titulo">A–Z</SelectItem></SelectContent></Select>
      <Select value={grupo} onValueChange={setGrupo}><SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ninguno">Agrupar: no</SelectItem><SelectItem value="estado">Por estado</SelectItem><SelectItem value="prioridad">Por prioridad</SelectItem><SelectItem value="responsable">Por responsable</SelectItem><SelectItem value="proyecto">Por proyecto</SelectItem></SelectContent></Select>
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
        ? Object.entries(grupos).map(([k, items]) => {
            const colapsado = gruposColapsados.has(k)
            const dot = colorDeGrupo(k)
            return (
              <div key={k}>
                <button onClick={() => toggleGrupo(k)} className="mb-1 mt-2 flex w-full items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground hover:text-foreground">
                  <ChevronDown size={12} className={'shrink-0 transition-transform ' + (colapsado ? '-rotate-90' : '')} />
                  {dot && <span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + dot} />}
                  <span className="truncate">{k}</span> <span className="font-normal normal-case">({items.length})</span>
                </button>
                {!colapsado && (
                  <div className="ml-4 space-y-1 border-l-2 border-dashed border-muted pl-2">{items.map(itemConSub)}</div>
                )}
              </div>
            )
          })
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
          <button disabled={mostrarArchivados} onClick={() => setSoloDisponibles(v => !v)} title="Oculta pendientes bloqueados por otros sin completar"
            className={'shrink-0 rounded-full border px-2.5 py-1 text-[11px] disabled:opacity-40 ' + (soloDisponibles ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>🔓 Disponibles</button>
        </div>
        <div className="hidden md:block">{filtrosAvanzados}</div>
        {filtrosAbiertos && <div className="md:hidden">{filtrosAvanzados}</div>}

        {/* Filtros guardados / smart lists (Fase 8.3) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filtrosGuardados.map(f => (
            <span key={f.id} className={'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ' + (filtroActivoId === f.id ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent')}>
              <button onClick={() => setFiltroActivoId(f.id)} className="flex items-center gap-1">
                <Bookmark size={10} />{f.nombre}{f.atajo && <kbd className="ml-0.5 rounded bg-muted px-1 text-[9px]">⇧{f.atajo}</kbd>}
              </button>
              <button onClick={() => eliminarFiltroGuardado(f.id)} aria-label={'Eliminar filtro ' + f.nombre} className="hover:text-destructive"><X size={9} /></button>
            </span>
          ))}
          <button onClick={() => setGuardarDlg(true)} className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground">
            <BookmarkPlus size={11} /> Guardar filtro actual
          </button>
        </div>
      </div>

      <Dialog open={guardarDlg} onOpenChange={setGuardarDlg}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="text-base">Guardar filtro actual</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input autoFocus value={nombreFiltro} onChange={e => setNombreFiltro(e.target.value)} placeholder="Nombre (ej. Vencidos de Trabajo)"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); guardarFiltroActual() } }} />
            <div className="space-y-1">
              <label className="text-[11px] uppercase text-muted-foreground">Atajo (opcional)</label>
              <Select value={atajoFiltro} onValueChange={setAtajoFiltro}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ninguno">Ninguno</SelectItem>
                  {(['1', '2', '3', '4'] as const).map(n => (
                    <SelectItem key={n} value={n}>Ctrl+Shift+{n}{filtrosGuardados.some(f => f.atajo === n) && ' (reasigna)'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setGuardarDlg(false)}>Cancelar</Button>
            <Button onClick={guardarFiltroActual}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
