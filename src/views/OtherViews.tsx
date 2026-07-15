import { useMemo, useState } from 'react'
import { useApp } from '@/store'
import type { Estado, Pendiente } from '@/types'
import { ESTADOS, PRIORIDAD_BORDER } from '@/types'
import { hoyISO, progresoSub, vencido } from '@/lib/app-utils'
import TaskRow from '@/components/TaskRow'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus, StickyNote, User, CheckSquare } from 'lucide-react'

/* ============ HOY ============ */
export function TodayView() {
  const { pendientes } = useApp()
  const h = hoyISO()
  const venc = pendientes.filter(vencido)
  const hoy = pendientes.filter(p => p.fechaLimite === h && p.estado !== 'completado')
  const inbox = pendientes.filter(p => !p.fechaLimite && p.estado !== 'completado')
  const Seccion = ({ titulo, color, items, vacio }: { titulo: string; color: string; items: Pendiente[]; vacio: string }) => (
    <div>
      <h3 className={'mb-2 text-xs font-bold ' + color}>{titulo} <span className="font-normal text-muted-foreground">({items.length})</span></h3>
      <div className="space-y-1.5">
        {items.map(p => <TaskRow key={p.id} p={p} />)}
        {!items.length && <p className="text-xs text-muted-foreground">{vacio}</p>}
      </div>
    </div>
  )
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Seccion titulo="⚠ Vencidos" color="text-red-500" items={venc} vacio="Nada vencido 🎉" />
      <Seccion titulo="📆 Para hoy" color="text-amber-600" items={hoy} vacio="Nada para hoy." />
      <Seccion titulo="📥 Sin fecha / Bandeja" color="text-muted-foreground" items={inbox} vacio="Bandeja vacía." />
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
  const KPI = ({ label, value, color, destacado }: { label: string; value: number; color?: string; destacado?: boolean }) => (
    <div className={'rounded-xl border bg-card p-3 ' + (destacado ? 'border-2 border-primary/40' : '')}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={'text-2xl font-bold ' + (color || '')}>{value}</div>
    </div>
  )
  const Barra = ({ label, v, max, color }: { label: string; v: number; max: number; color: string }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 truncate">{label}</span>
      <div className="h-4 flex-1 rounded-full bg-muted"><div className={'h-4 rounded-full ' + color} style={{ width: (v / max) * 100 + '%' }} /></div>
      <span className="w-6 text-right">{v}</span>
    </div>
  )
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
