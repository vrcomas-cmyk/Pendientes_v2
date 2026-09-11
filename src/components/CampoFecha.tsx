import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { isoAFechaLegible, fechaLegibleAISO, hoyISO } from '@/lib/app-utils'
import { Input } from '@/components/ui/input'

const DIAS_CORTOS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

/**
 * Campo de fecha con doble entrada: escribes `dd/mm/aaaa` a mano O eliges en un minicalendario.
 * El valor binding se mantiene en ISO (`aaaa-mm-dd`) para no tocar la lógica de ordenar/filtrar
 * del resto de la app; el texto visible se muestra como `dd/mm/aaaa`.
 *
 * El editor interno vive con `key={value}` para que, si el valor cambia desde fuera (ej. "hoy"
 * por prioridad, o el día elegido en el propio calendario), su estado local (el texto en edición)
 * se reinicie solo — sin useEffect con setState ni refs accedidas durante render.
 */
export default function CampoFecha({ value, onChange, placeholder = 'dd/mm/aaaa', autoFocus = false }: {
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  return <EditorCampoFecha key={value} value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus} />
}

function EditorCampoFecha({ value, onChange, placeholder, autoFocus }: {
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  const [texto, setTexto] = useState(value ? isoAFechaLegible(value) : '')
  const [abierto, setAbierto] = useState(false)
  const [mesVista, setMesVista] = useState(() => {
    const base = value ? new Date(value + 'T00:00') : new Date()
    return { anio: base.getFullYear(), mes: base.getMonth() }
  })
  const raiz = useRef<HTMLDivElement>(null)

  // Cierra el calendario al hacer clic fuera.
  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => { if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  const hoy = hoyISO()

  const aplicarTexto = (t: string) => {
    setTexto(t)
    onChange(fechaLegibleAISO(t))
  }

  const celda = useMemo(() => {
    const primero = new Date(mesVista.anio, mesVista.mes, 1)
    const inicioSemana = (primero.getDay() + 6) % 7 // lunes = 0
    const diasMes = new Date(mesVista.anio, mesVista.mes + 1, 0).getDate()
    const celdas: (number | null)[] = Array(inicioSemana).fill(null)
    for (let d = 1; d <= diasMes; d++) celdas.push(d)
    return celdas
  }, [mesVista])

  const cambiarMes = (delta: number) => {
    setMesVista(v => {
      const d = new Date(v.anio, v.mes + delta, 1)
      return { anio: d.getFullYear(), mes: d.getMonth() }
    })
  }

  const elegirDia = (dia: number) => {
    const iso = mesVista.anio + '-' + String(mesVista.mes + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0')
    setTexto(isoAFechaLegible(iso))
    onChange(iso)
    setAbierto(false)
  }

  return (
    <div ref={raiz} className="relative">
      <div className="flex items-center gap-1">
        <Input
          value={texto}
          autoFocus={autoFocus}
          onChange={e => aplicarTexto(e.target.value)}
          onBlur={() => { const iso = fechaLegibleAISO(texto); if (!iso && texto) setTexto(isoAFechaLegible(value)) }}
          placeholder={placeholder}
          inputMode="numeric"
          className="pr-8"
        />
        <button type="button" onClick={() => setAbierto(v => !v)} aria-label="Abrir calendario"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent">
          <Calendar size={15} />
        </button>
      </div>

      {abierto && (
        <div className="absolute left-0 top-full z-50 mt-1 w-60 rounded-xl border bg-popover p-2 shadow-lg">
          <div className="mb-1 flex items-center justify-between">
            <button type="button" onClick={() => cambiarMes(-1)} className="rounded-md p-1 hover:bg-accent" aria-label="Mes anterior"><ChevronLeft size={15} /></button>
            <span className="text-xs font-semibold">{MESES[mesVista.mes]} {mesVista.anio}</span>
            <button type="button" onClick={() => cambiarMes(1)} className="rounded-md p-1 hover:bg-accent" aria-label="Mes siguiente"><ChevronRight size={15} /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {DIAS_CORTOS.map(d => <span key={d} className="py-1 text-[10px] font-medium text-muted-foreground">{d}</span>)}
            {celda.map((dia, i) => {
              if (dia === null) return <span key={i} />
              const iso = mesVista.anio + '-' + String(mesVista.mes + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0')
              const esHoy = iso === hoy
              const seleccionado = value === iso
              return (
                <button type="button" key={i} onClick={() => elegirDia(dia)}
                  className={'flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ' +
                    (seleccionado ? 'bg-primary text-primary-foreground' : esHoy ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent')}>
                  {dia}
                </button>
              )
            })}
          </div>
          <div className="mt-1 flex items-center justify-between border-t pt-1">
            <button type="button" onClick={() => { onChange(''); setTexto(''); setAbierto(false) }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent">
              <X size={12} /> Limpiar
            </button>
            <button type="button" onClick={() => { const h = hoy; setTexto(isoAFechaLegible(h)); onChange(h); setAbierto(false) }}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-primary hover:bg-accent">Hoy</button>
          </div>
        </div>
      )}
    </div>
  )
}