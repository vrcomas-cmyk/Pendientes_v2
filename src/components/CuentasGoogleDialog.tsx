import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { iniciarConexionGoogle, desconectarGoogle, actualizarModoEspejo, actualizarDireccion, type CuentaGoogle, type DireccionSync, type EventoGCal } from '@/lib/googleCalendar'
import { sincronizarIncremental } from '@/lib/googleSync'
import { resumirGoogle } from '@/lib/agenda'
import { useSync } from '@/sync'
import { CalendarClock, Plus, X, ShieldCheck, ShieldAlert } from 'lucide-react'

const DIRECCIONES: { v: DireccionSync; label: string; ayuda: string }[] = [
  { v: 'ambas', label: 'Ver y enviar (ambas)', ayuda: 'Trae sus eventos para verlos aquí y le envía lo que agendes.' },
  { v: 'leer', label: 'Solo ver (traer de Google)', ayuda: 'Solo trae sus eventos para verlos y evitar cruces; la app nunca escribe en esta cuenta.' },
  { v: 'enviar', label: 'Solo enviar (a Google)', ayuda: 'Solo le manda lo que agendes; sus eventos no se muestran aquí.' },
]

const hora = (e: EventoGCal) => e.todoElDia ? 'todo el día' : new Date(e.inicio!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const dia = (e: EventoGCal) => new Date(e.todoElDia ? e.inicio + 'T00:00:00' : e.inicio!).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })

/** Cuentas de Google Calendar conectadas. Conectar exige iniciar sesión en Google con esa cuenta
    (confirma al propietario); cada cuenta define su DIRECCIÓN de sincronización (ver / enviar /
    ambas) y qué agendados refleja; y muestra un resumen de sus próximos eventos. */
