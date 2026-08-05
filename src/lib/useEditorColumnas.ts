import { toast } from 'sonner'
import { useApp } from '@/store'
import { useSync } from '@/sync'
import { uid } from '@/lib/app-utils'
import { siguienteColor } from '@/lib/columnas'
import { PROYECTO_COLORES_KEYS } from '@/types'

/** Acciones para editar las columnas del Kanban (compartidas por el espacio) — mismo hook usado
    por el tablero general (`KanbanView`) y por el tablero de cada proyecto (`ProyectosView`), para
    no duplicar la lógica de renombrar/recolorear/reordenar/añadir/eliminar en dos sitios. */
export function useEditorColumnas() {
  const { columnas, pendientes, actualizarPendiente } = useApp()
  const { actualizarColumnas } = useSync()

  const renombrar = (id: string, nombre: string) => {
    const limpio = nombre.trim()
    if (!limpio) return
    actualizarColumnas(columnas.map(c => c.id === id ? { ...c, nombre: limpio } : c))
  }
  const recolorear = (id: string) => {
    actualizarColumnas(columnas.map(c => c.id === id ? { ...c, color: PROYECTO_COLORES_KEYS[(PROYECTO_COLORES_KEYS.indexOf(c.color) + 1) % PROYECTO_COLORES_KEYS.length] } : c))
  }
  const marcarCompletado = (id: string) => {
    actualizarColumnas(columnas.map(c => ({ ...c, esCompletado: c.id === id })))
  }
  const mover = (id: string, dir: -1 | 1) => {
    const i = columnas.findIndex(c => c.id === id)
    const j = i + dir
    if (j < 0 || j >= columnas.length) return
    const copia = [...columnas];[copia[i], copia[j]] = [copia[j], copia[i]]
    actualizarColumnas(copia)
  }
  const agregar = () => {
    actualizarColumnas([...columnas, { id: uid(), nombre: 'Nueva columna', color: siguienteColor(columnas) }])
  }
  const eliminar = (id: string) => {
    const col = columnas.find(c => c.id === id)
    if (!col) return
    if (col.esCompletado) { toast.error('Antes marca otra columna como "completado"'); return }
    if (columnas.length <= 1) { toast.error('Debe quedar al menos una columna'); return }
    const restante = columnas.find(c => c.id !== id)!
    const afectados = pendientes.filter(p => p.estado === id)
    afectados.forEach(p => actualizarPendiente(p.id, { estado: restante.id }))
    actualizarColumnas(columnas.filter(c => c.id !== id))
    if (afectados.length) toast(`${afectados.length} pendiente(s) movidos a "${restante.nombre}"`)
  }

  return { columnas, renombrar, recolorear, marcarCompletado, mover, agregar, eliminar }
}
