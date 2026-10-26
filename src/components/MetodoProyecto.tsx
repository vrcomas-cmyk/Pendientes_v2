import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import type { Proyecto } from '@/types'
import { hoyISO, isoAFechaLegible } from '@/lib/app-utils'
import { idColumnaCompletado } from '@/lib/columnas'
import { barrasGantt, dividirSprint, diasEntre, ESTANCAMIENTO_DEFECTO } from '@/lib/proyectos'
import TaskRow from '@/components/TaskRow'
import CampoFecha from '@/components/CampoFecha'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowRight, Lock } from 'lucide-react'

/** Scrum como PERSPECTIVA: el sprint es una ventana de fechas del proyecto; los pendientes cuya
    fecha límite cae dentro están «en el sprint», el resto del trabajo abierto es backlog. «Al sprint»
    solo cambia la fecha límite del mismo pendiente — no hay copias. */
export function ScrumProyecto({ proyecto, mostrarArchivados, onConfigurar }: { proyecto: Proyecto; mostrarArchivados: boolean; onConfigurar: () => void }) {
  const { pendientes, columnas, actualizarPendiente } = useApp()
  const idCompletado = idColumnaCompletado(columnas)
  const items = useMemo(() => pendientes.filter(p => p.proyectoId === proyecto.id && !p.borrado && (mostrarArchivados || !p.archivado)), [pendientes, proyecto.id, mostrarArchivados])
  const sprint = proyecto.sprint

  if (!sprint) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <p>Define la iteración actual (fechas de inicio y fin) para ver sprint y backlog de este proyecto.</p>
        <Button size="sm" onClick={onConfigurar}>Configurar sprint</Button>
      </div>
    )
  }
  const { enSprint, backlog, hechos, total, porcentaje } = dividirSprint(items, sprint, idCompletado)
  const restantes = diasEntre(hoyISO(), sprint.fin)

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="shrink-0 space-y-1 rounded-lg border bg-card p-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold">{sprint.nombre || 'Sprint actual'} · {isoAFechaLegible(sprint.inicio)} – {isoAFechaLegible(sprint.fin)}</span>
          <button className="text-primary hover:underline" onClick={onConfigurar}>Editar</button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${porcentaje}%` }} /></div>
        <p className="text-[11px] text-muted-foreground">{hechos}/{total} hechos · {restantes > 0 ? `${restantes} día(s) restantes` : restantes === 0 ? 'termina hoy' : `terminó hace ${-restantes} día(s)`}</p>
      </div>
      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-2">
        <section className="flex min-h-0 flex-col">
          <h3 className="mb-1 text-xs font-bold text-muted-foreground">Sprint ({total})</h3>
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-1 scroll-thin">
            {enSprint.map(p => <TaskRow key={p.id} p={p} />)}
            {!enSprint.length && <p className="p-4 text-center text-xs text-muted-foreground">Nada en el sprint. Pasa pendientes desde el backlog.</p>}
          </div>
        </section>
        <section className="flex min-h-0 flex-col">
          <h3 className="mb-1 text-xs font-bold text-muted-foreground">Backlog ({backlog.length})</h3>
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-1 scroll-thin">
            {backlog.map(p => (
              <div key={p.id} className="flex items-center gap-1">
                <div className="min-w-0 flex-1"><TaskRow p={p} /></div>
                <Button size="sm" variant="secondary" className="h-7 shrink-0 px-2 text-[11px]" title={`Fijar fecha límite al fin del sprint (${isoAFechaLegible(sprint.fin)})`}
                  onClick={() => actualizarPendiente(p.id, { fechaLimite: sprint.fin })}>
                  Al sprint <ArrowRight size={11} className="ml-1" />
                </Button>
              </div>
            ))}
            {!backlog.length && <p className="p-4 text-center text-xs text-muted-foreground">Backlog vacío.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}

/** Gantt como perspectiva: barras de `fechaInicio` (o creación) a `fechaLimite` de los mismos
    pendientes. Las dependencias reales (`bloqueadoPor`) se marcan con candado; sin fecha límite no
    hay barra verificable y se listan aparte. */
export function GanttProyecto({ proyecto, mostrarArchivados }: { proyecto: Proyecto; mostrarArchivados: boolean }) {
  const { pendientes, columnas } = useApp()
  const { abrirPeek } = useUI()
  const idCompletado = idColumnaCompletado(columnas)
  const items = useMemo(() => pendientes.filter(p => p.proyectoId === proyecto.id && !p.borrado && (mostrarArchivados || !p.archivado)), [pendientes, proyecto.id, mostrarArchivados])
  const { barras, sinFecha } = useMemo(() => barrasGantt(items), [items])

  if (!barras.length) {
    return <p className="p-6 text-center text-xs text-muted-foreground">El Gantt necesita pendientes con fecha límite{sinFecha.length ? ` (hay ${sinFecha.length} sin fecha)` : ''}. El inicio se toma de «Inicio planeado» o de la fecha de creación.</p>
  }
  const hoy = hoyISO()
  const desde = barras.reduce((m, b) => (b.inicio < m ? b.inicio : m), barras[0].inicio)
  const hastaMax = barras.reduce((m, b) => (b.fin > m ? b.fin : m), barras[0].fin)
  const rango = Math.max(1, diasEntre(desde, hastaMax) + 1)
  const pct = (iso: string) => Math.min(100, Math.max(0, (diasEntre(desde, iso) / rango) * 100))
  const ancho = (a: string, b: string) => Math.max(1.5, ((diasEntre(a, b) + 1) / rango) * 100)
  const hoyEnRango = hoy >= desde && hoy <= hastaMax

  return (
    <div className="h-full overflow-auto scroll-thin">
      <div className="min-w-[560px] space-y-1 p-1">
        <div className="flex justify-between pl-44 text-[10px] text-muted-foreground"><span>{isoAFechaLegible(desde)}</span><span>{isoAFechaLegible(hastaMax)}</span></div>
        {barras.map(({ p, inicio, fin }) => {
          const hecho = p.estado === idCompletado
          const bloqueado = (p.bloqueadoPor?.length ?? 0) > 0
          const vencido = !hecho && fin < hoy
          return (
            <div key={p.id} className="flex items-center gap-2">
              <button onClick={() => abrirPeek(p.id)} className="flex w-44 shrink-0 items-center gap-1 truncate text-left text-xs hover:underline" title={p.titulo}>
                {bloqueado && <Lock size={10} className="shrink-0 text-muted-foreground" aria-label="Tiene dependencias" />}
                <span className={'truncate ' + (hecho ? 'line-through opacity-60' : '')}>{p.titulo}</span>
              </button>
              <div className="relative h-5 flex-1 rounded bg-muted/40">
                {hoyEnRango && <div className="absolute inset-y-0 w-px bg-primary/60" style={{ left: `${pct(hoy)}%` }} />}
                <div className={'absolute inset-y-0.5 rounded ' + (hecho ? 'bg-emerald-500/60' : vencido ? 'bg-red-500/70' : 'bg-primary/70')}
                  style={{ left: `${pct(inicio)}%`, width: `${ancho(inicio, fin)}%` }}
                  title={`${isoAFechaLegible(inicio)} – ${isoAFechaLegible(fin)}`} />
              </div>
            </div>
          )
        })}
        {sinFecha.length > 0 && <p className="pt-2 text-[11px] text-muted-foreground">Sin fecha límite (no aparecen): {sinFecha.map(p => p.titulo).join(', ')}</p>}
      </div>
    </div>
  )
}

/** Ajustes del proyecto para los métodos y el aviso de estancamiento. */
export function AjustesProyectoDialog({ proyecto, open, onOpenChange }: { proyecto: Proyecto; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { actualizarProyecto } = useApp()
  const [nombre, setNombre] = useState('')
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [dias, setDias] = useState('')
  const [pausa, setPausa] = useState('')

  useEffect(() => {
    if (!open) return
    /* eslint-disable react-hooks/set-state-in-effect -- reset del form al abrir */
    setNombre(proyecto.sprint?.nombre ?? ''); setInicio(proyecto.sprint?.inicio ?? hoyISO()); setFin(proyecto.sprint?.fin ?? '')
    setDias(proyecto.estancamientoDias ? String(proyecto.estancamientoDias) : ''); setPausa(proyecto.pausadoHasta ?? '')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, proyecto])

  const sprintInvalido = !!fin && !!inicio && fin < inicio
  const guardar = () => {
    if (sprintInvalido) return
    actualizarProyecto(proyecto.id, {
      sprint: inicio && fin ? { nombre: nombre.trim() || undefined, inicio, fin } : undefined,
      estancamientoDias: Number(dias) > 0 ? Math.round(Number(dias)) : undefined,
      pausadoHasta: pausa || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-base">Ajustes de {proyecto.nombre}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Sprint (vista Scrum)</p>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre (ej. Sprint 3)" />
            <div className="grid grid-cols-2 gap-2">
              <CampoFecha value={inicio} onChange={setInicio} placeholder="Inicio" />
              <CampoFecha value={fin} onChange={setFin} placeholder="Fin" />
            </div>
            {sprintInvalido && <p className="text-xs text-destructive">El fin es anterior al inicio.</p>}
            <p className="text-[11px] text-muted-foreground">Deja el fin vacío para quitar el sprint.</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Aviso de estancamiento</p>
            <Input type="number" min={1} value={dias} onChange={e => setDias(e.target.value)} placeholder={`Días sin actividad (def. ${ESTANCAMIENTO_DEFECTO})`} />
            <CampoFecha value={pausa} onChange={setPausa} placeholder="No avisar hasta… (vacaciones/espera)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={guardar} disabled={sprintInvalido}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
