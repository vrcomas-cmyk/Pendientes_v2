import { useEffect, useState } from 'react'
import { useApp } from '@/store'
import { META_ICONOS, PROYECTO_COLORES, PROYECTO_COLORES_KEYS } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

/** Crea una Meta (Fase 4 del plan de Contactos/Equipos/Metas). Mismo patrón que
    `NuevoEspacioDialog`/`NuevoContactoDialog`: diálogo simple sin pasos. */
export default function NuevaMetaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { crearMeta } = useApp()
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [icono, setIcono] = useState(META_ICONOS[0])
  const [color, setColor] = useState(PROYECTO_COLORES_KEYS[0])
  const [fechaObjetivo, setFechaObjetivo] = useState('')

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset del form al abrir
    setNombre(''); setDescripcion(''); setIcono(META_ICONOS[0]); setColor(PROYECTO_COLORES_KEYS[0]); setFechaObjetivo('')
  }, [open])

  const guardar = () => {
    const n = nombre.trim()
    if (!n) return
    crearMeta(n, { descripcion: descripcion.trim() || undefined, icono, color, fechaObjetivo: fechaObjetivo || undefined })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-base">Nueva meta</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre (ej. Lanzar el producto)"
            onKeyDown={e => { if (e.key === 'Enter') guardar() }} />
          <Textarea rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción (opcional)" />
          <Input type="date" value={fechaObjetivo} onChange={e => setFechaObjetivo(e.target.value)} />
          <div className="flex flex-wrap gap-1.5">
            {META_ICONOS.map(ic => (
              <button key={ic} type="button" onClick={() => setIcono(ic)}
                className={'flex h-8 w-8 items-center justify-center rounded-lg border text-base ' + (icono === ic ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-accent')}>
                {ic}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROYECTO_COLORES_KEYS.map(k => (
              <button key={k} type="button" onClick={() => setColor(k)}
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
