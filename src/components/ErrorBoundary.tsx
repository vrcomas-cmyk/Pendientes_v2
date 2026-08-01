import { Component, type ReactNode } from 'react'
import { descargar, hoyISO } from '@/lib/app-utils'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props { children: ReactNode }
interface State { error: Error | null }

/** Red de seguridad: si un error de render deja la PWA en blanco, ofrece rescatar los datos locales. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Error de render capturado por ErrorBoundary:', error, info.componentStack)
  }

  exportarDatos = () => {
    try {
      const pendientes = localStorage.getItem('pn_pendientes') || '[]'
      const notas = localStorage.getItem('pn_notas') || '[]'
      const usuario = localStorage.getItem('pn_usuario') || ''
      descargar('rescate_pendientes_notas_' + hoyISO() + '.json', JSON.stringify({ pendientes: JSON.parse(pendientes), notas: JSON.parse(notas), usuario }, null, 2), 'application/json')
    } catch { /* noop */ }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <AlertTriangle size={40} className="text-destructive" />
        <div>
          <h1 className="text-lg font-bold">Algo salió mal</h1>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            La aplicación tuvo un error inesperado. Tus datos siguen guardados en este dispositivo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={this.exportarDatos}>Exportar mis datos</Button>
          <Button onClick={() => window.location.reload()}>Recargar</Button>
        </div>
      </div>
    )
  }
}
