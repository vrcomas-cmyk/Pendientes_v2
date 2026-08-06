import { useRef, type ReactNode } from 'react'
import { useWidgets } from '@/widgets-store'
import { WIDGET_DEFAULTS, type WidgetInstancia } from '@/lib/widgets'
import { ChevronDown, ChevronUp, X, GripHorizontal } from 'lucide-react'

/** Caja "glass" común a todos los widgets: arrastrable desde el header, redimensionable desde la
    esquina inferior derecha, colapsable, con botón de cerrar. Los widgets concretos (Pomodoro,
    Kanban rápido...) solo aportan el contenido — nunca reimplementan drag/resize. */
export default function WidgetShell({ w, zIndex, children }: { w: WidgetInstancia; zIndex: number; children: ReactNode }) {
  const { moverWidget, redimensionarWidget, cerrarWidget, toggleColapsado, traerAlFrente } = useWidgets()
  const def = WIDGET_DEFAULTS[w.tipo]
  const arrastre = useRef<{ x: number; y: number; wx: number; wy: number } | null>(null)
  const resize = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    traerAlFrente(w.id)
    arrastre.current = { x: e.clientX, y: e.clientY, wx: w.x, wy: w.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onHeaderPointerMove = (e: React.PointerEvent) => {
    if (!arrastre.current) return
    const dx = e.clientX - arrastre.current.x
    const dy = e.clientY - arrastre.current.y
    const nx = Math.max(0, Math.min(window.innerWidth - 60, arrastre.current.wx + dx))
    const ny = Math.max(0, Math.min(window.innerHeight - 40, arrastre.current.wy + dy))
    moverWidget(w.id, nx, ny)
  }
  const onHeaderPointerUp = () => { arrastre.current = null }

  const onResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    traerAlFrente(w.id)
    resize.current = { x: e.clientX, y: e.clientY, w: w.w, h: w.h }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onResizePointerMove = (e: React.PointerEvent) => {
    if (!resize.current) return
    const dw = e.clientX - resize.current.x
    const dh = e.clientY - resize.current.y
    redimensionarWidget(w.id, Math.max(def.wMin, resize.current.w + dw), Math.max(def.hMin, resize.current.h + dh))
  }
  const onResizePointerUp = () => { resize.current = null }

  return (
    <div
      className="glass fixed flex flex-col overflow-hidden rounded-2xl shadow-glass"
      style={{ left: w.x, top: w.y, width: w.w, height: w.colapsado ? 'auto' : w.h, zIndex }}
      onPointerDown={() => traerAlFrente(w.id)}
    >
      <div
        className="flex shrink-0 cursor-grab items-center gap-1.5 border-b border-white/10 px-2.5 py-1.5 active:cursor-grabbing"
        onPointerDown={onHeaderPointerDown} onPointerMove={onHeaderPointerMove} onPointerUp={onHeaderPointerUp} onPointerCancel={onHeaderPointerUp}
      >
        <GripHorizontal size={13} className="shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">{def.titulo}</span>
        <button onClick={() => toggleColapsado(w.id)} className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground" title={w.colapsado ? 'Expandir' : 'Colapsar'}>
          {w.colapsado ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
        <button onClick={() => cerrarWidget(w.id)} className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive" title="Cerrar">
          <X size={13} />
        </button>
      </div>
      {!w.colapsado && (
        <>
          <div className="min-h-0 flex-1 overflow-auto p-2.5 scroll-thin">{children}</div>
          <div
            className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
            onPointerDown={onResizePointerDown} onPointerMove={onResizePointerMove} onPointerUp={onResizePointerUp} onPointerCancel={onResizePointerUp}
          />
        </>
      )}
    </div>
  )
}
