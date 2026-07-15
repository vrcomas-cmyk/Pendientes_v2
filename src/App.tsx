import { useEffect, useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { AppProvider, useApp } from '@/store'
import { ESTADOS } from '@/types'
import { descargar, hoyISO, vencido, parsearLinea, fechaPorPrioridad } from '@/lib/app-utils'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { SyncProvider, useSync, SyncBadge } from '@/sync'
import TaskModal from '@/components/TaskModal'
import PendientesView from '@/views/PendientesView'
import NotesView from '@/views/NotesView'
import { TodayView, DashboardView } from '@/views/OtherViews'
import {
  Star, ListTodo, BarChart3, StickyNote,
  Plus, Moon, Sun, Download, Upload, FileSpreadsheet, AlertTriangle, User, MoreVertical, LogOut, LogIn,
} from 'lucide-react'

type Vista = 'hoy' | 'pendientes' | 'notas' | 'dashboard'

const VISTAS: { id: Vista; label: string; corto: string; icon: React.ReactNode }[] = [
  { id: 'hoy', label: 'Hoy', corto: 'Hoy', icon: <Star size={18} /> },
  { id: 'pendientes', label: 'Pendientes', corto: 'Tareas', icon: <ListTodo size={18} /> },
  { id: 'notas', label: 'Notas', corto: 'Notas', icon: <StickyNote size={18} /> },
  { id: 'dashboard', label: 'Panel', corto: 'Panel', icon: <BarChart3 size={18} /> },
]

function Shell() {
  const app = useApp()
  const { pendientes, notas, usuario, setUsuario, crearPendiente, abrirModal, reemplazarTodo, notaActualId, setNotaActualId } = app
  const sync = useSync()
  const isMobile = useIsMobile()
  const [vista, setVistaState] = useState<Vista>('hoy')
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [menuAbierto, setMenuAbierto] = useState(false)
  const quickRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const setVista = (v: Vista) => {
    // Al tocar "Notas" en la navegación, siempre mostrar la lista (no una nota abierta)
    if (v === 'notas') setNotaActualId(null)
    setVistaState(v)
  }

  useEffect(() => { if (notaActualId && vista !== 'notas') setVistaState('notas') }, [notaActualId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const editando = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable
      if (editando) return
      if (e.key.toLowerCase() === 'n') { e.preventDefault(); abrirModal() }
      if (e.key === '/') { e.preventDefault(); quickRef.current?.focus() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [abrirModal])

  const toggleDark = () => {
    const d = document.documentElement.classList.toggle('dark')
    setDark(d)
    try { localStorage.setItem('darkMode', String(d)) } catch { /* noop */ }
  }

  const quickAdd = () => {
    const inp = quickRef.current
    if (!inp) return
    let txt = inp.value.trim()
    if (!txt) return
    let proyecto = ''
    txt = txt.replace(/#(\S+)/, (_m, p: string) => { proyecto = p; return '' })
    const parsed = parsearLinea('- ' + txt) // reusa la misma sintaxis de las notas (@ ! >)
    if (!parsed) return
    const prioridad = parsed.prioridad || 'Media'
    crearPendiente({
      titulo: parsed.titulo,
      descripcion: parsed.descripcion,
      responsable: parsed.responsable,
      prioridad,
      proyecto,
      fechaLimite: parsed.fechaLimite || fechaPorPrioridad(prioridad),
    })
    inp.value = ''
    toast.success('Pendiente creado')
  }

  const exportarJSON = () => descargar('pendientes_notas_' + hoyISO() + '.json', JSON.stringify({ pendientes, notas, usuario }, null, 2), 'application/json')
  const exportarCSV = () => {
    const cab = ['Titulo', 'Solicitante', 'Responsable', 'Prioridad', 'Estado', 'FechaLimite', 'Proyecto', 'Subtareas', 'Descripcion']
    const filas = pendientes.map(p => [
      p.titulo, p.solicitante, p.responsable, p.prioridad, ESTADOS[p.estado].label, p.fechaLimite, p.proyecto,
      p.subtareas.map(s => (s.completada ? '[x] ' : '[ ] ') + s.texto).join(' | '),
      (p.descripcion || '').replace(/\n/g, ' '),
    ].map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    descargar('pendientes_' + hoyISO() + '.csv', '\uFEFF' + [cab.join(','), ...filas].join('\n'), 'text/csv')
  }
  const importarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => {
      try {
        const d = JSON.parse(String(ev.target?.result))
        if (!confirm('Esto reemplazará tus datos actuales. ¿Continuar?')) return
        reemplazarTodo(d.pendientes || [], d.notas || [], d.usuario)
        toast.success('Datos importados')
      } catch { toast.error('Archivo inválido') }
    }
    r.readAsText(f)
    e.target.value = ''
  }

  const nVencidos = pendientes.filter(vencido).length
  const nAbiertos = pendientes.filter(p => p.estado !== 'completado').length

  const vistaActual = (
    <>
      {vista === 'hoy' && <TodayView />}
      {vista === 'pendientes' && <PendientesView />}
      {vista === 'notas' && <NotesView />}
      {vista === 'dashboard' && <DashboardView />}
    </>
  )

  const inputImport = <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importarJSON} />

  /* ===================== MÓVIL ===================== */
  if (isMobile) {
    const tituloVista = VISTAS.find(v => v.id === vista)?.label || ''
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        {/* Header compacto */}
        <header className="relative flex shrink-0 items-center gap-2 border-b bg-card px-3 py-2.5 shadow-sm">
          <span className="text-base font-bold">{tituloVista}</span>
          {vista === 'pendientes' && nVencidos > 0 && (
            <button onClick={() => { setVista('pendientes') }}
              className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
              {nVencidos} vencidos
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={toggleDark} className="rounded-md p-2 hover:bg-accent">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button onClick={() => setMenuAbierto(v => !v)} className="rounded-md p-2 hover:bg-accent"><MoreVertical size={16} /></button>
          </div>
          {menuAbierto && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuAbierto(false)} />
              <div className="absolute right-2 top-12 z-50 w-56 overflow-hidden rounded-xl border bg-card shadow-xl">
                <div className="px-3 py-2"><SyncBadge /></div>
                {sync.modoLocal ? (
                  <button onClick={() => { setMenuAbierto(false); sync.activarSync() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><LogIn size={15} /> Iniciar sesión / sincronizar</button>
                ) : (
                  <>
                    <div className="truncate px-3 pb-1 text-[11px] text-muted-foreground">{sync.email}</div>
                    <button onClick={() => { setMenuAbierto(false); sync.sincronizarAhora() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><User size={15} /> Sincronizar ahora</button>
                    <button onClick={() => { setMenuAbierto(false); sync.logout() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><LogOut size={15} /> Cerrar sesión</button>
                  </>
                )}
                <div className="border-t" />
                <button onClick={() => { setMenuAbierto(false); const n = prompt('Tu nombre:', usuario); if (n?.trim()) setUsuario(n.trim()) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><User size={15} /> Nombre: {usuario}</button>
                <div className="border-t" />
                <button onClick={() => { setMenuAbierto(false); exportarJSON() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><Download size={15} /> Exportar JSON</button>
                <button onClick={() => { setMenuAbierto(false); exportarCSV() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><FileSpreadsheet size={15} /> Exportar CSV</button>
                <button onClick={() => { setMenuAbierto(false); fileRef.current?.click() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><Upload size={15} /> Importar JSON</button>
              </div>
            </>
          )}
        </header>

        <main className="relative min-h-0 flex-1 overflow-auto p-3 scroll-thin">
          {vistaActual}
          {/* FAB nuevo pendiente (oculto en Notas, que tiene su propio botón) */}
          {vista !== 'notas' && (
            <button onClick={() => abrirModal()} aria-label="Nuevo pendiente"
              className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95">
              <Plus size={26} />
            </button>
          )}
        </main>

        {/* Barra inferior de vistas */}
        <nav className="grid shrink-0 grid-cols-6 border-t bg-card">
          {VISTAS.map(v => (
            <button key={v.id} onClick={() => setVista(v.id)}
              className={'flex flex-col items-center gap-0.5 py-2 text-[10px] ' + (vista === v.id ? 'text-primary' : 'text-muted-foreground')}>
              {v.icon}
              <span>{v.corto}</span>
            </button>
          ))}
        </nav>
        {inputImport}
        <TaskModal />
        <Toaster position="top-center" richColors />
      </div>
    )
  }

  /* ===================== ESCRITORIO ===================== */
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <nav className="group/rail z-30 flex w-14 shrink-0 flex-col overflow-hidden border-r bg-card transition-[width] duration-200 hover:w-56 hover:shadow-xl">
        <div className="p-2">
          <button onClick={() => abrirModal()} title="Nuevo pendiente (N)"
            className="flex w-full items-center gap-3 rounded-full bg-primary px-2.5 py-2.5 text-primary-foreground shadow-sm hover:opacity-90">
            <Plus size={18} className="w-5 shrink-0" />
            <span className="whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity group-hover/rail:opacity-100">Nuevo pendiente</span>
          </button>
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-1 scroll-thin">
          {VISTAS.map(v => (
            <button key={v.id} onClick={() => setVista(v.id)}
              className={'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm ' + (vista === v.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
              <span className="w-5 shrink-0">{v.icon}</span>
              <span className="flex-1 whitespace-nowrap text-left opacity-0 transition-opacity group-hover/rail:opacity-100">{v.label}</span>
              {v.id === 'pendientes' && nAbiertos > 0 && (
                <span className="whitespace-nowrap rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover/rail:opacity-100">{nAbiertos}</span>
              )}
            </button>
          ))}
          <div className="my-2 border-t" />
          <button onClick={() => { setVista('pendientes') }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent">
            <AlertTriangle size={16} className="w-5 shrink-0 text-red-500" />
            <span className="flex-1 whitespace-nowrap text-left opacity-0 transition-opacity group-hover/rail:opacity-100">Vencidos</span>
            {nVencidos > 0 && <span className="whitespace-nowrap rounded-full bg-red-100 px-1.5 text-[10px] text-red-700 opacity-0 transition-opacity group-hover/rail:opacity-100 dark:bg-red-900/40 dark:text-red-300">{nVencidos}</span>}
          </button>
        </div>
        <div className="space-y-0.5 border-t p-1">
          <button onClick={exportarJSON} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"><Download size={16} className="w-5 shrink-0" /><span className="whitespace-nowrap opacity-0 transition-opacity group-hover/rail:opacity-100">Exportar JSON</span></button>
          <button onClick={exportarCSV} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"><FileSpreadsheet size={16} className="w-5 shrink-0" /><span className="whitespace-nowrap opacity-0 transition-opacity group-hover/rail:opacity-100">Exportar CSV</span></button>
          <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"><Upload size={16} className="w-5 shrink-0" /><span className="whitespace-nowrap opacity-0 transition-opacity group-hover/rail:opacity-100">Importar JSON</span></button>
          {inputImport}
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-3 border-b bg-card px-4 py-2 shadow-sm">
          <h1 className="hidden whitespace-nowrap text-sm font-bold md:block">Pendientes <span className="text-primary">Pro</span></h1>
          <input ref={quickRef} placeholder='Captura rápida ( / ):  "cotización Soriana !alta @Liz mañana"'
            onKeyDown={e => { if (e.key === 'Enter') quickAdd() }}
            className="max-w-2xl flex-1 rounded-full border bg-muted/60 px-4 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={toggleDark} title="Modo oscuro" className="rounded-md bg-muted p-1.5">{dark ? <Sun size={14} /> : <Moon size={14} />}</button>
          <SyncBadge />
          {sync.modoLocal ? (
            <button onClick={sync.activarSync} className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary hover:underline"><LogIn size={13} /> Sincronizar</button>
          ) : (
            <button onClick={sync.logout} title={sync.email || ''} className="flex items-center gap-1 whitespace-nowrap text-xs font-medium hover:underline"><LogOut size={13} /> Salir</button>
          )}
          <button onClick={() => { const n = prompt('Tu nombre:', usuario); if (n?.trim()) setUsuario(n.trim()) }}
            className="flex items-center gap-1 whitespace-nowrap text-xs font-medium hover:underline"><User size={13} /> {usuario}</button>
        </div>

        <main className="min-h-0 flex-1 overflow-auto p-4 scroll-thin">{vistaActual}</main>
      </div>

      <TaskModal />
      <Toaster position="bottom-right" richColors />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <SyncProvider>
        <Shell />
      </SyncProvider>
    </AppProvider>
  )
}
