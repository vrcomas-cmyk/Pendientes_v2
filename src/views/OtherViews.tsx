import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import { useSync } from '@/sync'
import type { EventoCalendario, Pendiente } from '@/types'
import { PROYECTO_COLORES, PROYECTO_COLORES_KEYS } from '@/types'
import { hoyISO, isoMasDias, isoSumarDias, vencido, activo, actividadPorDia, rachaDiaria, medianaTiempoVida, throughputSemanal, nombreDiaSemana } from '@/lib/app-utils'
import { idColumnaCompletado } from '@/lib/columnas'
import { listarEventosDia, type EventoGCal } from '@/lib/googleCalendar'
import { sinDuplicarLocal } from '@/lib/agenda'
import TaskRow from '@/components/TaskRow'
import ProgressRing from '@/components/ProgressRing'
import KanbanDnd from '@/components/KanbanDnd'
import { Card } from '@/components/ui/card'
import { ChevronDown, StickyNote, X, Clock } from 'lucide-react'

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
function saludo(): string {
  const hh = new Date().getHours()
  return hh < 12 ? 'Buenos días' : hh < 19 ? 'Buenas tardes' : 'Buenas noches'
}
function etiquetaDia(iso: string): string {
  const h = hoyISO()
  if (iso === h) return 'Hoy'
  if (iso === isoMasDias(-1)) return 'Ayer'
  const d = new Date(iso + 'T00:00')
  return `${nombreDiaSemana(d.getDay())} ${iso.slice(5)}`
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
function FranjaSemanal({ pendientes, diaSel, onSeleccionar, idCompletado }: { pendientes: Pendiente[]; diaSel: string | null; onSeleccionar: (iso: string | null) => void; idCompletado: string }) {
  const dias = Array.from({ length: 7 }, (_, i) => isoMasDias(i))
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {dias.map((iso, i) => {
        const del = pendientes.filter(p => p.fechaLimite === iso)
        const abiertos = del.filter(p => p.estado !== idCompletado).length
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
  const { proyectos, pendientes: todosPendientes, columnas } = useApp()
  const { setProyectoAbiertoId } = useUI()
  const idCompletado = idColumnaCompletado(columnas)
  const pendientes = useMemo(() => todosPendientes.filter(activo), [todosPendientes])
  if (!proyectos.length) return null
  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-semibold">Proyectos</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {proyectos.map((p, i) => {
          const items = pendientes.filter(x => x.proyectoId === p.id)
          const completados = items.filter(x => x.estado === idCompletado).length
          const abiertos = items.length - completados
          const venc = items.filter(x => vencido(x, idCompletado)).length
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
  const { notas, pendientes } = useApp()
  const { setNotaActualId } = useUI()
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

/** Eventos de HOY que viven directo en Google Calendar y no fueron creados desde la app (ya
    espejados como pendiente/evento local se excluyen vía `sinDuplicarLocal`, igual que en
    `CalendarioView`). Se resuelve sus propios datos — no requiere props ni tocar `TodayView`
    salvo por montarlo, mismo idioma que `ResumenProyectos`/`NotasRecientes`. */
function AgendaGoogleHoy() {
  const { pendientes, eventos } = useApp()
  const { modoLocal } = useSync()
  const [eventosGoogle, setEventosGoogle] = useState<EventoGCal[]>([])

  useEffect(() => {
    if (modoLocal) { Promise.resolve().then(() => setEventosGoogle([])); return }
    let vivo = true
    listarEventosDia(hoyISO()).then(r => { if (vivo) setEventosGoogle(r.eventos) }).catch(() => { if (vivo) setEventosGoogle([]) })
    return () => { vivo = false }
  }, [modoLocal])

  const visibles = useMemo(() => sinDuplicarLocal(eventosGoogle, pendientes, eventos), [eventosGoogle, pendientes, eventos])
  if (!visibles.length) return null
  return (
    <Card className="p-3">
      <h3 className="mb-2 font-display text-sm font-semibold">De Google Calendar hoy</h3>
      <div className="space-y-1">
        {visibles.map(ev => (
          <div key={ev.cuentaId + '/' + ev.id} className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
            🔒 {ev.titulo}{ev.inicio && !ev.todoElDia && <span className="ml-auto shrink-0">{new Date(ev.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        ))}
      </div>
    </Card>
  )
}

/** Timeline cronológica única de hoy: mezcla pendientes con hora asignada + eventos de
    calendario, ordenados por hora — el "todo mezclado cronológicamente" de Cambios.md.
    Los pendientes sin hora siguen viviendo en la sección "Para hoy" de abajo (no se
    duplican aquí): esta franja es un complemento, no un reemplazo de esa sección. */
function TimelineHoy({ pendientesHoy }: { pendientesHoy: Pendiente[] }) {
  const { eventos } = useApp()
  const h = hoyISO()
  type Item = { hora: string; key: string } & ({ tipo: 'pendiente'; p: Pendiente } | { tipo: 'evento'; e: EventoCalendario })
  const items = useMemo<Item[]>(() => {
    const dePendientes: Item[] = pendientesHoy.filter(p => p.hora).map(p => ({ tipo: 'pendiente', p, hora: p.hora!, key: 'p-' + p.id }))
    const deEventos: Item[] = eventos.filter(e => !e.borrado && e.fecha === h).map(e => ({ tipo: 'evento', e, hora: e.hora, key: 'e-' + e.id }))
    return [...dePendientes, ...deEventos].sort((a, b) => a.hora.localeCompare(b.hora))
  }, [pendientesHoy, eventos, h])

  if (!items.length) return null
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-display-sm"><Clock size={15} className="text-primary" /> Cronología de hoy</h3>
      <div className="space-y-1.5">
        {items.map(item => item.tipo === 'pendiente' ? (
          <div key={item.key} className="flex items-start gap-2">
            <span className="mt-2 w-11 shrink-0 text-right text-[10px] font-medium text-muted-foreground">{item.hora}</span>
            <div className="min-w-0 flex-1"><TaskRow p={item.p} /></div>
          </div>
        ) : (
          <div key={item.key} className="flex items-center gap-2 rounded-lg px-1 py-1.5">
            <span className="w-11 shrink-0 text-right text-[10px] font-medium text-muted-foreground">{item.hora}</span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent2" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium">{item.e.titulo}</span>
            {item.e.duracionMin > 0 && <span className="shrink-0 text-[10px] text-muted-foreground">{item.e.duracionMin} min</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TodayView() {
  const { pendientes: todosPendientes, columnas } = useApp()
  const idCompletado = idColumnaCompletado(columnas)
  const pendientes = useMemo(() => todosPendientes.filter(activo), [todosPendientes])
  const [diaSel, setDiaSel] = useState<string | null>(null)
  const h = hoyISO()
  const limite7 = isoMasDias(7)
  const venc = pendientes.filter(p => vencido(p, idCompletado))
  const hoy = pendientes.filter(p => p.fechaLimite === h && p.estado !== idCompletado)
  const proximos = pendientes.filter(p => p.estado !== idCompletado && p.fechaLimite && p.fechaLimite > h && p.fechaLimite <= limite7)
  const inbox = pendientes.filter(p => !p.fechaLimite && p.estado !== idCompletado)
  const limite14 = isoMasDias(-14)
  const registro = pendientes.filter(p => p.estado === idCompletado && (p.fechaCompletado || p.modificado) >= limite14)
    .sort((a, b) => (b.fechaCompletado || b.modificado).localeCompare(a.fechaCompletado || a.modificado))

  const hoyTotal = pendientes.filter(p => p.fechaLimite === h).length
  const hoyHechas = hoyTotal - hoy.length
  const pctHoy = hoyTotal ? Math.round((hoyHechas / hoyTotal) * 100) : 100

  const deDiaSel = diaSel ? pendientes.filter(p => p.fechaLimite === diaSel) : []

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Hero */}
      <Card className="flex items-center gap-4 rounded-2xl p-4 sm:p-5">
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
      </Card>

      <FranjaSemanal pendientes={pendientes} diaSel={diaSel} onSeleccionar={setDiaSel} idCompletado={idCompletado} />

      {diaSel && (
        <Card className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold text-muted-foreground">{etiquetaDia(diaSel)}</h3>
            <button onClick={() => setDiaSel(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </div>
          <div className="space-y-1.5">
            {deDiaSel.map(p => <TaskRow key={p.id} p={p} />)}
            {!deDiaSel.length && <p className="text-xs text-muted-foreground">Nada agendado ese día.</p>}
          </div>
        </Card>
      )}

      <TimelineHoy pendientesHoy={hoy} />

      <ResumenProyectos />
      <NotasRecientes />
      <AgendaGoogleHoy />

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
export function KanbanView() {
  const { pendientes } = useApp()
  return <KanbanDnd pendientes={pendientes} />
}


/* ============ HEATMAP DE ACTIVIDAD (Fase 9.1) ============ */
const NIVELES_OPACIDAD = [0.16, 0.4, 0.62, 0.82, 1] // índice 0 = "algo" (bg-muted cubre el "nada")
function nivelActividad(c: number, max: number): number {
  if (c === 0) return -1
  const frac = c / max
  return frac <= 0.25 ? 0 : frac <= 0.5 ? 1 : frac <= 0.75 ? 2 : frac <= 0.99 ? 3 : 4
}
/** Heatmap estilo GitHub: 16 semanas completas (domingo a sábado), terminando en la semana
    actual. Un solo hue (primary) en 5 pasos de opacidad — escala secuencial de magnitud, el
    "nada" se pinta con `bg-muted` (no opacidad 0) para que sea un track visible, no un hueco. */
function HeatmapActividad({ actividad }: { actividad: Record<string, number> }) {
  const semanas = 16
  const dias = useMemo(() => {
    const hoyDow = new Date().getDay() // 0=domingo
    const finSemana = isoSumarDias(hoyISO(), 6 - hoyDow)
    const inicio = isoSumarDias(finSemana, -(semanas * 7 - 1))
    return Array.from({ length: semanas * 7 }, (_, i) => isoSumarDias(inicio, i))
  }, [])
  const max = Math.max(1, ...Object.values(actividad))
  const h = hoyISO()
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-xs font-bold">Actividad (últimas {semanas} semanas)</h3>
      <div className="overflow-x-auto scroll-thin">
        <div className="grid gap-[3px]" style={{ gridTemplateRows: 'repeat(7, 11px)', gridAutoFlow: 'column' }}>
          {dias.map(d => {
            const c = actividad[d] || 0
            const nivel = nivelActividad(c, max)
            const esFuturo = d > h
            return (
              <div key={d} title={esFuturo ? undefined : `${d}: ${c} completado${c === 1 ? '' : 's'}`}
                className={'h-[11px] w-[11px] rounded-sm ' + (esFuturo ? 'bg-transparent' : nivel < 0 ? 'bg-muted' : 'bg-primary')}
                style={nivel >= 0 ? { opacity: NIVELES_OPACIDAD[nivel] } : undefined} />
            )
          })}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        Menos
        <span className="h-[10px] w-[10px] rounded-sm bg-muted" />
        {NIVELES_OPACIDAD.map(o => <span key={o} className="h-[10px] w-[10px] rounded-sm bg-primary" style={{ opacity: o }} />)}
        Más
      </div>
    </Card>
  )
}

/* ============ DASHBOARD ============ */
function KPI({ label, value, color, destacado }: { label: string; value: number | string; color?: string; destacado?: boolean }) {
  return (
    <Card className={'p-3 ' + (destacado ? 'border-2 border-primary/40' : '')}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={'text-2xl font-bold ' + (color || '')}>{value}</div>
    </Card>
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
  const { pendientes: todosPendientes, notas, columnas } = useApp()
  const idCompletado = idColumnaCompletado(columnas)
  const pendientes = useMemo(() => todosPendientes.filter(activo), [todosPendientes])
  const stats = useMemo(() => {
    const abiertos = pendientes.filter(p => p.estado !== idCompletado)
    let subPend = 0
    abiertos.forEach(p => p.subtareas.forEach(s => { if (!s.completada) subPend++ }))
    const porP: Record<string, number> = { Alta: 0, Media: 0, Baja: 0 }
    abiertos.forEach(p => porP[p.prioridad]++)
    const porR: Record<string, number> = {}
    abiertos.forEach(p => { const r = p.responsable || 'Sin asignar'; porR[r] = (porR[r] || 0) + 1 })
    const porColumna: Record<string, number> = {}
    columnas.forEach(c => { porColumna[c.nombre] = pendientes.filter(p => p.estado === c.id).length })
    const desdeNotas = pendientes.filter(p => p.origenNota).length
    const actividad = actividadPorDia(pendientes)
    return {
      abiertos: abiertos.length, vencidos: pendientes.filter(p => vencido(p, idCompletado)).length, completados: pendientes.filter(p => p.estado === idCompletado).length,
      subPend, porP, porR, porColumna, desdeNotas, notas: notas.length,
      actividad, racha: rachaDiaria(actividad), mediana: medianaTiempoVida(pendientes), throughput: throughputSemanal(actividad),
    }
  }, [pendientes, notas, columnas, idCompletado])
  const maxP = Math.max(1, ...Object.values(stats.porP))
  const maxR = Math.max(1, ...Object.values(stats.porR))
  const maxC = Math.max(1, ...Object.values(stats.porColumna))
  const colP: Record<string, string> = { Alta: 'bg-red-500', Media: 'bg-amber-400', Baja: 'bg-emerald-400' }
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <KPI label="Total abiertos" value={stats.abiertos} />
        <KPI label="Vencidos" value={stats.vencidos} color="text-red-500" />
        <KPI label="Completados" value={stats.completados} color="text-green-500" />
        <KPI label="Subtareas por completar" value={stats.subPend} color="text-primary" destacado />
        <KPI label="Creados desde notas" value={stats.desdeNotas} color="text-primary" />
        <KPI label="Racha 🔥" value={stats.racha} color="text-amber-500" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <KPI label="Esta semana" value={stats.throughput} color="text-primary" />
        <KPI label="Mediana días/tarea" value={stats.mediana === null ? '—' : Math.round(stats.mediana * 10) / 10} color="text-primary" />
      </div>
      <HeatmapActividad actividad={stats.actividad} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-xs font-bold">Por columna del tablero</h3>
          <div className="space-y-2">{Object.entries(stats.porColumna).map(([k, v]) => <Barra key={k} label={k} v={v} max={maxC} color="bg-primary" />)}</div>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-xs font-bold">Por prioridad (abiertos)</h3>
          <div className="space-y-2">{Object.entries(stats.porP).map(([k, v]) => <Barra key={k} label={k} v={v} max={maxP} color={colP[k]} />)}</div>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-xs font-bold">Carga por responsable (abiertos)</h3>
          <div className="space-y-2">
            {Object.entries(stats.porR).sort((a, b) => b[1] - a[1]).map(([k, v]) => <Barra key={k} label={k} v={v} max={maxR} color="bg-primary" />)}
            {!Object.keys(stats.porR).length && <p className="text-xs text-muted-foreground">Sin datos.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
