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
  children?: Subtarea[]   // Fase 8.4: subtareas anidadas — opcional, sin migración de datos existentes
  asignadoA?: string[]    // Fase 1 (Contactos): ids de Contacto asignados; `responsable` (string) se mantiene como fallback legacy
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
  bloqueadoPor?: string[] // ids de otros Pendiente que deben completarse antes (Fase 8.5, dependencias)
  tiempoTotalMin?: number // minutos acumulados de trabajo real (Fase 9.2, time tracking opcional)
  tiempoInicio?: string   // ISO: si está seteado, el timer está corriendo desde esa marca; ausente = pausado
  ponderacion?: number    // porcentaje (0-100) que vale la entrega, ej. para planes de estudio importados
  modalidad?: 'individual' | 'equipo'
  responsableId?: string  // Fase 1 (Contactos): referencia a Contacto.id; `responsable` (string) se mantiene como espejo/fallback
  solicitanteId?: string  // ídem para `solicitante`
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
  // Fase 7 ("todo es una Entidad", ver AUDITORIA.md §8): campos opcionales que ya existían en
  // `Pendiente` — aditivos, sin migración de datos existentes (ausentes = tratados como vacíos).
  etiquetas?: string[]
  comentarios?: Comentario[]
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
  espacioId?: string      // referencia a Espacio.id; sin asignar cae en el Espacio "General" implícito (Fase 4)
  metaId?: string         // referencia a Meta.id (plan de Contactos/Equipos/Metas, ver workspace-doctrine); sin asignar no cuenta para el progreso de ninguna meta
  archivado?: boolean
  creado: string
  modificado: string
}

/** Espacio (Personal Workspace, Fase 4): agrupación visual de proyectos por contexto de vida
    (Trabajo, Escuela, Personal, Finanzas...). Capa nueva sobre `Proyecto`, no reemplaza nada.
    No confundir con el "Espacio" de `src/sync.tsx` / `src/lib/espacio.ts` — ese es la cuenta
    compartida de sincronización multi-usuario, un concepto totalmente distinto. Ver glosario
    en `.claude/skills/workspace-doctrine/SKILL.md`. */
export interface Espacio {
  id: string
  nombre: string
  icono: string   // un solo emoji, ej. "🏢"
  color: string   // clave de PROYECTO_COLORES
  creado: string
  modificado: string
}

export const ESPACIO_ICONOS = ['🏢', '🎓', '🏠', '💰', '🏍', '💡', '📚', '🎯', '🛒', '🔧', '❤️', '✈️']

/** Espacio "General" (H11): grupo virtual para todo lo que NO tiene un Espacio real asignado
    (pendientes sin `proyectoId`, proyectos sin `espacioId`). No es una fila de `espacios` —
    no se crea, no se sincroniza, no se puede borrar — es un id reservado que el filtro de
    contexto (`enEspacio`/`enEspacioProyecto` en `app-utils.ts`) y el selector de Espacio activo
    tratan como su propio destino filtrable. Antes de H11 ese contenido quedaba invisible sin
    aviso en cuanto se activaba un Espacio real (ver DECISIONS_LOG.md). */
export const ESPACIO_GENERAL_ID = 'general'
export const ESPACIO_GENERAL_ICONO = '🗂️'
export const ESPACIO_GENERAL_NOMBRE = 'General'

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

/** Etiqueta como entidad (Fase 8.1): antes `Pendiente.etiquetas`/`Nota.etiquetas` eran solo
    nombres sueltos sin color propio. Se resuelve por `nombre` (case-insensitive) contra las
    etiquetas ya usadas — no se introduce un campo `etiquetaIds` de espejo todavía porque nada lo
    consumiría aún; se añade cuando una función (ej. filtros guardados) necesite referenciar por id
    de forma estable a través de renombres. */
export interface Etiqueta {
  id: string
  nombre: string
  color: string   // clave de PROYECTO_COLORES
  creado: string
  modificado: string
}

