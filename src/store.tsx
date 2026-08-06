import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { Nota, Pendiente, Estado, FiltroFecha, Proyecto, EventoCalendario, ColumnaKanban, Espacio, Etiqueta, FiltroGuardado, Subtarea, PlantillaPendiente } from '@/types'
import { PROYECTO_COLORES_KEYS, COLUMNAS_DEFECTO, ESPACIO_ICONOS } from '@/types'
import { hoyISO, normalizar, storage, uid, describirRepeticion, defaultsHorario, fechaPorPrioridad, proximaInstanciaRepeticion } from '@/lib/app-utils'

interface ModalState { open: boolean; editId: string | null; defaults: Partial<Pendiente> }

interface AppCtx {
  pendientes: Pendiente[]
  notas: Nota[]
  usuario: string
  setUsuario: (u: string) => void
  crearPendiente: (datos: Partial<Pendiente>) => Pendiente
  actualizarPendiente: (id: string, datos: Partial<Pendiente>) => void
  eliminarPendiente: (id: string) => void
  restaurarPendiente: (id: string) => void
  duplicarPendiente: (id: string) => void
  archivarPendiente: (id: string) => void
  desarchivarPendiente: (id: string) => void
  toggleCompletar: (id: string) => void
  toggleSubtarea: (pid: string, sid: string) => void
  agregarSubtarea: (pid: string, texto: string) => void
  agregarSubSubtarea: (pid: string, padreId: string, texto: string) => void
  iniciarTimer: (pid: string) => void
  pausarTimer: (pid: string) => void
  agregarComentario: (pid: string, texto: string, adjuntos?: import('@/types').Adjunto[]) => void
  moverEstado: (id: string, estado: Estado) => void
  crearNota: () => Nota
  actualizarNota: (id: string, datos: Partial<Nota>) => void
  agregarComentarioNota: (id: string, texto: string) => void
  eliminarNota: (id: string) => void
  restaurarNota: (id: string) => void
  duplicarNota: (id: string) => void
  proyectos: Proyecto[]
  crearProyecto: (nombre: string, color?: string, cuentaGoogleId?: string) => Proyecto
  actualizarProyecto: (id: string, datos: Partial<Proyecto>) => void
  eliminarProyecto: (id: string) => void
  espacios: Espacio[]
  crearEspacio: (nombre: string, icono?: string, color?: string) => Espacio
  actualizarEspacio: (id: string, datos: Partial<Espacio>) => void
  eliminarEspacio: (id: string) => void
  espacioActualId: string | null
  setEspacioActualId: (id: string | null) => void
  etiquetas: Etiqueta[]
  crearEtiqueta: (nombre: string, color?: string) => Etiqueta
  actualizarEtiqueta: (id: string, datos: Partial<Etiqueta>) => void
  eliminarEtiqueta: (id: string) => void
  colorDeEtiqueta: (nombre: string) => string | undefined
  filtrosGuardados: FiltroGuardado[]
  crearFiltroGuardado: (nombre: string, criterios: FiltroGuardado['criterios'], atajo?: FiltroGuardado['atajo']) => FiltroGuardado
  actualizarFiltroGuardado: (id: string, datos: Partial<FiltroGuardado>) => void
  eliminarFiltroGuardado: (id: string) => void
  filtroActivoId: string | null
  setFiltroActivoId: (id: string | null) => void
  plantillas: PlantillaPendiente[]
  crearPlantilla: (nombre: string, datos: PlantillaPendiente['datos']) => PlantillaPendiente
  eliminarPlantilla: (id: string) => void
  crearPendienteDesdePlantilla: (id: string) => Pendiente | null
  eventos: EventoCalendario[]
  crearEvento: (datos: Partial<EventoCalendario>) => EventoCalendario
  actualizarEvento: (id: string, datos: Partial<EventoCalendario>) => void
  eliminarEvento: (id: string) => void
  restaurarEvento: (id: string) => void
  columnas: ColumnaKanban[]
  setColumnas: (cols: ColumnaKanban[]) => void
  reemplazarTodo: (p: Pendiente[], n: Nota[], u?: string, pr?: Proyecto[], ev?: EventoCalendario[]) => void
  vaciarPapelera: () => void
  personas: string[]
  modal: ModalState
  abrirModal: (editId?: string | null, defaults?: Partial<Pendiente>) => void
  cerrarModal: () => void
  peekId: string | null
  abrirPeek: (id: string) => void
  cerrarPeek: () => void
  notaActualId: string | null
  setNotaActualId: (id: string | null) => void
  proyectoAbiertoId: string | null
  setProyectoAbiertoId: (id: string | null) => void
  filtroFecha: FiltroFecha
  setFiltroFecha: (f: FiltroFecha) => void
}

