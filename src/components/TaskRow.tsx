import { useApp } from '@/store'
import type { Pendiente } from '@/types'
import { ESTADOS, PRIORIDAD_BORDER } from '@/types'
import { progresoSub, vencido } from '@/lib/app-utils'
import { Checkbox } from '@/components/ui/checkbox'
import { StickyNote, User, Calendar, CheckSquare } from 'lucide-react'

export default function TaskRow({ p, seleccionado, onClick }: { p: Pendiente; seleccionado?: boolean; onClick?: () => void }) {
  const { toggleCompletar, abrirModal } = useApp()
  const sub = progresoSub(p)
  return (
    <div
      onClick={onClick ?? (() => abrirModal(p.id))}
      className={
        'group flex cursor-pointer items-start gap-2 rounded-lg border border-l-4 bg-card p-2 hover:bg-accent ' +
        (PRIORIDAD_BORDER[p.prioridad] || 'border-l-slate-300') +
        (seleccionado ? ' ring-2 ring-primary' : '')
      }
    >
      <Checkbox
        checked={p.estado === 'completado'}
        onCheckedChange={() => toggleCompletar(p.id)}
        onClick={e => e.stopPropagation()}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={'truncate text-xs font-semibold ' + (p.estado === 'completado' ? 'linea-completada' : '')}>{p.titulo}</span>
          {p.origenNota && <StickyNote size={12} className="shrink-0 text-primary" />}
          {vencido(p) && <span className="rounded bg-red-100 px-1 text-[10px] text-red-700 dark:bg-red-900/40 dark:text-red-300">vencido</span>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
          <span className={'rounded-full px-1.5 ' + ESTADOS[p.estado].badge}>{ESTADOS[p.estado].label}</span>
          {p.responsable && <span className="inline-flex items-center gap-0.5"><User size={10} />{p.responsable}</span>}
          {p.fechaLimite && <span className="inline-flex items-center gap-0.5"><Calendar size={10} />{p.fechaLimite}</span>}
          {sub && <span className="inline-flex items-center gap-0.5"><CheckSquare size={10} />{sub.hechas}/{sub.total}</span>}
        </div>
      </div>
    </div>
  )
}
