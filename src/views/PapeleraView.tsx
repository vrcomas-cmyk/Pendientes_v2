import { useMemo } from 'react'
import { useApp } from '@/store'
import { PROYECTO_COLORES } from '@/types'
import { Button } from '@/components/ui/button'
import { RotateCcw, Inbox, AlertTriangle } from 'lucide-react'

function fmtFecha(iso: string): string {
  try { return new Date(iso).toLocaleString('es-MX') } catch { return iso }
}

export default function PapeleraView() {
  const { pendientes, notas, eventos, proyectos, restaurarPendiente, restaurarNota, restaurarEvento, vaciarPapelera, abrirModal } = useApp()

  const borradosPend = useMemo(() => pendientes.filter(p => p.borrado).sort((a, b) => b.modificado.localeCompare(a.modificado)), [pendientes])
  const borradasNotas = useMemo(() => notas.filter(n => n.borrado).sort((a, b) => b.modificado.localeCompare(a.modificado)), [notas])
  const borradosEventos = useMemo(() => eventos.filter(e => e.borrado).sort((a, b) => b.modificado.localeCompare(a.modificado)), [eventos])
  const vacia = !borradosPend.length && !borradasNotas.length && !borradosEventos.length

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Inbox size={18} /> Papelera</h2>
        {!vacia && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              if (confirm('¿Vaciar la papelera definitivamente? Esta acción no se puede deshacer.')) vaciarPapelera()
            }}
          >
            <AlertTriangle size={14} className="mr-1" /> Vaciar papelera
          </Button>
        )}
      </div>

      {vacia && (
        <div className="flex flex-col items-center gap-2 p-8 text-center text-xs text-muted-foreground">
          <Inbox size={28} className="opacity-40" />
          <p>La papelera está vacía.</p>
          <p className="text-[10px]">Los ítems eliminados aparecerán aquí durante 30 días (gestión por sync) antes de ser purgados.</p>
        </div>
      )}

      {borradosPend.length > 0 && (
        <Seccion titulo={`Pendientes (${borradosPend.length})`}>
          {borradosPend.map(p => {
            const proyecto = p.proyectoId ? proyectos.find(pr => pr.id === p.proyectoId) : null
            const dot = proyecto ? (PROYECTO_COLORES[proyecto.color]?.dot || '') : ''
            return (
              <Fila
                key={p.id}
                titulo={p.titulo}
                sub={`${proyecto?.nombre || p.proyecto || 'Sin proyecto'} · ${fmtFecha(p.modificado)}`}
                dot={dot}
                onRestaurar={() => restaurarPendiente(p.id)}
                onEditar={() => abrirModal(p.id)}
              />
            )
          })}
        </Seccion>
      )}

      {borradasNotas.length > 0 && (
        <Seccion titulo={`Notas (${borradasNotas.length})`}>
          {borradasNotas.map(n => (
            <Fila
              key={n.id}
              titulo={n.titulo || 'Sin título'}
              sub={`${n.carpeta || 'Sin carpeta'} · ${fmtFecha(n.modificado)}`}
              onRestaurar={() => restaurarNota(n.id)}
            />
          ))}
        </Seccion>
      )}

      {borradosEventos.length > 0 && (
        <Seccion titulo={`Eventos de calendario (${borradosEventos.length})`}>
          {borradosEventos.map(e => (
            <Fila
              key={e.id}
              titulo={e.titulo || 'Sin título'}
              sub={`${e.fecha} ${e.hora} · ${fmtFecha(e.modificado)}`}
              onRestaurar={() => restaurarEvento(e.id)}
            />
          ))}
        </Seccion>
      )}
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold text-muted-foreground">{titulo}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Fila({ titulo, sub, dot, onRestaurar, onEditar }: { titulo: string; sub: string; dot?: string; onRestaurar: () => void; onEditar?: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
      {dot && <span className={'h-2.5 w-2.5 shrink-0 rounded-full ' + dot} />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{titulo}</div>
        <div className="truncate text-[10px] text-muted-foreground">{sub}</div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={onRestaurar} title="Restaurar"><RotateCcw size={13} /></Button>
        {onEditar && <Button size="sm" variant="ghost" onClick={onEditar} title="Editar">Ver</Button>}
      </div>
    </div>
  )
}
