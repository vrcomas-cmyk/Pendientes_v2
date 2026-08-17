import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSync } from '@/sync'
import { crearInvitacion, canjearInvitacion, quitarMiembro } from '@/lib/espacio'
import { Users, Copy, X } from 'lucide-react'

type EtiquetaRol = 'miembro' | 'observador'
const ETIQUETAS_ROL: Record<EtiquetaRol, string> = { miembro: 'Miembro', observador: 'Observador' }

/** Etiquetas de rol "miembro"/"observador" (plan de Contactos/Equipos, ver workspace-doctrine):
    DELIBERADAMENTE solo informativas y solo locales a este dispositivo/navegador — no se
    sincronizan ni se envían a Supabase, y NO restringen ningún permiso real. El único rol que
    de verdad importa para lectura/escritura sigue siendo `padre`/`hija` (columna `rol` con
    CHECK constraint en `pnp_espacio_miembros`, verificado por cada política RLS de escritura).
    Convertir estas etiquetas en permisos reales requiere reescribir esas políticas — decisión
    de seguridad pendiente de definición explícita, no algo para adivinar en este cambio. */
function claveEtiquetas(espacioId: string): string { return `pn_etiquetas_rol_${espacioId}` }
function cargarEtiquetas(espacioId: string): Record<string, EtiquetaRol> {
  try { const raw = localStorage.getItem(claveEtiquetas(espacioId)); if (raw) return JSON.parse(raw) } catch { /* noop */ }
  return {}
}

/** Gestión del espacio compartido: quién es la cuenta "padre", qué cuentas "hija" están
    vinculadas, e invitar/canjear/quitar. Un espacio comparte pendientes, notas y proyectos entre
    todas sus cuentas (ver RLS por `espacio_id`); las cuentas de Google Calendar conectadas se
    reparten según el rol (la padre ve todo, cada hija solo lo suyo — ver `googleCalendar.ts`). */
export default function EspacioDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { userId, email, espacioId, miRol, miembros, recargarEspacio } = useSync()
  const [generando, setGenerando] = useState(false)
  const [invitacion, setInvitacion] = useState<string | null>(null)
  const [emailInvitado, setEmailInvitado] = useState('')
  const [codigo, setCodigo] = useState('')
  const [canjeando, setCanjeando] = useState(false)
  const [quitando, setQuitando] = useState<string | null>(null)
  const [etiquetas, setEtiquetas] = useState<Record<string, EtiquetaRol>>({})

  useEffect(() => {
    if (!espacioId) return
    setEtiquetas(cargarEtiquetas(espacioId)) // eslint-disable-line react-hooks/set-state-in-effect -- carga inicial desde localStorage al abrir/cambiar de espacio
  }, [espacioId, open])

  const cambiarEtiqueta = (miembroUserId: string, valor: string) => {
    if (!espacioId) return
    setEtiquetas(prev => {
      const next = { ...prev }
      if (valor === '__ninguna') delete next[miembroUserId]
      else next[miembroUserId] = valor as EtiquetaRol
      try { localStorage.setItem(claveEtiquetas(espacioId), JSON.stringify(next)) } catch { /* noop */ }
      return next
    })
  }

  // Fase 3 (plan de Contactos/Equipos): invitación restringida por email. El backend YA
  // validaba esto (`pnp_canjear_invitacion` en supabase_setup.sql compara el email de la
  // invitación contra el de quien canjea) — solo faltaba exponer el campo en esta UI. Cero
  // cambios de SQL/RLS: el email es opcional, y sin él el código sigue funcionando igual que
  // antes (cualquiera con el código puede canjearlo).
  const invitar = async () => {
    if (!espacioId || !userId) return
    setGenerando(true)
    try { const inv = await crearInvitacion(espacioId, userId, emailInvitado.trim() || undefined); setInvitacion(inv.codigo) }
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
              <span className="min-w-0 flex-1 truncate">
                {m.email}{m.userId === userId && <span className="text-muted-foreground"> (tú)</span>}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">{m.rol}</span>
                {etiquetas[m.userId] && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary" title="Etiqueta informativa, solo en este dispositivo">
                    {ETIQUETAS_ROL[etiquetas[m.userId]]}
                  </span>
                )}
                {miRol === 'padre' && m.rol === 'hija' && (
                  <>
                    <Select value={etiquetas[m.userId] || '__ninguna'} onValueChange={v => cambiarEtiqueta(m.userId, v)}>
                      <SelectTrigger className="h-6 w-[110px] text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__ninguna">Sin etiqueta</SelectItem>
                        <SelectItem value="miembro">Miembro</SelectItem>
                        <SelectItem value="observador">Observador</SelectItem>
                      </SelectContent>
                    </Select>
                    <button onClick={() => quitar(m.userId)} disabled={quitando === m.userId}
                      className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50" title="Quitar">
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {miRol === 'padre' && (
          <p className="text-[11px] text-muted-foreground">
            Las etiquetas "Miembro"/"Observador" son solo informativas y solo se ven en este
            dispositivo — no restringen qué puede hacer cada cuenta (eso sigue siendo padre/hija).
          </p>
        )}

        {miRol === 'padre' && (
          <div className="space-y-2 border-t pt-3">
            <Input type="email" value={emailInvitado} onChange={e => setEmailInvitado(e.target.value)}
              placeholder="Email de la otra cuenta (opcional)" onKeyDown={e => { if (e.key === 'Enter') invitar() }} />
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
              {emailInvitado.trim() && ' Solo podrá canjearlo esa cuenta de correo — otra persona con el código será rechazada.'}
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
