import type { Pendiente } from '@/types'
import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import { idColumnaCompletado } from '@/lib/columnas'
import {
  ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
} from '@/components/ui/context-menu'

/** Contenido del menú de click derecho de un pendiente — compartido por `TaskRow` (Lista y
    tableros de Proyectos), `KanbanView` y los bloques de `CalendarioView`, para no repetir la
    misma lista de acciones tres veces. El llamador solo pone `<ContextMenu><ContextMenuTrigger
    asChild>{tarjeta}</ContextMenuTrigger><MenuContextoPendiente p={p} /></ContextMenu>`. */
export default function MenuContextoPendiente({ p }: { p: Pendiente }) {
  const { columnas, proyectos, toggleCompletar, duplicarPendiente, archivarPendiente, desarchivarPendiente, eliminarPendiente, moverEstado, actualizarPendiente } = useApp()
  const { abrirModal } = useUI()
  const idCompletado = idColumnaCompletado(columnas)
  const completado = p.estado === idCompletado

  return (
    <ContextMenuContent className="w-52">
      <ContextMenuItem onClick={() => toggleCompletar(p.id)}>{completado ? 'Reabrir' : 'Completar'}</ContextMenuItem>
      <ContextMenuItem onClick={() => abrirModal(p.id)}>Editar</ContextMenuItem>
      <ContextMenuItem onClick={() => duplicarPendiente(p.id)}>Duplicar</ContextMenuItem>
      <ContextMenuSub>
        <ContextMenuSubTrigger>Mover a columna</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {columnas.map(c => (
            <ContextMenuItem key={c.id} disabled={c.id === p.estado} onClick={() => moverEstado(p.id, c.id)}>{c.nombre}</ContextMenuItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
      {proyectos.length > 0 && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>Mover a proyecto</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem disabled={!p.proyectoId} onClick={() => actualizarPendiente(p.id, { proyectoId: undefined, proyecto: '' })}>Sin proyecto</ContextMenuItem>
            <ContextMenuSeparator />
            {proyectos.map(pr => (
              <ContextMenuItem key={pr.id} disabled={pr.id === p.proyectoId} onClick={() => actualizarPendiente(p.id, { proyectoId: pr.id, proyecto: pr.nombre })}>{pr.nombre}</ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => (p.archivado ? desarchivarPendiente : archivarPendiente)(p.id)}>
        {p.archivado ? 'Desarchivar' : 'Archivar'}
      </ContextMenuItem>
      <ContextMenuItem className="text-destructive" onClick={() => eliminarPendiente(p.id)}>Eliminar</ContextMenuItem>
    </ContextMenuContent>
  )
}
