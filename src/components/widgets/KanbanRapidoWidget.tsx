import { useApp } from '@/store'
import { activo } from '@/lib/app-utils'
import KanbanDnd from '@/components/KanbanDnd'

/** Envuelve `KanbanDnd` tal cual — mismo componente que usa el tablero de Pendientes y el de cada
    Proyecto, solo con columnas más angostas para caber en un widget flotante. */
export default function KanbanRapidoWidget() {
  const { pendientes } = useApp()
  const items = pendientes.filter(activo)
  return (
    <div className="h-full min-w-0">
      <KanbanDnd pendientes={items} minColW={150} />
    </div>
  )
}
