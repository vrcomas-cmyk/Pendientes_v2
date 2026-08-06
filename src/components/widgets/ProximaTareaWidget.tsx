import { useMemo } from 'react'
import { useApp } from '@/store'
import { activo, hoyISO } from '@/lib/app-utils'
import { idColumnaCompletado } from '@/lib/columnas'
import TaskRow from '@/components/TaskRow'

/** Siguiente pendiente por hacer, mismo criterio que la sección "Para hoy" / "Próximos" de
    `TodayView`: primero lo de hoy sin completar, si no hay, lo agendado más próximo. */
export default function ProximaTareaWidget() {
  const { pendientes: todos, columnas } = useApp()
  const idCompletado = idColumnaCompletado(columnas)
  const h = hoyISO()

  const proxima = useMemo(() => {
    const abiertos = todos.filter(p => activo(p) && p.estado !== idCompletado && p.fechaLimite)
    const deHoy = abiertos.filter(p => p.fechaLimite === h).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
    if (deHoy.length) return deHoy[0]
    const futuras = abiertos.filter(p => p.fechaLimite > h).sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite))
    return futuras[0] || null
  }, [todos, idCompletado, h])

  if (!proxima) return <p className="text-xs text-muted-foreground">Nada agendado por ahora. 🎉</p>
  return <TaskRow p={proxima} />
}
