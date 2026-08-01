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
  repetir?: string        // regla de recurrencia normalizada: '7d' | '2s' | '1m' | 'w:1,4' | prefijo '!' = desde completado
  duracionMin?: number    // duración del bloque en la Agenda (time-blocking), en minutos
  googleEventos?: Record<string, string>  // cuentaId de Google Calendar -> id del evento creado ahí
  proyectoId?: string     // referencia a Proyecto.id; `proyecto` (string) se mantiene como espejo del nombre para compatibilidad (export CSV, badges antiguos)
  borrado?: boolean
  creado: string
  modificado: string
  fechaCompletado: string | null
}

export interface Nota {
  id: string
  titulo: string
  contenidoHTML: string
  carpeta?: string      // carpeta / archivo para organizar notas
  borrado?: boolean
  creado: string
  modificado: string
}

export interface Proyecto {
  id: string
  nombre: string
  color: string           // clave de PROYECTO_COLORES
  cuentaGoogleId?: string // id de conexión en pnp_google_calendar que "es dueña" de este proyecto (ruteo de espejo)
  archivado?: boolean
  creado: string
  modificado: string
}

export const PROYECTO_COLORES: Record<string, { dot: string; badge: string; border: string }> = {
  rojo:      { dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',         border: 'border-l-red-500' },
  naranja:   { dot: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', border: 'border-l-orange-500' },
  ambar:     { dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',  border: 'border-l-amber-500' },
  esmeralda: { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', border: 'border-l-emerald-500' },
  teal:      { dot: 'bg-teal-500',    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',     border: 'border-l-teal-500' },
  azul:      { dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',     border: 'border-l-blue-500' },
  indigo:    { dot: 'bg-indigo-500',  badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', border: 'border-l-indigo-500' },
  violeta:   { dot: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', border: 'border-l-violet-500' },
  rosa:      { dot: 'bg-pink-500',    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',     border: 'border-l-pink-500' },
  gris:      { dot: 'bg-slate-500',   badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300', border: 'border-l-slate-500' },
}
export const PROYECTO_COLORES_KEYS = Object.keys(PROYECTO_COLORES)

export const ESTADOS: Record<Estado, { label: string; dot: string; badge: string }> = {
  pendiente:   { label: 'Pendiente',   dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  en_progreso: { label: 'En progreso', dot: 'bg-blue-500',  badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  bloqueado:   { label: 'Bloqueado',   dot: 'bg-red-500',   badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  completado:  { label: 'Completado',  dot: 'bg-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
}

export const PRIORIDAD_BORDER: Record<Prioridad, string> = {
  Alta: 'border-l-red-500', Media: 'border-l-amber-400', Baja: 'border-l-emerald-400',
}

export type FiltroFecha = 'todos' | 'abiertos' | 'vencidos' | 'hoy' | 'semana'

/** Subtareas pendientes (no completadas) de un pendiente */
export function subtareasPendientes(p: Pendiente): number {
  return (p.subtareas || []).filter(s => !s.completada).length
}
