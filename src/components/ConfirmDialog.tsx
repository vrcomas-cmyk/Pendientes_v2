import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/** Confirmación destructiva genérica (Fase 10.2) — mismo patrón que ya usaba `PapeleraView.tsx`
    para "Vaciar papelera", extraído acá para no repetirlo en cada sitio que elimina algo
    (proyecto, carpeta, evento...). `open` controla la visibilidad; pasar `null`/`undefined` como
    trigger de apertura es responsabilidad del caller (normalmente vía un id "pendiente de
    confirmar" en estado local). */
export default function ConfirmDialog({
  open, onOpenChange, titulo, descripcion, textoConfirmar = 'Eliminar', onConfirmar,
  onCancelar, cerrarTrasConfirmar = true,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  titulo: string
  descripcion: string
  textoConfirmar?: string
  onConfirmar: () => void
  onCancelar?: () => void
  cerrarTrasConfirmar?: boolean
}) {
  const cancelar = onCancelar ?? (() => onOpenChange(false))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-base">{titulo}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{descripcion}</p>
        <DialogFooter>
          <Button variant="secondary" onClick={cancelar}>Cancelar</Button>
          <Button variant="destructive" onClick={() => { onConfirmar(); if (cerrarTrasConfirmar) onOpenChange(false) }}>{textoConfirmar}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
