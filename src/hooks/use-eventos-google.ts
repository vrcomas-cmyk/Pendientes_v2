import { useEffect, useState } from 'react'
import { useSync } from '@/sync'
import { listarEventosRango, type EventoGCal } from '@/lib/googleCalendar'
import { sincronizarIncremental, enRango, cacheCaliente } from '@/lib/googleSync'

/** Eventos de Google Calendar en [desdeISO, hastaISO] para pintar junto a los propios. Con la copia
    fría pinta YA con una consulta pequeña por rango y calienta la incremental por detrás; con la copia
    caliente la usa. Si algo falla, cae al listado por rango. En modo local no hace nada. */
export function useEventosGoogle(desdeISO: string, hastaISO: string): { eventos: EventoGCal[]; cargando: boolean; error: boolean } {
  const { modoLocal } = useSync()
  const [eventos, setEventos] = useState<EventoGCal[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (modoLocal) { Promise.resolve().then(() => { setEventos([]); setError(false); setCargando(false) }); return }
    let vivo = true
    const mostrar = (evs: EventoGCal[], errores?: Record<string, string>) => { if (vivo) { setEventos(evs); setError(!!errores && Object.keys(errores).length > 0) } }
    const porRango = () => listarEventosRango(desdeISO, hastaISO).then(r => mostrar(r.eventos, r.errores)).catch(() => mostrar([], { x: 'error' }))
    Promise.resolve().then(() => { if (vivo) setCargando(true) })
    const fin = () => { if (vivo) setCargando(false) }
    if (!cacheCaliente()) {
      porRango().finally(fin)
      sincronizarIncremental().catch(() => { /* sin soporte: basta el listado por rango */ })
    } else {
      sincronizarIncremental().then(r => mostrar(enRango(r.eventos, desdeISO, hastaISO), r.errores)).catch(porRango).finally(fin)
    }
    return () => { vivo = false }
  }, [desdeISO, hastaISO, modoLocal])

  return { eventos, cargando, error }
}
