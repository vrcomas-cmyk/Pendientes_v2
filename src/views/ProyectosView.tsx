import { useEffect, useState } from 'react'
import { useApp } from '@/store'
import { PROYECTO_COLORES, PROYECTO_COLORES_KEYS } from '@/types'
import { listarCuentasGoogle, type CuentaGoogle } from '@/lib/googleCalendar'
import { activo } from '@/lib/app-utils'
import { idColumnaCompletado } from '@/lib/columnas'
import TaskRow from '@/components/TaskRow'
import KanbanDnd from '@/components/KanbanDnd'
import ImportarPlanDialog from '@/components/ImportarPlanDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { Plus, Briefcase, ChevronLeft, List, Columns3, Trash2, Upload } from 'lucide-react'

function NuevoProyectoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { crearProyecto } = useApp()
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState(PROYECTO_COLORES_KEYS[0])
  const [cuentaId, setCuentaId] = useState<string>('')
  const [cuentas, setCuentas] = useState<CuentaGoogle[]>([])

  useEffect(() => {
    if (!open) return
    setNombre(''); setColor(PROYECTO_COLORES_KEYS[0]); setCuentaId('') // eslint-disable-line react-hooks/set-state-in-effect -- intentional form reset when the dialog opens
    listarCuentasGoogle().then(r => setCuentas(r.cuentas)).catch(() => setCuentas([]))
  }, [open])

  const guardar = () => {
    const n = nombre.trim()
    if (!n) return
    crearProyecto(n, color, cuentaId || undefined)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-base">Nuevo proyecto</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del proyecto"
            onKeyDown={e => { if (e.key === 'Enter') guardar() }} />
          <div className="flex flex-wrap gap-1.5">
            {PROYECTO_COLORES_KEYS.map(k => (
              <button key={k} onClick={() => setColor(k)}
                className={'h-6 w-6 rounded-full ' + PROYECTO_COLORES[k].dot + (color === k ? ' ring-2 ring-offset-2 ring-primary' : '')} />
            ))}
          </div>
          {cuentas.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase text-muted-foreground">Cuenta dueña (opcional)</label>
              <Select value={cuentaId || '__ninguna'} onValueChange={v => setCuentaId(v === '__ninguna' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ninguna">Ninguna</SelectItem>
                  {cuentas.map(c => <SelectItem key={c.id} value={c.id}>{c.email}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Si esa cuenta está en modo "Solo lo propio", únicamente recibirá los pendientes de este proyecto.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={guardar}>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TableroProyecto({ proyectoId }: { proyectoId: string }) {
  const { pendientes } = useApp()
  const items = pendientes.filter(p => p.proyectoId === proyectoId)
  return <KanbanDnd pendientes={items} defaultsAlAgregar={{ proyectoId }} minColW={220} />
}

function ListaProyecto({ proyectoId }: { proyectoId: string }) {
  const { pendientes } = useApp()
  const items = pendientes.filter(p => p.proyectoId === proyectoId && activo(p))
  return (
    <div className="h-full space-y-1.5 overflow-y-auto p-1 scroll-thin">
      {items.map(p => <TaskRow key={p.id} p={p} />)}
      {!items.length && <p className="p-6 text-center text-xs text-muted-foreground">Este proyecto no tiene pendientes todavía.</p>}
    </div>
  )
}

export default function ProyectosView() {
  const { proyectos, pendientes, eliminarProyecto, actualizarProyecto, proyectoAbiertoId: proyectoSelId, setProyectoAbiertoId: setProyectoSelId, columnas } = useApp()
  const idCompletado = idColumnaCompletado(columnas)
  const isMobile = useIsMobile()
  const [modo, setModo] = useState<'tablero' | 'lista'>('tablero')
  const [nuevoDlg, setNuevoDlg] = useState(false)
  const [importarDlg, setImportarDlg] = useState(false)

  const proyecto = proyectos.find(p => p.id === proyectoSelId) || null

  const panelLista = (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-2">
        <h3 className="px-1 text-xs font-bold text-muted-foreground">Proyectos</h3>
        <Button size="sm" onClick={() => setNuevoDlg(true)}><Plus size={13} className="mr-1" /> Nuevo</Button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-1 scroll-thin">
        {proyectos.map(p => {
          const items = pendientes.filter(x => x.proyectoId === p.id && activo(x))
          const abiertos = items.filter(x => x.estado !== idCompletado).length
          const colores = PROYECTO_COLORES[p.color] || PROYECTO_COLORES[PROYECTO_COLORES_KEYS[0]]
          return (
            <ContextMenu key={p.id}>
              <ContextMenuTrigger asChild>
                <div onClick={() => setProyectoSelId(p.id)}
                  className={'flex cursor-pointer items-center gap-2 rounded-lg p-2.5 ' + (proyectoSelId === p.id ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-accent')}>
                  <span className={'h-2.5 w-2.5 shrink-0 rounded-full ' + colores.dot} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.nombre}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{abiertos} abiertos</span>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-44">
                <ContextMenuItem onClick={() => actualizarProyecto(p.id, { color: PROYECTO_COLORES_KEYS[(PROYECTO_COLORES_KEYS.indexOf(p.color) + 1) % PROYECTO_COLORES_KEYS.length] })}>
                  Cambiar color
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem className="text-destructive" onClick={() => eliminarProyecto(p.id)}>Eliminar</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
        {!proyectos.length && <p className="p-4 text-center text-xs text-muted-foreground">Crea tu primer proyecto para organizar trabajo o estudio en un tablero propio.</p>}
      </div>
    </div>
  )

  const panelDetalle = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
      {!proyecto ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Selecciona o crea un proyecto</div>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b p-2">
            {isMobile && (
              <Button size="sm" variant="ghost" onClick={() => setProyectoSelId(null)} className="shrink-0 px-2"><ChevronLeft size={18} /></Button>
            )}
            <span className={'h-2.5 w-2.5 shrink-0 rounded-full ' + (PROYECTO_COLORES[proyecto.color]?.dot || '')} />
            <h2 className="min-w-0 flex-1 truncate text-sm font-bold">{proyecto.nombre}</h2>
            <div className="flex shrink-0 items-center gap-1 rounded-lg border p-0.5">
              <button onClick={() => setModo('tablero')} className={'rounded-md p-1.5 ' + (modo === 'tablero' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}><Columns3 size={14} /></button>
              <button onClick={() => setModo('lista')} className={'rounded-md p-1.5 ' + (modo === 'lista' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}><List size={14} /></button>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setImportarDlg(true)} className="shrink-0" title="Importar plan de estudio">
              <Upload size={13} className="mr-1" /> {!isMobile && 'Importar plan'}
            </Button>
            <button onClick={() => { eliminarProyecto(proyecto.id); setProyectoSelId(null) }} title="Eliminar proyecto"
              className="shrink-0 px-1 text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button>
          </div>
          <div className="min-h-0 flex-1 p-2">
            {modo === 'tablero' ? <TableroProyecto proyectoId={proyecto.id} /> : <ListaProyecto proyectoId={proyecto.id} />}
          </div>
          <ImportarPlanDialog open={importarDlg} onOpenChange={setImportarDlg} proyectoId={proyecto.id} />
        </>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2">
        {!proyecto ? (
          <>
            <div className="flex shrink-0 items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-bold"><Briefcase size={15} className="text-primary" /> Proyectos</h2>
            </div>
            <div className="min-h-0 flex-1">{panelLista}</div>
          </>
        ) : (
          <div className="min-h-0 flex-1">{panelDetalle}</div>
        )}
        <NuevoProyectoDialog open={nuevoDlg} onOpenChange={setNuevoDlg} />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold"><Briefcase size={15} className="text-primary" /> Proyectos</h2>
      </div>
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="w-1/4 min-w-[200px]">{panelLista}</div>
        <div className="min-h-0 flex-1">{panelDetalle}</div>
      </div>
      <NuevoProyectoDialog open={nuevoDlg} onOpenChange={setNuevoDlg} />
    </div>
  )
}