const Ctx = createContext<AppCtx>(null as unknown as AppCtx)
// eslint-disable-next-line react-refresh/only-export-components -- context hook shared alongside its provider
export const useApp = () => useContext(Ctx)

function semilla(): { p: Pendiente[]; n: Nota[] } {
  const nota: Nota = {
    id: uid(), titulo: 'Reunión semanal',
    contenidoHTML: '<div>Temas para revisar esta semana:</div><div>- Revisión de notas: revisar con Jorge el tema de las notas</div><div>- Cotización Soriana: pedir precios antes del viernes</div><div><br></div><div>Tip: escribe una línea que empiece con «-» y presiona Enter para convertirla en pendiente ✨</div>',
    creado: new Date().toISOString(), modificado: new Date().toISOString(),
  }
  const p1 = normalizar({
    titulo: 'Enviar reporte mensual', solicitante: 'Liz', responsable: 'Yo', prioridad: 'Alta',
    fechaLimite: hoyISO(), descripcion: 'Incluir cierre de ventas y comodatos.',
    subtareas: [
      { id: uid(), texto: 'Exportar BigQuery', completada: true },
      { id: uid(), texto: 'Armar dashboard', completada: false },
    ],
  })
  const p2 = normalizar({ titulo: 'Revisar inventario PROTEC', responsable: 'Yo', prioridad: 'Media' })
  return { p: [p1, p2], n: [nota] }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [pendientes, setPendientes] = useState<Pendiente[]>(() => {
    try {
      const raw = storage.get('pn_pendientes')
      if (raw) return (JSON.parse(raw) as Partial<Pendiente>[]).map(normalizarConservandoId)
    } catch { /* noop */ }
    return semillaCache.p
  })
  const [notas, setNotas] = useState<Nota[]>(() => {
    try {
      const raw = storage.get('pn_notas')
      if (raw) return JSON.parse(raw) as Nota[]
    } catch { /* noop */ }
    return semillaCache.n
  })
  const [proyectos, setProyectos] = useState<Proyecto[]>(() => {
    try {
      const raw = storage.get('pn_proyectos')
      if (raw) return JSON.parse(raw) as Proyecto[]
    } catch { /* noop */ }
    return []
  })
  const [eventos, setEventos] = useState<EventoCalendario[]>(() => {
    try {
      const raw = storage.get('pn_eventos')
      if (raw) return JSON.parse(raw) as EventoCalendario[]
    } catch { /* noop */ }
    return []
  })
  const [columnas, setColumnas] = useState<ColumnaKanban[]>(() => {
    try {
      const raw = storage.get('pn_columnas_local')
      if (raw) { const cols = JSON.parse(raw) as ColumnaKanban[]; if (cols.length) return cols }
    } catch { /* noop */ }
    return COLUMNAS_DEFECTO
  })
  const [espacios, setEspacios] = useState<Espacio[]>(() => {
    try {
      const raw = storage.get('pn_espacios')
      if (raw) return JSON.parse(raw) as Espacio[]
    } catch { /* noop */ }
    return []
  })
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>(() => {
    try {
      const raw = storage.get('pn_etiquetas')
      if (raw) return JSON.parse(raw) as Etiqueta[]
    } catch { /* noop */ }
    return []
  })
  const [filtrosGuardados, setFiltrosGuardados] = useState<FiltroGuardado[]>(() => {
    try {
      const raw = storage.get('pn_filtros_guardados')
      if (raw) return JSON.parse(raw) as FiltroGuardado[]
    } catch { /* noop */ }
    return []
  })
  const [filtroActivoId, setFiltroActivoId] = useState<string | null>(null)
  const [plantillas, setPlantillas] = useState<PlantillaPendiente[]>(() => {
    try {
      const raw = storage.get('pn_plantillas')
      if (raw) return JSON.parse(raw) as PlantillaPendiente[]
    } catch { /* noop */ }
    return []
  })
  const [usuario, setUsuarioState] = useState(() => storage.get('pn_usuario') || 'Yo')
  const [modal, setModal] = useState<ModalState>({ open: false, editId: null, defaults: {} })
  const [notaActualId, setNotaActualId] = useState<string | null>(null)
  const [proyectoAbiertoId, setProyectoAbiertoId] = useState<string | null>(null)
  const [peekId, setPeekId] = useState<string | null>(null)
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todos')
  const [espacioActualId, setEspacioActualId] = useState<string | null>(null)

  useEffect(() => { storage.set('pn_pendientes', JSON.stringify(pendientes)) }, [pendientes])
  useEffect(() => { storage.set('pn_notas', JSON.stringify(notas)) }, [notas])
  useEffect(() => { storage.set('pn_proyectos', JSON.stringify(proyectos)) }, [proyectos])
  useEffect(() => { storage.set('pn_eventos', JSON.stringify(eventos)) }, [eventos])
  useEffect(() => { storage.set('pn_columnas_local', JSON.stringify(columnas)) }, [columnas])
  useEffect(() => { storage.set('pn_espacios', JSON.stringify(espacios)) }, [espacios])
  useEffect(() => { storage.set('pn_etiquetas', JSON.stringify(etiquetas)) }, [etiquetas])
  useEffect(() => { storage.set('pn_filtros_guardados', JSON.stringify(filtrosGuardados)) }, [filtrosGuardados])
  useEffect(() => { storage.set('pn_plantillas', JSON.stringify(plantillas)) }, [plantillas])

  // Purga automática de la papelera (Fase 8): la UI de PapeleraView ya prometía "se purgan a los
  // 30 días" pero nada lo cumplía — esto lo hace real. Corre una sola vez al montar; si el usuario
  // deja la app abierta más de 30 días seguidos no vuelve a correr, pero el próximo reinicio sí.
  useEffect(() => {
    const limite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const purgar = <T extends { borrado?: boolean; modificado: string }>(arr: T[]) => arr.filter(x => !(x.borrado && x.modificado < limite))
    setPendientes(prev => { const p = purgar(prev); return p.length === prev.length ? prev : p })
    setNotas(prev => { const n = purgar(prev); return n.length === prev.length ? prev : n })
    setEventos(prev => { const e = purgar(prev); return e.length === prev.length ? prev : e })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar, a propósito
  }, [])

  const setUsuario = (u: string) => { setUsuarioState(u); storage.set('pn_usuario', u) }

  // Id de la única columna marcada "esCompletado" (dispara fechaCompletado, bloqueo por subtareas
  // pendientes y exclusión de "vencido"); si ninguna columna la tiene marcada (raro: se borró sin
  // reasignar), cae a la última columna como aproximación razonable.
  const idCompletado = useMemo(() => columnas.find(c => c.esCompletado)?.id ?? columnas[columnas.length - 1]?.id ?? 'completado', [columnas])
  const idPorDefecto = useMemo(() => columnas.find(c => !c.esCompletado)?.id ?? columnas[0]?.id ?? 'pendiente', [columnas])

  const crearPendiente = (datos: Partial<Pendiente>): Pendiente => {
    const nuevo = normalizar(datos)
    if (nuevo.estado === idCompletado) nuevo.fechaCompletado = new Date().toISOString()
    setPendientes(prev => [nuevo, ...prev])
    return nuevo
  }

  const actualizarPendiente = (id: string, datos: Partial<Pendiente>) => {
    setPendientes(prev => prev.map(p => {
      if (p.id !== id) return p
      const subtareasFinales = datos.subtareas ?? p.subtareas
      const datosFinales = { ...datos }
      // No permitir completar si quedan subtareas pendientes
      if (datos.estado === idCompletado && (subtareasFinales || []).some(s => !s.completada)) {
        toast.error('No puedes completarlo: faltan subtareas')
        datosFinales.estado = p.estado === idCompletado ? idPorDefecto : p.estado
      }
      const upd = { ...p, ...datosFinales, modificado: new Date().toISOString() }
      if (datosFinales.estado) {
        upd.fechaCompletado = datosFinales.estado === idCompletado
          ? (p.estado === idCompletado ? p.fechaCompletado : new Date().toISOString())
          : null
      }
      return upd
    }))
  }

  const restaurarPendiente = (id: string) => {
    setPendientes(prev => prev.map(p => p.id !== id ? p : { ...p, borrado: false, modificado: new Date().toISOString() }))
  }
  const eliminarPendiente = (id: string) => {
    setPendientes(prev => prev.map(p => p.id !== id ? p : { ...p, borrado: true, modificado: new Date().toISOString() }))
    toast('Pendiente enviado a la papelera', {
      action: {
        label: 'Deshacer',
        onClick: () => restaurarPendiente(id),
      },
    })
  }

  const duplicarPendiente = (id: string) => {
    const p = pendientes.find(x => x.id === id)
    if (!p) return
    crearPendiente({
      titulo: p.titulo + ' (copia)', descripcion: p.descripcion, solicitante: p.solicitante, responsable: p.responsable,
      prioridad: p.prioridad, estado: p.estado, fechaLimite: p.fechaLimite, hora: p.hora, duracionMin: p.duracionMin,
      proyecto: p.proyecto, proyectoId: p.proyectoId, etiquetas: p.etiquetas, repetir: p.repetir,
      ponderacion: p.ponderacion, modalidad: p.modalidad,
      subtareas: (p.subtareas || []).map(s => ({ ...s, id: uid() })),
    })
    toast.success('Pendiente duplicado')
  }

  const archivarPendiente = (id: string) => {
    setPendientes(prev => prev.map(p => p.id !== id ? p : { ...p, archivado: true, modificado: new Date().toISOString() }))
    toast('Pendiente archivado', {
      action: {
        label: 'Deshacer',
        onClick: () => setPendientes(prev => prev.map(p => p.id !== id ? p : { ...p, archivado: false, modificado: new Date().toISOString() })),
      },
    })
  }

  const desarchivarPendiente = (id: string) => {
    setPendientes(prev => prev.map(p => p.id !== id ? p : { ...p, archivado: false, modificado: new Date().toISOString() }))
    toast('Pendiente desarchivado', {
      action: {
        label: 'Deshacer',
        onClick: () => setPendientes(prev => prev.map(p => p.id !== id ? p : { ...p, archivado: true, modificado: new Date().toISOString() })),
      },
    })
  }

  const toggleCompletar = (id: string) => {
    const p = pendientes.find(x => x.id === id)
    if (p && p.estado !== idCompletado) {
      const faltan = (p.subtareas || []).filter(s => !s.completada).length
      if (faltan > 0) {
        toast.error(`No puedes completarlo: faltan ${faltan} subtarea(s)`)
        return
      }
    }
    setPendientes(prev => prev.map(p => {
      if (p.id !== id) return p
      const completado = p.estado === idCompletado
      // Si el timer seguía corriendo al completar, se pausa y acumula — no tiene sentido que
      // siga contando tiempo sobre algo ya terminado.
      const corriendo = !completado && p.tiempoInicio
      const min = corriendo ? Math.round((Date.now() - new Date(p.tiempoInicio!).getTime()) / 60000) : 0
      return {
        ...p,
        estado: completado ? idPorDefecto : idCompletado,
        fechaCompletado: completado ? null : new Date().toISOString(),
        modificado: new Date().toISOString(),
        ...(corriendo ? { tiempoInicio: undefined, tiempoTotalMin: (p.tiempoTotalMin || 0) + min } : {}),
      }
    }))
    // Recurrencia: al completar (no al reabrir) un pendiente con regla, se crea la siguiente
    // instancia — salvo que `;until`/`;count` (Fase 8.7) indiquen que la serie ya terminó.
    if (p && p.estado !== idCompletado && p.repetir) {
      const base = p.repetir.startsWith('!') ? hoyISO() : (p.fechaLimite || hoyISO())
      const proxima = proximaInstanciaRepeticion(p.repetir, base)
      if (proxima) {
        crearPendiente({
          titulo: p.titulo, descripcion: p.descripcion, responsable: p.responsable, solicitante: p.solicitante,
          prioridad: p.prioridad, proyecto: p.proyecto, etiquetas: p.etiquetas, hora: p.hora, repetir: proxima.repetir,
          fechaLimite: proxima.fechaLimite,
          subtareas: (p.subtareas || []).map(s => ({ ...s, id: uid(), completada: false })),
        })
        toast.success(`Se repite: próxima el ${proxima.fechaLimite} (${describirRepeticion(proxima.repetir)})`)
      } else {
        toast.success('Completado — esa era la última repetición de la serie')
      }
    }
  }

  const agregarComentario = (pid: string, texto: string, adjuntos?: import('@/types').Adjunto[]) => {
    const t = texto.trim()
    if (!t && !(adjuntos && adjuntos.length)) return
    setPendientes(prev => prev.map(p => p.id !== pid ? p : {
      ...p,
      comentarios: [...(p.comentarios || []), { id: uid(), texto: t, autor: usuario, fecha: new Date().toISOString(), adjuntos: adjuntos && adjuntos.length ? adjuntos : undefined }],
      modificado: new Date().toISOString(),
    }))
  }

  // Fase 8.4 — subtareas anidadas: buscan/actualizan por id recursivamente en `children`, sin
  // asumir profundidad fija (la UI hoy solo ofrece agregar un nivel, pero el dato soporta más).
  const alternarSubtareaRec = (arr: Subtarea[], sid: string): Subtarea[] =>
    arr.map(s => s.id === sid ? { ...s, completada: !s.completada } : s.children ? { ...s, children: alternarSubtareaRec(s.children, sid) } : s)
  const agregarHijoRec = (arr: Subtarea[], padreId: string, nueva: Subtarea): Subtarea[] =>
    arr.map(s => s.id === padreId ? { ...s, children: [...(s.children || []), nueva] } : s.children ? { ...s, children: agregarHijoRec(s.children, padreId, nueva) } : s)

  const toggleSubtarea = (pid: string, sid: string) => {
    setPendientes(prev => prev.map(p => p.id !== pid ? p : {
      ...p,
      subtareas: alternarSubtareaRec(p.subtareas, sid),
      modificado: new Date().toISOString(),
    }))
  }

  const agregarSubtarea = (pid: string, texto: string) => {
    const t = texto.trim()
    if (!t) return
    setPendientes(prev => prev.map(p => p.id !== pid ? p : {
      ...p,
      subtareas: [...p.subtareas, { id: uid(), texto: t, completada: false, responsable: '', fechaLimite: '' }],
      modificado: new Date().toISOString(),
    }))
  }

  // Fase 9.2 — time tracking opcional: solo un timer corre a la vez en toda la app (empezar uno
  // pausa cualquier otro que estuviera corriendo), consistente con que solo se está trabajando en
  // una cosa a la vez en la realidad.
  const iniciarTimer = (pid: string) => {
    const ahora = new Date().toISOString()
    setPendientes(prev => prev.map(p => {
      if (p.id === pid) return { ...p, tiempoInicio: ahora }
      if (p.tiempoInicio) {
        const min = Math.round((Date.now() - new Date(p.tiempoInicio).getTime()) / 60000)
        return { ...p, tiempoInicio: undefined, tiempoTotalMin: (p.tiempoTotalMin || 0) + min, modificado: new Date().toISOString() }
      }
      return p
    }))
  }
  const pausarTimer = (pid: string) => {
    setPendientes(prev => prev.map(p => {
      if (p.id !== pid || !p.tiempoInicio) return p
      const min = Math.round((Date.now() - new Date(p.tiempoInicio).getTime()) / 60000)
      return { ...p, tiempoInicio: undefined, tiempoTotalMin: (p.tiempoTotalMin || 0) + min, modificado: new Date().toISOString() }
    }))
  }

  const agregarSubSubtarea = (pid: string, padreId: string, texto: string) => {
    const t = texto.trim()
    if (!t) return
    setPendientes(prev => prev.map(p => p.id !== pid ? p : {
      ...p,
      subtareas: agregarHijoRec(p.subtareas, padreId, { id: uid(), texto: t, completada: false, responsable: '', fechaLimite: '' }),
      modificado: new Date().toISOString(),
    }))
  }

  const moverEstado = (id: string, estado: Estado) => actualizarPendiente(id, { estado })

  const crearNota = (): Nota => {
    const n: Nota = { id: uid(), titulo: 'Nueva nota', contenidoHTML: '', creado: new Date().toISOString(), modificado: new Date().toISOString() }
    setNotas(prev => [n, ...prev])
    setNotaActualId(n.id)
    return n
  }
  const actualizarNota = (id: string, datos: Partial<Nota>) => {
    setNotas(prev => prev.map(n => n.id !== id ? n : { ...n, ...datos, modificado: new Date().toISOString() }))
  }
  const agregarComentarioNota = (id: string, texto: string) => {
    const t = texto.trim()
    if (!t) return
    setNotas(prev => prev.map(n => n.id !== id ? n : {
      ...n,
      comentarios: [...(n.comentarios || []), { id: uid(), texto: t, autor: usuario, fecha: new Date().toISOString() }],
      modificado: new Date().toISOString(),
    }))
  }
  const duplicarNota = (id: string) => {
    const n = notas.find(x => x.id === id)
    if (!n) return
    const copia: Nota = { id: uid(), titulo: n.titulo + ' (copia)', contenidoHTML: n.contenidoHTML, carpeta: n.carpeta, creado: new Date().toISOString(), modificado: new Date().toISOString() }
    setNotas(prev => [copia, ...prev])
    toast.success('Nota duplicada')
  }
  const restaurarNota = (id: string) => {
    setNotas(prev => prev.map(n => n.id !== id ? n : { ...n, borrado: false, modificado: new Date().toISOString() }))
  }
  const eliminarNota = (id: string) => {
    setNotas(prev => prev.map(n => n.id !== id ? n : { ...n, borrado: true, modificado: new Date().toISOString() }))
    // Desvincular pendientes (no se borran)
    setPendientes(prev => prev.map(p => p.origenNota?.notaId === id ? { ...p, origenNota: null, modificado: new Date().toISOString() } : p))
    if (notaActualId === id) setNotaActualId(null)
    toast('Nota enviada a la papelera (sus pendientes se conservan)', {
      action: {
        label: 'Deshacer',
        onClick: () => restaurarNota(id),
      },
    })
  }

  const crearProyecto = (nombre: string, color?: string, cuentaGoogleId?: string): Proyecto => {
    const p: Proyecto = {
      id: uid(), nombre: nombre.trim(), color: color || PROYECTO_COLORES_KEYS[proyectos.length % PROYECTO_COLORES_KEYS.length],
      cuentaGoogleId, creado: new Date().toISOString(), modificado: new Date().toISOString(),
    }
    setProyectos(prev => [...prev, p])
    return p
  }
  const actualizarProyecto = (id: string, datos: Partial<Proyecto>) => {
    setProyectos(prev => prev.map(p => p.id !== id ? p : { ...p, ...datos, modificado: new Date().toISOString() }))
    // El nombre del proyecto se refleja en `pendiente.proyecto` (texto) para exports/badges antiguos.
    if (datos.nombre) {
      setPendientes(prev => prev.map(p => p.proyectoId === id ? { ...p, proyecto: datos.nombre!, modificado: new Date().toISOString() } : p))
    }
  }
  const eliminarProyecto = (id: string) => {
    setProyectos(prev => prev.filter(p => p.id !== id))
    // Desvincular pendientes (no se borran)
    setPendientes(prev => prev.map(p => p.proyectoId === id ? { ...p, proyectoId: undefined, modificado: new Date().toISOString() } : p))
    toast('Proyecto eliminado (sus pendientes se conservan)')
  }

  const crearEspacio = (nombre: string, icono?: string, color?: string): Espacio => {
    const e: Espacio = {
      id: uid(), nombre: nombre.trim(),
      icono: icono || ESPACIO_ICONOS[espacios.length % ESPACIO_ICONOS.length],
      color: color || PROYECTO_COLORES_KEYS[espacios.length % PROYECTO_COLORES_KEYS.length],
      creado: new Date().toISOString(), modificado: new Date().toISOString(),
    }
    setEspacios(prev => [...prev, e])
    return e
  }
  const actualizarEspacio = (id: string, datos: Partial<Espacio>) => {
    setEspacios(prev => prev.map(e => e.id !== id ? e : { ...e, ...datos, modificado: new Date().toISOString() }))
  }
  const eliminarEspacio = (id: string) => {
    setEspacios(prev => prev.filter(e => e.id !== id))
    // Desvincular proyectos (no se borran): vuelven al Espacio "General" implícito
    setProyectos(prev => prev.map(p => p.espacioId === id ? { ...p, espacioId: undefined, modificado: new Date().toISOString() } : p))
    if (espacioActualId === id) setEspacioActualId(null)
    toast('Espacio eliminado (sus proyectos vuelven a General)')
  }

  const crearEtiqueta = (nombre: string, color?: string): Etiqueta => {
    const e: Etiqueta = {
      id: uid(), nombre: nombre.trim(),
      color: color || PROYECTO_COLORES_KEYS[etiquetas.length % PROYECTO_COLORES_KEYS.length],
      creado: new Date().toISOString(), modificado: new Date().toISOString(),
    }
    setEtiquetas(prev => [...prev, e])
    return e
  }
  const actualizarEtiqueta = (id: string, datos: Partial<Etiqueta>) => {
    setEtiquetas(prev => prev.map(e => e.id !== id ? e : { ...e, ...datos, modificado: new Date().toISOString() }))
  }
  const eliminarEtiqueta = (id: string) => {
    // Solo se borra el registro de color: los nombres sueltos en `Pendiente.etiquetas`/
    // `Nota.etiquetas` no se tocan (no hay `etiquetaIds` que desvincular, ver types.ts).
    setEtiquetas(prev => prev.filter(e => e.id !== id))
  }
  const colorDeEtiqueta = (nombre: string): string | undefined => {
    const n = nombre.trim().toLowerCase()
    return etiquetas.find(e => e.nombre.toLowerCase() === n)?.color
  }

  const crearFiltroGuardado = (nombre: string, criterios: FiltroGuardado['criterios'], atajo?: FiltroGuardado['atajo']): FiltroGuardado => {
    const f: FiltroGuardado = { id: uid(), nombre: nombre.trim(), criterios, atajo, creado: new Date().toISOString(), modificado: new Date().toISOString() }
    // Un atajo solo puede pertenecer a un filtro a la vez: se lo quitamos a quien lo tuviera.
    setFiltrosGuardados(prev => [...prev.map(x => x.atajo === atajo && atajo ? { ...x, atajo: undefined } : x), f])
    return f
  }
  const actualizarFiltroGuardado = (id: string, datos: Partial<FiltroGuardado>) => {
    setFiltrosGuardados(prev => prev.map(f => {
      if (f.id === id) return { ...f, ...datos, modificado: new Date().toISOString() }
      if (datos.atajo && f.atajo === datos.atajo) return { ...f, atajo: undefined } // reasignar el atajo lo libera del anterior dueño
      return f
    }))
  }
  const eliminarFiltroGuardado = (id: string) => {
    setFiltrosGuardados(prev => prev.filter(f => f.id !== id))
    if (filtroActivoId === id) setFiltroActivoId(null)
  }

  const crearPlantilla = (nombre: string, datos: PlantillaPendiente['datos']): PlantillaPendiente => {
    const pl: PlantillaPendiente = { id: uid(), nombre: nombre.trim(), datos, creado: new Date().toISOString(), modificado: new Date().toISOString() }
    setPlantillas(prev => [...prev, pl])
    return pl
  }
  const eliminarPlantilla = (id: string) => setPlantillas(prev => prev.filter(p => p.id !== id))
  const crearPendienteDesdePlantilla = (id: string): Pendiente | null => {
    const pl = plantillas.find(p => p.id === id)
    if (!pl) return null
    return crearPendiente({
      titulo: pl.datos.titulo, descripcion: pl.datos.descripcion, prioridad: pl.datos.prioridad,
      etiquetas: pl.datos.etiquetas, proyectoId: pl.datos.proyectoId, duracionMin: pl.datos.duracionMin,
      fechaLimite: fechaPorPrioridad(pl.datos.prioridad),
      subtareas: (pl.datos.subtareas || []).map(s => ({ id: uid(), texto: s.texto, completada: false })),
    })
  }

  const eliminarEvento = (id: string) => {
    setEventos(prev => prev.map(e => e.id !== id ? e : { ...e, borrado: true, modificado: new Date().toISOString() }))
  }
  const restaurarEvento = (id: string) => {
    setEventos(prev => prev.map(e => e.id !== id ? e : { ...e, borrado: false, modificado: new Date().toISOString() }))
  }

  /** Elimina definitivamente (del store local) todos los ítems con `borrado=true`.
      Llamado desde la vista Papelera con "Vaciar papelera". Los ítems borrados quedan
      fuera del localStorage; el próximo flush los borrará también de la nube. */
  const vaciarPapelera = () => {
    setPendientes(prev => prev.filter(p => !p.borrado))
    setNotas(prev => prev.filter(n => !n.borrado))
    setEventos(prev => prev.filter(e => !e.borrado))
  }

  const crearEvento = (datos: Partial<EventoCalendario>): EventoCalendario => {
    const base = {
      id: uid(), titulo: '', fecha: '', hora: '', duracionMin: 15,
      creado: new Date().toISOString(), modificado: new Date().toISOString(),
      ...datos,
    }
    const { hora, duracionMin } = defaultsHorario(base.fecha, base.hora, base.duracionMin)
    const nuevo: EventoCalendario = { ...base, hora, duracionMin: duracionMin ?? 15 }
    setEventos(prev => [nuevo, ...prev])
    return nuevo
  }
  const actualizarEvento = (id: string, datos: Partial<EventoCalendario>) => {
    setEventos(prev => prev.map(e => e.id !== id ? e : { ...e, ...datos, modificado: new Date().toISOString() }))
  }

  const reemplazarTodo = (p: Pendiente[], n: Nota[], u?: string, pr?: Proyecto[], ev?: EventoCalendario[]) => {
    setPendientes(p.map(normalizarConservandoId))
    setNotas(n)
    if (u) setUsuario(u)
    if (pr) setProyectos(pr)
    if (ev) setEventos(ev.map(normalizarEventoConservandoId))
  }

  const personas = useMemo(() => {
    const s = new Set<string>([usuario])
    pendientes.forEach(p => { if (p.responsable) s.add(p.responsable); if (p.solicitante) s.add(p.solicitante) })
    return [...s].sort()
  }, [pendientes, usuario])

  const abrirModal = (editId: string | null = null, defaults: Partial<Pendiente> = {}) => {
    setPeekId(null)
    setModal({ open: true, editId, defaults })
  }
  const cerrarModal = () => setModal(m => ({ ...m, open: false }))
  const abrirPeek = (id: string) => setPeekId(id)
  const cerrarPeek = () => setPeekId(null)

  const value: AppCtx = {
    pendientes, notas, usuario, setUsuario,
    crearPendiente, actualizarPendiente, eliminarPendiente, restaurarPendiente, duplicarPendiente, archivarPendiente, desarchivarPendiente, toggleCompletar, toggleSubtarea, agregarSubtarea, agregarSubSubtarea, iniciarTimer, pausarTimer, agregarComentario, moverEstado,
    crearNota, actualizarNota, agregarComentarioNota, eliminarNota, restaurarNota, duplicarNota, proyectos, crearProyecto, actualizarProyecto, eliminarProyecto,
    espacios, crearEspacio, actualizarEspacio, eliminarEspacio, espacioActualId, setEspacioActualId,
    etiquetas, crearEtiqueta, actualizarEtiqueta, eliminarEtiqueta, colorDeEtiqueta,
    filtrosGuardados, crearFiltroGuardado, actualizarFiltroGuardado, eliminarFiltroGuardado, filtroActivoId, setFiltroActivoId,
    plantillas, crearPlantilla, eliminarPlantilla, crearPendienteDesdePlantilla,
    eventos, crearEvento, actualizarEvento, eliminarEvento, restaurarEvento, columnas, setColumnas, reemplazarTodo, vaciarPapelera,
    personas, modal, abrirModal, cerrarModal, peekId, abrirPeek, cerrarPeek, notaActualId, setNotaActualId,
    proyectoAbiertoId, setProyectoAbiertoId,
    filtroFecha, setFiltroFecha,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

const semillaCache = semilla()

function normalizarConservandoId(p: Partial<Pendiente>): Pendiente {
  return { ...normalizar({}), ...p, id: p.id || uid() } as Pendiente
}

function normalizarEventoConservandoId(e: Partial<EventoCalendario>): EventoCalendario {
  return {
    id: e.id || uid(), titulo: '', fecha: '', hora: '', duracionMin: 15,
    creado: new Date().toISOString(), modificado: new Date().toISOString(),
    ...e,
  } as EventoCalendario
}
