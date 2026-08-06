import { useEffect, useState } from 'react'
import type { Adjunto, Pendiente, Subtarea } from '@/types'
import { PROYECTO_COLORES } from '@/types'
import { useApp } from '@/store'
import { googleCalendarUrl, progresoSub, vencido, describirRepeticion } from '@/lib/app-utils'
import { columnaDe, colorColumna, idColumnaCompletado } from '@/lib/columnas'
import { subirAdjunto } from '@/lib/adjuntos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import AdjuntosUI, { Miniatura } from '@/components/AdjuntosUI'
import { StickyNote, Calendar, CalendarPlus, Send, User, ImagePlus, X, Plus, CornerDownRight, Play, Pause, Timer } from 'lucide-react'

function formatearMin(min: number): string {
  const h = Math.floor(min / 60), m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/** Timer opcional (Fase 9.2): play/pause + tiempo acumulado. Solo se re-renderiza cada minuto
    mientras corre (no cada segundo) — no tiene sentido gastar renders en algo que se muestra en
    minutos redondeados. */
function TimerPendiente({ p }: { p: Pendiente }) {
  const { iniciarTimer, pausarTimer } = useApp()
  const [, forzarRender] = useState(0)
  const corriendo = !!p.tiempoInicio
  useEffect(() => {
    if (!corriendo) return
    const id = setInterval(() => forzarRender(v => v + 1), 60000)
    return () => clearInterval(id)
  }, [corriendo])
  const enCurso = corriendo ? Math.round((Date.now() - new Date(p.tiempoInicio!).getTime()) / 60000) : 0
  const total = (p.tiempoTotalMin || 0) + enCurso
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-xs">
      <Timer size={13} className="text-muted-foreground" />
      <span className="flex-1">{total > 0 ? formatearMin(total) : 'Sin tiempo registrado'}{corriendo && <span className="ml-1 text-primary">● corriendo</span>}</span>
      <Button size="sm" variant={corriendo ? 'secondary' : 'default'} className="h-6 px-2 text-[11px]"
        onClick={() => corriendo ? pausarTimer(p.id) : iniciarTimer(p.id)}>
        {corriendo ? <Pause size={11} className="mr-1" /> : <Play size={11} className="mr-1" />}
        {corriendo ? 'Pausar' : 'Iniciar'}
      </Button>
    </div>
  )
}

/**
 * Cuerpo compartido entre el panel deDetalle de la ListView y el diálogo `PendientePeek`.
 * Renderiza metadatos + descripción + enlace a Google Calendar + subtareas + adjuntos +
 * etiquetas + comentarios. No renderiza la cabecera (título + acciones) — es responsabilidad
 * del caller, que la estructura de la UI depende del contexto (Diálogo con _header_ Radix,
 * panel con _header_ y botón "Volver" en móvil).
 *
 * Props:
 *  - `pendiente`: el pendiente a mostrar (ya resuelto, no null).
 *  - `permitirAgregarSubtarea`: si `true` muestra el input inline para añadir subtareas
 *    (Peek), si `false` sólo las lista (TaskDetail).
 *  - `destacarOrigenNota`: si `true` muestra el botón "Esta tarea vive también en una
 *    nota" que abre la nota vinculada (panel). El Peek ya lo muestra como badge en el
 *    header, evitando duplicación.
 *  - `mostrarCreado`: si `true` muestra el campo `Creado: <fecha>` en el grid de
 *    metadatos (panel). El Peek lo omite por brevedad.
 */
interface Props {
  pendiente: Pendiente
  permitirAgregarSubtarea?: boolean
  destacarOrigenNota?: boolean
  mostrarCreado?: boolean
}

/** Fila de subtarea recursiva (Fase 8.4): se llama a sí misma para renderizar `children` con
    indentación creciente. `permitirAgregar` solo habilita el "+" de agregar hijo en el nivel
    donde `PendienteCuerpo` lo permite (Peek); TaskDetail sigue siendo de solo lectura. */
