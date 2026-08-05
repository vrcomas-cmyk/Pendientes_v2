import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { iniciarConexionGoogle, desconectarGoogle, actualizarModoEspejo, type CuentaGoogle } from '@/lib/googleCalendar'
import { useSync } from '@/sync'
import { CalendarClock, Plus, X } from 'lucide-react'

/** Gestiona varias cuentas de Google Calendar conectadas a la vez, con espejo asimétrico:
    cada cuenta decide si refleja TODO lo que se agenda en la app, o solo lo PROPIO (los
    pendientes cuyo proyecto la tiene como dueña) — ej. el correo laboral solo ve sus proyectos,
    el correo personal ve todo para organizar su tiempo completo. */
export default function CuentasGoogleDialog({
  open, onOpenChange, cuentas, onCambio,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  cuentas: CuentaGoogle[]
  onCambio: () => void
}) {
  const { email: emailSync } = useSync()
  const [desconectando, setDesconectando] = useState<string | null>(null)
  const [cambiandoModo, setCambiandoModo] = useState<string | null>(null)

  const conectarOtra = () => {
    try { iniciarConexionGoogle() } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo iniciar la conexión') }
  }

  const desconectar = async (cuentaId: string) => {
    setDesconectando(cuentaId)
    try { await desconectarGoogle(cuentaId); onCambio() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo desconectar') }
    finally { setDesconectando(null) }
  }

  const cambiarModo = async (cuentaId: string, modo: 'todo' | 'propio') => {
    setCambiandoModo(cuentaId)
    try { await actualizarModoEspejo(cuentaId, modo); onCambio() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo cambiar el modo') }
    finally { setCambiandoModo(null) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-base"><CalendarClock size={17} /> Google Calendar</DialogTitle></DialogHeader>
        {emailSync && <p className="text-xs text-muted-foreground">Sesión de sincronización: <span className="font-medium text-foreground">{emailSync}</span></p>}
        <p className="text-xs text-muted-foreground">
          Cada cuenta decide qué recibe: <b>Refleja todo</b> crea ahí cualquier pendiente que agendes;
          <b> Solo lo propio</b> únicamente los de proyectos que tengan esa cuenta como dueña.
        </p>
        <div className="space-y-2">
          {cuentas.map(c => (
            <div key={c.id} className="space-y-1.5 rounded-lg border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm">{c.email}</span>
                <button onClick={() => desconectar(c.id)} disabled={desconectando === c.id}
                  className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50" title="Desconectar">
                  <X size={14} />
                </button>
              </div>
              <Select value={c.modoEspejo} onValueChange={v => cambiarModo(c.id, v as 'todo' | 'propio')} disabled={cambiandoModo === c.id}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Refleja todo</SelectItem>
                  <SelectItem value="propio">Solo lo propio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          {!cuentas.length && <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">Ninguna cuenta conectada todavía.</p>}
        </div>
        <Button variant="secondary" onClick={conectarOtra} className="w-full">
          <Plus size={14} className="mr-1" /> {cuentas.length ? 'Conectar otra cuenta' : 'Conectar cuenta de Google'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
