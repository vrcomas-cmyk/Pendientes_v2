import { useEffect, useRef, useState } from 'react'
import ProgressRing from '@/components/ProgressRing'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

const DURACION_S = 25 * 60

function formatear(s: number): string {
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

/** Envuelve `ProgressRing` (ya usado en Hoy y en el resumen de proyectos) — no crea un componente
    visual nuevo, solo lo alimenta con el progreso de la cuenta regresiva. */
export default function PomodoroWidget() {
  const [restante, setRestante] = useState(DURACION_S)
  const [corriendo, setCorriendo] = useState(false)
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!corriendo) return
    intervalo.current = setInterval(() => {
      setRestante(s => {
        if (s <= 1) {
          setCorriendo(false)
          toast.success('¡Pomodoro completado! 🍅 Tómate un descanso.')
          return DURACION_S
        }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalo.current) clearInterval(intervalo.current) }
  }, [corriendo])

  const reiniciar = () => { setCorriendo(false); setRestante(DURACION_S) }
  const pct = Math.round(((DURACION_S - restante) / DURACION_S) * 100)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <ProgressRing pct={pct} size={110} stroke={8}>
        <span className="font-display text-lg font-bold">{formatear(restante)}</span>
      </ProgressRing>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setCorriendo(v => !v)}>
          {corriendo ? <Pause size={13} className="mr-1" /> : <Play size={13} className="mr-1" />}
          {corriendo ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={reiniciar} title="Reiniciar"><RotateCcw size={14} /></Button>
      </div>
    </div>
  )
}
