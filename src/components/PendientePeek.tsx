import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import PosponerMenu from '@/components/PosponerMenu'
import PendienteCuerpo from '@/components/PendienteCuerpo'
import { subtareasFaltantes } from '@/types'
import { Pencil, CheckCircle2 } from 'lucide-react'

/**
 * Diálogo de solo lectura para un pendiente (p. ej. al abrir un chip desde una nota).
 * Solo permite marcar/agregar subtareas y completar. Para cualquier otro cambio hay
 * un botón "Editar" que abre el modal completo (`TaskModal`).
 *
 * El cuerpo compartido vive en `<PendienteCuerpo>` para evitar divergencia con el
 * panel de detalle de la ListView (`TaskDetail`).
 */
export default function PendientePeek() {
  const { pendientes, toggleCompletar, columnas } = useApp()
  const { peekId, cerrarPeek, abrirModal } = useUI()
  const idCompletado = columnas.find(c => c.esCompletado)?.id ?? columnas[columnas.length - 1]?.id ?? 'completado'
  const p = peekId ? pendientes.find(x => x.id === peekId) : null

  return (
    <Dialog open={!!p} onOpenChange={o => { if (!o) cerrarPeek() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
        {p && (
          <>
            <DialogHeader>
              <DialogTitle className={p.estado === idCompletado ? 'linea-completada' : ''}>{p.titulo}</DialogTitle>
            </DialogHeader>

            <PendienteCuerpo
              pendiente={p}
              permitirAgregarSubtarea
            />

            {/* Acciones */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <Button
                variant="ghost" size="sm"
                disabled={p.estado !== idCompletado && subtareasFaltantes(p) > 0}
                onClick={() => toggleCompletar(p.id)}
                title={subtareasFaltantes(p) > 0 ? `Faltan ${subtareasFaltantes(p)} subtarea(s)` : ''}
              >
                <CheckCircle2 size={14} className="mr-1" /> {p.estado === idCompletado ? 'Reabrir' : 'Completar'}
              </Button>
              <div className="flex gap-2">
                <PosponerMenu id={p.id} variant="secondary" />
                <Button size="sm" onClick={() => abrirModal(p.id)}><Pencil size={13} className="mr-1" /> Editar</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
