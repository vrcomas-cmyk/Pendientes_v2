import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { uid, storage } from '@/lib/app-utils'
import { WIDGET_DEFAULTS, type WidgetInstancia, type WidgetTipo } from '@/lib/widgets'

interface WidgetsCtx {
  widgets: WidgetInstancia[]
  abrirWidget: (tipo: WidgetTipo) => void
  cerrarWidget: (id: string) => void
  moverWidget: (id: string, x: number, y: number) => void
  redimensionarWidget: (id: string, w: number, h: number) => void
  toggleColapsado: (id: string) => void
  traerAlFrente: (id: string) => void
  ordenZ: string[]
}

const Ctx = createContext<WidgetsCtx>(null as unknown as WidgetsCtx)
// eslint-disable-next-line react-refresh/only-export-components -- context hook shared alongside its provider
export const useWidgets = () => useContext(Ctx)

const LS_WIDGETS = 'pn_widgets'
const LS_ORDEN = 'pn_widgets_z'

/** Store aislado del sistema de widgets flotantes: posición/tamaño/orden-z son estado de UI, no
    datos de dominio, así que viven en su propio Context (no en `AppCtx`) — ver AUDITORIA.md §9. */
export function WidgetsProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<WidgetInstancia[]>(() => {
    try {
      const raw = storage.get(LS_WIDGETS)
      if (raw) return JSON.parse(raw) as WidgetInstancia[]
    } catch { /* noop */ }
    return []
  })
  const [ordenZ, setOrdenZ] = useState<string[]>(() => {
    try {
      const raw = storage.get(LS_ORDEN)
      if (raw) return JSON.parse(raw) as string[]
    } catch { /* noop */ }
    return []
  })

  useEffect(() => { storage.set(LS_WIDGETS, JSON.stringify(widgets)) }, [widgets])
  useEffect(() => { storage.set(LS_ORDEN, JSON.stringify(ordenZ)) }, [ordenZ])

  const traerAlFrente = (id: string) => setOrdenZ(prev => [...prev.filter(x => x !== id), id])

  const abrirWidget = (tipo: WidgetTipo) => {
    const def = WIDGET_DEFAULTS[tipo]
    // Cascada leve para que los widgets nuevos no nazcan exactamente encima de los anteriores.
    const offset = (widgets.length % 6) * 24
    const nuevo: WidgetInstancia = {
      id: uid(), tipo, colapsado: false,
      x: 96 + offset, y: 96 + offset, w: def.w, h: def.h,
    }
    setWidgets(prev => [...prev, nuevo])
    traerAlFrente(nuevo.id)
  }
  const cerrarWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
    setOrdenZ(prev => prev.filter(x => x !== id))
  }
  const moverWidget = (id: string, x: number, y: number) => {
    setWidgets(prev => prev.map(w => w.id !== id ? w : { ...w, x, y }))
  }
  const redimensionarWidget = (id: string, w: number, h: number) => {
    setWidgets(prev => prev.map(x => x.id !== id ? x : { ...x, w, h }))
  }
  const toggleColapsado = (id: string) => {
    setWidgets(prev => prev.map(w => w.id !== id ? w : { ...w, colapsado: !w.colapsado }))
  }

  const value: WidgetsCtx = { widgets, abrirWidget, cerrarWidget, moverWidget, redimensionarWidget, toggleColapsado, traerAlFrente, ordenZ }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
