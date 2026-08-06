import { useEffect, useRef } from 'react'
import type { Pendiente } from '@/types'
import { hoyISO, activo } from '@/lib/app-utils'
import { idColumnaCompletado } from '@/lib/columnas'

const LS_ACTIVOS = 'pn_recordatorios_activos'
const LS_NOTIFICADOS = 'pn_recordatorios_notificados'
const VENTANA_MIN = 5 // si el momento agendado quedó hasta 5 min atrás, todavía avisa (por si el intervalo lo agarra tarde)

export function recordatoriosActivos(): boolean {
  try { return localStorage.getItem(LS_ACTIVOS) === '1' } catch { return false }
}
export function setRecordatoriosActivos(v: boolean) {
  try { localStorage.setItem(LS_ACTIVOS, v ? '1' : '0') } catch { /* noop */ }
}

function yaNotificado(clave: string): boolean {
  try { return JSON.parse(localStorage.getItem(LS_NOTIFICADOS) || '[]').includes(clave) } catch { return false }
}
function marcarNotificado(clave: string) {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_NOTIFICADOS) || '[]') as string[]
    // Se queda solo con los del día de hoy — no hace falta arrastrar el historial completo.
    const hoy = hoyISO()
    const filtrado = arr.filter(c => c.endsWith(hoy)).slice(-200)
    localStorage.setItem(LS_NOTIFICADOS, JSON.stringify([...filtrado, clave]))
  } catch { /* noop */ }
}

/** Recordatorios locales (Fase 11.3, "sin push server"): revisa cada minuto si hay pendientes
    agendados con hora que ya llegaron, y dispara una `Notification` del navegador. Limitación
    real y documentada a propósito: solo funciona mientras esta pestaña sigue abierta (aunque sea
    en segundo plano) — sin un service worker con push del servidor, no hay forma de notificar con
    la app completamente cerrada. Es "mejor que nada", no un sustituto de push real. */
export function useRecordatoriosLocales(pendientes: Pendiente[], idCompletado: ReturnType<typeof idColumnaCompletado>) {
  const pendientesRef = useRef(pendientes)
  pendientesRef.current = pendientes

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    const revisar = () => {
      if (!recordatoriosActivos() || Notification.permission !== 'granted') return
      const ahora = new Date()
      const hoy = hoyISO()
      pendientesRef.current
        .filter(p => activo(p) && p.estado !== idCompletado && p.fechaLimite === hoy && p.hora)
        .forEach(p => {
          const clave = p.id + '|' + p.hora + '|' + hoy
          if (yaNotificado(clave)) return
          const [h, m] = p.hora!.split(':').map(Number)
          const agendado = new Date(); agendado.setHours(h, m, 0, 0)
          const diffMin = (ahora.getTime() - agendado.getTime()) / 60000
          if (diffMin < 0 || diffMin > VENTANA_MIN) return
          new Notification(p.titulo, { body: p.descripcion || `Agendado a las ${p.hora}`, tag: clave })
          marcarNotificado(clave)
        })
    }
    revisar()
    const id = setInterval(revisar, 60000)
    return () => clearInterval(id)
  }, [idCompletado])
}
