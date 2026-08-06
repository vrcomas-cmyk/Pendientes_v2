import { useWidgets } from '@/widgets-store'
import WidgetShell from '@/components/widgets/WidgetShell'
import PomodoroWidget from '@/components/widgets/PomodoroWidget'
import KanbanRapidoWidget from '@/components/widgets/KanbanRapidoWidget'
import NotaRapidaWidget from '@/components/widgets/NotaRapidaWidget'
import ProximaTareaWidget from '@/components/widgets/ProximaTareaWidget'
import type { WidgetTipo } from '@/lib/widgets'

const CONTENIDO: Record<WidgetTipo, () => React.ReactNode> = {
  pomodoro: () => <PomodoroWidget />,
  kanban: () => <KanbanRapidoWidget />,
  'nota-rapida': () => <NotaRapidaWidget />,
  'proxima-tarea': () => <ProximaTareaWidget />,
}

/** Capa global de widgets flotantes: se monta una sola vez (junto a TaskModal/PendientePeek en
    App.tsx) y sobrevive a los cambios de vista — un widget abierto en Hoy sigue visible en
    Proyectos, tal como se espera de un panel "siempre al frente" desacoplado de la navegación. */
export default function WidgetsLayer() {
  const { widgets, ordenZ } = useWidgets()
  if (!widgets.length) return null
  return (
    <>
      {widgets.map(w => (
        <WidgetShell key={w.id} w={w} zIndex={50 + Math.max(0, ordenZ.indexOf(w.id))}>
          {CONTENIDO[w.tipo]()}
        </WidgetShell>
      ))}
    </>
  )
}
