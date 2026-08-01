import { useState } from 'react'
import { useApp } from '@/store'
import ListView from '@/views/ListView'
import { KanbanView, CalendarView } from '@/views/OtherViews'
import AgendaView from '@/views/AgendaView'
import { List, Columns3, CalendarDays, CalendarClock } from 'lucide-react'

type Modo = 'lista' | 'tablero' | 'calendario' | 'agenda'

const MODOS: { id: Modo; label: string; icon: React.ReactNode }[] = [
  { id: 'lista', label: 'Lista', icon: <List size={14} /> },
  { id: 'tablero', label: 'Tablero', icon: <Columns3 size={14} /> },
  { id: 'calendario', label: 'Calendario', icon: <CalendarDays size={14} /> },
  { id: 'agenda', label: 'Agenda', icon: <CalendarClock size={14} /> },
]

export default function PendientesView() {
  const [modo, setModo] = useState<Modo>(() => {
    try { return (localStorage.getItem('pn_modo_vista') as Modo) || 'lista' } catch { return 'lista' }
  })
  const { filtroFecha, setFiltroFecha } = useApp()

  const cambiar = (m: Modo) => {
    setModo(m)
    try { localStorage.setItem('pn_modo_vista', m) } catch { /* noop */ }
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Selector de vista (las vistas son opcionales, no módulos separados) */}
      <div className="flex shrink-0 items-center gap-1 rounded-lg border bg-card p-1 w-fit">
        {MODOS.map(m => (
          <button key={m.id} onClick={() => cambiar(m.id)}
            className={'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ' + (modo === m.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {modo === 'lista' && <ListView filtroFecha={filtroFecha} setFiltroFecha={setFiltroFecha} />}
        {modo === 'tablero' && <KanbanView />}
        {modo === 'calendario' && <CalendarView />}
        {modo === 'agenda' && <AgendaView />}
      </div>
    </div>
  )
}