export default function CuentasGoogleDialog({
  open, onOpenChange, cuentas, onCambio,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  cuentas: CuentaGoogle[]
  onCambio: () => void
}) {
  const { email: emailSync, modoLocal } = useSync()
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [eventos, setEventos] = useState<EventoGCal[]>([])
  const [cargandoResumen, setCargandoResumen] = useState(false)
  const [errorResumen, setErrorResumen] = useState('')

  const claveCuentas = cuentas.map(c => c.id + c.direccion).join(',')
  useEffect(() => {
    if (!open || modoLocal || !cuentas.some(c => (c.direccion ?? 'ambas') !== 'enviar')) { Promise.resolve().then(() => setEventos([])); return }
    let vivo = true
    Promise.resolve().then(() => { setCargandoResumen(true); setErrorResumen('') })
    sincronizarIncremental()
      .then(r => { if (vivo) setEventos([...r.eventos.values()]) })
      .catch(() => { if (vivo) setErrorResumen('No se pudo leer Google Calendar para el resumen.') })
      .finally(() => { if (vivo) setCargandoResumen(false) })
    return () => { vivo = false }
  }, [open, modoLocal, claveCuentas]) // eslint-disable-line react-hooks/exhaustive-deps

  const resumenes = useMemo(() => new Map(resumirGoogle(eventos, cuentas.map(c => c.id)).map(r => [r.cuentaId, r])), [eventos, cuentas])

  const conectar = (direccion: DireccionSync) => {
    try { iniciarConexionGoogle(direccion) } catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo iniciar la conexión') }
  }
  const envolver = async (id: string, fn: () => Promise<void>, fallo: string) => {
    setOcupada(id)
    try { await fn(); onCambio() } catch (err) { toast.error(err instanceof Error ? err.message : fallo) } finally { setOcupada(null) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-base"><CalendarClock size={17} /> Google Calendar</DialogTitle></DialogHeader>
        {emailSync && <p className="text-xs text-muted-foreground">Sesión de sincronización: <span className="font-medium text-foreground">{emailSync}</span></p>}
        <div className="space-y-2">
          {cuentas.map(c => {
            const dir = c.direccion ?? 'ambas'
            const r = resumenes.get(c.id)
            return (
              <div key={c.id} className="space-y-1.5 rounded-lg border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{c.email}</span>
                  <button onClick={() => envolver(c.id, () => desconectarGoogle(c.id), 'No se pudo desconectar')} disabled={ocupada === c.id}
                    className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50" title="Desconectar" aria-label={`Desconectar ${c.email}`}>
                    <X size={14} />
                  </button>
                </div>
                {c.verificada
                  ? <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400"><ShieldCheck size={12} /> Propietario confirmado con inicio de sesión de Google</p>
                  : <p className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400"><ShieldAlert size={12} /> Sin confirmar.{' '}
                      <button className="underline" onClick={() => conectar(c.escritura === false ? 'leer' : 'ambas')}>Vuelve a iniciar sesión con esta cuenta</button></p>}

                <Select value={dir} onValueChange={v => envolver(c.id, () => actualizarDireccion(c.id, v as DireccionSync), 'No se pudo cambiar la dirección')} disabled={ocupada === c.id}>
                  <SelectTrigger className="h-7 text-xs" aria-label={`Dirección de ${c.email}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{DIRECCIONES.map(d => <SelectItem key={d.v} value={d.v} disabled={c.escritura === false && d.v !== 'leer'}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">{DIRECCIONES.find(d => d.v === dir)?.ayuda}</p>
                {c.escritura === false && (
                  <p className="text-[10px] text-muted-foreground">🔒 Conectada con permiso de solo lectura. Para enviarle eventos, reconéctala con «Ver y enviar».</p>
                )}

                {dir !== 'leer' && (
                  <Select value={c.modoEspejo} onValueChange={v => envolver(c.id, () => actualizarModoEspejo(c.id, v as 'todo' | 'propio'), 'No se pudo cambiar el modo')} disabled={ocupada === c.id}>
                    <SelectTrigger className="h-7 text-xs" aria-label={`Qué enviar a ${c.email}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Envía todo lo que marque «Enviar a Google»</SelectItem>
                      <SelectItem value="propio">Envía solo lo de proyectos con esta cuenta como dueña</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {dir !== 'enviar' && (
                  <div className="rounded-md bg-muted/60 p-2 text-[11px]">
                    {cargandoResumen && !r ? <span className="text-muted-foreground">Cargando resumen…</span> : r ? (
                      <>
                        <p className="font-medium">Hoy: {r.hoy} evento{r.hoy === 1 ? '' : 's'}{r.horasHoy > 0 ? ` · ${r.horasHoy} h ocupadas` : ''} · Próx. 7 días: {r.proximos7}</p>
                        {r.siguientes.map(e => <p key={e.id} className="truncate text-muted-foreground">{dia(e)} {hora(e)} · {e.titulo}</p>)}
                        {!r.siguientes.length && <p className="text-muted-foreground">Sin eventos próximos.</p>}
                      </>
                    ) : errorResumen ? <span className="text-destructive">{errorResumen}</span> : null}
                  </div>
                )}
              </div>
            )
          })}
          {!cuentas.length && <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">Ninguna cuenta conectada todavía.</p>}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Al conectar, Google te pedirá <b>iniciar sesión con esa cuenta</b> y aceptar el acceso: así se confirma que eres su propietario.
          Tus pendientes con fecha <b>no</b> se envían solos; marca «Enviar a Google Calendar» al agendar.
        </p>
        <p className="text-[11px] text-muted-foreground">
          Solo se pide el permiso que necesitas: <b>Solo ver</b> únicamente lee tu calendario (permiso de lectura); <b>Ver y enviar</b> también puede crear y mover los eventos que tú marques.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => conectar('leer')}><Plus size={14} className="mr-1" /> Solo ver</Button>
          <Button variant="secondary" onClick={() => conectar('ambas')}><Plus size={14} className="mr-1" /> Ver y enviar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
