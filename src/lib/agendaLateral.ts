import { useEffect, useState } from 'react'

const CLAVE = 'pn_panel_agenda'
const EVENTO = 'pn-agenda-lateral'
const ANCHO_MIN = '(min-width: 1280px)' // mismo punto de corte `xl` que usa el panel (hidden xl:flex)

export function leerAgendaAbierta(): boolean {
  try { return localStorage.getItem(CLAVE) !== '0' } catch { return true }
}

export function fijarAgendaAbierta(v: boolean) {
  try { localStorage.setItem(CLAVE, v ? '1' : '0') } catch { /* noop */ }
  window.dispatchEvent(new Event(EVENTO))
}

const pantallaAncha = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(ANCHO_MIN).matches

/** `abierta` = preferencia del usuario; `visible` = además la pantalla es lo bastante ancha para que
    el panel lateral se vea. Los módulos usan `visible` para NO repetir lo que el panel ya muestra. */
export function useAgendaLateral(): { abierta: boolean; visible: boolean } {
  const [abierta, setAbierta] = useState(leerAgendaAbierta)
  const [ancha, setAncha] = useState(pantallaAncha)
  useEffect(() => {
    const alCambiar = () => { setAbierta(leerAgendaAbierta()); setAncha(pantallaAncha()) }
    window.addEventListener(EVENTO, alCambiar)
    window.addEventListener('resize', alCambiar)
    return () => { window.removeEventListener(EVENTO, alCambiar); window.removeEventListener('resize', alCambiar) }
  }, [])
  return { abierta, visible: abierta && ancha }
}
