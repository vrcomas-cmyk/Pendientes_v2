import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import { useSync } from '@/sync'
import { activo, hoyISO, isoAFechaLegible } from '@/lib/app-utils'
import { idColumnaCompletado } from '@/lib/columnas'
import { buscarConflictos, deduplicarGoogle, sinDuplicarLocal, esHoraPorDefecto } from '@/lib/agenda'
import { sincronizarIncremental, enRango, cacheCaliente } from '@/lib/googleSync'
import { parsearEventoRapido } from '@/lib/captura'
import { listarEventosRango, type EventoGCal } from '@/lib/googleCalendar'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, AlertTriangle, CalendarDays } from 'lucide-react'

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const sumar = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
const hh = (iso: string) => { const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') }

type Fila =
  | { k: 'p'; id: string; hora: string; titulo: string; min: number; hecho: boolean; choca: boolean }
  | { k: 'e'; id: string; hora: string; titulo: string; min: number; choca: boolean }
  | { k: 'g'; id: string; hora: string; titulo: string; min: number; choca: boolean }

/** Panel lateral derecho de agenda (estilo panel de Calendar en Gmail): siempre a la vista junto a
    cualquier módulo. Combina pendientes con hora, eventos propios y eventos de Google del día, con
    marca de origen y aviso de cruces. Captura rápida de eventos sin salir de lo que estás haciendo. */
export default function PanelAgenda({ onCerrar, onAbrirCalendario, variante = 'lateral' }: { onCerrar: () => void; onAbrirCalendario: () => void; variante?: 'lateral' | 'hoja' }) {
  const { pendientes: todos, eventos: todosEv, columnas, crearEvento } = useApp()
  const { abrirPeek } = useUI()
  const { modoLocal } = useSync()
  const idCompletado = idColumnaCompletado(columnas)
  const [dia, setDia] = useState(hoyISO())
  const [google, setGoogle] = useState<EventoGCal[]>([])
  const [errorGoogle, setErrorGoogle] = useState(false)
  const [cargandoGoogle, setCargandoGoogle] = useState(false)
  const [texto, setTexto] = useState('')

  // Igual que el calendario completo (Pendientes → Calendario): la agenda es TODO tu tiempo, sin
  // filtrar por Espacio activo, para que ambos muestren siempre lo mismo.
  const pendientes = useMemo(() => todos.filter(activo), [todos])
  const eventos = useMemo(() => todosEv.filter(e => !e.borrado), [todosEv])

  useEffect(() => {
    if (modoLocal) { Promise.resolve().then(() => { setGoogle([]); setErrorGoogle(false) }); return }
    let vivo = true
    const desde = new Date(dia + 'T00:00:00').toISOString(), hasta = new Date(dia + 'T23:59:59').toISOString()
    const mostrar = (evs: EventoGCal[], errores?: Record<string, string>) => { if (vivo) { setGoogle(evs); setErrorGoogle(!!errores && Object.keys(errores).length > 0) } }
    const porRango = () => listarEventosRango(desde, hasta).then(r => mostrar(r.eventos, r.errores)).catch(() => mostrar([], { x: 'error' }))
    Promise.resolve().then(() => { if (vivo) setCargandoGoogle(true) })
    const fin = () => { if (vivo) setCargandoGoogle(false) }
    if (!cacheCaliente()) {
      // Primera carga: la sincronización incremental baja toda la ventana (lenta). Se pinta YA el día
      // con una consulta pequeña por rango y la copia completa se calienta en segundo plano.
      porRango().finally(fin)
      sincronizarIncremental().catch(() => { /* sin soporte: se queda con el listado por rango */ })
    } else {
      sincronizarIncremental().then(r => mostrar(enRango(r.eventos, desde, hasta), r.errores)).catch(porRango).finally(fin)
    }
    return () => { vivo = false }
  }, [dia, modoLocal])

  const googleVisible = useMemo(() => deduplicarGoogle(sinDuplicarLocal(google, pendientes, eventos)), [google, pendientes, eventos])
  const todoElDia = googleVisible.filter(g => g.todoElDia)

  const { filas, sinHora } = useMemo(() => {
    const fuentes = { pendientes, eventos, google: googleVisible, idCompletado }
    const ch = (fecha: string, hora: string, min: number, id: string) => buscarConflictos({ fecha, hora, duracionMin: min }, fuentes, id).length > 0
    const f: Fila[] = []
    for (const p of pendientes) if (p.fechaLimite === dia && p.hora && !esHoraPorDefecto(p.hora, p.duracionMin)) f.push({ k: 'p', id: p.id, hora: p.hora, titulo: p.titulo, min: p.duracionMin || 15, hecho: p.estado === idCompletado, choca: p.estado !== idCompletado && ch(dia, p.hora, p.duracionMin || 15, p.id) })
    for (const e of eventos) if (e.fecha === dia && e.hora) f.push({ k: 'e', id: e.id, hora: e.hora, titulo: e.titulo, min: e.duracionMin, choca: ch(dia, e.hora, e.duracionMin, e.id) })
    for (const g of googleVisible) if (!g.todoElDia && g.inicio) {
      const min = g.fin ? Math.max(1, Math.round((new Date(g.fin).getTime() - new Date(g.inicio).getTime()) / 60000)) : 30
      f.push({ k: 'g', id: g.cuentaId + '/' + g.id, hora: hh(g.inicio), titulo: g.titulo, min, choca: g.ocupado !== false && ch(dia, hh(g.inicio), min, g.cuentaId + '/' + g.id) })
    }
    f.sort((a, b) => a.hora.localeCompare(b.hora))
    return { filas: f, sinHora: pendientes.filter(p => p.fechaLimite === dia && (!p.hora || esHoraPorDefecto(p.hora, p.duracionMin)) && p.estado !== idCompletado) }
  }, [pendientes, eventos, googleVisible, dia, idCompletado])

  const crear = () => {
    const ev = parsearEventoRapido(texto)
    if (!ev) return
    // El día del panel manda salvo que el texto traiga su propia fecha explícita (>mañana, >2026-11-02…).
    const conFecha = /(>\s*\S+|\b(hoy|mañana|manana)\b)/i.test(texto)
    crearEvento({ titulo: ev.titulo, descripcion: ev.descripcion || undefined, fecha: conFecha ? ev.fecha : dia, hora: ev.hora || '08:00', duracionMin: ev.duracionMin })
    setTexto('')
    toast.success('Evento creado (solo en la app)')
  }

  const esHoy = dia === hoyISO()
  const d = new Date(dia + 'T00:00:00')

  // 'lateral' = columna derecha en pantallas anchas; 'hoja' = contenido de la hoja inferior en móvil.
  const Contenedor = variante === 'lateral' ? 'aside' : 'section'
  const clasesContenedor = variante === 'lateral' ? 'hidden w-72 shrink-0 flex-col border-l bg-card xl:flex' : 'flex h-full min-h-0 flex-col bg-card'
  return (
    <Contenedor aria-label={variante === 'lateral' ? 'Agenda' : 'Agenda del día'} className={clasesContenedor}>
      <div className="flex items-center gap-1 border-b px-2 py-2">
        <CalendarDays size={15} className="ml-1 text-primary" />
        <button onClick={() => setDia(sumar(dia, -1))} aria-label="Día anterior" className="rounded p-1 hover:bg-accent"><ChevronLeft size={15} /></button>
        <button onClick={() => setDia(hoyISO())} className="min-w-0 flex-1 truncate text-center text-xs font-bold capitalize hover:text-primary" title="Ir a hoy" aria-label={`Agenda del día ${dia}; volver a la fecha actual`}>
          {esHoy ? 'Hoy' : DIAS[d.getDay()]} · {isoAFechaLegible(dia).slice(0, 5)}
        </button>
        <button onClick={() => setDia(sumar(dia, 1))} aria-label="Día siguiente" className="rounded p-1 hover:bg-accent"><ChevronRight size={15} /></button>
        <button onClick={onCerrar} aria-label="Ocultar agenda" className="rounded p-1 text-muted-foreground hover:bg-accent"><X size={14} /></button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2 scroll-thin">
        {todoElDia.map(g => (
          <div key={g.cuentaId + g.id} className="truncate rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground" title={g.email}>🔒 {g.titulo} <span className="opacity-60">(todo el día)</span></div>
        ))}
        {filas.map(f => (
          <button key={f.k + f.id} disabled={f.k === 'g'} onClick={() => { if (f.k === 'p') abrirPeek(f.id) }}
            className={'flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left text-xs ' +
              (f.k === 'p' ? 'border-primary/40 bg-primary/10' : f.k === 'e' ? 'border-accent2/50 bg-accent2/15' : 'bg-muted text-muted-foreground') +
              (f.k === 'p' && f.hecho ? ' line-through opacity-50' : '')}>
            <span className="w-10 shrink-0 font-medium tabular-nums">{f.hora}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{f.k === 'g' ? '🔒 ' : ''}{f.titulo}</span>
              <span className="text-[10px] opacity-70">{f.k === 'p' ? 'Pendiente' : f.k === 'e' ? 'Evento' : 'Google'} · {f.min} min</span>
            </span>
            {f.choca && <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" aria-label="Se cruza con otro elemento" />}
          </button>
        ))}
        {!filas.length && !todoElDia.length && <p className="px-1 py-4 text-center text-xs text-muted-foreground">Sin eventos con hora este día.</p>}

        {sinHora.length > 0 && (
          <div className="pt-2">
            <h3 className="px-1 pb-1 text-[11px] font-bold text-muted-foreground">Sin hora ({sinHora.length})</h3>
            {sinHora.map(p => (
              <button key={p.id} onClick={() => abrirPeek(p.id)} className="mb-1 block w-full truncate rounded-lg border bg-background px-2 py-1 text-left text-xs hover:bg-accent">{p.titulo}</button>
            ))}
          </div>
        )}
        {cargandoGoogle && !modoLocal && <p className="px-1 text-[10px] text-muted-foreground">Cargando Google Calendar…</p>}
        {errorGoogle && !modoLocal && <p className="px-1 pt-2 text-[10px] text-muted-foreground">No se pudo actualizar Google Calendar; los datos de Google pueden estar desactualizados.</p>}
      </div>

      <div className="space-y-1.5 border-t p-2">
        <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); crear() } }}
          placeholder='Evento rápido: "Junta 3pm por 1h"' aria-label="Evento rápido"
          className="w-full rounded-full border bg-muted/60 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary" />
        <Button size="sm" variant="secondary" className="h-7 w-full text-xs" onClick={onAbrirCalendario}>Abrir calendario completo</Button>
      </div>
    </Contenedor>
  )
}
