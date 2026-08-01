import { useState } from 'react'
import type { Adjunto } from '@/types'
import { useApp } from '@/store'
import { ESTADOS, PROYECTO_COLORES } from '@/types'
import { googleCalendarUrl, progresoSub, vencido, describirRepeticion } from '@/lib/app-utils'
import { subirAdjunto } from '@/lib/adjuntos'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import AdjuntosUI, { Miniatura } from '@/components/AdjuntosUI'
import PosponerMenu from '@/components/PosponerMenu'
import { Pencil, Plus, User, Calendar, CalendarPlus, StickyNote, CheckCircle2, Send, ImagePlus, X } from 'lucide-react'

/**
 * Vista de SOLO LECTURA de un pendiente (p. ej. al abrir un chip desde una nota).
 * No se edita en línea: solo se pueden marcar/agregar subtareas y completar.
 * Para modificar cualquier otro campo hay un botón "Editar" que abre el modal completo.
 */
export default function PendientePeek() {
  const { peekId, cerrarPeek, pendientes, proyectos, abrirModal, toggleSubtarea, agregarSubtarea, toggleCompletar, agregarComentario, actualizarPendiente } = useApp()
  const [subNueva, setSubNueva] = useState('')
  const [com, setCom] = useState('')
  const [comImgs, setComImgs] = useState<Adjunto[]>([])
  const p = peekId ? pendientes.find(x => x.id === peekId) : null

  const agregar = () => { if (p && subNueva.trim()) { agregarSubtarea(p.id, subNueva); setSubNueva('') } }
  const enviarCom = () => {
    if (!p || (!com.trim() && !comImgs.length)) return
    agregarComentario(p.id, com, comImgs)
    setCom(''); setComImgs([])
  }
  const adjuntarImagenCom = async (file: File) => {
    if (!p) return
    try { const a = await subirAdjunto(file, p.id); setComImgs(prev => [...prev, a]) }
    catch { /* noop */ }
  }
  const onPasteCom = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items || []
    for (const it of items) { if (it.type.startsWith('image/')) { const f = it.getAsFile(); if (f) adjuntarImagenCom(f) } }
  }
  const elegirImagenCom = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'
    inp.onchange = () => { const f = inp.files?.[0]; if (f) adjuntarImagenCom(f) }
    inp.click()
  }

  return (
    <Dialog open={!!p} onOpenChange={o => { if (!o) cerrarPeek() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
        {p && (() => {
          const sub = progresoSub(p)
          const gcal = googleCalendarUrl(p.titulo, p.fechaLimite, p.hora, p.descripcion)
          const faltan = p.subtareas.filter(s => !s.completada).length
          return (
            <>
              <DialogHeader>
                <DialogTitle className={p.estado === 'completado' ? 'linea-completada' : ''}>{p.titulo}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Metadatos */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className={'rounded-full px-2 py-0.5 ' + ESTADOS[p.estado].badge}>{ESTADOS[p.estado].label}</span>
                  <Badge variant="secondary">Prioridad: {p.prioridad}</Badge>
                  {(() => {
                    const proyecto = p.proyectoId ? proyectos.find(x => x.id === p.proyectoId) : null
                    if (proyecto) return <Badge variant="secondary"><span className={'mr-1 inline-block h-2 w-2 rounded-full ' + (PROYECTO_COLORES[proyecto.color]?.dot || '')} />{proyecto.nombre}</Badge>
                    return p.proyecto ? <Badge variant="secondary">📁 {p.proyecto}</Badge> : null
                  })()}
                  {p.origenNota && <Badge variant="secondary"><StickyNote size={11} className="mr-1" /> Desde nota</Badge>}
                  {p.repetir && <Badge variant="secondary">🔁 {describirRepeticion(p.repetir)}</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {p.responsable && <div><span className="text-muted-foreground">Responsable:</span> {p.responsable}</div>}
                  {p.solicitante && <div><span className="text-muted-foreground">Solicita:</span> {p.solicitante}</div>}
                  {p.fechaLimite && <div className="col-span-2"><span className="text-muted-foreground">Fecha límite:</span> {p.fechaLimite}{p.hora ? ' ' + p.hora : ''} {vencido(p) && <span className="font-medium text-red-500">(vencido)</span>}</div>}
                </div>

                {p.descripcion && <div className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{p.descripcion}</div>}

                {gcal && (
                  <a href={gcal} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10">
                    <CalendarPlus size={14} /> Agregar a Google Calendar
                  </a>
                )}

                {/* Subtareas: lo único editable en línea */}
                <div>
                  <div className="mb-1.5 text-xs font-bold">Subtareas {sub && <span className="font-normal text-muted-foreground">({sub.hechas}/{sub.total})</span>}</div>
                  {sub && <div className="mb-2 h-1.5 w-full rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: sub.pct + '%' }} /></div>}
                  <div className="space-y-1">
                    {p.subtareas.map(s => (
                      <div key={s.id} className="flex items-start gap-2 rounded-md border px-2 py-1.5 text-sm">
                        <Checkbox checked={s.completada} onCheckedChange={() => toggleSubtarea(p.id, s.id)} className="mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className={s.completada ? 'linea-completada' : ''}>{s.texto}</span>
                          {(s.responsable || s.fechaLimite) && (
                            <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                              {s.responsable && <span className="inline-flex items-center gap-0.5"><User size={9} />{s.responsable}</span>}
                              {s.fechaLimite && <span className="inline-flex items-center gap-0.5"><Calendar size={9} />{s.fechaLimite}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {!p.subtareas.length && <p className="text-xs text-muted-foreground">Sin subtareas.</p>}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input value={subNueva} onChange={e => setSubNueva(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar() } }} placeholder="Agregar subtarea y Enter" className="h-8 text-xs" />
                    <Button variant="secondary" size="sm" onClick={agregar}><Plus size={14} /></Button>
                  </div>
                </div>

                {/* Adjuntos */}
                <div>
                  <div className="mb-1 text-xs font-bold">Adjuntos</div>
                  <AdjuntosUI adjuntos={p.adjuntos || []} taskId={p.id} onChange={a => actualizarPendiente(p.id, { adjuntos: a })} />
                </div>

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
                          <button onClick={() => setComImgs(prev => prev.filter(x => x.id !== a.id))} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Input value={com} onChange={e => setCom(e.target.value)} onPaste={onPasteCom} onKeyDown={e => { if (e.key === 'Enter') enviarCom() }} placeholder="Comenta… (pega una captura con Ctrl+V)" className="h-8 text-xs" />
                    <Button variant="secondary" size="sm" onClick={elegirImagenCom} title="Adjuntar captura"><ImagePlus size={13} /></Button>
                    <Button size="sm" onClick={enviarCom}><Send size={13} /></Button>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <Button variant="ghost" size="sm" disabled={p.estado !== 'completado' && faltan > 0}
                  onClick={() => toggleCompletar(p.id)} title={faltan > 0 ? `Faltan ${faltan} subtarea(s)` : ''}>
                  <CheckCircle2 size={14} className="mr-1" /> {p.estado === 'completado' ? 'Reabrir' : 'Completar'}
                </Button>
                <div className="flex gap-2">
                  <PosponerMenu id={p.id} variant="secondary" />
                  <Button size="sm" onClick={() => abrirModal(p.id)}><Pencil size={13} className="mr-1" /> Editar</Button>
                </div>
              </div>
            </>
          )
        })()}
      </DialogContent>
    </Dialog>
  )
}