function FilaSubtarea({ s, pid, nivel, permitirAgregar }: { s: Subtarea; pid: string; nivel: number; permitirAgregar: boolean }) {
  const { toggleSubtarea, agregarSubSubtarea } = useApp()
  const [agregando, setAgregando] = useState(false)
  const [texto, setTexto] = useState('')
  const confirmar = () => { if (texto.trim()) { agregarSubSubtarea(pid, s.id, texto); setTexto(''); setAgregando(false) } }
  return (
    <div style={{ marginLeft: nivel * 16 }}>
      <div className="flex items-start gap-2 rounded-md border px-2 py-1.5 text-sm">
        <Checkbox checked={s.completada} onCheckedChange={() => toggleSubtarea(pid, s.id)} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <span className={s.completada ? 'linea-completada' : ''}>{s.texto}</span>
          {(s.responsable || s.fechaLimite) && (
            <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
              {s.responsable && <span className="inline-flex items-center gap-0.5"><User size={9} />{s.responsable}</span>}
              {s.fechaLimite && <span className="inline-flex items-center gap-0.5"><Calendar size={9} />{s.fechaLimite}</span>}
            </div>
          )}
        </div>
        {permitirAgregar && nivel < 2 && (
          <button onClick={() => setAgregando(v => !v)} title="Agregar sub-subtarea" className="shrink-0 text-muted-foreground hover:text-primary">
            <CornerDownRight size={13} />
          </button>
        )}
      </div>
      {agregando && (
        <div className="mt-1 flex gap-2" style={{ marginLeft: 16 }}>
          <Input autoFocus value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') confirmar() }} placeholder="Sub-subtarea y Enter" className="h-7 text-xs" />
          <Button variant="secondary" size="sm" onClick={confirmar}><Plus size={13} /></Button>
        </div>
      )}
      {!!s.children?.length && (
        <div className="mt-1 space-y-1">
          {s.children.map(h => <FilaSubtarea key={h.id} s={h} pid={pid} nivel={nivel + 1} permitirAgregar={permitirAgregar} />)}
        </div>
      )}
    </div>
  )
}

