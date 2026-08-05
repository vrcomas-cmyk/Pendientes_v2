// Antes era una unión fija; ahora es el id de una `ColumnaKanban` moldeable desde la interfaz
// (ver `COLUMNAS_DEFECTO` más abajo y `src/lib/columnas.ts`). Se conserva el alias `Estado` para no
// tener que renombrar el campo `Pendiente.estado` ni sus importaciones en el resto de la app.
export type Estado = string
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
  ponderacion?: number    // porcentaje (0-100) que vale la entrega, ej. para planes de estudio importados
  modalidad?: 'individual' | 'equipo'
  archivado?: boolean     // "archivar" (estilo Gmail): se saca de las vistas activas sin borrarlo
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

/** Evento suelto de calendario (no es un pendiente): reunión, cita, bloqueo de tiempo, etc.
    Se espeja en Google Calendar igual que un pendiente agendado, vía `googleEventos`. */
export interface EventoCalendario {
  id: string
  titulo: string
  descripcion?: string
  fecha: string           // YYYY-MM-DD
  hora: string             // HH:MM
  duracionMin: number
  cuentaGoogleId?: string  // cuenta de origen (ruteo de espejo, igual que Proyecto.cuentaGoogleId)
  soloEstaCuenta?: boolean // igual semántica que el parámetro de agendarPendiente
  googleEventos?: Record<string, string>  // cuentaId de Google Calendar -> id del evento creado ahí
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

export const PROYECTO_COLORES: Record<string, { dot: string; badge: string; border: string; bg: string }> = {
  rojo:      { dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',         border: 'border-l-red-500',     bg: 'bg-red-50 dark:bg-red-900/20' },
  naranja:   { dot: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', border: 'border-l-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ambar:     { dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',  border: 'border-l-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
  esmeralda: { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  teal:      { dot: 'bg-teal-500',    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',     border: 'border-l-teal-500',     bg: 'bg-teal-50 dark:bg-teal-900/20' },
  azul:      { dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',     border: 'border-l-blue-500',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
  indigo:    { dot: 'bg-indigo-500',  badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', border: 'border-l-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  violeta:   { dot: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', border: 'border-l-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  rosa:      { dot: 'bg-pink-500',    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',     border: 'border-l-pink-500',     bg: 'bg-pink-50 dark:bg-pink-900/20' },
  gris:      { dot: 'bg-slate-500',   badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300', border: 'border-l-slate-500',    bg: 'bg-slate-50 dark:bg-slate-900/20' },
}
export const PROYECTO_COLORES_KEYS = Object.keys(PROYECTO_COLORES)

/** Columna del tablero Kanban: antes era un `enum` fijo, ahora es un dato moldeable por el usuario
    (nombre, color, orden) guardado en el espacio compartido (`pnp_espacios.config.columnas`) — así
    todas las cuentas de un mismo espacio ven las mismas columnas. Exactamente una columna puede
    tener `esCompletado: true`: es la que dispara la lógica de "completado" (bloqueo por subtareas
    pendientes, `fechaCompletado`, exclusión de "vencido"). */
export interface ColumnaKanban {
  id: string
  nombre: string
  color: string   // clave de PROYECTO_COLORES
  esCompletado?: boolean
}
export const COLUMNAS_DEFECTO: ColumnaKanban[] = [
  { id: 'pendiente',   nombre: 'Pendiente',   color: 'ambar' },
  { id: 'en_progreso', nombre: 'En progreso', color: 'azul' },
  { id: 'bloqueado',   nombre: 'Bloqueado',   color: 'rojo' },
  { id: 'completado',  nombre: 'Completado',  color: 'esmeralda', esCompletado: true },
]

export const PRIORIDAD_BORDER: Record<Prioridad, string> = {
  Alta: 'border-l-red-500', Media: 'border-l-amber-400', Baja: 'border-l-emerald-400',
}

export type FiltroFecha = 'todos' | 'abiertos' | 'vencidos' | 'hoy' | 'semana'

/** Subtareas pendientes (no completadas) de un pendiente */
export function subtareasPendientes(p: Pendiente): number {
  return (p.subtareas || []).filter(s => !s.completada).length
}
