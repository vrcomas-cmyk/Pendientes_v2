import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

/** Hoja inferior para móvil (bottom sheet): sube desde abajo, se cierra con Esc, tocando fuera o con
    el asa. Usa Radix Dialog, así que atrapa el foco y es accesible igual que los demás diálogos. */
export default function HojaInferior({ open, onOpenChange, titulo, children }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  titulo: string
  children: ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in fade-in duration-150 motion-reduce:animate-none" />
        <DialogPrimitive.Content aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex h-[78vh] flex-col overflow-hidden rounded-t-2xl border-t bg-card shadow-xl outline-none animate-in slide-in-from-bottom duration-200 motion-reduce:animate-none">
          <DialogPrimitive.Title className="sr-only">{titulo}</DialogPrimitive.Title>
          <button type="button" aria-label="Cerrar" onClick={() => onOpenChange(false)} className="flex shrink-0 justify-center pb-1 pt-2">
            <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </button>
          <div className="min-h-0 flex-1">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
