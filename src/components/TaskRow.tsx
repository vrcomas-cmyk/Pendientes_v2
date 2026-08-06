import { useRef, useState } from 'react'
import { useApp } from '@/store'
import type { Pendiente } from '@/types'
import { PRIORIDAD_BORDER, PROYECTO_COLORES } from '@/types'
import { progresoSub, vencido, describirRepeticion, estaBloqueado } from '@/lib/app-utils'
import { columnaDe, colorColumna, idColumnaCompletado } from '@/lib/columnas'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import PosponerMenu from '@/components/PosponerMenu'
import MenuContextoPendiente from '@/components/MenuContextoPendiente'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { StickyNote, User, Calendar, CheckSquare, Repeat, Users, Archive, ArchiveRestore, Lock } from 'lucide-react'

const UMBRAL_SWIPE = 0.35 // fracción del ancho para "soltar y archivar"

export default function TaskRow({ p, seleccionado, onClick, modoArchivados }: { p: Pendiente; seleccionado?: boolean; onClick?: () => void; modoArchivados?: boolean }) {
  const { toggleCompletar, abrirPeek, proyectos, archivarPendiente, desarchivarPendiente, columnas, pendientes } = useApp()
  const idCompletado = idColumnaCompletado(columnas)
  const bloqueado = estaBloqueado(p, pendientes, idCompletado)
  const col = columnaDe(columnas, p.estado)
  const sub = progresoSub(p)
  const proyecto = p.proyectoId ? proyectos.find(x => x.id === p.proyectoId) : null
  const esMobile = useIsMobile()

  // --- Swipe (solo móvil): pointer events, solo se compromete si el gesto es predominantemente horizontal ---
  const filaRef = useRef<HTMLDivElement>(null)
  const [dx, setDx] = useState(0)
  const [arrastrando, setArrastrando] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const inicio = useRef<{ x: number; y: number; decidido: boolean; horizontal: boolean; ancho: number } | null>(null)

  const alTerminarSwipe = (accionArchivar: boolean) => {
    setSaliendo(true)
    setTimeout(() => { if (accionArchivar) archivarPendiente(p.id); else desarchivarPendiente(p.id) }, 150)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!esMobile) return
    inicio.current = { x: e.clientX, y: e.clientY, decidido: false, horizontal: false, ancho: filaRef.current?.offsetWidth || 300 }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!esMobile || !inicio.current) return
    const dxRaw = e.clientX - inicio.current.x
    const dyRaw = e.clientY - inicio.current.y
    if (!inicio.current.decidido) {
      if (Math.abs(dxRaw) < 8 && Math.abs(dyRaw) < 8) return
      inicio.current.decidido = true
      inicio.current.horizontal = Math.abs(dxRaw) > Math.abs(dyRaw)
      if (inicio.current.horizontal) setArrastrando(true)
    }
    if (!inicio.current.horizontal) return
    e.preventDefault()
    // Solo se puede deslizar hacia la izquierda (archivar) o derecha si ya está archivado (desarchivar)
    const limitado = modoArchivados ? Math.max(0, Math.min(dxRaw, inicio.current.ancho)) : Math.min(0, Math.max(dxRaw, -inicio.current.ancho))
    setDx(limitado)
  }
  const onPointerUp = () => {
    if (!esMobile || !inicio.current) return
    const fue = inicio.current.horizontal
    const ancho = inicio.current.ancho
    inicio.current = null
    if (fue && Math.abs(dx) / ancho > UMBRAL_SWIPE) {
      alTerminarSwipe(!modoArchivados)
      return
    }
    setArrastrando(false)
    setDx(0)
  }
  const onClickFila = (e: React.MouseEvent) => {
    // Si hubo un arrastre real, no lo tratamos como click (evita abrir el modal por accidente)
    if (Math.abs(dx) > 4) return
    // Por defecto abre la vista de solo lectura (peek) — igual que en Lista y Calendario. Editar
    // campos requiere el botón "Editar" explícito dentro del peek, no un click directo a la fila.
    ;(onClick ?? (() => abrirPeek(p.id)))()
    void e
  }

  const contenido = (
    <ContextMenu>
    <ContextMenuTrigger asChild>
    <div
      onClick={onClickFila}
      className={
        'group flex cursor-pointer items-start gap-2 rounded-lg border border-l-4 bg-card p-2 hover:bg-accent ' +
        (PRIORIDAD_BORDER[p.prioridad] || 'border-l-slate-300') +
        (seleccionado ? ' ring-2 ring-primary' : '')
      }
      style={esMobile ? { transform: `translateX(${dx}px)`, transition: arrastrando ? 'none' : 'transform 0.2s ease' } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Checkbox
        checked={p.estado === idCompletado}
        onCheckedChange={() => toggleCompletar(p.id)}
        onClick={e => e.stopPropagation()}
        aria-label={p.estado === idCompletado ? `Marcar "${p.titulo}" como no completado` : `Marcar "${p.titulo}" como completado`}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={'truncate text-xs font-semibold ' + (p.estado === idCompletado ? 'linea-completada' : '')}>{p.titulo}</span>
          {p.origenNota && <StickyNote size={12} className="shrink-0 text-primary" />}
          {bloqueado && <span title="Bloqueado por otro pendiente sin completar" className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Lock size={9} />bloqueado</span>}
          {vencido(p, idCompletado) && <span className="rounded bg-red-100 px-1 text-[10px] text-red-700 dark:bg-red-900/40 dark:text-red-300">vencido</span>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
          <span className={'rounded-full px-1.5 ' + colorColumna(col).badge}>{col.nombre}</span>
          {proyecto ? (
            <span className={'inline-flex items-center gap-1 rounded-full px-1.5 ' + (PROYECTO_COLORES[proyecto.color]?.badge || '')}>
              <span className={'h-1.5 w-1.5 rounded-full ' + (PROYECTO_COLORES[proyecto.color]?.dot || '')} />{proyecto.nombre}
            </span>
          ) : p.proyecto && <span className="rounded-full bg-muted px-1.5">📁 {p.proyecto}</span>}
          {p.responsable && <span className="inline-flex items-center gap-0.5"><User size={10} />{p.responsable}</span>}
          {p.fechaLimite && <span className="inline-flex items-center gap-0.5"><Calendar size={10} />{p.fechaLimite}</span>}
          {sub && <span className="inline-flex items-center gap-0.5"><CheckSquare size={10} />{sub.hechas}/{sub.total}</span>}
          {p.repetir && <span className="inline-flex items-center gap-0.5" title={describirRepeticion(p.repetir)}><Repeat size={10} /></span>}
          {typeof p.ponderacion === 'number' && <span aria-label={`Vale ${p.ponderacion} por ciento de la calificación`} className="inline-flex items-center gap-0.5 rounded-full bg-indigo-100 px-1.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{p.ponderacion}%</span>}
          {p.modalidad === 'equipo' && <span className="inline-flex items-center gap-0.5" title="En equipo"><Users size={10} /></span>}
        </div>
      </div>
      <div className="shrink-0 opacity-70 transition-opacity hover:opacity-100 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
        {modoArchivados ? (
          <Button size="icon" variant="ghost" className="h-8 w-8" title="Desarchivar" onClick={() => desarchivarPendiente(p.id)}>
            <ArchiveRestore size={14} />
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" title="Archivar" onClick={() => archivarPendiente(p.id)}>
              <Archive size={14} />
            </Button>
            <PosponerMenu id={p.id} size="icon" variant="ghost" />
          </div>
        )}
      </div>
    </div>
    </ContextMenuTrigger>
    <MenuContextoPendiente p={p} />
    </ContextMenu>
  )

  if (!esMobile) return contenido

  return (
    <div ref={filaRef} className="relative overflow-hidden rounded-lg" style={{ opacity: saliendo ? 0 : 1, transition: 'opacity 0.15s ease' }}>
      <div className={'absolute inset-0 flex items-center rounded-lg bg-red-500 text-white ' + (modoArchivados ? 'justify-start pl-4' : 'justify-end pr-4')}>
        {modoArchivados ? <ArchiveRestore size={18} /> : <Archive size={18} />}
      </div>
      {contenido}
    </div>
  )
}
