import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const ATAJOS: [string, string][] = [
  ['N', 'Nuevo pendiente'],
  ['Shift+N', 'Nueva nota'],
  ['/', 'Enfocar la captura rápida'],
  ['1 – 7', 'Ir a Hoy / Inbox / Pendientes / Notas / Proyectos / Panel / Papelera'],
  ['Ctrl+Shift+1 – 4', 'Ir a un filtro guardado (smart list) — se configuran en Pendientes'],
  ['J / K', 'En Pendientes (Lista): moverse a la fila siguiente / anterior'],
  ['X', 'En Pendientes (Lista): completar la fila seleccionada'],
  ['Ctrl+Enter', 'En el modal de pendiente: guardar'],
  ['Esc', 'Cerrar la nota o el proyecto abierto'],
  ['Ctrl+K', 'Paleta de comandos'],
  ['?', 'Esta ayuda'],
]

const SINTAXIS: [string, string, string][] = [
  [':', 'Contexto / descripción', 'Cotización Soriana: pedir precio a 3 proveedores'],
  ['@', 'Responsable (repetible)', '@Liz @Juan'],
  ['!', 'Prioridad', '!alta · !media · !baja'],
  ['>', 'Fecha límite', '>mañana · >viernes · >2026-08-01 · >+5d'],
  ['#', 'Proyecto / etiqueta (repetible)', '#ventas #urgente'],
  ['*', 'Repetición', '*cada 3d · *cada lunes · *cada! 7d (desde que se completa)'],
]

export default function AyudaAtajos({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-base">Atajos y sintaxis de captura</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Atajos de teclado</h3>
            <div className="space-y-1">
              {ATAJOS.map(([tecla, desc]) => (
                <div key={tecla} className="flex items-center gap-2">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px] font-semibold">{tecla}</kbd>
                  <span className="text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Sintaxis de captura (notas y captura rápida)</h3>
            <div className="space-y-1.5">
              {SINTAXIS.map(([token, desc, ej]) => (
                <div key={token} className="flex items-start gap-2">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px] font-semibold">{token}</kbd>
                  <div className="min-w-0">
                    <div className="text-muted-foreground">{desc}</div>
                    <div className="truncate text-[11px] text-muted-foreground/70">{ej}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
