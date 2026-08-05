import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSync } from '@/sync'
import { crearInvitacion, canjearInvitacion, quitarMiembro } from '@/lib/espacio'
import { Users, Copy, X } from 'lucide-react'

/** Gestión del espacio compartido: quién es la cuenta "padre", qué cuentas "hija" están
    vinculadas, e invitar/canjear/quitar. Un espacio comparte pendientes, notas y proyectos entre
    todas sus cuentas (ver RLS por `espacio_id`); las cuentas de Google Calendar conectadas se
    reparten según el rol (la padre ve todo, cada hija solo lo suyo — ver `googleCalendar.ts`). */
export default function EspacioDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { userId, email, espacioId, miRol, miembros, recargarEspacio } = useSync()
  const [generando, setGenerando] = useState(false)
  const [invitacion, setInvitacion] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const [canjeando, setCanjeando] = useState(false)
  const [quitando, setQuitando] = useState<string | null>(null)

  const invitar = async () => {
    if (!espacioId || !userId) return
    setGenerando(true)
    try { const inv = await crearInvitacion(espacioId, userId); setInvitacion(inv.codigo) }
    catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo generar la invitación') }
    finally { setGenerando(false) }
  }

  const copiar = async (texto: string) => {
    try { await navigator.clipboard.writeText(texto); toast.success('Código copiado') }
    catch { toast.error('No se pudo copiar') }
  }

  const canjear = async () => {
    if (!codigo.trim()) { toast.error('Escribe el código de invitación'); return }
    setCanjeando(true)
    try { await canjearInvitacion(codigo); toast.success('Cuenta vinculada'); setCodigo(''); recargarEspacio() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo canjear la invitación') }
    finally { setCanjeando(false) }
  }

  const quitar = async (miembroId: string) => {
    setQuitando(miembroId)
    try { await quitarMiembro(miembroId); recargarEspacio() }
    catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo quitar la cuenta') }
    finally { setQuitando(null) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-base"><Users size={17} /> Cuentas vinculadas</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">
          Todas las cuentas de este espacio comparten pendientes, notas y proyectos. La cuenta{' '}
          <b>padre</b> ve todos los eventos de Google Calendar; cada cuenta <b>hija</b> solo los suyos.
        </p>
        <div className="space-y-1.5">
          {miembros.map(m => (
            <div key={m.userId} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
              <span className="truncate">
                {m.email}{m.userId === userId && <span className="text-muted-foreground"> (tú)</span>}
              </span>
              <div className="flex items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">{m.rol}</span>
                {miRol === 'padre' && m.rol === 'hija' && (
                  <button onClick={() => quitar(m.userId)} disabled={quitando === m.userId}
                    className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50" title="Quitar">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {miRol === 'padre' && (
          <div className="space-y-2 border-t pt-3">
            <Button variant="secondary" onClick={invitar} disabled={generando} className="w-full">
              {generando ? 'Generando…' : 'Invitar cuenta hija'}
            </Button>
            {invitacion && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
                <code className="text-sm font-semibold tracking-wider">{invitacion}</code>
                <button onClick={() => copiar(invitacion)} className="text-muted-foreground hover:text-foreground" title="Copiar">
                  <Copy size={14} />
                </button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Comparte este código con la otra cuenta: debe iniciar sesión con su propio correo y
              canjearlo aquí mismo, en "Canjear código". Vence en 7 días.
            </p>
          </div>
        )}

        {miRol === 'hija' && (
          <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
            Esta cuenta ({email}) es una cuenta hija: solo la padre puede invitar o quitar cuentas.
          </p>
        )}

        <div className="space-y-2 border-t pt-3">
          <Input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} placeholder="Código de invitación" onKeyDown={e => { if (e.key === 'Enter') canjear() }} />
          <Button variant="outline" onClick={canjear} disabled={canjeando} className="w-full">
            {canjeando ? 'Canjeando…' : 'Canjear código'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
