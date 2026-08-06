import { useMemo } from 'react'
import { useApp } from '@/store'
import { activo } from '@/lib/app-utils'
import { idColumnaCompletado } from '@/lib/columnas'
import TaskRow from '@/components/TaskRow'
import { Inbox as InboxIcon } from 'lucide-react'

/** Bandeja de entrada universal (Fase 5): formaliza como vista de primera clase el filtro
    "sin fecha" que ya vivía dentro de `TodayView` — todo lo capturado sin clasificar cae acá
    hasta que el usuario le da fecha, proyecto o espacio ("menos clics, menos ventanas"). La
    acción de "mover a" (fecha) ya la resuelve `PosponerMenu`, montado dentro de `TaskRow`. */
export default function InboxView() {
  const { pendientes: todosPendientes, columnas } = useApp()
  const idCompletado = idColumnaCompletado(columnas)
  const items = useMemo(
    () => todosPendientes.filter(p => activo(p) && !p.fechaLimite && p.estado !== idCompletado),
    [todosPendientes, idCompletado],
  )

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <InboxIcon size={18} className="text-primary" />
        <h2 className="text-display-md">Inbox</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Todo lo que capturaste sin fecha, proyecto o espacio cae acá. Dale una fecha (botón «Posponer»
        en cada fila) o ábrelo para asignarle proyecto y etiquetas.
      </p>
      <div className="space-y-1.5">
        {items.map(p => <TaskRow key={p.id} p={p} />)}
        {!items.length && (
          <p className="rounded-xl border bg-card p-6 text-center text-xs text-muted-foreground">
            Bandeja vacía — todo lo capturado ya tiene fecha o quedó organizado. 🎉
          </p>
        )}
      </div>
    </div>
  )
}
