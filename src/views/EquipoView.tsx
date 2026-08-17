import { useMemo, useState } from 'react'
import { useApp } from '@/store'
import { useSync } from '@/sync'
import { useUI } from '@/ui-store'
import { activo } from '@/lib/app-utils'
import { idColumnaCompletado } from '@/lib/columnas'
import TaskRow from '@/components/TaskRow'
import { Card } from '@/components/ui/card'
import { Users, Crown, UserCircle2 } from 'lucide-react'

type FiltroEquipo = 'delegue' | 'me_delegaron' | 'sin_asignar'

/** Vista «Mi Equipo» (Fase 3 del plan de Contactos/Equipos/Delegación — ver workspace-doctrine).
    Deliberadamente de solo-lectura: muestra los miembros de la cuenta compartida (ya expuestos
    por `useSync()`, sin tocar roles ni RLS) y filtros rápidos de delegación sobre los pendientes
    ya existentes. La expansión de roles (miembro/observador) y permisos que el plan original
    proponía para esta fase queda deliberadamente FUERA de este hito: cambiar quién puede ver o
    escribir qué es una superficie de seguridad — RLS en Supabase, flujo de invitación — que
    amerita su propia revisión dedicada, no apilarla sobre el resto de los cambios de esta
    sesión. Lo que sigue es 100% aditivo y de solo lectura: no hay forma de que rompa nada. */
export default function EquipoView() {
  const { pendientes, columnas, usuario } = useApp()
  const { miembros, miRol } = useSync()
  const { abrirPeek } = useUI()
  const idCompletado = idColumnaCompletado(columnas)
  const [filtro, setFiltro] = useState<FiltroEquipo>('me_delegaron')

  const activos = useMemo(() => pendientes.filter(p => activo(p) && p.estado !== idCompletado), [pendientes, idCompletado])

  const listas: Record<FiltroEquipo, typeof activos> = {
    delegue: activos.filter(p => p.responsable && p.responsable !== usuario),
    me_delegaron: activos.filter(p => p.responsable === usuario && p.solicitante && p.solicitante !== usuario),
    sin_asignar: activos.filter(p => !p.responsable),
  }

  const chips: { f: FiltroEquipo; label: string }[] = [
    { f: 'me_delegaron', label: 'Me delegaron' },
    { f: 'delegue', label: 'Delegué a otros' },
    { f: 'sin_asignar', label: 'Sin asignar' },
  ]

  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="flex shrink-0 items-center gap-1.5 text-sm font-bold"><Users size={15} className="text-primary" /> Mi Equipo</h2>

      {miembros.length > 0 && (
        <Card className="shrink-0 p-3">
          <p className="mb-2 text-[11px] uppercase text-muted-foreground">Cuenta compartida ({miembros.length} miembro{miembros.length === 1 ? '' : 's'})</p>
          <div className="flex flex-wrap gap-2">
            {miembros.map(m => (
              <span key={m.userId} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
                {m.rol === 'padre' ? <Crown size={11} className="text-amber-500" /> : <UserCircle2 size={11} className="text-muted-foreground" />}
                <span className="max-w-[160px] truncate">{m.email}</span>
              </span>
            ))}
          </div>
          {miRol && <p className="mt-2 text-[11px] text-muted-foreground">Tu rol: {miRol === 'padre' ? 'Padre (administra la cuenta)' : 'Hija (miembro)'}</p>}
        </Card>
      )}

      <div className="flex shrink-0 gap-1.5">
        {chips.map(c => (
          <button key={c.f} onClick={() => setFiltro(c.f)}
            className={'rounded-full border px-3 py-1.5 text-xs font-medium ' + (filtro === c.f ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}>
            {c.label} ({listas[c.f].length})
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 scroll-thin">
        {listas[filtro].length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">Nada acá por ahora.</p>
        ) : (
          listas[filtro].map(p => <TaskRow key={p.id} p={p} onClick={() => abrirPeek(p.id)} />)
        )}
      </div>
    </div>
  )
}
