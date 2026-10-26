import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/store'
import type { Roca } from '@/types'
import { descargar, hoyISO, isoAFechaLegible } from '@/lib/app-utils'
import { actividadesDelPeriodo, informeRocaMarkdown, resumenRoca, trimestreDe } from '@/lib/rocas'
import CampoFecha from '@/components/CampoFecha'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Mountain, Plus, Trash2, Copy, Download, Pencil, ArrowLeft } from 'lucide-react'

const ETIQUETA_DEFECTO = 'Actividades'

function DialogoRoca({ open, onOpenChange, roca }: { open: boolean; onOpenChange: (o: boolean) => void; roca?: Roca }) {
  const { crearRoca, actualizarRoca } = useApp()
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')

  useEffect(() => {
    if (!open) return
    const t = trimestreDe(hoyISO())
    /* eslint-disable react-hooks/set-state-in-effect -- reset del form al abrir */
    setNombre(roca?.nombre ?? ''); setDescripcion(roca?.descripcion ?? ''); setEtiqueta(roca?.etiquetaActividad ?? '')
    setObjetivo(roca?.objetivo ? String(roca.objetivo) : ''); setInicio(roca?.fechaInicio ?? t.inicio); setFin(roca?.fechaFin ?? t.fin)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, roca])

  const invalido = !nombre.trim() || !inicio || !fin || fin < inicio
  const guardar = () => {
    if (invalido) return
    const datos = {
      nombre: nombre.trim(), descripcion: descripcion.trim() || undefined, etiquetaActividad: etiqueta.trim() || undefined,
      objetivo: Number(objetivo) > 0 ? Math.round(Number(objetivo)) : undefined, fechaInicio: inicio, fechaFin: fin,
    }
    if (roca) actualizarRoca(roca.id, datos)
    else crearRoca(datos.nombre, datos)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-base">{roca ? 'Editar roca' : 'Nueva roca'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre (ej. Soporte a usuarios)" />
          <Textarea rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción (opcional)" />
          <div className="grid grid-cols-2 gap-2">
            <Input value={etiqueta} onChange={e => setEtiqueta(e.target.value)} placeholder="Qué se cuenta: Ayudas generadas" />
            <Input type="number" min={1} value={objetivo} onChange={e => setObjetivo(e.target.value)} placeholder="Objetivo (opcional)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CampoFecha value={inicio} onChange={setInicio} placeholder="Inicio" />
            <CampoFecha value={fin} onChange={setFin} placeholder="Fin" />
          </div>
          {fin && inicio && fin < inicio && <p className="text-xs text-destructive">La fecha final es anterior a la inicial.</p>}
          <p className="text-[11px] text-muted-foreground">Por defecto es el trimestre actual; cambia las fechas si tu periodo es distinto.</p>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={guardar} disabled={invalido}>{roca ? 'Guardar' : 'Crear'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetalleRoca({ roca, onVolver }: { roca: Roca; onVolver: () => void }) {
  const { agregarActividadRoca, actualizarActividadRoca, eliminarActividadRoca, actualizarRoca, eliminarRoca, pendientes } = useApp()
  const [texto, setTexto] = useState('')
  const [solicitante, setSolicitante] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [editar, setEditar] = useState(false)
  const [pendienteId, setPendienteId] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editTexto, setEditTexto] = useState('')
  const [editSolicitante, setEditSolicitante] = useState('')
  const abiertos = useMemo(() => pendientes.filter(p => !p.borrado && !p.archivado && !p.fechaCompletado), [pendientes])
  const tituloDe = (id?: string) => (id ? pendientes.find(p => p.id === id)?.titulo : undefined)
  const etiqueta = roca.etiquetaActividad || ETIQUETA_DEFECTO
  const res = resumenRoca(roca)
  const acts = actividadesDelPeriodo(roca)
  const fueraDePeriodo = fecha < roca.fechaInicio || fecha > roca.fechaFin

  const porDia = useMemo(() => {
    const m = new Map<string, typeof acts>()
    acts.forEach(a => m.set(a.fecha, [...(m.get(a.fecha) ?? []), a]))
    return [...m.entries()]
  }, [acts])

  const agregar = () => {
    if (!texto.trim()) return
    agregarActividadRoca(roca.id, { descripcion: texto, solicitante: solicitante.trim() || undefined, fecha: fecha || hoyISO(), pendienteId: pendienteId || undefined })
    setTexto(''); setPendienteId('')
  }
  const copiar = async () => {
    try { await navigator.clipboard.writeText(informeRocaMarkdown(roca)); toast.success('Informe copiado') }
    catch { toast.error('No se pudo copiar; usa «Descargar»') }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onVolver}><ArrowLeft size={14} className="mr-1" /> Rocas</Button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-bold">{roca.nombre}</h2>
        <Button size="sm" variant="secondary" onClick={copiar}><Copy size={13} className="mr-1" /> Copiar informe</Button>
        <Button size="sm" variant="secondary" onClick={() => descargar(`roca_${roca.nombre.replace(/\W+/g, '_')}.md`, informeRocaMarkdown(roca), 'text/markdown')}><Download size={13} className="mr-1" /> Descargar</Button>
        <Button size="sm" variant="ghost" aria-label="Editar roca" onClick={() => setEditar(true)}><Pencil size={13} /></Button>
        <Button size="sm" variant="ghost" aria-label="Eliminar roca" onClick={() => { eliminarRoca(roca.id); onVolver(); toast.success('Roca eliminada') }}><Trash2 size={13} /></Button>
      </div>

      <Card className="shrink-0 space-y-2 p-3">
        <p className="text-xs text-muted-foreground">{isoAFechaLegible(roca.fechaInicio)} – {isoAFechaLegible(roca.fechaFin)}{roca.estado === 'cerrada' ? ' · cerrada' : ''}</p>
        <p className="text-2xl font-bold leading-none">{res.total}{res.objetivo ? <span className="text-base font-medium text-muted-foreground"> / {res.objetivo}</span> : null} <span className="text-sm font-medium text-muted-foreground">{etiqueta}</span></p>
        {res.porcentaje !== undefined && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${res.porcentaje}%` }} /></div>
        )}
        <p className="text-[11px] text-muted-foreground">{res.dias} día(s) con registro</p>
        {roca.descripcion && <p className="text-xs">{roca.descripcion}</p>}
        <Button size="sm" variant="ghost" className="h-6 px-1 text-[11px]" onClick={() => actualizarRoca(roca.id, { estado: roca.estado === 'cerrada' ? 'activa' : 'cerrada' })}>
          {roca.estado === 'cerrada' ? 'Reabrir roca' : 'Marcar como cerrada'}
        </Button>
      </Card>

      <div className="shrink-0 space-y-1.5 rounded-xl border bg-card p-2.5">
        <Input value={texto} onChange={e => setTexto(e.target.value)} placeholder={`Hoy me pidieron… (Enter para registrar en «${etiqueta}»)`}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar() } }} aria-label="Nueva actividad" />
        <div className="flex flex-wrap items-center gap-2">
          <Input className="h-8 min-w-0 flex-1 text-xs" value={solicitante} onChange={e => setSolicitante(e.target.value)} placeholder="Quién lo pidió (opcional)"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar() } }} />
          <select value={pendienteId} onChange={e => setPendienteId(e.target.value)} aria-label="Vincular a un pendiente"
            className="h-8 max-w-[11rem] rounded-md border bg-background px-2 text-xs">
            <option value="">Sin pendiente vinculado</option>
            {abiertos.map(p => <option key={p.id} value={p.id}>{p.titulo.slice(0, 50)}</option>)}
          </select>
          <div className="w-36"><CampoFecha value={fecha} onChange={setFecha} placeholder="Fecha" /></div>
          <Button size="sm" onClick={agregar} disabled={!texto.trim()}><Plus size={13} className="mr-1" /> Registrar</Button>
        </div>
        {fueraDePeriodo && <p className="text-[11px] text-amber-600 dark:text-amber-400">Esta fecha cae fuera del periodo de la roca: se guardará pero no contará en el informe.</p>}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-1 scroll-thin">
        {porDia.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay registros en este periodo.</p>}
        {porDia.map(([dia, lista]) => (
          <section key={dia}>
            <h3 className="mb-1 text-xs font-semibold text-muted-foreground">{isoAFechaLegible(dia)} · {lista.length}</h3>
            <ul className="space-y-1">
              {lista.map(a => (
                <li key={a.id} className="flex items-start gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-sm">
                  {editId === a.id ? (
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Textarea rows={2} value={editTexto} onChange={e => setEditTexto(e.target.value)} aria-label="Editar actividad" />
                      <Input className="h-8 text-xs" value={editSolicitante} onChange={e => setEditSolicitante(e.target.value)} placeholder="Quién lo pidió" />
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 text-xs" disabled={!editTexto.trim()}
                          onClick={() => { actualizarActividadRoca(roca.id, a.id, { descripcion: editTexto.trim(), solicitante: editSolicitante.trim() || undefined }); setEditId(null) }}>Guardar</Button>
                        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => setEditId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{a.descripcion}{a.solicitante && <span className="ml-1 text-xs text-muted-foreground">— {a.solicitante}</span>}
                        {a.pendienteId && <span className="ml-1 text-xs text-primary">↳ {tituloDe(a.pendienteId) ?? 'pendiente eliminado'}</span>}</span>
                      <button aria-label="Editar actividad" className="shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditId(a.id); setEditTexto(a.descripcion); setEditSolicitante(a.solicitante ?? '') }}><Pencil size={13} /></button>
                    </>
                  )}
                  <button aria-label="Eliminar actividad" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => eliminarActividadRoca(roca.id, a.id)}><Trash2 size={13} /></button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <DialogoRoca open={editar} onOpenChange={setEditar} roca={roca} />
    </div>
  )
}

/** Rocas (Hito 5): objetivos/KPI de un periodo con bitácora diaria de actividades («Ayudas
    generadas»…). La bitácora es registro, no tareas: no crea pendientes ni los duplica. */
export default function RocasView() {
  const { rocas } = useApp()
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [nueva, setNueva] = useState(false)
  const activas = useMemo(() => rocas.filter(r => !r.borrado), [rocas])
  const detalle = detalleId ? activas.find(r => r.id === detalleId) : undefined

  if (detalle) return <DetalleRoca roca={detalle} onVolver={() => setDetalleId(null)} />

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold"><Mountain size={15} className="text-primary" /> Rocas</h2>
        <Button size="sm" onClick={() => setNueva(true)}><Plus size={13} className="mr-1" /> Nueva roca</Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1 scroll-thin">
        {activas.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Mountain size={28} className="text-muted-foreground/50" />
            <p>Crea una roca por cada KPI del periodo y ve registrando lo que te piden cada día.</p>
            <Button size="sm" variant="secondary" onClick={() => setNueva(true)}><Plus size={13} className="mr-1" /> Crear la primera</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activas.map(r => {
              const res = resumenRoca(r)
              return (
                <Card key={r.id} interactive onClick={() => setDetalleId(r.id)} className="flex flex-col gap-2 p-3.5 text-left">
                  <span className="truncate text-sm font-semibold">{r.nombre}</span>
                  <p className="text-[11px] text-muted-foreground">{isoAFechaLegible(r.fechaInicio)} – {isoAFechaLegible(r.fechaFin)}{r.estado === 'cerrada' ? ' · cerrada' : ''}</p>
                  <p className="text-lg font-bold leading-none">{res.total}{res.objetivo ? <span className="text-xs font-medium text-muted-foreground"> / {res.objetivo}</span> : null} <span className="text-xs font-medium text-muted-foreground">{r.etiquetaActividad || ETIQUETA_DEFECTO}</span></p>
                  {res.porcentaje !== undefined && <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${res.porcentaje}%` }} /></div>}
                </Card>
              )
            })}
          </div>
        )}
      </div>
      <DialogoRoca open={nueva} onOpenChange={setNueva} />
    </div>
  )
}
