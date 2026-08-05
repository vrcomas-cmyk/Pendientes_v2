import type { ColumnaKanban } from '@/types'
import { PROYECTO_COLORES, PROYECTO_COLORES_KEYS } from '@/types'

const COLUMNA_ELIMINADA: ColumnaKanban = { id: '__eliminada', nombre: 'Columna eliminada', color: 'gris' }

/** Busca una columna por id; si ya no existe (se eliminó, o el pendiente viene de datos viejos),
    cae a un placeholder gris en vez de reventar — pasa cuando alguien borra una columna con
    pendientes dentro que no llegaron a reasignarse (ej. datos importados). */
export function columnaDe(columnas: ColumnaKanban[], id: string): ColumnaKanban {
  return columnas.find(c => c.id === id) || { ...COLUMNA_ELIMINADA, id }
}

/** Id de la columna marcada `esCompletado` — cae al último id de la lista si ninguna la tiene
    marcada (no debería pasar salvo datos corruptos: la UI impide borrar esa columna). */
export function idColumnaCompletado(columnas: ColumnaKanban[]): string {
  return columnas.find(c => c.esCompletado)?.id ?? columnas[columnas.length - 1]?.id ?? 'completado'
}

export function colorColumna(c: ColumnaKanban) {
  return PROYECTO_COLORES[c.color] || PROYECTO_COLORES[PROYECTO_COLORES_KEYS[0]]
}

/** Siguiente color de la paleta, para asignar por defecto a una columna nueva (round-robin, mismo
    patrón que `crearProyecto` en store.tsx). */
export function siguienteColor(columnas: ColumnaKanban[]): string {
  return PROYECTO_COLORES_KEYS[columnas.length % PROYECTO_COLORES_KEYS.length]
}