export default function PendienteCuerpo({
  pendiente: p,
  permitirAgregarSubtarea = false,
  destacarOrigenNota = false,
  mostrarCreado = false,
}: Props) {
  const { proyectos, columnas, agregarSubtarea, setNotaActualId, agregarComentario, actualizarPendiente, colorDeEtiqueta } = useApp()
  const idCompletado = idColumnaCompletado(columnas)
  const col = columnaDe(columnas, p.estado)
  const sub = progresoSub(p)
  const gcal = googleCalendarUrl(p.titulo, p.fechaLimite, p.hora, p.descripcion)
  const proyecto = p.proyectoId ? proyectos.find(x => x.id === p.proyectoId) : null

  const [subNueva, setSubNueva] = useState('')
  const [com, setCom] = useState('')
  const [comImgs, setComImgs] = useState<Adjunto[]>([])

  const agregar = () => {
    if (subNueva.trim()) { agregarSubtarea(p.id, subNueva); setSubNueva('') }
  }
  const enviarCom = () => {
    if (!com.trim() && !comImgs.length) return
    agregarComentario(p.id, com, comImgs)
    setCom(''); setComImgs([])
  }
  const adjuntarImagenCom = async (file: File) => {
    try { const a = await subirAdjunto(file, p.id); setComImgs(prev => [...prev, a]) }
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
    <div className="space-y-4">
      {/* Metadatos */}
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <span className={' rounded-full px-2 py-0.5 ' + colorColumna(col).badge}>{col.nombre}</span>
        <Badge variant="secondary">Prioridad: {p.prioridad}</Badge>
        {proyecto
          ? <Badge variant="secondary"><span className={'mr-1 inline-block h-2 w-2 rounded-full ' + (PROYECTO_COLORES[proyecto.color]?.dot || '')} />{proyecto.nombre}</Badge>
          : p.proyecto && <Badge variant="secondary">📁 {p.proyecto}</Badge>}
        {p.origenNota && <Badge variant="secondary"><StickyNote size={11} className="mr-1" /> Desde nota</Badge>}
        {p.repetir && <Badge variant="secondary">🔁 {describirRepeticion(p.repetir)}</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {p.responsable && <div><span className="text-muted-foreground">Responsable:</span> {p.responsable}</div>}
        {p.solicitante && <div><span className="text-muted-foreground">Solicita:</span> {p.solicitante}</div>}
        {p.fechaLimite && <div className="col-span-2"><span className="text-muted-foreground">Fecha límite:</span> {p.fechaLimite}{p.hora ? ' ' + p.hora : ''} {vencido(p, idCompletado) && <span className="font-medium text-red-500">(vencido)</span>}</div>}
        {mostrarCreado && <div className="col-span-2"><span className="text-muted-foreground">Creado:</span> {new Date(p.creado).toLocaleDateString()}</div>}
      </div>

      {p.descripcion && <div className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{p.descripcion}</div>}

      <TimerPendiente p={p} />

      {gcal && (
        <a href={gcal} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10">
          <CalendarPlus size={14} /> Agregar a Google Calendar
        </a>
      )}

      {destacarOrigenNota && p.origenNota && (
        <button onClick={() => setNotaActualId(p.origenNota!.notaId)} className="flex items-center gap-1 text-xs text-primary hover:underline">
          <StickyNote size={13} /> Esta tarea vive también en una nota
        </button>
      )}

      {/* Subtareas */}
      <div>
        <div className="mb-1.5 text-xs font-bold">Subtareas {sub && <span className="font-normal text-muted-foreground">({sub.hechas}/{sub.total})</span>}</div>
        {sub && <div className="mb-2 h-1.5 w-full rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: sub.pct + '%' }} /></div>}
        <div className="space-y-1">
          {p.subtareas.map(s => <FilaSubtarea key={s.id} s={s} pid={p.id} nivel={0} permitirAgregar={permitirAgregarSubtarea} />)}
          {!p.subtareas.length && <p className="text-xs text-muted-foreground">Sin subtareas.</p>}
        </div>
        {permitirAgregarSubtarea && (
          <div className="mt-2 flex gap-2">
            <Input value={subNueva} onChange={e => setSubNueva(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar() } }} placeholder="Agregar subtarea y Enter" className="h-8 text-xs" />
            <Button variant="secondary" size="sm" onClick={agregar}><Plus size={14} /></Button>
          </div>
        )}
        {sub && sub.hechas < sub.total && <p className="mt-1 text-[10px] text-amber-600">⚠ No se puede completar hasta terminar las subtareas.</p>}
      </div>

      {/* Adjuntos */}
      <div>
        <div className="mb-1 text-xs font-bold">Adjuntos</div>
        <AdjuntosUI adjuntos={p.adjuntos || []} taskId={p.id} onChange={a => actualizarPendiente(p.id, { adjuntos: a })} />
      </div>

      {/* Etiquetas — color propio si la etiqueta está registrada en Ajustes (Fase 8.1), gris si no */}
      {p.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {p.etiquetas.map(e => {
            const color = colorDeEtiqueta(e)
            return (
              <span key={e} className={'rounded-full px-1.5 py-0.5 text-[10px] ' + (color ? PROYECTO_COLORES[color].badge : 'bg-primary/10 text-primary')}>#{e}</span>
            )
          })}
        </div>
      )}

      {/* Comentarios */}
      <div>
        <div className="mb-1 text-xs font-bold">Comentarios</div>
        <div className="space-y-1">
          {(p.comentarios || []).map((c, i) => (
            <div key={c.id || i} className="rounded bg-muted p-1.5 text-xs">
              <div><b>{c.autor}:</b> {c.texto} <span className="text-muted-foreground">· {new Date(c.fecha).toLocaleString()}</span></div>
              {c.adjuntos && c.adjuntos.length > 0 && <div className="mt-1 flex flex-wrap gap-1.5">{c.adjuntos.map(a => <Miniatura key={a.id} a={a} />)}</div>}
            </div>
          ))}
          {!(p.comentarios || []).length && <p className="text-xs text-muted-foreground">Aún no hay comentarios.</p>}
        </div>
        {comImgs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {comImgs.map(a => (
              <div key={a.id} className="relative">
                <Miniatura a={a} />
                <button onClick={() => setComImgs(prev => prev.filter(x => x.id !== a.id))} aria-label="Quitar imagen" className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"><X size={12} /></button>
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
  )
}
