import { useMemo, useState } from 'react'
import { useApp } from '@/store'
import type { Estado, Pendiente } from '@/types'
import { ESTADOS, PRIORIDAD_BORDER, PROYECTO_COLORES, PROYECTO_COLORES_KEYS } from '@/types'
import { hoyISO, isoMasDias, progresoSub, vencido } from '@/lib/app-utils'
import TaskRow from '@/components/TaskRow'
import ProgressRing from '@/components/ProgressRing'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronDown, Plus, StickyNote, User, CheckSquare, X } from 'lucide-react'

/* ============ HOY ============ */
function Seccion({ titulo, color, items, vacio }: { titulo: string; color: string; items: Pendiente[]; vacio: string }) {
  return (
    <div>
      <h3 className={'mb-2 text-xs font-bold ' + color}>{titulo} <span className="font-normal text-muted-foreground">({items.length})</span></h3>
      <div className="space-y-1.5">
        {items.map(p => <TaskRow key={p.id} p={p} />)}
        {!items.length && <p className="text-xs text-muted-foreground">{vacio}</p>}
      </div>
    </div>
  )
}
const NOMBRES_DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
function saludo(): string {
  const hh = new Date().getHours()
  return hh < 12 ? 'Buenos días' : hh < 19 ? 'Buenas tardes' : 'Buenas noches'
}
function etiquetaDia(iso: string): string {
  const h = hoyISO()
  if (iso === h) return 'Hoy'
  if (iso === isoMasDias(-1)) return 'Ayer'
  const d = new Date(iso + 'T00:00')
  return `${NOMBRES_DIAS_LARGO[d.getDay()]} ${iso.slice(5)}`
}

/** Completados recientes agrupados por día — la sensación de logro que hoy no existe: al completar, el
    pendiente simplemente desaparecía de toda vista sin dejar rastro. */
