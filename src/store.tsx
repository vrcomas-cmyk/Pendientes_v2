import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { Nota, Pendiente, Estado, FiltroFecha, Proyecto } from '@/types'
import { PROYECTO_COLORES_KEYS } from '@/types'
import { hoyISO, normalizar, storage, uid, siguienteFecha, describirRepeticion } from '@/lib/app-utils'

interface ModalState { open: boolean; editId: string | null; defaults: Partial<Pendiente> }

interface AppCtx {
  pendientes: Pendiente[]
  notas: Nota[]
  usuario: string
  setUsuario: (u: string) => void
  crearPendiente: (datos: Partial<Pendiente>) => Pendiente
  actualizarPendiente: (id: string, datos: Partial<Pendiente>) => void
  eliminarPendiente: (id: string) => void
  archivarPendiente: (id: string) => void
  desarchivarPendiente: (id: string) => void
  toggleCompletar: (id: string) => void
  toggleSubtarea: (pid: string, sid: string) => void
  agregarSubtarea: (pid: string, texto: string) => void
  agregarComentario: (pid: string, texto: string, adjuntos?: import('@/types').Adjunto[]) => void
  moverEstado: (id: string, estado: Estado) => void
  crearNota: () => Nota
  actualizarNota: (id: string, datos: Partial<Nota>) => void
  eliminarNota: (id: string) => void
  proyectos: Proyecto[]
  crearProyecto: (nombre: string, color?: string, cuentaGoogleId?: string) => Proyecto
  actualizarProyecto: (id: string, datos: Partial<Proyecto>) => void
  eliminarProyecto: (id: string) => void
  reemplazarTodo: (p: Pendiente[], n: Nota[], u?: string, pr?: Proyecto[]) => void
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
  const [usuario, setUsuarioState] = useState(() => storage.get('pn_usuario') || 'Yo')
  const [modal, setModal] = useState<ModalState>({ open: false, editId: null, defaults: {} })
  const [notaActualId, setNotaActualId] = useState<string | null>(null)
  const [proyectoAbiertoId, setProyectoAbiertoId] = useState<string | null>(null)
  const [peekId, setPeekId] = useState<string | null>(null)
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todos')
  const ultimoEliminado = useRef<Pendiente | null>(null)
  const ultimaNotaEliminada = useRef<{ nota: Nota; desvinculados: string[] } | null>(null)

  useEffect(() => { storage.set('pn_pendientes', JSON.stringify(pendientes)) }, [pendientes])
  useEffect(() => { storage.set('pn_notas', JSON.stringify(notas)) }, [notas])
  useEffect(() => { storage.set('pn_proyectos', JSON.stringify(proyectos)) }, [proyectos])

  const setUsuario = (u: string) => { setUsuarioState(u); storage.set('pn_usuario', u) }

  const crearPendiente = (datos: Partial<Pendiente>): Pendiente => {
    const nuevo = normalizar(datos)
    if (nuevo.estado === 'completado') nuevo.fechaCompletado = new Date().toISOString()
    setPendientes(prev => [nuevo, ...prev])
    return nuevo
  }

  const actualizarPendiente = (id: string, datos: Partial<Pendiente>) => {
    setPendientes(prev => prev.map(p => {
      if (p.id !== id) return p
      const subtareasFinales = datos.subtareas ?? p.subtareas
      const datosFinales = { ...datos }
      // No permitir completar si quedan subtareas pendientes
      if (datos.estado === 'completado' && (subtareasFinales || []).some(s => !s.completada)) {
        toast.error('No puedes completarlo: faltan subtareas')
        datosFinales.estado = p.estado === 'completado' ? 'pendiente' : p.estado
      }
      const upd = { ...p, ...datosFinales, modificado: new Date().toISOString() }
      if (datosFinales.estado) {
        upd.fechaCompletado = datosFinales.estado === 'completado'
          ? (p.estado === 'completado' ? p.fechaCompletado : new Date().toISOString())
          : null
      }
      return upd
    }))
  }

