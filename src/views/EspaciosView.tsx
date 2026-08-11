import { useState } from 'react'
import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import { PROYECTO_COLORES } from '@/types'
import NuevoEspacioDialog from '@/components/NuevoEspacioDialog'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Plus } from 'lucide-react'

/** Vista «Espacios» (F2.1 / PDS §5.3): 5º destino primario. Lista los espacios del Personal
    Workspace como tarjetas; un clic fija `espacioActualId` y entra en la vista Proyectos
    (que ya filtra por `espacioActualId`). No confundir con el "Espacio" de sincronización
    (cuenta compartida) — ese vive en EspacioDialog/Ajustes. */
export default function EspaciosView({ onEntrar }: { onEntrar: () => void }) {
  const { espacios, proyectos } = useApp()
  const { setEspacioActualId } = useUI()
  const [dlg, setDlg] = useState(false)

  const activos = (espacioId: string) =>
    proyectos.filter(p => p.espacioId === espacioId && !p.archivado).length

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold"><LayoutGrid size={15} className="text-primary" /> Espacios</h2>
        <Button size="sm" onClick={() => setDlg(true)}><Plus size={13} className="mr-1" /> Nuevo espacio</Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1 scroll-thin">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <button type="button" onClick={() => { setEspacioActualId(null); onEntrar() }}
            className="glass flex flex-col items-start gap-2 rounded-2xl bg-card p-4 text-left transition-colors hover:bg-accent">
            <span aria-hidden className="text-2xl leading-none">📋</span>
            <span className="text-sm font-semibold">Todos</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>{proyectos.filter(p => !p.archivado).length}</span>
              <span>activos</span>
            </span>
          </button>
          {espacios.map(e => {
            const colores = PROYECTO_COLORES[e.color] || PROYECTO_COLORES[Object.keys(PROYECTO_COLORES)[0]]
            return (
              <button key={e.id} type="button" onClick={() => { setEspacioActualId(e.id); onEntrar() }}
                className="glass flex flex-col items-start gap-2 rounded-2xl bg-card p-4 text-left transition-colors hover:bg-accent">
                <span aria-hidden className="text-2xl leading-none">{e.icono}</span>
                <span className="text-sm font-semibold">{e.nombre}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className={'h-1.5 w-1.5 rounded-full ' + colores.dot} />
                  <span>{activos(e.id)}</span>
                  <span>activos</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <NuevoEspacioDialog open={dlg} onOpenChange={setDlg} />
    </div>
  )
}