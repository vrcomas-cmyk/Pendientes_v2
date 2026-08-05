import { useState, useMemo } from 'react'
import type { Pendiente } from '@/types'
import { PRIORIDAD_BORDER } from '@/types'
import { useApp } from '@/store'
import { activo, progresoSub } from '@/lib/app-utils'
import { colorColumna } from '@/lib/columnas'
import { useEditorColumnas } from '@/lib/useEditorColumnas'
import ColumnaHeader from '@/components/ColumnaHeader'
import MenuContextoPendiente from '@/components/MenuContextoPendiente'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Plus, User, CheckSquare, StickyNote } from 'lucide-react'

interface Props {
  /** Pendientes ya filtrados por el caller (la barra se renderiza con éstos). */
  pendientes: Pendiente[]
  /** Defaults a pasar al `abrirModal` al hacer click en "Añadir pendiente"
      desde el header de la columna (p. ej. `{ proyectoId }` en el tablero de un proyecto). */
  defaultsAlAgregar?: Partial<Pendiente>
  /** Ancho mínimo de las columnas. La vista general usa 240, el tablero de proyecto 220. */
  minColW?: number
}

/**
 * Tablero Kanban con drag & drop HTML5 nativo, columnas moldeables (compartidas
 * en el espacio) y menú contextual por tarjeta. Unificado entre `KanbanView`
 * (vista general de Pendientes) y `TableroProyecto` (vista por proyecto).
 *
 * - `onDragStart` fija el `id` del pendiente arrastrado en estado local.
 * - `onDrop` sobre una columna dispara `moverEstado(id, colId)`.
 * - Click en la tarjeta abre `PendientePeek` (vía `abrirPeek`).
 * - Botón "Añadir columna" usa `useEditorColumnas` (compartido en el espacio).
 */
export default function KanbanDnd({ pendientes, defaultsAlAgregar = {}, minColW = 240 }: Props) {
  const { moverEstado, abrirModal, abrirPeek, columnas } = useApp()
  const { agregar } = useEditorColumnas()
  const [dragId, setDragId] = useState<string | null>(null)

  const items = useMemo(() => pendientes.filter(activo), [pendientes])

  return (
    <div
      className="grid h-full auto-rows-fr gap-3 overflow-y-auto scroll-thin"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${minColW}px, 1fr))` }}
    >
      {columnas.map((col, idx) => {
        const deEstaColumna = items.filter(p => p.estado === col.id)
        const colores = colorColumna(col)
        return (
          <div
            key={col.id}
            className={'group flex min-h-[120px] flex-col rounded-lg p-2 ' + colores.bg}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (dragId) moverEstado(dragId, col.id) }}
          >
            <ColumnaHeader
              col={col}
              idx={idx}
              total={columnas.length}
              cantidad={deEstaColumna.length}
              onAgregarPendiente={() => abrirModal(null, { estado: col.id, ...defaultsAlAgregar })}
            />
            <div className="flex-1 space-y-1.5 overflow-y-auto scroll-thin">
              {deEstaColumna.map(p => {
                const sub = progresoSub(p)
                return (
                  <ContextMenu key={p.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        draggable
                        onDragStart={() => setDragId(p.id)}
                        onClick={() => abrirPeek(p.id)}
                        className={'cursor-pointer rounded-lg border-l-4 bg-card p-2 shadow-sm ' + (PRIORIDAD_BORDER[p.prioridad] || '')}
                      >
                        <div className={'text-xs font-medium ' + (col.esCompletado ? 'linea-completada' : '')}>{p.titulo}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
                          {p.responsable && <span className="inline-flex items-center gap-0.5"><User size={10} />{p.responsable}</span>}
                          {sub && <span className="inline-flex items-center gap-0.5"><CheckSquare size={10} />{sub.hechas}/{sub.total}</span>}
                          {p.origenNota && <StickyNote size={10} className="text-primary" />}
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <MenuContextoPendiente p={p} />
                  </ContextMenu>
                )
              })}
            </div>
          </div>
        )
      })}
      <button
        onClick={agregar}
        className="flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus size={16} className="mr-1" /> Añadir columna
      </button>
    </div>
  )
}
