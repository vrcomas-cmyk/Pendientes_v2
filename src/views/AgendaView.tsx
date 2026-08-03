import { useEffect, useState } from 'react'
import { useApp } from '@/store'
import type { Pendiente } from '@/types'
import { hoyISO, activo } from '@/lib/app-utils'
import { listarCuentasGoogle, listarEventosDia, agendarPendiente, actualizarEventoAgenda, eliminarEventoAgenda, type CuentaGoogle, type EventoGCal } from '@/lib/googleCalendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, GripVertical, CalendarOff, Plus } from 'lucide-react'
import { toast } from 'sonner'

const HORA_INICIO = 7
const HORA_FIN = 21

const COLORES_CUENTA = ['bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-emerald-500']
function colorDeCuenta(cuentaId: string): string {
  let h = 0
  for (let i = 0; i < cuentaId.length; i++) h = (h * 31 + cuentaId.charCodeAt(i)) >>> 0
  return COLORES_CUENTA[h % COLORES_CUENTA.length]
}

/** Time-blocking guiado (estilo Sunsama): arrastra un pendiente de hoy a una franja horaria.
    Con Google Calendar conectado (una o varias cuentas), crea/mueve el evento real como espejo en
    TODAS las cuentas conectadas y muestra los eventos existentes de todas como bloques de "ocupado";
    sin conexión, opera en modo degradado (solo local). */