  const eliminarPendiente = (id: string) => {
    const p = pendientes.find(x => x.id === id) || null
    ultimoEliminado.current = p
    setPendientes(prev => prev.filter(x => x.id !== id))
    toast('Pendiente eliminado', {
      action: {
        label: 'Deshacer',
        onClick: () => { const u = ultimoEliminado.current; if (u) setPendientes(prev => [u, ...prev]) },
      },
    })
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
    if (p && p.estado !== 'completado') {
      const faltan = (p.subtareas || []).filter(s => !s.completada).length
      if (faltan > 0) {
        toast.error(`No puedes completarlo: faltan ${faltan} subtarea(s)`)
        return
      }
    }
    setPendientes(prev => prev.map(p => {
      if (p.id !== id) return p
      const completado = p.estado === 'completado'
      return {
        ...p,
        estado: completado ? 'pendiente' : 'completado',
        fechaCompletado: completado ? null : new Date().toISOString(),
        modificado: new Date().toISOString(),
      }
    }))
    // Recurrencia: al completar (no al reabrir) un pendiente con regla, se crea la siguiente instancia.
    if (p && p.estado !== 'completado' && p.repetir) {
      const base = p.repetir.startsWith('!') ? hoyISO() : (p.fechaLimite || hoyISO())
      const nuevaFecha = siguienteFecha(p.repetir, base)
      crearPendiente({
        titulo: p.titulo, descripcion: p.descripcion, responsable: p.responsable, solicitante: p.solicitante,
        prioridad: p.prioridad, proyecto: p.proyecto, etiquetas: p.etiquetas, hora: p.hora, repetir: p.repetir,
        fechaLimite: nuevaFecha,
        subtareas: (p.subtareas || []).map(s => ({ ...s, id: uid(), completada: false })),
      })
      toast.success(`Se repite: próxima el ${nuevaFecha} (${describirRepeticion(p.repetir)})`)
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

  const toggleSubtarea = (pid: string, sid: string) => {
    setPendientes(prev => prev.map(p => p.id !== pid ? p : {
      ...p,
      subtareas: p.subtareas.map(s => s.id !== sid ? s : { ...s, completada: !s.completada }),
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
  const eliminarNota = (id: string) => {
    const n = notas.find(x => x.id === id) || null
    const desvinculados = pendientes.filter(p => p.origenNota?.notaId === id).map(p => p.id)
    ultimaNotaEliminada.current = n ? { nota: n, desvinculados } : null
    setNotas(prev => prev.filter(n => n.id !== id))
    // Desvincular pendientes (no se borran)
    setPendientes(prev => prev.map(p => p.origenNota?.notaId === id ? { ...p, origenNota: null, modificado: new Date().toISOString() } : p))
    if (notaActualId === id) setNotaActualId(null)
    toast('Nota eliminada (sus pendientes se conservan)', {
      action: {
        label: 'Deshacer',
        onClick: () => {
          const u = ultimaNotaEliminada.current
          if (!u) return
          setNotas(prev => [u.nota, ...prev])
          setPendientes(prev => prev.map(p => u.desvinculados.includes(p.id) ? { ...p, origenNota: { notaId: u.nota.id }, modificado: new Date().toISOString() } : p))
        },
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

  const reemplazarTodo = (p: Pendiente[], n: Nota[], u?: string, pr?: Proyecto[]) => {
    setPendientes(p.map(normalizarConservandoId))
    setNotas(n)
    if (u) setUsuario(u)
    if (pr) setProyectos(pr)
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
    crearPendiente, actualizarPendiente, eliminarPendiente, archivarPendiente, desarchivarPendiente, toggleCompletar, toggleSubtarea, agregarSubtarea, agregarComentario, moverEstado,
    crearNota, actualizarNota, eliminarNota, proyectos, crearProyecto, actualizarProyecto, eliminarProyecto, reemplazarTodo,
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
