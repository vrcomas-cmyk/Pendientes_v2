import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/store'
import type { Comentario, Estado, Prioridad, Subtarea, Adjunto } from '@/types'
import { PROYECTO_COLORES, PROYECTO_COLORES_KEYS } from '@/types'
import { uid, fechaPorPrioridad, describirRepeticion } from '@/lib/app-utils'
import AdjuntosUI, { Miniatura } from '@/components/AdjuntosUI'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronRight, Plus, Trash2, X, StickyNote } from 'lucide-react'

export default function TaskModal() {
  const { modal, cerrarModal, pendientes, crearPendiente, actualizarPendiente, eliminarPendiente, usuario, personas, proyectos, crearProyecto } = useApp()
  const editando = modal.editId ? pendientes.find(p => p.id === modal.editId) : null
  const [draftId, setDraftId] = useState<string>(() => uid())

  const [titulo, setTitulo] = useState('')
  const [solicitante, setSolicitante] = useState('')
  const [responsable, setResponsable] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState<Prioridad>('Media')
  const [estado, setEstado] = useState<Estado>('pendiente')
  const [fechaLimite, setFechaLimite] = useState('')
  const [fechaTocada, setFechaTocada] = useState(false)
  const [hora, setHora] = useState('')
  const [proyectoId, setProyectoId] = useState('')
  const [nuevoProyectoVal, setNuevoProyectoVal] = useState('')
  const [creandoProyecto, setCreandoProyecto] = useState(false)
  const [repetir, setRepetir] = useState('')
  const [etiquetas, setEtiquetas] = useState('')
  const [subtareas, setSubtareas] = useState<Subtarea[]>([])
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([])
  const [subNueva, setSubNueva] = useState('')
  const [comNuevo, setComNuevo] = useState('')
  const [avanzado, setAvanzado] = useState(false)

  useEffect(() => {
    if (!modal.open) return
    setDraftId(editando?.id || uid()) // eslint-disable-line react-hooks/set-state-in-effect -- intentional form reset when the modal opens
    const d = modal.defaults
    setTitulo(editando?.titulo ?? d.titulo ?? '')
    setSolicitante(editando?.solicitante ?? d.solicitante ?? '')
    setResponsable(editando?.responsable ?? d.responsable ?? (editando ? '' : usuario))
    setDescripcion(editando?.descripcion ?? d.descripcion ?? '')
    const prioInicial = editando?.prioridad ?? d.prioridad ?? 'Media'
    setPrioridad(prioInicial)
    setEstado(editando?.estado ?? d.estado ?? 'pendiente')
    const fechaInicial = editando?.fechaLimite ?? d.fechaLimite ?? ''
    if (fechaInicial) { setFechaLimite(fechaInicial); setFechaTocada(true) }
    else { setFechaLimite(fechaPorPrioridad(prioInicial)); setFechaTocada(false) }
    setHora(editando?.hora ?? d.hora ?? '')
    setProyectoId(editando?.proyectoId ?? d.proyectoId ?? '')
    setCreandoProyecto(false); setNuevoProyectoVal('')
    setRepetir(editando?.repetir ?? d.repetir ?? '')
    setEtiquetas((editando?.etiquetas ?? d.etiquetas ?? []).join(', '))
    setSubtareas(JSON.parse(JSON.stringify(editando?.subtareas ?? d.subtareas ?? [])))
    setComentarios(JSON.parse(JSON.stringify(editando?.comentarios ?? d.comentarios ?? [])))
    setAdjuntos(JSON.parse(JSON.stringify(editando?.adjuntos ?? d.adjuntos ?? [])))
    setAvanzado(false)
    setSubNueva(''); setComNuevo('')
  }, [modal.open]) // eslint-disable-line react-hooks/exhaustive-deps

  const agregarSub = () => {
    const v = subNueva.trim(); if (!v) return
    setSubtareas(s => [...s, { id: uid(), texto: v, completada: false, responsable: '', fechaLimite: '' }])
    setSubNueva('')
  }
  const setSub = (i: number, campo: keyof Subtarea, valor: unknown) =>
    setSubtareas(arr => arr.map((x, j) => j === i ? { ...x, [campo]: valor } : x))

  const agregarCom = () => {
    const v = comNuevo.trim(); if (!v) return
    setComentarios(c => [...c, { id: uid(), texto: v, autor: usuario, fecha: new Date().toISOString() }])
    setComNuevo('')
  }

  const guardar = () => {
    const t = titulo.trim()
    if (!t) { toast.error('El título es obligatorio'); return }
    if (estado === 'completado' && subtareas.some(s => !s.completada)) {
      toast.error('No puedes marcarlo como completado: faltan subtareas')
      return
    }
    const nombreProyecto = proyectos.find(p => p.id === proyectoId)?.nombre || ''
    const datos = {
      titulo: t, solicitante: solicitante.trim(), responsable: responsable.trim(),
      descripcion: descripcion.trim(), prioridad, estado, fechaLimite, hora,
      proyecto: nombreProyecto, proyectoId: proyectoId || undefined,
      etiquetas: etiquetas.split(',').map(s => s.trim()).filter(Boolean),
      subtareas, comentarios, adjuntos, repetir: repetir || undefined,
    }
    if (editando) actualizarPendiente(editando.id, datos)
    else crearPendiente({ ...datos, id: draftId })
    cerrarModal()
    toast.success('Guardado')
  }

  const faltanSub = subtareas.filter(s => !s.completada).length

  return (
    <Dialog open={modal.open} onOpenChange={o => { if (!o) cerrarModal() }}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto scroll-thin">
        <DialogHeader><DialogTitle>{editando ? 'Editar pendiente' : 'Nuevo pendiente'}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase text-muted-foreground">Título *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="¿Qué hay que hacer?" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase text-muted-foreground">Quién lo solicita</Label>
              <Input list="personas-dl" value={solicitante} onChange={e => setSolicitante(e.target.value)} placeholder="Ej: Liz" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase text-muted-foreground">Responsable</Label>
              <Input list="personas-dl" value={responsable} onChange={e => setResponsable(e.target.value)} placeholder="Ej: Yo" />
            </div>
          </div>
          <datalist id="personas-dl">{personas.map(p => <option key={p} value={p} />)}</datalist>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase text-muted-foreground">Descripción</Label>
            <Textarea rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Contexto, detalle…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase text-muted-foreground">Prioridad</Label>
              <Select value={prioridad} onValueChange={v => { setPrioridad(v as Prioridad); if (!fechaTocada) setFechaLimite(fechaPorPrioridad(v as Prioridad)) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Alta">🔴 Alta</SelectItem><SelectItem value="Media">🟡 Media</SelectItem><SelectItem value="Baja">🟢 Baja</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase text-muted-foreground">Estado</Label>
              <Select value={estado} onValueChange={v => setEstado(v as Estado)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pendiente">Pendiente</SelectItem><SelectItem value="en_progreso">En progreso</SelectItem><SelectItem value="bloqueado">Bloqueado</SelectItem><SelectItem value="completado" disabled={faltanSub > 0}>Completado{faltanSub > 0 ? ` (faltan ${faltanSub})` : ''}</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          {/* Fecha límite + hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase text-muted-foreground">Fecha límite</Label>
              <Input type="date" value={fechaLimite} onChange={e => { setFechaLimite(e.target.value); setFechaTocada(true) }} />
              {!fechaTocada && <p className="text-[10px] text-muted-foreground">Sugerida por prioridad ({prioridad})</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase text-muted-foreground">Hora (opcional)</Label>
              <Input type="time" value={hora} onChange={e => setHora(e.target.value)} />
            </div>
          </div>

          {/* Repetición */}
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase text-muted-foreground">Repetir</Label>
            <Select value={repetir || 'nunca'} onValueChange={v => setRepetir(v === 'nunca' ? '' : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nunca">No se repite</SelectItem>
                <SelectItem value="1d">Cada día</SelectItem>
                <SelectItem value="7d">Cada semana</SelectItem>
                <SelectItem value="14d">Cada 2 semanas</SelectItem>
                <SelectItem value="1m">Cada mes</SelectItem>
                <SelectItem value="!1d">Cada día (desde que se completa)</SelectItem>
                <SelectItem value="!7d">Cada semana (desde que se completa)</SelectItem>
              </SelectContent>
            </Select>
            {repetir && <p className="text-[10px] text-muted-foreground">Al completarlo se creará el siguiente: {describirRepeticion(repetir)}.</p>}
          </div>

          {/* Subtareas con responsable y fecha */}
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase text-muted-foreground">Subtareas {faltanSub > 0 && <span className="text-amber-600">· {faltanSub} por completar</span>}</Label>
            <div className="space-y-2">
              {subtareas.map((s, i) => (
                <div key={s.id} className="rounded-lg border p-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={s.completada} onCheckedChange={v => setSub(i, 'completada', !!v)} />
                    <Input value={s.texto} onChange={e => setSub(i, 'texto', e.target.value)} className={'h-7 flex-1 text-xs ' + (s.completada ? 'line-through opacity-60' : '')} />
                    <button onClick={() => setSubtareas(arr => arr.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 pl-6">
                    <Input list="personas-dl" value={s.responsable || ''} onChange={e => setSub(i, 'responsable', e.target.value)} placeholder="👤 Responsable" className="h-7 text-xs" />
                    <Input type="date" value={s.fechaLimite || ''} onChange={e => setSub(i, 'fechaLimite', e.target.value)} className="h-7 text-xs" />
                  </div>
                </div>
              ))}
              {!subtareas.length && <p className="text-xs text-muted-foreground">Sin subtareas.</p>}
            </div>
            <div className="flex gap-2">
              <Input value={subNueva} onChange={e => setSubNueva(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarSub() } }} placeholder="Agregar subtarea y Enter" className="h-8 text-xs" />
              <Button variant="secondary" size="sm" onClick={agregarSub}><Plus size={14} /></Button>
            </div>
          </div>

          {/* Adjuntos */}
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase text-muted-foreground">Adjuntos (archivos / imágenes)</Label>
            <AdjuntosUI adjuntos={adjuntos} taskId={draftId} onChange={setAdjuntos} />
          </div>

          {/* Comentarios / bitácora */}
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase text-muted-foreground">Comentarios e historial</Label>
            <div className="max-h-32 space-y-1 overflow-y-auto scroll-thin">
              {comentarios.map((c, i) => (
                <div key={i} className="rounded bg-muted p-1.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <span><b>{c.autor}:</b> {c.texto} <span className="text-muted-foreground">· {new Date(c.fecha).toLocaleString()}</span></span>
                    <button onClick={() => setComentarios(arr => arr.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X size={12} /></button>
                  </div>
                  {c.adjuntos && c.adjuntos.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">{c.adjuntos.map(a => <Miniatura key={a.id} a={a} />)}</div>
                  )}
                </div>
              ))}
              {!comentarios.length && <p className="text-xs text-muted-foreground">Sin comentarios.</p>}
            </div>
            <div className="flex gap-2">
              <Input value={comNuevo} onChange={e => setComNuevo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarCom() } }} placeholder="Escribe un comentario y Enter" className="h-8 text-xs" />
              <Button variant="secondary" size="sm" onClick={agregarCom}><Plus size={14} /></Button>
            </div>
          </div>

          {/* Avanzado */}
          <button onClick={() => setAvanzado(a => !a)} className="flex items-center gap-1 text-xs font-semibold text-primary">
            {avanzado ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Más detalles (proyecto, etiquetas)
          </button>
          {avanzado && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase text-muted-foreground">Proyecto</Label>
                {creandoProyecto ? (
                  <div className="flex gap-2">
                    <Input autoFocus value={nuevoProyectoVal} onChange={e => setNuevoProyectoVal(e.target.value)} placeholder="Nombre del proyecto nuevo"
                      onKeyDown={e => {
                        if (e.key !== 'Enter') return
                        e.preventDefault()
                        const n = nuevoProyectoVal.trim()
                        if (!n) return
                        const p = crearProyecto(n)
                        setProyectoId(p.id); setCreandoProyecto(false); setNuevoProyectoVal('')
                      }} />
                    <Button variant="secondary" size="sm" onClick={() => setCreandoProyecto(false)}>Cancelar</Button>
                  </div>
                ) : (
                  <Select value={proyectoId || '__ninguno'} onValueChange={v => { if (v === '__nuevo') setCreandoProyecto(true); else setProyectoId(v === '__ninguno' ? '' : v) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ninguno">Sin proyecto</SelectItem>
                      {proyectos.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className={'mr-1.5 inline-block h-2 w-2 rounded-full ' + (PROYECTO_COLORES[p.color]?.dot || PROYECTO_COLORES[PROYECTO_COLORES_KEYS[0]].dot)} />
                          {p.nombre}
                        </SelectItem>
                      ))}
                      <SelectItem value="__nuevo">+ Crear nuevo proyecto…</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase text-muted-foreground">Etiquetas (coma)</Label>
                <Input value={etiquetas} onChange={e => setEtiquetas(e.target.value)} placeholder="urgente, cliente" />
              </div>
              {editando?.origenNota && <p className="flex items-center gap-1 text-xs text-muted-foreground"><StickyNote size={13} /> Vinculado a una nota.</p>}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center sm:justify-between">
          {editando ? (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { eliminarPendiente(editando.id); cerrarModal() }}>
              <Trash2 size={14} className="mr-1" /> Eliminar
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
            <Button onClick={guardar}>Guardar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
