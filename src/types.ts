export type Estado = 'pendiente' | 'en_progreso' | 'bloqueado' | 'completado'
export type Prioridad = 'Alta' | 'Media' | 'Baja'

export interface Subtarea {
  id: string
  texto: string
  completada: boolean
  responsable?: string
  fechaLimite?: string
}
export interface Comentario { id?: string; texto: string; autor: string; fecha: string; adjuntos?: Adjunto[] }

export interface Adjunto {
  id: string
  nombre: string
  tipo: string        // mime
  tamano: number      // bytes
  path?: string       // ruta en Supabase Storage (modo nube)
  dataUrl?: string    // base64 (modo local / imágenes pequeñas)
}

export interface Pendiente {
  id: string
  titulo: string
  solicitante: string
  responsable: string
  descripcion: string
  prioridad: Prioridad
  estado: Estado
  fechaLimite: string
  hora?: string       // HH:MM para eventos de calendario
  proyecto: string
  etiquetas: string[]
  subtareas: Subtarea[]
  comentarios: Comentario[]
  adjuntos: Adjunto[]
  origenNota: { notaId: string } | null
  borrado?: boolean
  creado: string
  modificado: string
  fechaCompletado: string | null
}

export interface Nota {
  id: string
  titulo: string
  contenidoHTML: string
  borrado?: boolean
  creado: string
  modificado: string
}

export const ESTADOS: Record<Estado, { label: string; dot: string; badge: string }> = {
  pendiente:   { label: 'Pendiente',   dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  en_progreso: { label: 'En progreso', dot: 'bg-blue-500',  badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  bloqueado:   { label: 'Bloqueado',   dot: 'bg-red-500',   badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  completado:  { label: 'Completado',  dot: 'bg-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
}

export const PRIORIDAD_BORDER: Record<Prioridad, string> = {
  Alta: 'border-l-red-500', Media: 'border-l-amber-400', Baja: 'border-l-emerald-400',
}

/** Subtareas pendientes (no completadas) de un pendiente */
export function subtareasPendientes(p: Pendiente): number {
  return (p.subtareas || []).filter(s => !s.completada).length
}
