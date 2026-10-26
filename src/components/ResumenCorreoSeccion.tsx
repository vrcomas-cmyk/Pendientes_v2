import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSync } from '@/sync'
import { getSupabase } from '@/lib/supabase'
import { mensajeDeFuncion } from '@/lib/funciones-errores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CampoFecha from '@/components/CampoFecha'
import { Mail } from 'lucide-react'

const DIAS = [{ n: 1, l: 'L' }, { n: 2, l: 'M' }, { n: 3, l: 'X' }, { n: 4, l: 'J' }, { n: 5, l: 'V' }, { n: 6, l: 'S' }, { n: 0, l: 'D' }]
const zonaLocal = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City' } catch { return 'America/Mexico_City' } }

interface Prefs { activo: boolean; diario: boolean; semanal: boolean; hora_local: string; zona: string; dias: number[]; pausado_hasta: string; email: string }

/** Preferencias del resumen por correo (Hito 3). El envío real lo hace la Edge Function
    `resumen-correo` por cron; aquí solo se guardan preferencias. Requiere sesión sincronizada. */
export default function ResumenCorreoSeccion() {
  const { userId, email, modoLocal } = useSync()
  const [p, setP] = useState<Prefs | null>(null)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (modoLocal || !userId) return
    const sb = getSupabase()
    if (!sb) return
    let vivo = true
    Promise.resolve().then(() => setCargando(true))
    sb.from('pnp_resumen_prefs').select('*').eq('user_id', userId).maybeSingle().then(({ data, error: e }) => {
      if (!vivo) return
      if (e) { setError('No se pudieron leer las preferencias (¿ya corriste supabase_setup.sql?)'); setCargando(false); return }
      setP(data
        ? { activo: data.activo, diario: data.diario, semanal: data.semanal, hora_local: data.hora_local, zona: data.zona, dias: data.dias ?? [1, 2, 3, 4, 5], pausado_hasta: data.pausado_hasta ?? '', email: data.email }
        : { activo: false, diario: true, semanal: true, hora_local: '07:00', zona: zonaLocal(), dias: [1, 2, 3, 4, 5], pausado_hasta: '', email: email ?? '' })
      setCargando(false)
    })
    return () => { vivo = false }
  }, [modoLocal, userId, email])

  if (modoLocal || !userId) {
    return <p className="text-xs text-muted-foreground">Inicia sesión y activa la sincronización para recibir resúmenes por correo.</p>
  }
  if (cargando) return <p className="text-xs text-muted-foreground">Cargando…</p>
  if (error) return <p className="text-xs text-destructive">{error}</p>
  if (!p) return null

  const set = (c: Partial<Prefs>) => setP({ ...p, ...c })
  const emailValido = /^\S+@\S+\.\S+$/.test(p.email.trim())
  const horaValida = /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(p.hora_local)
  const invalido = !emailValido || !horaValida || (p.activo && !p.diario && !p.semanal) || (p.diario && p.dias.length === 0 && !p.semanal)

  const guardar = async () => {
    const sb = getSupabase()
    if (!sb || invalido) return
    setGuardando(true)
    const { error: e } = await sb.from('pnp_resumen_prefs').upsert({
      user_id: userId, email: p.email.trim(), activo: p.activo, diario: p.diario, semanal: p.semanal, hora_local: p.hora_local,
      zona: p.zona, dias: p.dias, pausado_hasta: p.pausado_hasta || null, actualizado: new Date().toISOString(),
    })
    setGuardando(false)
    if (e) toast.error('No se pudo guardar: ' + e.message); else toast.success('Preferencias de resumen guardadas')
  }

  const probar = async () => {
    const sb = getSupabase()
    if (!sb) return
    await guardar()
    const { data, error: e } = await sb.functions.invoke('resumen-correo', { body: { action: 'prueba', tipo: p.diario ? 'diario' : 'semanal' } })
    if (e || data?.error) {
      const motivo = await mensajeDeFuncion(e, data)
      toast.error('No se pudo enviar la prueba: ' + (motivo ?? 'error desconocido (¿está desplegada la función?)'), { duration: 12000 })
    } else toast.success(data?.vacio ? 'Prueba enviada (hoy no tienes nada programado)' : 'Prueba enviada a ' + p.email)
  }

  return (
    <div className="space-y-2.5">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.activo} onChange={e => set({ activo: e.target.checked })} /> Recibir resúmenes por correo</label>
      <Input type="email" value={p.email} onChange={e => set({ email: e.target.value })} placeholder="Correo de destino" aria-label="Correo de destino" />
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={p.diario} onChange={e => set({ diario: e.target.checked })} /> Diario</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={p.semanal} onChange={e => set({ semanal: e.target.checked })} /> Semanal (lunes)</label>
        <label className="flex items-center gap-1.5">a las <Input type="time" className="h-8 w-28" value={p.hora_local} onChange={e => set({ hora_local: e.target.value })} aria-label="Hora de envío" /></label>
      </div>
      {p.diario && (
        <div className="flex items-center gap-1" role="group" aria-label="Días del resumen diario">
          {DIAS.map(d => (
            <button key={d.n} type="button" aria-pressed={p.dias.includes(d.n)}
              onClick={() => set({ dias: p.dias.includes(d.n) ? p.dias.filter(x => x !== d.n) : [...p.dias, d.n] })}
              className={'h-7 w-7 rounded-full border text-[11px] ' + (p.dias.includes(d.n) ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground')}>{d.l}</button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">Los lunes con «Semanal» activo recibes un solo correo: la semana (lunes–domingo) ya incluye ese día. Zona horaria: {p.zona}.</p>
      <div className="flex items-center gap-2 text-xs"><span className="shrink-0">Pausar hasta</span><div className="w-40"><CampoFecha value={p.pausado_hasta} onChange={v => set({ pausado_hasta: v })} placeholder="Sin pausa" /></div></div>
      <div className="flex gap-2">
        <Button size="sm" onClick={guardar} disabled={invalido || guardando}><Mail size={13} className="mr-1" /> Guardar</Button>
        <Button size="sm" variant="secondary" onClick={probar} disabled={invalido || guardando}>Enviar prueba</Button>
      </div>
    </div>
  )
}
