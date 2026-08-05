import { useState } from 'react'
import { useApp } from '@/store'
import { colorColumna } from '@/lib/columnas'
import { ACENTOS, leerAcento, guardarAcento, aplicarAcento } from '@/lib/tema'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Settings2 } from 'lucide-react'

/** Panel centralizado de personalización: tema, color de acento, y un resumen de las columnas del
    Kanban (edición completa — renombrar/recolorear/reordenar/añadir/eliminar — vive en el propio
    Tablero, donde arrastrar y ver el resultado en vivo tiene más sentido; aquí solo se enlaza). */
export default function AjustesDialog({
  open, onOpenChange, dark, toggleDark, onIrTablero,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  dark: boolean
  toggleDark: () => void
  onIrTablero: () => void
}) {
  const { columnas } = useApp()
  const [acento, setAcento] = useState(leerAcento)

  const elegirAcento = (key: string) => {
    setAcento(key)
    guardarAcento(key)
    aplicarAcento(key, dark)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-base"><Settings2 size={17} /> Ajustes</DialogTitle></DialogHeader>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase text-muted-foreground">Apariencia</p>
          <button onClick={toggleDark} className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-accent">
            <span className="flex items-center gap-2">{dark ? <Moon size={15} /> : <Sun size={15} />} Modo {dark ? 'oscuro' : 'claro'}</span>
            <span className="text-xs text-muted-foreground">Cambiar</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase text-muted-foreground">Color de acento</p>
          <div className="flex flex-wrap gap-2">
            {ACENTOS.map(a => (
              <button key={a.key} onClick={() => elegirAcento(a.key)} title={a.nombre}
                className={'h-7 w-7 rounded-full ring-offset-2 ring-offset-background ' + (acento === a.key ? 'ring-2 ring-foreground' : '')}
                style={{ backgroundColor: `hsl(${a.hue} 65% 58%)` }} />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase text-muted-foreground">Columnas del tablero ({columnas.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {columnas.map(c => (
              <span key={c.id} className={'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ' + colorColumna(c).badge}>
                <span className={'h-1.5 w-1.5 rounded-full ' + colorColumna(c).dot} /> {c.nombre}
              </span>
            ))}
          </div>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => { onIrTablero(); onOpenChange(false) }}>
            Editar columnas en el Tablero
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Se comparten con todas las cuentas de tu espacio: renombrar, recolorear, reordenar,
            añadir o eliminar columnas ahí se ve reflejado para todos.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
