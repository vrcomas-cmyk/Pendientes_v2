import { useState } from 'react'
import type { ColumnaKanban } from '@/types'
import { colorColumna } from '@/lib/columnas'
import { useEditorColumnas } from '@/lib/useEditorColumnas'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { ChevronLeft, ChevronRight, CheckCircle2, Trash2, Plus, MoreVertical } from 'lucide-react'

/** Encabezado editable de una columna del Kanban: click en el punto de color para recolorear,
    click en el nombre para renombrarlo, y un botón "⋮" siempre visible (no solo al pasar el mouse
    — en táctil no hay hover, así que los controles quedaban inalcanzables en móvil) que abre un
    menú con mover/marcar completado/eliminar/añadir. Compartido por el tablero general
    (`KanbanView`) y el tablero por proyecto (`ProyectosView`). */
export default function ColumnaHeader({
  col, idx, total, cantidad, onAgregarPendiente,
}: {
  col: ColumnaKanban
  idx: number
  total: number
  cantidad: number
  onAgregarPendiente?: () => void
}) {
  const { renombrar, recolorear, marcarCompletado, mover, eliminar } = useEditorColumnas()
  const [editando, setEditando] = useState(false)
  const [nombreTmp, setNombreTmp] = useState('')
  const colores = colorColumna(col)

  const guardar = () => { renombrar(col.id, nombreTmp); setEditando(false) }

  return (
    <div className="mb-1.5 flex items-start justify-between gap-1">
      <div className="flex min-w-0 flex-1 items-start gap-1.5">
        <button onClick={() => recolorear(col.id)} title="Cambiar color" className={'mt-1 h-2.5 w-2.5 shrink-0 rounded-full ' + colores.dot} />
        {editando ? (
          <input autoFocus value={nombreTmp} onChange={e => setNombreTmp(e.target.value)}
            onBlur={guardar} onKeyDown={e => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') setEditando(false) }}
            className="h-6 min-w-0 flex-1 rounded border bg-background px-1 text-[10px] font-bold" />
        ) : (
          <h3 onClick={() => { setEditando(true); setNombreTmp(col.nombre) }} title="Click para renombrar" className="cursor-text break-words text-[10px] font-bold leading-tight hover:underline">
            {col.nombre} <span className="font-normal text-muted-foreground">{cantidad}</span>
          </h3>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="shrink-0 text-muted-foreground hover:text-primary" title="Opciones de columna"><MoreVertical size={14} /></button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem disabled={idx === 0} onClick={() => mover(col.id, -1)}><ChevronLeft size={14} className="mr-2" /> Mover izquierda</DropdownMenuItem>
          <DropdownMenuItem disabled={idx === total - 1} onClick={() => mover(col.id, 1)}><ChevronRight size={14} className="mr-2" /> Mover derecha</DropdownMenuItem>
          <DropdownMenuItem onClick={() => marcarCompletado(col.id)}>
            <CheckCircle2 size={14} className={'mr-2 ' + (col.esCompletado ? 'text-emerald-500' : '')} /> Marcar como completado
          </DropdownMenuItem>
          {!col.esCompletado && onAgregarPendiente && (
            <DropdownMenuItem onClick={onAgregarPendiente}><Plus size={14} className="mr-2" /> Añadir pendiente</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => eliminar(col.id)}><Trash2 size={14} className="mr-2" /> Eliminar columna</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
