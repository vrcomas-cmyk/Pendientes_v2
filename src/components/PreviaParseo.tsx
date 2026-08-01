import { parsearLinea, describirRepeticion } from '@/lib/app-utils'
import { Calendar, User, Flag, Folder, Repeat } from 'lucide-react'

const COLOR_PRIORIDAD: Record<string, string> = {
  Alta: 'text-red-600 dark:text-red-400', Media: 'text-amber-600 dark:text-amber-400', Baja: 'text-emerald-600 dark:text-emerald-400',
}

/** Chips de "lo que se entendió" mientras se escribe una captura rápida o una línea de tarea en una nota. */
export default function PreviaParseo({ texto }: { texto: string }) {
  if (!texto.trim()) return null
  const proyectos = [...texto.matchAll(/#(\S+)/g)].map(m => m[1])
  const p = parsearLinea(texto.replace(/#(\S+)/g, ''))
  if (!p) return null

  const chips: { icon: React.ReactNode; label: string; cls?: string }[] = []
  if (p.fechaLimite) chips.push({ icon: <Calendar size={11} />, label: p.fechaLimite })
  if (p.responsable) chips.push({ icon: <User size={11} />, label: p.responsable })
  if (p.prioridad) chips.push({ icon: <Flag size={11} />, label: p.prioridad, cls: COLOR_PRIORIDAD[p.prioridad] })
  if (proyectos.length) chips.push({ icon: <Folder size={11} />, label: proyectos.join(', ') })
  if (p.repetir) chips.push({ icon: <Repeat size={11} />, label: describirRepeticion(p.repetir) })

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
      <span className="font-medium text-foreground">{p.titulo || '…'}</span>
      {p.descripcion && <span className="truncate">· {p.descripcion}</span>}
      {chips.map((c, i) => (
        <span key={i} className={'inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 ' + (c.cls || '')}>{c.icon}{c.label}</span>
      ))}
    </div>
  )
}
