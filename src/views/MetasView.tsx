import { useMemo, useState } from 'react'
import { useApp } from '@/store'
import { PROYECTO_COLORES } from '@/types'
import type { Meta } from '@/types'
import NuevaMetaDialog from '@/components/NuevaMetaDialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Target, Plus, Trash2, X } from 'lucide-react'

/** Vista «Metas» (Fase 4 del plan de Contactos/Equipos/Metas, ver workspace-doctrine): objetivos
    de largo plazo que agrupan Proyectos, con progreso agregado (`progresoMeta` en store.tsx). */
export default function MetasView() {
  const { metas, eliminarMeta, proyectos, actualizarProyecto, progresoMeta } = useApp()
  const [dlgNueva, setDlgNueva] = useState(false)
  const [detalleId, setDetalleId] = useState<string | null>(null)

  const activas = useMemo(() => metas.filter(m => !m.borrado), [metas])
  const detalle = detalleId ? activas.find(m => m.id === detalleId) : null
  const proyectosDeDetalle = detalle ? proyectos.filter(p => p.metaId === detalle.id && !p.archivado) : []
  const proyectosSinMeta = proyectos.filter(p => !p.metaId && !p.archivado)

  const vincularProyecto = (proyectoId: string) => {
    if (!detalle) return
    actualizarProyecto(proyectoId, { metaId: detalle.id })
  }
  const desvincularProyecto = (proyectoId: string) => actualizarProyecto(proyectoId, { metaId: undefined })

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold"><Target size={15} className="text-primary" /> Metas</h2>
        <Button size="sm" onClick={() => setDlgNueva(true)}><Plus size={13} className="mr-1" /> Nueva meta</Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1 scroll-thin">
        {activas.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Target size={28} className="text-muted-foreground/50" />
            <p>Todavía no tenés metas. Agrupá tus proyectos bajo un objetivo de largo plazo.</p>
            <Button size="sm" variant="secondary" onClick={() => setDlgNueva(true)}><Plus size={13} className="mr-1" /> Crear la primera</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activas.map(m => {
              const colores = PROYECTO_COLORES[m.color] || PROYECTO_COLORES[Object.keys(PROYECTO_COLORES)[0]]
              const prog = progresoMeta(m.id)
              const nProyectos = proyectos.filter(p => p.metaId === m.id && !p.archivado).length
              return (
                <Card key={m.id} interactive onClick={() => setDetalleId(m.id)} className="flex flex-col gap-2 p-3.5 text-left">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="text-xl leading-none">{m.icono}</span>
                    <span className="flex-1 truncate text-sm font-semibold">{m.nombre}</span>
                  </div>
                  {m.fechaObjetivo && <p className="text-[11px] text-muted-foreground">🗓 {m.fechaObjetivo}</p>}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={'h-full rounded-full transition-[width] duration-300 ease-smooth ' + colores.dot} style={{ width: `${prog.porcentaje}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{prog.completados}/{prog.total} pendientes</span>
                    <span>{nProyectos} proyecto{nProyectos === 1 ? '' : 's'}</span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <NuevaMetaDialog open={dlgNueva} onOpenChange={setDlgNueva} />

      <Dialog open={!!detalle} onOpenChange={o => { if (!o) setDetalleId(null) }}>
        <DialogContent className="max-w-md">
          {detalle && <DetalleMeta detalle={detalle} proyectosDe={proyectosDeDetalle} proyectosSinMeta={proyectosSinMeta}
            progreso={progresoMeta(detalle.id)} onVincular={vincularProyecto} onDesvincular={desvincularProyecto}
            onEliminar={() => { eliminarMeta(detalle.id); setDetalleId(null) }} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetalleMeta({ detalle, proyectosDe, proyectosSinMeta, progreso, onVincular, onDesvincular, onEliminar }: {
  detalle: Meta
  proyectosDe: { id: string; nombre: string; color: string }[]
  proyectosSinMeta: { id: string; nombre: string; color: string }[]
  progreso: { total: number; completados: number; porcentaje: number }
  onVincular: (proyectoId: string) => void
  onDesvincular: (proyectoId: string) => void
  onEliminar: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <span aria-hidden className="text-xl">{detalle.icono}</span> {detalle.nombre}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        {detalle.descripcion && <p className="text-sm text-muted-foreground">{detalle.descripcion}</p>}
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Progreso</span><span>{progreso.porcentaje}% ({progreso.completados}/{progreso.total})</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={'h-full rounded-full ' + (PROYECTO_COLORES[detalle.color]?.dot || 'bg-primary')} style={{ width: `${progreso.porcentaje}%` }} />
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] uppercase text-muted-foreground">Proyectos vinculados</p>
          {proyectosDe.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin proyectos todavía.</p>
          ) : (
            <div className="space-y-1">
              {proyectosDe.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs hover:bg-accent">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + (PROYECTO_COLORES[p.color]?.dot || '')} /> {p.nombre}
                  </span>
                  <button onClick={() => onDesvincular(p.id)} aria-label={`Desvincular proyecto ${p.nombre}`} className="text-muted-foreground hover:text-destructive"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          {proyectosSinMeta.length > 0 && (
            <Select onValueChange={onVincular}>
              <SelectTrigger className="mt-2 h-8 text-xs"><SelectValue placeholder="+ Vincular proyecto…" /></SelectTrigger>
              <SelectContent>{proyectosSinMeta.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onEliminar}>
          <Trash2 size={13} className="mr-1.5" /> Eliminar meta
        </Button>
      </div>
    </>
  )
}
