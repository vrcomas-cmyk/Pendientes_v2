import { useEffect, useState } from 'react'
import { useApp } from '@/store'
import { ESPACIO_ICONOS, PROYECTO_COLORES, PROYECTO_COLORES_KEYS } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

/** Crea un Espacio del Personal Workspace (Trabajo/Escuela/Personal/...) — no confundir con
    `EspacioDialog` (src/components/EspacioDialog.tsx), que gestiona la cuenta compartida de
    sincronización. Ver glosario en `.claude/skills/workspace-doctrine/SKILL.md`. */
export default function NuevoEspacioDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { crearEspacio } = useApp()
  const [nombre, setNombre] = useState('')
  const [icono, setIcono] = useState(ESPACIO_ICONOS[0])
  const [color, setColor] = useState(PROYECTO_COLORES_KEYS[0])

  useEffect(() => {
    if (!open) return
    setNombre(''); setIcono(ESPACIO_ICONOS[0]); setColor(PROYECTO_COLORES_KEYS[0]) // eslint-disable-line react-hooks/set-state-in-effect -- reset del form al abrir
  }, [open])

  const guardar = () => {
    const n = nombre.trim()
    if (!n) return
    crearEspacio(n, icono, color)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-base">Nuevo espacio</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del espacio (ej. Trabajo)"
            onKeyDown={e => { if (e.key === 'Enter') guardar() }} />
          <div className="flex flex-wrap gap-1.5">
            {ESPACIO_ICONOS.map(ic => (
              <button key={ic} onClick={() => setIcono(ic)}
                className={'flex h-8 w-8 items-center justify-center rounded-lg border text-base ' + (icono === ic ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-accent')}>
                {ic}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROYECTO_COLORES_KEYS.map(k => (
              <button key={k} onClick={() => setColor(k)}
                className={'h-6 w-6 rounded-full ' + PROYECTO_COLORES[k].dot + (color === k ? ' ring-2 ring-offset-2 ring-primary' : '')} />
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={guardar}>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
