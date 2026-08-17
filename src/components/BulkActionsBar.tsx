import { useState } from 'react'
import { useApp } from '@/store'
import type { Prioridad } from '@/types'
import { PROYECTO_COLORES } from '@/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ConfirmDialog from '@/components/ConfirmDialog'
import { CheckSquare, Trash2, X } from 'lucide-react'

/** Barra de acciones masivas (Fase 2.2 del plan de mejora): aparece flotante cuando hay ≥1
    pendiente seleccionado en modo selección de ListView. Reusa el CRUD normal de `store.tsx`
    (mismo `eliminarPendiente`/`actualizarPendiente` que usa cualquier otra vista — nada nuevo
    a nivel de datos, solo aplicado en bucle sobre los ids seleccionados). */
export default function BulkActionsBar({ ids, onLimpiar }: { ids: string[]; onLimpiar: () => void }) {
  const { toggleCompletar, actualizarPendiente, eliminarPendiente, pendientes, columnas, personas, contactos, proyectos } = useApp()
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const idCompletado = columnas.find(c => c.esCompletado)?.id || 'completado'

  if (ids.length === 0) return null

  const completarTodos = () => {
    ids.forEach(id => {
      const p = pendientes.find(x => x.id === id)
      if (p && p.estado !== idCompletado) toggleCompletar(id)
    })
    onLimpiar()
  }
  const cambiarPrioridad = (prioridad: Prioridad) => { ids.forEach(id => actualizarPendiente(id, { prioridad })); onLimpiar() }
  const cambiarResponsable = (nombre: string) => { ids.forEach(id => actualizarPendiente(id, { responsable: nombre })); onLimpiar() }
  const cambiarProyecto = (proyectoId: string) => {
    const pr = proyectoId === '__ninguno' ? null : proyectos.find(x => x.id === proyectoId)
    ids.forEach(id => actualizarPendiente(id, { proyectoId: pr?.id, proyecto: pr?.nombre || '' }))
    onLimpiar()
  }
  const eliminarTodos = () => { ids.forEach(id => eliminarPendiente(id)); setConfirmarEliminar(false); onLimpiar() }

  const nombresDisponibles = [...new Set([...personas, ...contactos.filter(c => !c.borrado).map(c => c.nombre)])].sort()

  return (
    <>
      <div className="glass fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit max-w-[95vw] items-center gap-2 rounded-full p-1.5 shadow-glass">
        <span className="whitespace-nowrap px-2 text-xs font-medium">{ids.length} seleccionado{ids.length === 1 ? '' : 's'}</span>
        <Button size="sm" variant="ghost" className="h-8" onClick={completarTodos}>
          <CheckSquare size={13} className="mr-1.5" /> Completar
        </Button>
        <Select onValueChange={v => cambiarPrioridad(v as Prioridad)}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Prioridad" /></SelectTrigger>
          <SelectContent><SelectItem value="Alta">🔴 Alta</SelectItem><SelectItem value="Media">🟡 Media</SelectItem><SelectItem value="Baja">🟢 Baja</SelectItem></SelectContent>
        </Select>
        <Select onValueChange={cambiarResponsable}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Responsable" /></SelectTrigger>
          <SelectContent>{nombresDisponibles.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
        </Select>
        {proyectos.length > 0 && (
          <Select onValueChange={cambiarProyecto}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Mover a proyecto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__ninguno">Sin proyecto</SelectItem>
              {proyectos.map(pr => (
                <SelectItem key={pr.id} value={pr.id}>
                  <span className={'mr-1.5 inline-block h-2 w-2 rounded-full ' + (PROYECTO_COLORES[pr.color]?.dot || '')} />{pr.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive" onClick={() => setConfirmarEliminar(true)}>
          <Trash2 size={13} className="mr-1.5" /> Eliminar
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onLimpiar} aria-label="Cancelar selección">
          <X size={14} />
        </Button>
      </div>
      <ConfirmDialog
        open={confirmarEliminar}
        onOpenChange={setConfirmarEliminar}
        titulo={`¿Eliminar ${ids.length} pendiente${ids.length === 1 ? '' : 's'}?`}
        descripcion="Se mueven a la Papelera — se pueden restaurar desde ahí."
        onConfirmar={eliminarTodos}
      />
    </>
  )
}
