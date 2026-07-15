import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { Nota, Pendiente, Estado } from '@/types'
import { hoyISO, normalizar, storage, uid } from '@/lib/app-utils'

interface ModalState { open: boolean; editId: string | null; defaults: Partial<Pendiente> }

interface AppCtx {
  pendientes: Pendiente[]
  notas: Nota[]
  usuario: string
  setUsuario: (u: string) => void
  crearPendiente: (datos: Partial<Pendiente>) => Pendiente
  actualizarPendiente: (id: string, datos: Partial<Pendiente>) => void
  eliminarPendiente: (id: string) => void
  toggleCompletar: (id: string) => void
  toggleSubtarea: (pid: string, sid: string) => void
  agregarComentario: (pid: string, texto: string, adjuntos?: import('@/types').Adjunto[]) => void
  moverEstado: (id: string, estado: Estado) => void
  crearNota: () => Nota
  actualizarNota: (id: string, datos: Partial<Nota>) => void
  eliminarNota: (id: string) => void
  reemplazarTodo: (p: Pendiente[], n: Nota[], u?: string) => void
  personas: string[]
  modal: ModalState
  abrirModal: (editId?: string | null, defaults?: Partial<Pendiente>) => void
  cerrarModal: () => void
  notaActualId: string | null
  setNotaActualId: (id: string | null) => void
}

const Ctx = createContext<AppCtx>(null as unknown as AppCtx)
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
  const [usuario, setUsuarioState] = useState(() => storage.get('pn_usuario') || 'Yo')
  const [modal, setModal] = useState<ModalState>({ open: false, editId: null, defaults: {} })
  const [notaActualId, setNotaActualId] = useState<string | null>(null)
  const ultimoEliminado = useRef<Pendiente | null>(null)

  useEffect(() => { storage.set('pn_pendientes', JSON.stringify(pendientes)) }, [pendientes])
  useEffect(() => { storage.set('pn_notas', JSON.stringify(notas)) }, [notas])

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
    setNotas(prev => prev.filter(n => n.id !== id))
    // Desvincular pendientes (no se borran)
    setPendientes(prev => prev.map(p => p.origenNota?.notaId === id ? { ...p, origenNota: null, modificado: new Date().toISOString() } : p))
    if (notaActualId === id) setNotaActualId(null)
    toast('Nota eliminada (sus pendientes se conservan)')
  }

  const reemplazarTodo = (p: Pendiente[], n: Nota[], u?: string) => {
    setPendientes(p.map(normalizarConservandoId))
    setNotas(n)
    if (u) setUsuario(u)
  }

  const personas = useMemo(() => {
    const s = new Set<string>([usuario])
    pendientes.forEach(p => { if (p.responsable) s.add(p.responsable); if (p.solicitante) s.add(p.solicitante) })
    return [...s].sort()
  }, [pendientes, usuario])

  const abrirModal = (editId: string | null = null, defaults: Partial<Pendiente> = {}) =>
    setModal({ open: true, editId, defaults })
  const cerrarModal = () => setModal(m => ({ ...m, open: false }))

  const value: AppCtx = {
    pendientes, notas, usuario, setUsuario,
    crearPendiente, actualizarPendiente, eliminarPendiente, toggleCompletar, toggleSubtarea, agregarComentario, moverEstado,
    crearNota, actualizarNota, eliminarNota, reemplazarTodo,
    personas, modal, abrirModal, cerrarModal, notaActualId, setNotaActualId,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

const semillaCache = semilla()

function normalizarConservandoId(p: Partial<Pendiente>): Pendiente {
  return { ...normalizar({}), ...p, id: p.id || uid() } as Pendiente
}
