import { useEffect, useState } from 'react'
import { useApp } from '@/store'
import { PROYECTO_COLORES, PROYECTO_COLORES_KEYS } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const AVATARES_SUGERIDOS = ['👤', '🧑', '👩', '👨', '🧑‍💼', '👩‍💼', '👨‍💼', '🧑‍💻']

/** Crea un Contacto (Fase 1b del plan de Contactos, ver workspace-doctrine). Mismo patrón que
    `NuevoEspacioDialog`: diálogo simple, sin pasos, con selector de color/avatar. */
export default function NuevoContactoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { crearContacto } = useApp()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [avatar, setAvatar] = useState(AVATARES_SUGERIDOS[0])
  const [color, setColor] = useState(PROYECTO_COLORES_KEYS[0])

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset del form al abrir
    setNombre(''); setEmail(''); setTelefono(''); setAvatar(AVATARES_SUGERIDOS[0]); setColor(PROYECTO_COLORES_KEYS[0])
  }, [open])

  const guardar = () => {
    const n = nombre.trim()
    if (!n) return
    crearContacto(n, {
      email: email.trim() || undefined,
      telefono: telefono.trim() || undefined,
      avatar,
      color,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-base">Nuevo contacto</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre (ej. Liz)"
            onKeyDown={e => { if (e.key === 'Enter') guardar() }} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (opcional)" />
            <Input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Teléfono (opcional)" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase text-muted-foreground">Avatar</Label>
            <div className="flex flex-wrap gap-1.5">
              {AVATARES_SUGERIDOS.map(a => (
                <button key={a} type="button" onClick={() => setAvatar(a)}
                  className={'flex h-8 w-8 items-center justify-center rounded-lg border text-base ' + (avatar === a ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-accent')}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase text-muted-foreground">Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {PROYECTO_COLORES_KEYS.map(k => (
                <button key={k} type="button" onClick={() => setColor(k)}
                  className={'h-6 w-6 rounded-full ' + PROYECTO_COLORES[k].dot + (color === k ? ' ring-2 ring-offset-2 ring-primary' : '')} />
              ))}
            </div>
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
