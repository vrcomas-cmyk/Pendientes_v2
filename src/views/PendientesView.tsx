import { useEffect, useState } from 'react'
import { useUI } from '@/ui-store'
import ListView from '@/views/ListView'
import { KanbanView } from '@/views/OtherViews'
import { Card } from '@/components/ui/card'
import { List, Columns3 } from 'lucide-react'

type Modo = 'lista' | 'tablero'

const MODOS: { id: Modo; label: string; icon: React.ReactNode }[] = [
  { id: 'lista', label: 'Lista', icon: <List size={14} /> },
  { id: 'tablero', label: 'Tablero', icon: <Columns3 size={14} /> },
]

/** El calendario ya es un módulo propio («Calendario»): los modos guardados 'calendario'/'agenda' se
    migran a 'lista' para no dejar a nadie con un modo que ya no existe. */
function leerModoGuardado(): Modo {
  try {
    const v = localStorage.getItem('pn_modo_vista')
    if (v === 'lista' || v === 'tablero') return v
  } catch { /* noop */ }
  return 'lista'
}

export default function PendientesView() {
  const [modo, setModo] = useState<Modo>(leerModoGuardado)
  const { filtroFecha, setFiltroFecha } = useUI()

  // El panel lateral de agenda pide abrir el calendario completo aunque esta vista ya esté montada.
  useEffect(() => {
    const h = () => setModo(leerModoGuardado())
    window.addEventListener('pn-modo-vista', h)
    return () => window.removeEventListener('pn-modo-vista', h)
  }, [])

  const cambiar = (m: Modo) => {
    setModo(m)
    try { localStorage.setItem('pn_modo_vista', m) } catch { /* noop */ }
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Selector de vista (las vistas son opcionales, no módulos separados) */}
      <Card className="flex shrink-0 items-center gap-1 p-1 w-fit">
        {MODOS.map(m => (
          <button key={m.id} onClick={() => cambiar(m.id)}
            className={'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ' + (modo === m.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
            {m.icon} {m.label}
          </button>
        ))}
      </Card>
      <div className="min-h-0 flex-1">
        {modo === 'lista' && <ListView filtroFecha={filtroFecha} setFiltroFecha={setFiltroFecha} />}
        {modo === 'tablero' && <KanbanView />}
      </div>
    </div>
  )
}
