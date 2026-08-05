export interface Acento { key: string; nombre: string; hue: number }

export const ACENTOS: Acento[] = [
  { key: 'indigo', nombre: 'Índigo', hue: 250 },
  { key: 'azul', nombre: 'Azul', hue: 217 },
  { key: 'teal', nombre: 'Teal', hue: 175 },
  { key: 'esmeralda', nombre: 'Esmeralda', hue: 152 },
  { key: 'ambar', nombre: 'Ámbar', hue: 38 },
  { key: 'rosa', nombre: 'Rosa', hue: 330 },
  { key: 'rojo', nombre: 'Rojo', hue: 0 },
]

export function leerAcento(): string {
  try { return localStorage.getItem('pn_acento') || 'indigo' } catch { return 'indigo' }
}

export function guardarAcento(key: string) {
  try { localStorage.setItem('pn_acento', key) } catch { /* noop */ }
}

/** Aplica el color de acento como variables CSS (--primary/--ring/--primary-foreground), ajustando
    saturación/luminosidad según el tema activo — mismos valores que `index.css` usa para el índigo
    por defecto, solo cambia el tono (hue). Se re-aplica en cada cambio de acento O de tema: una
    variable puesta inline (`style.setProperty`) gana siempre sobre las reglas `.dark` del CSS, así
    que el claro/oscuro hay que recalcularlo aquí, no se puede dejar que la cascada lo resuelva. */
export function aplicarAcento(key: string, oscuro: boolean) {
  const hue = ACENTOS.find(a => a.key === key)?.hue ?? 250
  const root = document.documentElement.style
  if (oscuro) {
    root.setProperty('--primary', `${hue} 75% 70%`)
    root.setProperty('--ring', `${hue} 75% 70%`)
    root.setProperty('--primary-foreground', `${hue} 30% 10%`)
  } else {
    root.setProperty('--primary', `${hue} 65% 58%`)
    root.setProperty('--ring', `${hue} 65% 58%`)
    root.setProperty('--primary-foreground', '0 0% 100%')
  }
}