function Registro({ items }: { items: Pendiente[] }) {
  const [abierto, setAbierto] = useState(false)
  const grupos = useMemo(() => {
    const g: Record<string, Pendiente[]> = {}
    items.forEach(p => {
      const iso = (p.fechaCompletado || p.modificado).slice(0, 10)
      ;(g[iso] = g[iso] || []).push(p)
    })
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]))
  }, [items])
  if (!items.length) return null
  return (
    <div>
      <button onClick={() => setAbierto(v => !v)} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <ChevronDown size={13} className={'transition-transform ' + (abierto ? '' : '-rotate-90')} />
        📜 Registro <span className="font-normal">({items.length} en los últimos 14 días)</span>
      </button>
      {abierto && (
        <div className="mt-2 space-y-3">
          {grupos.map(([iso, ps]) => (
            <div key={iso}>
              <h4 className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">{etiquetaDia(iso)}</h4>
              <div className="space-y-1.5">{ps.map(p => <TaskRow key={p.id} p={p} />)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

/** Franja de 7 días (hoy + 6) cruzando TODOS los pendientes, de cualquier proyecto.
    Clic en un día filtra la mini-lista que aparece debajo. */
function FranjaSemanal({ pendientes, diaSel, onSeleccionar }: { pendientes: Pendiente[]; diaSel: string | null; onSeleccionar: (iso: string | null) => void }) {
  const dias = Array.from({ length: 7 }, (_, i) => isoMasDias(i))
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {dias.map((iso, i) => {
        const del = pendientes.filter(p => p.fechaLimite === iso)
        const abiertos = del.filter(p => p.estado !== 'completado').length
        const hechos = del.length - abiertos
        const d = new Date(iso + 'T00:00')
        const activo = diaSel === iso
        return (
          <button key={iso} onClick={() => onSeleccionar(activo ? null : iso)}
            style={{ animationDelay: `${i * 40}ms` }}
            className={'animate-fade-in-up flex flex-col items-center gap-1 rounded-xl border p-2 transition-all hover:-translate-y-0.5 hover:shadow-md ' +
              (activo ? 'border-primary bg-primary/10 ring-1 ring-primary/40' : i === 0 ? 'border-primary/30 bg-primary/5' : 'bg-card')}>
            <span className="text-[10px] font-medium uppercase text-muted-foreground">{DIAS_CORTOS[d.getDay()]}</span>
            <span className="font-display text-base font-semibold">{d.getDate()}</span>
            {del.length > 0 ? (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                {abiertos > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-primary">{abiertos}</span>}
                {hechos > 0 && abiertos === 0 && <span className="text-emerald-600">✓</span>}
              </span>
            ) : <span className="text-[10px] text-muted-foreground/40">·</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Resumen por proyecto: progreso, abiertos y vencidos de un vistazo — clic navega al tablero. */
function ResumenProyectos() {
  const { proyectos, pendientes, setProyectoAbiertoId } = useApp()
  if (!proyectos.length) return null
  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-semibold">Proyectos</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {proyectos.map((p, i) => {
          const items = pendientes.filter(x => x.proyectoId === p.id)
          const completados = items.filter(x => x.estado === 'completado').length
          const abiertos = items.length - completados
          const venc = items.filter(vencido).length
          const pct = items.length ? Math.round((completados / items.length) * 100) : 0
          const colores = PROYECTO_COLORES[p.color] || PROYECTO_COLORES[PROYECTO_COLORES_KEYS[0]]
          return (
            <button key={p.id} onClick={() => setProyectoAbiertoId(p.id)} style={{ animationDelay: `${i * 50}ms` }}
              className="animate-fade-in-up flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md">
              <ProgressRing pct={pct} size={44} stroke={4} color={`hsl(var(--primary))`}>
                <span className="text-[10px] font-semibold">{pct}%</span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + colores.dot} />
                  <span className="truncate text-xs font-semibold">{p.nombre}</span>
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {abiertos} abierto{abiertos === 1 ? '' : 's'}{venc > 0 && <span className="text-red-500"> · {venc} vencido{venc === 1 ? '' : 's'}</span>}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Notas modificadas recientemente — para que Hoy sea de verdad el punto de entrada único. */
function NotasRecientes() {
  const { notas, pendientes, setNotaActualId } = useApp()
  const recientes = [...notas].sort((a, b) => b.modificado.localeCompare(a.modificado)).slice(0, 4)
  if (!recientes.length) return null
  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-semibold">Notas recientes</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {recientes.map((n, i) => {
          const vinculados = pendientes.filter(p => p.origenNota?.notaId === n.id).length
          const extracto = n.contenidoHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90)
          return (
            <button key={n.id} onClick={() => setNotaActualId(n.id)} style={{ animationDelay: `${i * 50}ms` }}
              className="animate-fade-in-up flex flex-col items-start gap-1 rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex w-full items-center gap-1.5">
                <StickyNote size={12} className="shrink-0 text-primary" />
                <span className="truncate text-xs font-semibold">{n.titulo}</span>
                {vinculados > 0 && <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">{vinculados}</span>}
              </div>
              {extracto && <p className="line-clamp-2 text-[11px] text-muted-foreground">{extracto}</p>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function TodayView() {
  const { pendientes } = useApp()
  const [diaSel, setDiaSel] = useState<string | null>(null)
  const h = hoyISO()
  const limite7 = isoMasDias(7)
  const venc = pendientes.filter(vencido)
  const hoy = pendientes.filter(p => p.fechaLimite === h && p.estado !== 'completado')
  const proximos = pendientes.filter(p => p.estado !== 'completado' && p.fechaLimite && p.fechaLimite > h && p.fechaLimite <= limite7)
  const inbox = pendientes.filter(p => !p.fechaLimite && p.estado !== 'completado')
  const limite14 = isoMasDias(-14)
  const registro = pendientes.filter(p => p.estado === 'completado' && (p.fechaCompletado || p.modificado) >= limite14)
    .sort((a, b) => (b.fechaCompletado || b.modificado).localeCompare(a.fechaCompletado || a.modificado))

  const hoyTotal = pendientes.filter(p => p.fechaLimite === h).length
  const hoyHechas = hoyTotal - hoy.length
  const pctHoy = hoyTotal ? Math.round((hoyHechas / hoyTotal) * 100) : 100

  const deDiaSel = diaSel ? pendientes.filter(p => p.fechaLimite === diaSel) : []

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Hero */}
      <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 sm:p-5">
        <ProgressRing pct={pctHoy} size={64} stroke={6}>
          <span className="font-display text-sm font-bold">{pctHoy}%</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold sm:text-2xl">{saludo()}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {hoy.length} para hoy{venc.length > 0 && <span className="text-red-500"> · {venc.length} vencido{venc.length === 1 ? '' : 's'}</span>}
            {hoyTotal > 0 && ` · ${hoyHechas}/${hoyTotal} completadas`}
          </p>
        </div>
      </div>

      <FranjaSemanal pendientes={pendientes} diaSel={diaSel} onSeleccionar={setDiaSel} />

      {diaSel && (
        <div className="rounded-xl border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold text-muted-foreground">{etiquetaDia(diaSel)}</h3>
            <button onClick={() => setDiaSel(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </div>
          <div className="space-y-1.5">
            {deDiaSel.map(p => <TaskRow key={p.id} p={p} />)}
            {!deDiaSel.length && <p className="text-xs text-muted-foreground">Nada agendado ese día.</p>}
          </div>
        </div>
      )}

      <ResumenProyectos />
      <NotasRecientes />

      <div className="space-y-5">
        <Seccion titulo="⚠ Vencidos" color="text-red-500" items={venc} vacio="Nada vencido 🎉" />
        <Seccion titulo="📆 Para hoy" color="text-amber-600" items={hoy} vacio="Nada para hoy." />
        <Seccion titulo="🔜 Próximos 7 días" color="text-blue-600" items={proximos} vacio="Nada agendado esta semana." />
        <Seccion titulo="📥 Sin fecha / Bandeja" color="text-muted-foreground" items={inbox} vacio="Bandeja vacía." />
        <Registro items={registro} />
      </div>
    </div>
  )
}

/* ============ KANBAN ============ */
const COLS: { estado: Estado; bg: string }[] = [
  { estado: 'pendiente', bg: 'bg-muted' },
  { estado: 'en_progreso', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { estado: 'bloqueado', bg: 'bg-red-50 dark:bg-red-900/20' },
  { estado: 'completado', bg: 'bg-green-50 dark:bg-green-900/20' },
]
export function KanbanView() {
  const { pendientes, moverEstado, abrirModal } = useApp()
  const [dragId, setDragId] = useState<string | null>(null)
  return (
    <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-4">
      {COLS.map(col => {
        const items = pendientes.filter(p => p.estado === col.estado)
        return (
          <div key={col.estado}
            className={'flex min-h-[120px] flex-col rounded-lg p-2 ' + col.bg}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (dragId) moverEstado(dragId, col.estado) }}>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-xs font-bold">{ESTADOS[col.estado].label} <span className="font-normal text-muted-foreground">{items.length}</span></h3>
              {col.estado !== 'completado' && (
                <button onClick={() => abrirModal(null, { estado: col.estado })} className="text-muted-foreground hover:text-primary"><Plus size={14} /></button>
              )}
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto scroll-thin">
              {items.map(p => {
                const sub = progresoSub(p)
                return (
                  <div key={p.id} draggable onDragStart={() => setDragId(p.id)} onClick={() => abrirModal(p.id)}
                    className={'cursor-pointer rounded-lg border-l-4 bg-card p-2 shadow-sm ' + (PRIORIDAD_BORDER[p.prioridad] || '')}>
                    <div className={'text-xs font-medium ' + (p.estado === 'completado' ? 'linea-completada' : '')}>{p.titulo}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
                      {p.responsable && <span className="inline-flex items-center gap-0.5"><User size={10} />{p.responsable}</span>}
                      {sub && <span className="inline-flex items-center gap-0.5"><CheckSquare size={10} />{sub.hechas}/{sub.total}</span>}
                      {p.origenNota && <StickyNote size={10} className="text-primary" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ============ CALENDARIO ============ */
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
export function CalendarView() {
  const { pendientes, abrirModal } = useApp()
  const ahora = new Date()
  const [mes, setMes] = useState(ahora.getMonth())
  const [anio, setAnio] = useState(ahora.getFullYear())
  const cambiar = (d: number) => {
    let m = mes + d, a = anio
    if (m < 0) { m = 11; a-- } if (m > 11) { m = 0; a++ }
    setMes(m); setAnio(a)
  }
  const primer = new Date(anio, mes, 1).getDay()
  const dias = new Date(anio, mes + 1, 0).getDate()
  const celdas: (number | null)[] = [...Array(primer).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)]
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => cambiar(-1)}><ChevronLeft size={15} /></Button>
        <span className="text-sm font-bold">{MESES[mes]} {anio}</span>
        <Button variant="secondary" size="sm" onClick={() => cambiar(1)}><ChevronRight size={15} /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {celdas.map((d, i) => {
          if (d === null) return <div key={i} />
          const iso = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const tareas = pendientes.filter(p => p.fechaLimite === iso)
          const esHoy = iso === hoyISO()
          return (
            <div key={i} className={'min-h-[70px] rounded border p-1 text-[10px] ' + (esHoy ? 'border-primary bg-primary/10' : 'bg-card')}>
              <div className={'font-bold ' + (esHoy ? 'text-primary' : '')}>{d}</div>
              {tareas.slice(0, 3).map(p => (
                <div key={p.id} onClick={() => abrirModal(p.id)}
                  className={'mt-0.5 cursor-pointer truncate rounded px-1 ' + ESTADOS[p.estado].badge + (p.estado === 'completado' ? ' line-through opacity-50' : '')}>
                  {p.titulo}
                </div>
              ))}
              {tareas.length > 3 && <div className="text-muted-foreground">+{tareas.length - 3} más</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============ DASHBOARD ============ */
function KPI({ label, value, color, destacado }: { label: string; value: number; color?: string; destacado?: boolean }) {
  return (
    <div className={'rounded-xl border bg-card p-3 ' + (destacado ? 'border-2 border-primary/40' : '')}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={'text-2xl font-bold ' + (color || '')}>{value}</div>
    </div>
  )
}
function Barra({ label, v, max, color }: { label: string; v: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 truncate">{label}</span>
      <div className="h-4 flex-1 rounded-full bg-muted"><div className={'h-4 rounded-full ' + color} style={{ width: (v / max) * 100 + '%' }} /></div>
      <span className="w-6 text-right">{v}</span>
    </div>
  )
}
export function DashboardView() {
  const { pendientes, notas } = useApp()
  const stats = useMemo(() => {
    const abiertos = pendientes.filter(p => p.estado !== 'completado')
    let subPend = 0
    abiertos.forEach(p => p.subtareas.forEach(s => { if (!s.completada) subPend++ }))
    const porP: Record<string, number> = { Alta: 0, Media: 0, Baja: 0 }
    abiertos.forEach(p => porP[p.prioridad]++)
    const porR: Record<string, number> = {}
    abiertos.forEach(p => { const r = p.responsable || 'Sin asignar'; porR[r] = (porR[r] || 0) + 1 })
    const desdeNotas = pendientes.filter(p => p.origenNota).length
    return { abiertos: abiertos.length, vencidos: pendientes.filter(vencido).length, progreso: pendientes.filter(p => p.estado === 'en_progreso').length, completados: pendientes.filter(p => p.estado === 'completado').length, subPend, porP, porR, desdeNotas, notas: notas.length }
  }, [pendientes, notas])
  const maxP = Math.max(1, ...Object.values(stats.porP))
  const maxR = Math.max(1, ...Object.values(stats.porR))
  const colP: Record<string, string> = { Alta: 'bg-red-500', Media: 'bg-amber-400', Baja: 'bg-emerald-400' }
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <KPI label="Total abiertos" value={stats.abiertos} />
        <KPI label="Vencidos" value={stats.vencidos} color="text-red-500" />
        <KPI label="En progreso" value={stats.progreso} color="text-blue-500" />
        <KPI label="Completados" value={stats.completados} color="text-green-500" />
        <KPI label="Subtareas por completar" value={stats.subPend} color="text-primary" destacado />
        <KPI label="Creados desde notas" value={stats.desdeNotas} color="text-primary" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-xs font-bold">Por prioridad (abiertos)</h3>
          <div className="space-y-2">{Object.entries(stats.porP).map(([k, v]) => <Barra key={k} label={k} v={v} max={maxP} color={colP[k]} />)}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-xs font-bold">Carga por responsable (abiertos)</h3>
          <div className="space-y-2">
            {Object.entries(stats.porR).sort((a, b) => b[1] - a[1]).map(([k, v]) => <Barra key={k} label={k} v={v} max={maxR} color="bg-primary" />)}
            {!Object.keys(stats.porR).length && <p className="text-xs text-muted-foreground">Sin datos.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