/** Contacto (Fase 1 del plan de Contactos/Equipos, ver `.claude/skills/workspace-doctrine`):
    reemplaza los strings sueltos de `responsable`/`solicitante` por una entidad persistente y
    referenciable. `Pendiente.responsable`/`solicitante` (strings) se mantienen como campo
    legacy/espejo para retrocompatibilidad — `responsableId`/`solicitanteId` son la referencia
    real cuando existe un Contacto asociado. Sync a la nube (`pnp_contactos`) y UI de selección
    quedan para el siguiente hito; por ahora es solo local (`pn_contactos`), igual que `Etiqueta`. */
export interface Contacto {
  id: string
  nombre: string
  email?: string        // si coincide con el email de un usuario registrado, puede asociarse a `usuarioId`
  telefono?: string
  avatar?: string        // emoji o URL de imagen
  color: string          // clave de PROYECTO_COLORES, para badges/avatares
  usuarioId?: string      // referencia a un usuario real de la cuenta compartida, si ya se asoció
  etiquetas?: string[]
  notas?: string
  borrado?: boolean
  creado: string
  modificado: string
}

/** Meta (Fase 4 del plan de Contactos/Equipos/Delegación — ver `.claude/skills/workspace-doctrine`;
    NO confundir con la "Fase 4" del roadmap visual vigente en `AUDITORIA.md`, que es `Espacio`,
    arriba en este mismo archivo): objetivo de largo plazo que agrupa Proyectos y agrega su
    progreso. Capa nueva sobre `Proyecto` (`Proyecto.metaId?`), no reemplaza nada. */
export interface Meta {
  id: string
  nombre: string
  descripcion?: string
  icono: string             // un solo emoji, mismo criterio que Espacio.icono
  color: string             // clave de PROYECTO_COLORES
  fechaObjetivo?: string    // YYYY-MM-DD
  espacioId?: string        // opcional: si se quiere acotar la meta a un Espacio (workspace UI) puntual
  archivado?: boolean
  borrado?: boolean
  creado: string
  modificado: string
}

export const META_ICONOS = ['🎯', '🚀', '⭐', '🏆', '📈', '💪', '🌱', '🔭', '🧭', '🏔️']

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

/** Plantilla de pendiente reutilizable (Fase 8.6): captura los campos que tiene sentido repetir
    (no fecha ni estado, que dependen del momento en que se instancia). */
export interface PlantillaPendiente {
  id: string
  nombre: string
  datos: {
    titulo: string
    descripcion?: string
    prioridad: Prioridad
    etiquetas?: string[]
    subtareas?: { texto: string }[]
    duracionMin?: number
    proyectoId?: string
  }
  creado: string
  modificado: string
}

/** Filtro guardado / smart list (Fase 8.3): captura el mismo criterio que ya usa `ListView`
    (estado, prioridad, responsable, orden, agrupación, texto, filtro de fecha) bajo un nombre.
    `atajo` es la posición 1-4 de `Ctrl+Shift+<n>` — NO los dígitos sueltos `6-9` que preveía el
    plan original de esta fase: cuando se escribió, la app tenía 5 vistas (`1-5` libres para esto);
    hoy son 7 (`1-7`, incluye Inbox y Papelera de fases posteriores), así que `6-9` ya están
    tomados por navegación. Ver CHANGELOG.md Fase 8.3. */
export interface FiltroGuardado {
  id: string
  nombre: string
  atajo?: '1' | '2' | '3' | '4'
  criterios: {
    q: string
    fEstado: string
    fPrioridad: string
    fResp: string
    orden: string
    grupo: string
    filtroFecha: FiltroFecha
  }
  creado: string
  modificado: string
}

/** Subtareas pendientes (no completadas) de un pendiente, contando también las anidadas
    (`Subtarea.children`, Fase 8.4) recursivamente. Solo se expone como `subtareasFaltantes`
    (Fase 12.3, auditoría knip): nada importa este nombre directamente. */
function subtareasPendientes(p: Pendiente): number {
  const contar = (arr: Subtarea[]): number => arr.reduce((n, s) => n + (s.completada ? 0 : 1) + contar(s.children || []), 0)
  return contar(p.subtareas || [])
}

/** Nombre más declarativo usado por la UI (Peek) para habilitar/deshabilitar el botón
    "Completar". */
export const subtareasFaltantes = subtareasPendientes