export default function AgendaView() {
  const { pendientes: todosPendientes, proyectos, actualizarPendiente } = useApp()
  const pendientes = todosPendientes.filter(activo)
  const [cuentas, setCuentas] = useState<CuentaGoogle[]>([])
  const [eventosGoogle, setEventosGoogle] = useState<EventoGCal[]>([])
  const [sincronizando, setSincronizando] = useState(false)
  const [viendoComo, setViendoComo] = useState<string>('')
  const [nuevoEventoHora, setNuevoEventoHora] = useState<number | null>(null)
  const [nuevoEventoTitulo, setNuevoEventoTitulo] = useState('')
  const [nuevoEventoDuracion, setNuevoEventoDuracion] = useState('30')
  const hoy = hoyISO()
  const conectado = cuentas.length > 0

  useEffect(() => {
    let vivo = true
    listarCuentasGoogle().then(r => {
      if (!vivo) return
      setCuentas(r.cuentas)
      setViendoComo(v => v || r.cuentas[0]?.id || '')
    }).catch(() => { if (vivo) setCuentas([]) })
    return () => { vivo = false }
  }, [])

  // Perfil personal (cuenta en modo "todo") = ve eventos fusionados de todas las cuentas;
  // perfil laboral (cuenta en modo "propio") = ve solo los eventos de esa cuenta.
  const cuentaVista = cuentas.find(c => c.id === viendoComo)
  const eventosVisibles = !cuentaVista || cuentaVista.modoEspejo === 'todo'
    ? eventosGoogle
    : eventosGoogle.filter(e => e.cuentaId === cuentaVista.id)

  useEffect(() => {
    let vivo = true
    if (!conectado) { Promise.resolve().then(() => { if (vivo) setEventosGoogle([]) }); return () => { vivo = false } }
    listarEventosDia(hoy).then(r => { if (vivo) setEventosGoogle(r.eventos) }).catch(() => { /* noop */ })
    return () => { vivo = false }
  }, [conectado, hoy])

  const avisarErrores = (errores?: Record<string, string>) => {
    if (!errores) return
    Object.entries(errores).forEach(([cuentaId, msg]) => {
      const email = cuentas.find(c => c.id === cuentaId)?.email || 'una cuenta'
      toast.error(`${email}: ${msg}`)
    })
  }

  const sinAgendar = pendientes.filter(p => p.fechaLimite === hoy && p.estado !== 'completado' && !p.hora)
  const agendados = pendientes.filter(p => p.fechaLimite === hoy && p.hora)
  const horaDe = (p: Pendiente) => parseInt((p.hora || '0:0').split(':')[0], 10)

  const arrastrar = (e: React.DragEvent, id: string) => { e.dataTransfer.setData('text/pendiente-id', id) }

  const onDrop = async (hora: number, e: React.DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/pendiente-id')
    const p = pendientes.find(x => x.id === id)
    if (!p) return
    const horaStr = String(hora).padStart(2, '0') + ':00'
    const duracion = p.duracionMin || 30
    actualizarPendiente(p.id, { hora: horaStr, duracionMin: duracion })
    if (!conectado) return
    const origenCuentaId = proyectos.find(x => x.id === p.proyectoId)?.cuentaGoogleId
    setSincronizando(true)
    try {
      const r = p.googleEventos && Object.keys(p.googleEventos).length
        ? await actualizarEventoAgenda(p.googleEventos, hoy, horaStr, duracion, p.titulo, p.descripcion, origenCuentaId)
        : await agendarPendiente(hoy, horaStr, duracion, p.titulo, p.descripcion, origenCuentaId)
      actualizarPendiente(p.id, { googleEventos: r.eventos })
      avisarErrores(r.errores)
      setEventosGoogle((await listarEventosDia(hoy)).eventos)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo agendar en Google Calendar')
    } finally {
      setSincronizando(false)
    }
  }

  const quitarDeAgenda = async (p: Pendiente) => {
    if (conectado && p.googleEventos && Object.keys(p.googleEventos).length) {
      setSincronizando(true)
      try { await eliminarEventoAgenda(p.googleEventos) } catch { /* noop */ } finally { setSincronizando(false) }
    }
    actualizarPendiente(p.id, { hora: '', duracionMin: undefined, googleEventos: undefined })
  }

  const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)

  const abrirNuevoEvento = (hora: number) => {
    setNuevoEventoHora(hora)
    setNuevoEventoTitulo('')
    setNuevoEventoDuracion('30')
  }

  const crearEventoSuelto = async () => {
    const titulo = nuevoEventoTitulo.trim()
    if (!titulo || nuevoEventoHora === null) return
    const horaStr = String(nuevoEventoHora).padStart(2, '0') + ':00'
    setSincronizando(true)
    try {
      const soloEstaCuenta = cuentaVista?.modoEspejo === 'propio'
      const r = await agendarPendiente(hoy, horaStr, Number(nuevoEventoDuracion) || 30, titulo, undefined, viendoComo || undefined, soloEstaCuenta)
      avisarErrores(r.errores)
      setEventosGoogle((await listarEventosDia(hoy)).eventos)
      setNuevoEventoHora(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear el evento en Google Calendar')
    } finally {
      setSincronizando(false)
    }
  }

  return (
    <div className="flex h-full gap-3">
      <div className="w-64 shrink-0 space-y-1.5 overflow-y-auto rounded-xl border bg-card p-2 scroll-thin">
        <h3 className="px-1 text-xs font-bold text-muted-foreground">Sin agendar hoy</h3>
        {sinAgendar.map(p => (
          <div key={p.id} draggable onDragStart={e => arrastrar(e, p.id)}
            className="flex cursor-grab items-center gap-1.5 rounded-lg border bg-background p-2 text-xs active:cursor-grabbing">
            <GripVertical size={12} className="shrink-0 text-muted-foreground" /> <span className="truncate">{p.titulo}</span>
          </div>
        ))}
        {!sinAgendar.length && <p className="px-1 text-xs text-muted-foreground">Nada pendiente sin agendar para hoy.</p>}
        {conectado && (
          <div className="mt-2 space-y-1.5 px-1">
            <h3 className="text-[11px] font-bold text-muted-foreground">Ver mi calendario como</h3>
            <Select value={viendoComo} onValueChange={setViendoComo}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cuentas.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.email} {c.modoEspejo === 'todo' ? '(personal · ve todo)' : '(laboral · solo lo suyo)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1.5">
              {cuentas.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  <span className={'h-1.5 w-1.5 rounded-full ' + colorDeCuenta(c.id)} /> {c.email}
                </span>
              ))}
            </div>
          </div>
        )}
        {!conectado && (
          <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-muted p-2 text-[10px] text-muted-foreground">
            <CalendarOff size={13} className="mt-0.5 shrink-0" /> No hay ninguna cuenta de Google Calendar conectada. Conecta una (o varias) desde el menú de sincronización para ver tus eventos reales y crear bloques que se guarden como espejo en todas.
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto rounded-xl border bg-card p-2 scroll-thin">
        {horas.map(h => {
          const enEstaHora = agendados.filter(p => horaDe(p) === h)
          const eventosEnEstaHora = eventosVisibles.filter(e => e.inicio && !e.todoElDia && new Date(e.inicio).getHours() === h)
          return (
            <div key={h} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(h, e)} className="group flex min-h-[52px] gap-2 border-b py-1">
              <div className="flex w-12 shrink-0 flex-col items-start gap-0.5 pt-1">
                <span className="text-[11px] text-muted-foreground">{String(h).padStart(2, '0')}:00</span>
                {conectado && (
                  <button onClick={() => abrirNuevoEvento(h)} title="Nuevo evento"
                    className="text-muted-foreground opacity-0 hover:text-primary group-hover:opacity-100"><Plus size={12} /></button>
                )}
              </div>
              <div className="flex-1 space-y-1">
                {eventosEnEstaHora.map(ev => (
                  <div key={ev.cuentaId + '/' + ev.id} className="flex items-center gap-1.5 rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                    <span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + colorDeCuenta(ev.cuentaId)} title={ev.email} />
                    🔒 {ev.titulo}
                  </div>
                ))}
                {enEstaHora.map(p => (
                  <div key={p.id} draggable onDragStart={e => arrastrar(e, p.id)}
                    className="flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/10 px-2 py-1 text-xs">
                    <span className="cursor-grab truncate">{p.titulo}</span>
                    <button onClick={() => quitarDeAgenda(p)} title="Quitar de la agenda" className="shrink-0 text-muted-foreground hover:text-destructive"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {sincronizando && <div className="fixed bottom-4 right-4 z-30 rounded-full bg-card px-3 py-1.5 text-xs shadow-lg">Sincronizando con Google Calendar…</div>}

      <Dialog open={nuevoEventoHora !== null} onOpenChange={o => { if (!o) setNuevoEventoHora(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              Nuevo evento a las {nuevoEventoHora !== null ? String(nuevoEventoHora).padStart(2, '0') + ':00' : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input autoFocus value={nuevoEventoTitulo} onChange={e => setNuevoEventoTitulo(e.target.value)}
              placeholder="Ej: Junta con el equipo" onKeyDown={e => { if (e.key === 'Enter') crearEventoSuelto() }} />
            <Select value={nuevoEventoDuracion} onValueChange={setNuevoEventoDuracion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Se crea directo en Google Calendar (no es un pendiente): {cuentaVista?.modoEspejo === 'todo'
                ? 'se refleja en todas tus cuentas conectadas.'
                : `solo en ${cuentaVista?.email || 'la cuenta seleccionada'}.`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNuevoEventoHora(null)}>Cancelar</Button>
            <Button onClick={crearEventoSuelto} disabled={!nuevoEventoTitulo.trim()}>Crear evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
