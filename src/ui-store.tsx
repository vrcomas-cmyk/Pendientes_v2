import { createContext, useCallback, useContext, useReducer, useRef, useState, type ReactNode } from 'react'
import type { FiltroFecha } from '@/types'
import { overlayReducer, type TipoOverlay } from '@/lib/overlay'

interface ModalState {
  open: boolean
  editId: string | null
  defaults: Partial<import('@/types').Pendiente>
  // El formulario del TaskModal queda montado (open=true) también bajo `'confirmar-cierre'` para
  // que, al cancelar el descarte, vuelva al modal con el texto intacto sin re-resetear.
}

interface UIState {
  overlay: TipoOverlay
  modal: ModalState
  abrirModal: (editId?: string | null, defaults?: Partial<import('@/types').Pendiente>) => void
  cerrarModal: () => void
  peekId: string | null
  abrirPeek: (id: string) => void
  cerrarPeek: () => void
  paletaAbierta: boolean
  abrirPaleta: () => void
  cerrarPaleta: () => void
  registrarGuardia: (fn: (() => boolean) | null) => void
  confirmarDescartes: () => void
  cancelarDescartes: () => void
  notaActualId: string | null
  setNotaActualId: (id: string | null) => void
  proyectoAbiertoId: string | null
  setProyectoAbiertoId: (id: string | null) => void
  filtroFecha: FiltroFecha
  setFiltroFecha: (f: FiltroFecha) => void
  espacioActualId: string | null
  setEspacioActualId: (id: string | null) => void
  filtroActivoId: string | null
  setFiltroActivoId: (id: string | null) => void
}

/** Persistencia del espacio activo (E2-F2): la elección del selector «Espacio activo»
    sobrevive a recargas. Formato estable: la key guarda el `Espacio.id` crudo; elegir «Todos»
    borra la key (init → `null`). Un id que ya no existe (espacio eliminado) la guardia
    defensiva del Shell lo trata como «Todos» sin tocar el store. */
const LS_ESPACIO_ACTIVO = 'pn_espacio_activo'

const UIContext = createContext<UIState>(null as unknown as UIState)

// eslint-disable-next-line react-refresh/only-export-components -- context hook shared alongside its provider
export const useUI = () => useContext(UIContext)

/** H4 — Epic 1 «Regla de exclusividad de overlays + confirmación antes de descartar una edición».
    `overlay` es la fuente de verdad (ver `src/lib/overlay.ts`); `modal`, `peek` y `paleta`
    derivan de él: abrir uno cierra cualquier otro automáticamente. Mantiene la API previa de
    `abrirModal`/`abrirPeek` (firma idéntica) para no tocar a sus llamadores.
    Guardia de descarte: mientras el `TaskModal` registra una guardia que devuelve true (form
    "sucio"), cualquier cierre o apertura de otro overlay se aplaza a `'confirmar-cierre'`,
    guardando la acción en `accionPendienteRef`. `confirmarDescartes()` ejecuta la acción
    pendiente; `cancelarDescartes()` vuelve al modal sin ejecutarla. */
export function UIProvider({ children }: { children: ReactNode }) {
  const [overlay, dispatch] = useReducer(overlayReducer, 'ninguno' as TipoOverlay)
  const [modalDatos, setModalDatos] = useState<{ editId: string | null; defaults: Partial<import('@/types').Pendiente> }>({ editId: null, defaults: {} })
  const [peekId, setPeekId] = useState<string | null>(null)
  const [notaActualId, setNotaActualId] = useState<string | null>(null)
  const [proyectoAbiertoId, setProyectoAbiertoId] = useState<string | null>(null)
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todos')
  const [espacioActualId, setEspacioActualIdState] = useState<string | null>(() => {
    try { return localStorage.getItem(LS_ESPACIO_ACTIVO) } catch { return null }
  })
  const [filtroActivoId, setFiltroActivoId] = useState<string | null>(null)
  const guardiaRef = useRef<(() => boolean) | null>(null)
  const accionPendienteRef = useRef<(() => void) | null>(null)

  const abrirModalInterna = (editId: string | null = null, defaults: Partial<import('@/types').Pendiente> = {}) => {
    setModalDatos({ editId, defaults })
    dispatch({ tipo: 'abrir', overlay: 'modal' })
  }
  const cerrarModalInterna = () => dispatch({ tipo: 'cerrar', overlay: 'modal' })
  const abrirPeekInterna = (id: string) => {
    setPeekId(id)
    dispatch({ tipo: 'abrir', overlay: 'peek' })
  }
  const cerrarPeekInterna = () => dispatch({ tipo: 'cerrar', overlay: 'peek' })
  const abrirPaletaInterna = () => dispatch({ tipo: 'abrir', overlay: 'paleta' })
  const cerrarPaletaInterna = () => dispatch({ tipo: 'cerrar', overlay: 'paleta' })

  const interceptar = (fn: () => void) => {
    if (overlay === 'confirmar-cierre') return
    if (overlay === 'modal' && guardiaRef.current?.()) {
      accionPendienteRef.current = fn
      dispatch({ tipo: 'abrir', overlay: 'confirmar-cierre' })
      return
    }
    fn()
  }

  const abrirModal = (editId?: string | null, defaults?: Partial<import('@/types').Pendiente>) => interceptar(() => abrirModalInterna(editId, defaults))
  const cerrarModal = () => interceptar(() => cerrarModalInterna())
  const abrirPeek = (id: string) => interceptar(() => abrirPeekInterna(id))
  const cerrarPeek = () => interceptar(() => cerrarPeekInterna())
  const abrirPaleta = () => interceptar(() => abrirPaletaInterna())
  const cerrarPaleta = () => interceptar(() => cerrarPaletaInterna())

  const registrarGuardia = useCallback((fn: (() => boolean) | null) => { guardiaRef.current = fn }, [])

  const confirmarDescartes = useCallback(() => {
    const accion = accionPendienteRef.current
    if (accion == null) return
    accionPendienteRef.current = null
    accion()
  }, [])

  const cancelarDescartes = useCallback(() => {
    if (accionPendienteRef.current == null) return
    accionPendienteRef.current = null
    dispatch({ tipo: 'abrir', overlay: 'modal' })
  }, [])

  /** Wrapper estable que además de setear el estado React persiste la elección en
      localStorage (key `pn_espacio_activo`). «Todos» (`null`) borra la key para que el
      init del próximo montaje vuelva a `null`. Firma idéntica a la anterior: los llamadores
      (EspaciosView, selector del sidebar) no cambian. */
  const setEspacioActualId = useCallback((id: string | null) => {
    setEspacioActualIdState(id)
    try {
      if (id == null) localStorage.removeItem(LS_ESPACIO_ACTIVO)
      else localStorage.setItem(LS_ESPACIO_ACTIVO, id)
    } catch { /* noop */ }
  }, [])

  const modal: ModalState = { open: overlay === 'modal' || overlay === 'confirmar-cierre', editId: modalDatos.editId, defaults: modalDatos.defaults }

  const value: UIState = {
    overlay, modal, abrirModal, cerrarModal,
    peekId, abrirPeek, cerrarPeek,
    paletaAbierta: overlay === 'paleta', abrirPaleta, cerrarPaleta,
    registrarGuardia, confirmarDescartes, cancelarDescartes,
    notaActualId, setNotaActualId,
    proyectoAbiertoId, setProyectoAbiertoId,
    filtroFecha, setFiltroFecha,
    espacioActualId, setEspacioActualId,
    filtroActivoId, setFiltroActivoId,
  }
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}