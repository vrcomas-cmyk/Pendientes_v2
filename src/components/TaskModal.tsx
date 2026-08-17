import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import ConfirmDialog from '@/components/ConfirmDialog'
import type { Comentario, Estado, Prioridad, Subtarea, Adjunto } from '@/types'
type Modalidad = 'individual' | 'equipo'
import { PROYECTO_COLORES, PROYECTO_COLORES_KEYS } from '@/types'
import { uid, fechaPorPrioridad, describirRepeticion, defaultsHorario, asignarProyecto } from '@/lib/app-utils'
import { isGoogleConfigurado } from '@/lib/googleCalendar'
import { sincronizarEspejoGoogle } from '@/lib/agenda'
import { idColumnaCompletado } from '@/lib/columnas'
import AdjuntosUI, { Miniatura } from '@/components/AdjuntosUI'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, X, StickyNote, BookmarkPlus } from 'lucide-react'

export default function TaskModal() {
  const { pendientes, crearPendiente, actualizarPendiente, eliminarPendiente, usuario, personas, proyectos, crearProyecto, columnas, crearPlantilla, contactos, crearContacto } = useApp()
  const { modal, cerrarModal, overlay, registrarGuardia, confirmarDescartes, cancelarDescartes } = useUI()
  const idCompletado = idColumnaCompletado(columnas)
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
  const [ponderacion, setPonderacion] = useState('')
  const [modalidad, setModalidad] = useState<Modalidad | ''>('')
  const [bloqueadoPor, setBloqueadoPor] = useState<string[]>([])
  const [subtareas, setSubtareas] = useState<Subtarea[]>([])
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([])
  const [subNueva, setSubNueva] = useState('')
  const [comNuevo, setComNuevo] = useState('')
  // Fase 2.3 (plan de mejora): el modal se organiza en pestañas en vez del acordeón "Más
  // detalles" que escondía Proyecto/Etiquetas/Ponderación. Puramente de presentación — ningún
  // campo, handler ni la lógica de guardado/dirty-check de abajo cambia de comportamiento.
  const [tab, setTab] = useState<'general' | 'subtareas' | 'detalles' | 'actividad'>('general')

  type ValoresFormulario = {
    titulo: string; solicitante: string; responsable: string; descripcion: string
    prioridad: Prioridad; estado: Estado; fechaLimite: string; hora: string
    proyectoId: string; repetir: string; etiquetas: string; ponderacion: string
    modalidad: Modalidad | ''; bloqueadoPor: string[]
    subtareas: Subtarea[]; comentarios: Comentario[]; adjuntos: Adjunto[]
  }
  const snapshotDe = (v: ValoresFormulario) => JSON.stringify([
    v.titulo, v.solicitante, v.responsable, v.descripcion, v.prioridad, v.estado,
    v.fechaLimite, v.hora, v.proyectoId, v.repetir, v.etiquetas, v.ponderacion,
    v.modalidad, v.bloqueadoPor, v.subtareas, v.comentarios, v.adjuntos,
  ])
  const baseRef = useRef('')
  const dirtyRef = useRef(false)
  const sinVerificarRef = useRef(false)

  useLayoutEffect(() => {
    dirtyRef.current = baseRef.current !== '' && snapshotDe({
      titulo, solicitante, responsable, descripcion, prioridad, estado, fechaLimite,
      hora, proyectoId, repetir, etiquetas, ponderacion, modalidad, bloqueadoPor,
      subtareas, comentarios, adjuntos,
    }) !== baseRef.current
  })

  useEffect(() => {
    registrarGuardia(() => dirtyRef.current && !sinVerificarRef.current)
    return () => registrarGuardia(null)
  }, [registrarGuardia])

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
    const ponderacionInicial = editando?.ponderacion ?? d.ponderacion
    setPonderacion(ponderacionInicial != null ? String(ponderacionInicial) : '')
    setModalidad(editando?.modalidad ?? d.modalidad ?? '')
    setBloqueadoPor(editando?.bloqueadoPor ?? [])
    setSubtareas(JSON.parse(JSON.stringify(editando?.subtareas ?? d.subtareas ?? [])))
    setComentarios(JSON.parse(JSON.stringify(editando?.comentarios ?? d.comentarios ?? [])))
    setAdjuntos(JSON.parse(JSON.stringify(editando?.adjuntos ?? d.adjuntos ?? [])))
    setTab('general')
    setSubNueva(''); setComNuevo('')
    baseRef.current = snapshotDe({
      titulo: editando?.titulo ?? d.titulo ?? '',
      solicitante: editando?.solicitante ?? d.solicitante ?? '',
      responsable: editando?.responsable ?? d.responsable ?? (editando ? '' : usuario),
      descripcion: editando?.descripcion ?? d.descripcion ?? '',
      prioridad: prioInicial,
      estado: editando?.estado ?? d.estado ?? 'pendiente',
      fechaLimite: fechaInicial || fechaPorPrioridad(prioInicial),
      hora: editando?.hora ?? d.hora ?? '',
      proyectoId: editando?.proyectoId ?? d.proyectoId ?? '',
      repetir: editando?.repetir ?? d.repetir ?? '',
      etiquetas: (editando?.etiquetas ?? d.etiquetas ?? []).join(', '),
      ponderacion: (editando?.ponderacion ?? d.ponderacion) != null ? String(editando?.ponderacion ?? d.ponderacion) : '',
      modalidad: editando?.modalidad ?? d.modalidad ?? '',
      bloqueadoPor: editando?.bloqueadoPor ?? [],
      subtareas: JSON.parse(JSON.stringify(editando?.subtareas ?? d.subtareas ?? [])),
      comentarios: JSON.parse(JSON.stringify(editando?.comentarios ?? d.comentarios ?? [])),
      adjuntos: JSON.parse(JSON.stringify(editando?.adjuntos ?? d.adjuntos ?? [])),
    })
    dirtyRef.current = false
    sinVerificarRef.current = false
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
    if (estado === idCompletado && subtareas.some(s => !s.completada)) {
      toast.error('No puedes marcarlo como completado: faltan subtareas')
      return
    }
    // Si `proyectoId` apunta a un proyecto que no está (todavía) en `proyectos` — ej. borrado o
    // creado en otro dispositivo, no sincronizado — se conserva el nombre anterior en vez de
    // vaciarlo: así el guardado no deja la tarea sin proyecto visible mientras llega el dato.
    const { proyecto: nombreProyecto } = asignarProyecto(proyectoId || undefined, proyectos, editando?.proyecto || '')
    // El default de horario (8:00-8:05 solo fecha, +15min solo hora) se aplica al agendar por
    // primera vez, no en cada guardado suelto — así no se reagenda algo que el usuario ya quitó
    // deliberadamente de la Agenda.
    const seAgendaPorPrimeraVez = !editando || (!editando.fechaLimite && fechaLimite) || (!editando.hora && hora)
    const { hora: horaFinal, duracionMin: duracionFinal } = seAgendaPorPrimeraVez
      ? defaultsHorario(fechaLimite, hora, editando?.duracionMin)
      : { hora, duracionMin: editando?.duracionMin }
    const descripcionFinal = descripcion.trim()
    // Combobox de contacto (Fase 1b): el campo sigue siendo un string libre (retrocompatible,
    // igual que antes), pero al guardar se resuelve contra `contactos` por nombre — si ya existe
    // un contacto con ese nombre se reusa su id, si no se crea uno nuevo automáticamente. Así
    // `responsableId`/`solicitanteId` quedan como referencia real sin agregar un paso extra al
    // usuario (sigue siendo "escribir un nombre y listo").
    const resolverContacto = (nombre: string): string | undefined => {
      const n = nombre.trim()
      if (!n) return undefined
      const existente = contactos.find(c => !c.borrado && c.nombre.toLowerCase() === n.toLowerCase())
      return existente ? existente.id : crearContacto(n).id
    }
    const responsableTrim = responsable.trim()
    const solicitanteTrim = solicitante.trim()
    const datos = {
      titulo: t, solicitante: solicitanteTrim, responsable: responsableTrim,
      responsableId: resolverContacto(responsableTrim), solicitanteId: resolverContacto(solicitanteTrim),
      descripcion: descripcionFinal, prioridad, estado, fechaLimite, hora: horaFinal, duracionMin: duracionFinal,
      proyecto: nombreProyecto, proyectoId: proyectoId || undefined,
      etiquetas: etiquetas.split(',').map(s => s.trim()).filter(Boolean),
      subtareas, comentarios, adjuntos, repetir: repetir || undefined,
      ponderacion: ponderacion.trim() ? Math.max(0, Math.min(100, Number(ponderacion))) : undefined,
      modalidad: modalidad || undefined,
      bloqueadoPor: bloqueadoPor.length ? bloqueadoPor : undefined,
    }
    const id = editando?.id || draftId
    if (editando) actualizarPendiente(editando.id, datos)
    else crearPendiente({ ...datos, id: draftId })
    sinVerificarRef.current = true
    cerrarModal()
    toast.success('Guardado')

    // Mantiene el espejo en Google Calendar al día: si cambió título/fecha/hora/duración de un
    // pendiente ya agendado (o se acaba de agendar/desagendar), refleja el cambio allá también —
    // antes solo la Agenda lo hacía, y editar desde aquí dejaba el evento de Google desincronizado.
    const origenCuentaId = proyectos.find(p => p.id === proyectoId)?.cuentaGoogleId
    const teniaHorario = !!editando?.hora || !!editando?.googleEventos
    if (isGoogleConfigurado() && (horaFinal || teniaHorario)) {
      sincronizarEspejoGoogle(
        { hora: editando?.hora, googleEventos: editando?.googleEventos },
        { titulo: t, fecha: fechaLimite, hora: horaFinal, duracionMin: duracionFinal || 15, descripcion: descripcionFinal },
        origenCuentaId,
      )
        .then(r => { actualizarPendiente(id, { googleEventos: r.googleEventos }); if (r.errores && Object.keys(r.errores).length) toast.error('Algunas cuentas de Google no se pudieron actualizar') })
        .catch(err => toast.error(err instanceof Error ? err.message : 'No se pudo actualizar Google Calendar'))
    }
  }

  const faltanSub = subtareas.filter(s => !s.completada).length

  const guardarComoPlantilla = () => {
    const t = titulo.trim()
    if (!t) { toast.error('Escribe un título antes de guardar la plantilla'); return }
    crearPlantilla(t, {
      titulo: t, descripcion: descripcion.trim() || undefined, prioridad,
      etiquetas: etiquetas.split(',').map(s => s.trim()).filter(Boolean),
      subtareas: subtareas.map(s => ({ texto: s.texto })),
      duracionMin: undefined, proyectoId: proyectoId || undefined,
    })
    toast.success('Plantilla guardada: ' + t)
  }

  return (
    <>
      <Dialog open={modal.open} onOpenChange={o => { if (!o && overlay === 'modal') cerrarModal() }}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto scroll-thin"
        onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); guardar() } }}>
        <DialogHeader><DialogTitle>{editando ? 'Editar pendiente' : 'Nuevo pendiente'}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase text-muted-foreground">Título *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="¿Qué hay que hacer?" autoFocus />
          </div>
          <datalist id="personas-dl">
            {/* Une los strings sueltos legacy (`personas`, derivado de responsable/solicitante ya
                usados) con los nombres de Contacto reales — un nombre nuevo tipeado acá se
                convierte en Contacto recién al guardar (ver `resolverContacto` más abajo). */}
            {[...new Set([...personas, ...contactos.filter(c => !c.borrado).map(c => c.nombre)])].sort().map(p => <option key={p} value={p} />)}
          </datalist>

          {/* Pestañas (Fase 2.3): reemplazan el acordeón "Más detalles" — nada se esconde detrás
              de un toggle, cada sección tiene su propio lugar fijo. */}
          <div className="flex gap-1 border-b">
            {([
              ['general', 'General'],
              ['subtareas', `Subtareas${subtareas.length ? ` (${subtareas.length})` : ''}`],
              ['detalles', 'Detalles'],
              ['actividad', `Actividad${comentarios.length || adjuntos.length ? ` (${comentarios.length + adjuntos.length})` : ''}`],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={'border-b-2 px-2.5 pb-2 text-xs font-medium transition-colors ' + (tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'general' && (
          <div className="space-y-4">
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
                  <SelectContent>
                    {columnas.map(c => (
                      <SelectItem key={c.id} value={c.id} disabled={c.esCompletado && faltanSub > 0}>
                        {c.nombre}{c.esCompletado && faltanSub > 0 ? ` (faltan ${faltanSub})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
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
                {!hora && <p className="text-[10px] text-muted-foreground">Sin hora se agenda a las 8:00 (5 min)</p>}
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
          </div>
          )}

          {tab === 'subtareas' && (
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase text-muted-foreground">Subtareas {faltanSub > 0 && <span className="text-amber-600">· {faltanSub} por completar</span>}</Label>
            <div className="space-y-2">
              {subtareas.map((s, i) => (
                <div key={s.id} className="rounded-lg border p-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={s.completada} onCheckedChange={v => setSub(i, 'completada', !!v)} aria-label={`Marcar subtarea "${s.texto || 'sin título'}" como ${s.completada ? 'no completada' : 'completada'}`} />
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
          )}

          {tab === 'actividad' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase text-muted-foreground">Adjuntos (archivos / imágenes)</Label>
              <AdjuntosUI adjuntos={adjuntos} taskId={draftId} onChange={setAdjuntos} />
            </div>

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
          </div>
          )}

          {tab === 'detalles' && (
            <div className="space-y-4">
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase text-muted-foreground">Ponderación (%)</Label>
                  <Input type="number" min={0} max={100} value={ponderacion} onChange={e => setPonderacion(e.target.value)} placeholder="Ej: 20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase text-muted-foreground">Modalidad</Label>
                  <Select value={modalidad || '__ninguna'} onValueChange={v => setModalidad(v === '__ninguna' ? '' : v as Modalidad)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ninguna">Sin especificar</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="equipo">Equipo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase text-muted-foreground">Bloqueado por (Fase 8.5)</Label>
                <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border p-1.5 scroll-thin">
                  {pendientes.filter(p => p.id !== (editando?.id || draftId) && !p.borrado).map(p => (
                    <label key={p.id} className="flex items-center gap-2 rounded px-1 py-1 text-xs hover:bg-accent">
                      <Checkbox checked={bloqueadoPor.includes(p.id)}
                        onCheckedChange={v => setBloqueadoPor(arr => v ? [...arr, p.id] : arr.filter(id => id !== p.id))} />
                      <span className={'truncate ' + (p.estado === idCompletado ? 'text-muted-foreground line-through' : '')}>{p.titulo}</span>
                    </label>
                  ))}
                  {!pendientes.length && <p className="p-1 text-[11px] text-muted-foreground">No hay otros pendientes todavía.</p>}
                </div>
                <p className="text-[10px] text-muted-foreground">Este pendiente se marcará bloqueado mientras los seleccionados sigan sin completarse.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={guardarComoPlantilla}><BookmarkPlus size={13} className="mr-1" /> Guardar como plantilla</Button>
              {editando?.origenNota && <p className="flex items-center gap-1 text-xs text-muted-foreground"><StickyNote size={13} /> Vinculado a una nota.</p>}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center sm:justify-between">
          {editando ? (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { eliminarPendiente(editando.id); sinVerificarRef.current = true; cerrarModal() }}>
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
      {overlay === 'confirmar-cierre' && (
        <ConfirmDialog
          open
          onOpenChange={o => { if (!o) cancelarDescartes() }}
          onCancelar={cancelarDescartes}
          cerrarTrasConfirmar={false}
          onConfirmar={confirmarDescartes}
          titulo={editando ? 'Descartar cambios?' : 'Descartar este pendiente?'}
          descripcion="Hay cambios sin guardar en este pendiente. Si descartas, se perderán."
          textoConfirmar="Descartar"
        />
      )}
    </>
  )
}
