import { createContext, useContext, useState, type ReactNode } from 'react'
import type { FiltroFecha } from '@/types'

interface ModalState { open: boolean; editId: string | null; defaults: Partial<import('@/types').Pendiente> }

interface UIState {
  modal: ModalState
  abrirModal: (editId?: string | null, defaults?: Partial<import('@/types').Pendiente>) => void
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
  espacioActualId: string | null
  setEspacioActualId: (id: string | null) => void
  filtroActivoId: string | null
  setFiltroActivoId: (id: string | null) => void
}

const UIContext = createContext<UIState>(null as unknown as UIState)

// eslint-disable-next-line react-refresh/only-export-components -- context hook shared alongside its provider
export const useUI = () => useContext(UIContext)

export function UIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({ open: false, editId: null, defaults: {} })
  const [peekId, setPeekId] = useState<string | null>(null)
  const [notaActualId, setNotaActualId] = useState<string | null>(null)
  const [proyectoAbiertoId, setProyectoAbiertoId] = useState<string | null>(null)
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todos')
  const [espacioActualId, setEspacioActualId] = useState<string | null>(null)
  const [filtroActivoId, setFiltroActivoId] = useState<string | null>(null)

  const abrirModal = (editId: string | null = null, defaults: Partial<import('@/types').Pendiente> = {}) => {
    setPeekId(null)
    setModal({ open: true, editId, defaults })
  }
  const cerrarModal = () => setModal(m => ({ ...m, open: false }))
  const abrirPeek = (id: string) => setPeekId(id)
  const cerrarPeek = () => setPeekId(null)

  const value: UIState = {
    modal, abrirModal, cerrarModal,
    peekId, abrirPeek, cerrarPeek,
    notaActualId, setNotaActualId,
    proyectoAbiertoId, setProyectoAbiertoId,
    filtroFecha, setFiltroFecha,
    espacioActualId, setEspacioActualId,
    filtroActivoId, setFiltroActivoId,
  }
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}