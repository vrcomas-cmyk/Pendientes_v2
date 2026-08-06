import { useEffect, useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { AppProvider, useApp } from '@/store'
import { columnaDe, idColumnaCompletado } from '@/lib/columnas'
import { PROYECTO_COLORES } from '@/types'
import { descargar, hoyISO, vencido, parsearLinea, fechaPorPrioridad, activo } from '@/lib/app-utils'
import { generarICS, generarMarkdown, generarHTMLImprimible } from '@/lib/exportar'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { SyncProvider, useSync, SyncBadge } from '@/sync'
import TaskModal from '@/components/TaskModal'
import PendientePeek from '@/components/PendientePeek'
import PreviaParseo from '@/components/PreviaParseo'
import AyudaAtajos from '@/components/AyudaAtajos'
import ErrorBoundary from '@/components/ErrorBoundary'
import PaletaComandos from '@/components/PaletaComandos'
import { manejarCallbackOAuth, listarCuentasGoogle, type CuentaGoogle } from '@/lib/googleCalendar'
import CuentasGoogleDialog from '@/components/CuentasGoogleDialog'
import EspacioDialog from '@/components/EspacioDialog'
import NuevoEspacioDialog from '@/components/NuevoEspacioDialog'
import ImportarCsvDialog from '@/components/ImportarCsvDialog'
import SkipLink from '@/components/SkipLink'
import { useRecordatoriosLocales } from '@/hooks/use-recordatorios-locales'
import WidgetsLayer from '@/components/widgets/WidgetsLayer'
import { WidgetsProvider, useWidgets } from '@/widgets-store'
import { WIDGET_DEFAULTS, type WidgetTipo } from '@/lib/widgets'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import AjustesDialog from '@/components/AjustesDialog'
import { aplicarAcento, leerAcento } from '@/lib/tema'
import PendientesView from '@/views/PendientesView'
import NotesView from '@/views/NotesView'
import ProyectosView from '@/views/ProyectosView'
import PapeleraView from '@/views/PapeleraView'
import InboxView from '@/views/InboxView'
import { TodayView, DashboardView } from '@/views/OtherViews'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Star, ListTodo, BarChart3, StickyNote, Briefcase, Inbox as InboxIcon,
  Plus, Moon, Sun, Download, Upload, FileSpreadsheet, AlertTriangle, User, MoreVertical, LogOut, LogIn, HelpCircle, CalendarClock, Users, Settings2, Trash2, Search, LayoutGrid, Timer, Columns3, PenLine, ArrowRightCircle, FileText,
} from 'lucide-react'

const LS_VISTA = 'pn_vista'
const VISTAS_VALIDAS = ['hoy', 'inbox', 'pendientes', 'notas', 'proyectos', 'dashboard', 'papelera'] as const

type Vista = 'hoy' | 'inbox' | 'pendientes' | 'notas' | 'proyectos' | 'dashboard' | 'papelera'

const VISTAS: { id: Vista; label: string; corto: string; icon: React.ReactNode }[] = [
  { id: 'hoy', label: 'Hoy', corto: 'Hoy', icon: <Star size={18} /> },
  { id: 'inbox', label: 'Inbox', corto: 'Inbox', icon: <InboxIcon size={18} /> },
  { id: 'pendientes', label: 'Pendientes', corto: 'Tareas', icon: <ListTodo size={18} /> },
  { id: 'notas', label: 'Notas', corto: 'Notas', icon: <StickyNote size={18} /> },
  { id: 'proyectos', label: 'Proyectos', corto: 'Proyectos', icon: <Briefcase size={18} /> },
  { id: 'dashboard', label: 'Panel', corto: 'Panel', icon: <BarChart3 size={18} /> },
  { id: 'papelera', label: 'Papelera', corto: 'Papelera', icon: <Trash2 size={18} /> },
]

const WIDGET_ICONOS: Record<WidgetTipo, React.ReactNode> = {
  pomodoro: <Timer size={14} />,
  kanban: <Columns3 size={14} />,
  'nota-rapida': <PenLine size={14} />,
  'proxima-tarea': <ArrowRightCircle size={14} />,
}

function Shell() {
  const app = useApp()
  const { pendientes, notas, proyectos, eventos, usuario, setUsuario, crearPendiente, crearNota, abrirModal, reemplazarTodo, notaActualId, setNotaActualId, proyectoAbiertoId, setProyectoAbiertoId, setFiltroFecha, espacios, espacioActualId, setEspacioActualId, filtrosGuardados, setFiltroActivoId } = app
  const sync = useSync()
  const { abrirWidget } = useWidgets()
  const isMobile = useIsMobile()
  const [vista, setVistaState] = useState<Vista>(() => {
    try { const v = localStorage.getItem(LS_VISTA); if (v && (VISTAS_VALIDAS as readonly string[]).includes(v)) return v as Vista } catch { /* noop */ }
    return 'hoy'
  })
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [nombreDlg, setNombreDlg] = useState(false)
  const [nombreVal, setNombreVal] = useState('')
  const [importDlg, setImportDlg] = useState(false)
  const [ayudaAbierta, setAyudaAbierta] = useState(false)
  const [paletaAbierta, setPaletaAbierta] = useState(false)
  const [cuentasGoogle, setCuentasGoogle] = useState<CuentaGoogle[]>([])
  const [cuentasGoogleDlg, setCuentasGoogleDlg] = useState(false)
  const [espacioDlg, setEspacioDlg] = useState(false)
  const [nuevoEspacioDlg, setNuevoEspacioDlg] = useState(false)
  const [importarCsvDlg, setImportarCsvDlg] = useState(false)
  const [ajustesDlg, setAjustesDlg] = useState(false)
  const [quickTexto, setQuickTexto] = useState('')
  const [fabAbierto, setFabAbierto] = useState(false)
  const quickRef = useRef<HTMLInputElement>(null)
  const quickMovilRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const importPendiente = useRef<{ pendientes: unknown[]; notas: unknown[]; usuario?: string } | null>(null)

  const abrirNombreDlg = () => { setNombreVal(usuario); setNombreDlg(true) }
  const confirmarNombre = () => { const n = nombreVal.trim(); if (n) setUsuario(n); setNombreDlg(false) }

  const setVista = (v: Vista) => {
    // Al tocar "Notas"/"Proyectos" en la navegación, siempre mostrar la lista (no un detalle abierto)
    if (v === 'notas') setNotaActualId(null)
    if (v === 'proyectos') setProyectoAbiertoId(null)
    setVistaState(v)
    try { localStorage.setItem(LS_VISTA, v) } catch { /* noop */ }
  }

  const verVencidos = () => { setNotaActualId(null); setVista('pendientes'); setFiltroFecha('vencidos') }

  // notaActualId/proyectoAbiertoId son globales: así una tarjeta de "Hoy" puede abrir directamente
  // una nota o un proyecto sin que la vista deba conocer el detalle de cómo se navega.
  const vistaMostrada: Vista = notaActualId ? 'notas' : proyectoAbiertoId ? 'proyectos' : vista

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const editando = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable
      if (e.key === '?' && !editando) { e.preventDefault(); setAyudaAbierta(true); return }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletaAbierta(v => !v); return }
      if (editando) return
      if (e.key.toLowerCase() === 'n' && e.shiftKey) { e.preventDefault(); crearNota(); return }
      if (e.key.toLowerCase() === 'n') { e.preventDefault(); abrirModal() }
      if (e.key === '/') { e.preventDefault(); quickRef.current?.focus() }
      if (e.key === 'Escape') { if (notaActualId) setNotaActualId(null); else if (proyectoAbiertoId) setProyectoAbiertoId(null) }
      if (e.ctrlKey && e.shiftKey && ['1', '2', '3', '4'].includes(e.key)) {
        // Filtros guardados (Fase 8.3): NO son los dígitos sueltos 6-9 que el plan original
        // reservaba — esos ya los usa la navegación de vistas (hoy son 7, no 5). Ver types.ts.
        const filtro = filtrosGuardados.find(f => f.atajo === e.key)
        if (filtro) { e.preventDefault(); setVista('pendientes'); setFiltroActivoId(filtro.id) }
        return
      }
      if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) { e.preventDefault(); setVista(VISTAS_VALIDAS[Number(e.key) - 1] as Vista) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [abrirModal, crearNota, notaActualId, proyectoAbiertoId, filtrosGuardados, setFiltroActivoId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tema: si el usuario ya eligió explícitamente (toggleDark guardó 'darkMode'), se respeta.
  // Si nunca lo tocó, la app sigue el tema del sistema operativo en vivo.
  useEffect(() => {
    let elegidoManual: string | null = null
    try { elegidoManual = localStorage.getItem('darkMode') } catch { /* noop */ }
    if (elegidoManual !== null) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const aplicar = (d: boolean) => { document.documentElement.classList.toggle('dark', d); setDark(d) }
    const onChange = (e: MediaQueryListEvent) => aplicar(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggleDark = () => {
    const d = document.documentElement.classList.toggle('dark')
    setDark(d)
    try { localStorage.setItem('darkMode', String(d)) } catch { /* noop */ }
  }

  // Re-aplica el color de acento elegido en Ajustes cada vez que cambia el tema: una variable CSS
  // puesta inline (ver `aplicarAcento`) no sigue la cascada de `.dark`, así que hay que recalcularla
  // nosotros mismos en cada cambio (incluido el montaje inicial).
  useEffect(() => { aplicarAcento(leerAcento(), dark) }, [dark])

  // Conexión con Google Calendar: requiere sesión sincronizada (la Edge Function identifica
  // al usuario por su JWT de Supabase). Al volver del consentimiento de Google, la URL trae
  // `?code=...`; se intercambia una sola vez al montar. Se soportan varias cuentas conectadas
  // a la vez (espejo): por eso se recarga la lista completa tras cada cambio.
  const recargarCuentasGoogle = () => {
    listarCuentasGoogle()
      .then(r => { setCuentasGoogle(r.cuentas); if (r.error) toast.error(r.error) })
      .catch(() => setCuentasGoogle([]))
  }

  useEffect(() => {
    let vivo = true
    if (sync.modoLocal) { Promise.resolve().then(() => { if (vivo) setCuentasGoogle([]) }); return () => { vivo = false } }
    // Espera a que se resuelva el espacio de trabajo (se crea/lee al iniciar sesión, en sync.tsx):
    // si se consulta Google Calendar antes, la Edge Function todavía no encuentra membresía y
    // devuelve error de forma transitoria.
    if (!sync.espacioId) return () => { vivo = false }
    manejarCallbackOAuth()
      .then(r => { if (r) toast.success('Google Calendar conectado: ' + r.email) })
      .catch(err => toast.error(err instanceof Error ? err.message : 'No se pudo conectar con Google Calendar'))
      .finally(() => { listarCuentasGoogle().then(s => { if (vivo) { setCuentasGoogle(s.cuentas); if (s.error) toast.error(s.error) } }) })
    return () => { vivo = false }
  }, [sync.modoLocal, sync.espacioId])

  const quickAdd = () => {
    const txt0 = quickTexto.trim()
    if (!txt0) return
    const etiquetasHash: string[] = []
    const txt = txt0.replace(/#(\S+)/g, (_m, p: string) => { etiquetasHash.push(p); return '' })
    const parsed = parsearLinea('- ' + txt) // reusa la misma sintaxis de las notas (@ ! > *)
    if (!parsed) { toast.error('No se entendió el texto. Revisa la sintaxis con "?"'); return }
    const prioridad = parsed.prioridad || 'Media'
    const nombreProyecto = etiquetasHash[0] || ''
    // Si el #hashtag coincide con un proyecto gestionado existente, hereda su ruteo de espejo.
    const proyectoExistente = nombreProyecto ? proyectos.find(p => p.nombre.toLowerCase() === nombreProyecto.toLowerCase()) : null
    crearPendiente({
      titulo: parsed.titulo,
      descripcion: parsed.descripcion,
      responsable: parsed.responsable,
      prioridad,
      proyecto: nombreProyecto,
      proyectoId: proyectoExistente?.id,
      etiquetas: etiquetasHash.slice(1),
      fechaLimite: parsed.fechaLimite || fechaPorPrioridad(prioridad),
      repetir: parsed.repetir,
    })
    setQuickTexto('')
    toast.success('Pendiente creado')
  }

  const exportarJSON = () => descargar('pendientes_notas_' + hoyISO() + '.json', JSON.stringify({ pendientes, notas, usuario }, null, 2), 'application/json')
  const exportarCSV = () => {
    const cab = ['Titulo', 'Solicitante', 'Responsable', 'Prioridad', 'Estado', 'FechaLimite', 'Proyecto', 'Subtareas', 'Descripcion']
    const filas = pendientes.map(p => [
      p.titulo, p.solicitante, p.responsable, p.prioridad, columnaDe(app.columnas, p.estado).nombre, p.fechaLimite, p.proyecto,
      p.subtareas.map(s => (s.completada ? '[x] ' : '[ ] ') + s.texto).join(' | '),
      (p.descripcion || '').replace(/\n/g, ' '),
    ].map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    descargar('pendientes_' + hoyISO() + '.csv', '\uFEFF' + [cab.join(','), ...filas].join('\n'), 'text/csv')
  }
  const exportarICS = () => descargar('pendientes_' + hoyISO() + '.ics', generarICS(pendientes, eventos), 'text/calendar')
  const exportarMarkdown = () => descargar('pendientes_' + hoyISO() + '.md', generarMarkdown(pendientes, notas, proyectos), 'text/markdown')
  const exportarHTML = () => descargar('pendientes_' + hoyISO() + '.html', generarHTMLImprimible(pendientes, proyectos), 'text/html')
  const importarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => {
      try {
        const d = JSON.parse(String(ev.target?.result))
        importPendiente.current = { pendientes: d.pendientes || [], notas: d.notas || [], usuario: d.usuario }
        setImportDlg(true)
      } catch { toast.error('Archivo inválido') }
    }
    r.readAsText(f)
    e.target.value = ''
  }
  const confirmarImportacion = () => {
    const d = importPendiente.current
    setImportDlg(false)
    if (!d) return
    reemplazarTodo(d.pendientes as Parameters<typeof reemplazarTodo>[0], d.notas as Parameters<typeof reemplazarTodo>[1], d.usuario)
    toast.success('Datos importados')
  }

  const idCompletado = idColumnaCompletado(app.columnas)
  useRecordatoriosLocales(pendientes, idCompletado)
  const nVencidos = pendientes.filter(p => vencido(p, idCompletado)).length
  const nAbiertos = pendientes.filter(p => p.estado !== idCompletado).length
  const nInbox = pendientes.filter(p => activo(p) && !p.fechaLimite && p.estado !== idCompletado).length

  const vistaActual = (
    <>
      {vistaMostrada === 'hoy' && <TodayView />}
      {vistaMostrada === 'inbox' && <InboxView />}
      {vistaMostrada === 'pendientes' && <PendientesView />}
      {vistaMostrada === 'notas' && <NotesView />}
      {vistaMostrada === 'proyectos' && <ProyectosView />}
      {vistaMostrada === 'dashboard' && <DashboardView />}
      {vistaMostrada === 'papelera' && <PapeleraView />}
    </>
  )

  const inputImport = <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importarJSON} />

  // Dock de accesos rápidos (solo escritorio): fila fija de acciones frecuentes, glass. Sustituye
  // al FAB en desktop porque con sidebar permanente ya hay espacio para mostrarlo siempre visible
  // en vez de esconderlo detrás de un toggle — "menos clics" (ver Cambios.md).
  const dockEscritorio = (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center">
      <div className="glass flex items-center gap-1 rounded-full p-1.5 shadow-glass">
        <button onClick={() => crearNota()} title="Nueva nota (Shift+N)"
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors duration-150 hover:bg-accent">
          <StickyNote size={15} className="text-primary" /> Nota
        </button>
        <button onClick={() => abrirModal()} title="Nuevo pendiente (N)"
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors duration-150 hover:bg-accent">
          <ListTodo size={15} className="text-primary" /> Pendiente
        </button>
        <button onClick={() => setPaletaAbierta(true)} title="Buscar (Ctrl+K)"
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors duration-150 hover:bg-accent">
          <Search size={15} className="text-primary" /> Buscar
        </button>
        <div className="mx-0.5 h-5 w-px bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button title="Añadir widget" className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors duration-150 hover:bg-accent">
              <LayoutGrid size={15} className="text-primary" /> Widgets
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {(Object.keys(WIDGET_DEFAULTS) as WidgetTipo[]).map(tipo => (
              <DropdownMenuItem key={tipo} onClick={() => abrirWidget(tipo)}>
                {WIDGET_ICONOS[tipo]} <span className="ml-2">{WIDGET_DEFAULTS[tipo].titulo}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  // Captura universal: crear pendiente o nota desde CUALQUIER vista, no solo desde el header de
  // escritorio (que solo crea pendientes) o el FAB móvil (que antes se ocultaba en Notas).
  const fabCaptura = (
    <>
      {fabAbierto && <div className="fixed inset-0 z-30" onClick={() => setFabAbierto(false)} />}
      <div className={'fixed z-40 flex flex-col items-end gap-2 ' + (isMobile ? 'bottom-20 right-4' : 'bottom-6 right-6')}>
        {fabAbierto && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 motion-reduce:animate-none">
            <button onClick={() => { setFabAbierto(false); crearNota() }}
              className="flex items-center gap-2 rounded-full border bg-card py-1.5 pl-3.5 pr-1.5 text-sm shadow-lg transition-transform hover:-translate-y-0.5">
              Nueva nota
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><StickyNote size={15} /></span>
            </button>
            <button onClick={() => { setFabAbierto(false); abrirModal() }}
              className="flex items-center gap-2 rounded-full border bg-card py-1.5 pl-3.5 pr-1.5 text-sm shadow-lg transition-transform hover:-translate-y-0.5">
              Nuevo pendiente
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><ListTodo size={15} /></span>
            </button>
          </div>
        )}
        <button onClick={() => setFabAbierto(v => !v)} aria-label="Crear pendiente o nota" aria-expanded={fabAbierto}
          className={'flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95 ' +
            (isMobile ? 'h-14 w-14' : 'h-12 w-12') + (fabAbierto ? ' rotate-45' : '')}>
          <Plus size={isMobile ? 26 : 22} />
        </button>
      </div>
    </>
  )

  const dialogosGlobales = (
    <>
      <Dialog open={nombreDlg} onOpenChange={setNombreDlg}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="text-base">Tu nombre</DialogTitle></DialogHeader>
          <Input autoFocus value={nombreVal} onChange={e => setNombreVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmarNombre() } }} placeholder="Tu nombre" />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNombreDlg(false)}>Cancelar</Button>
            <Button onClick={confirmarNombre}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={importDlg} onOpenChange={setImportDlg}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="text-base">Importar datos</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esto reemplazará tus pendientes y notas actuales. ¿Continuar?</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setImportDlg(false)}>Cancelar</Button>
            <Button onClick={confirmarImportacion}>Reemplazar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AyudaAtajos open={ayudaAbierta} onOpenChange={setAyudaAbierta} />
      <CuentasGoogleDialog open={cuentasGoogleDlg} onOpenChange={setCuentasGoogleDlg} cuentas={cuentasGoogle} onCambio={recargarCuentasGoogle} />
      <EspacioDialog open={espacioDlg} onOpenChange={setEspacioDlg} />
      <NuevoEspacioDialog open={nuevoEspacioDlg} onOpenChange={setNuevoEspacioDlg} />
      <ImportarCsvDialog open={importarCsvDlg} onOpenChange={setImportarCsvDlg} />
      <AjustesDialog open={ajustesDlg} onOpenChange={setAjustesDlg} dark={dark} toggleDark={toggleDark} onIrTablero={() => { setVista('pendientes') }} />
      <PaletaComandos open={paletaAbierta} onOpenChange={setPaletaAbierta}
        onIrVista={setVista} onAlternarTema={toggleDark} onExportarJSON={exportarJSON} onExportarCSV={exportarCSV} onVerVencidos={verVencidos} />
    </>
  )

  /* ===================== MÓVIL ===================== */
  if (isMobile) {
    const tituloVista = VISTAS.find(v => v.id === vistaMostrada)?.label || ''
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <SkipLink />
        {/* Header compacto */}
        <header className="relative flex shrink-0 items-center gap-2 border-b bg-card px-3 py-2.5 shadow-sm">
          <span className="text-base font-bold">{tituloVista}</span>
          {nVencidos > 0 && (
            <button onClick={verVencidos}
              className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
              {nVencidos} vencidos
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setAyudaAbierta(true)} aria-label="Ayuda y atajos" className="rounded-md p-2 hover:bg-accent"><HelpCircle size={16} /></button>
            <button onClick={toggleDark} aria-label="Cambiar tema" className="rounded-md p-2 hover:bg-accent">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button onClick={() => setMenuAbierto(v => !v)} aria-label="Más opciones" className="rounded-md p-2 hover:bg-accent"><MoreVertical size={16} /></button>
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
                    <button onClick={() => { setMenuAbierto(false); setCuentasGoogleDlg(true) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent">
                      <CalendarClock size={15} /> Google Calendar{cuentasGoogle.length ? ` (${cuentasGoogle.length})` : ''}
                    </button>
                    <button onClick={() => { setMenuAbierto(false); setEspacioDlg(true) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent">
                      <Users size={15} /> Cuentas vinculadas{sync.miembros.length > 1 ? ` (${sync.miembros.length})` : ''}
                    </button>
                  </>
                )}
                <div className="border-t" />
                <button onClick={() => { setMenuAbierto(false); setAjustesDlg(true) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><Settings2 size={15} /> Ajustes</button>
                <button onClick={() => { setMenuAbierto(false); abrirNombreDlg() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><User size={15} /> Nombre: {usuario}</button>
                <div className="border-t" />
                <button onClick={() => { setMenuAbierto(false); exportarJSON() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><Download size={15} /> Exportar JSON</button>
                <button onClick={() => { setMenuAbierto(false); exportarCSV() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><FileSpreadsheet size={15} /> Exportar CSV</button>
                <button onClick={() => { setMenuAbierto(false); exportarICS() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><CalendarClock size={15} /> Exportar calendario (.ics)</button>
                <button onClick={() => { setMenuAbierto(false); exportarMarkdown() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><FileText size={15} /> Exportar Markdown</button>
                <button onClick={() => { setMenuAbierto(false); exportarHTML() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><FileText size={15} /> Exportar HTML imprimible</button>
                <button onClick={() => { setMenuAbierto(false); fileRef.current?.click() }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><Upload size={15} /> Importar JSON</button>
                <button onClick={() => { setMenuAbierto(false); setImportarCsvDlg(true) }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"><Upload size={15} /> Importar CSV / Todoist</button>
              </div>
            </>
          )}
        </header>

        {vistaMostrada !== 'notas' && (
          <div className="shrink-0 space-y-1 border-b bg-card px-3 py-2">
            <input ref={quickMovilRef} value={quickTexto} onChange={e => setQuickTexto(e.target.value)}
              placeholder='Captura rápida: "cotización !alta @Liz mañana"'
              onKeyDown={e => { if (e.key === 'Enter') quickAdd() }}
              className="w-full rounded-full border bg-muted/60 px-4 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary" />
            <PreviaParseo texto={quickTexto} />
          </div>
        )}

        <main id="main-content" tabIndex={-1} className="relative min-h-0 flex-1 overflow-auto p-3 scroll-thin outline-none">
          <div key={vistaMostrada} className="animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">{vistaActual}</div>
        </main>
        {fabCaptura}

        {/* Barra inferior de vistas */}
        <nav className="grid shrink-0 grid-cols-7 border-t bg-card">
          {VISTAS.map(v => (
            <button key={v.id} onClick={() => setVista(v.id)} aria-current={vistaMostrada === v.id ? 'page' : undefined}
              className={'flex flex-col items-center gap-0.5 py-2 text-[10px] ' + (vistaMostrada === v.id ? 'text-primary' : 'text-muted-foreground')}>
              {v.icon}
              <span>{v.corto}</span>
            </button>
          ))}
        </nav>
        {inputImport}
        <TaskModal />
        <PendientePeek />
        {dialogosGlobales}
        <Toaster position="top-center" richColors />
      </div>
    )
  }

  /* ===================== ESCRITORIO ===================== */
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <SkipLink />
      <nav className="z-30 flex w-60 shrink-0 flex-col overflow-hidden border-r bg-card/80 shadow-soft backdrop-blur-xl">
        <div className="p-2.5">
          <h1 className="px-1.5 pb-2 text-sm font-bold">Pendientes <span className="text-primary">Pro</span></h1>
          <button onClick={() => abrirModal()} title="Nuevo pendiente (N)"
            className="flex w-full items-center gap-3 rounded-full bg-primary px-3.5 py-2.5 text-primary-foreground shadow-sm transition-transform duration-150 ease-spring hover:-translate-y-px hover:opacity-90">
            <Plus size={18} className="w-5 shrink-0" />
            <span className="whitespace-nowrap text-sm font-semibold">Nuevo pendiente</span>
          </button>
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 scroll-thin">
          {VISTAS.map(v => (
            <button key={v.id} onClick={() => setVista(v.id)} aria-current={vistaMostrada === v.id ? 'page' : undefined}
              className={'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ' + (vistaMostrada === v.id ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-accent')}>
              <span className="w-5 shrink-0">{v.icon}</span>
              <span className="flex-1 whitespace-nowrap text-left">{v.label}</span>
              {v.id === 'pendientes' && nAbiertos > 0 && (
                <span className="whitespace-nowrap rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">{nAbiertos}</span>
              )}
              {v.id === 'inbox' && nInbox > 0 && (
                <span className="whitespace-nowrap rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">{nInbox}</span>
              )}
            </button>
          ))}
          <div className="my-2 border-t" />
          <button onClick={verVencidos}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent">
            <AlertTriangle size={16} className="w-5 shrink-0 text-red-500" />
            <span className="flex-1 whitespace-nowrap text-left">Vencidos</span>
            {nVencidos > 0 && <span className="whitespace-nowrap rounded-full bg-red-100 px-1.5 text-[10px] text-red-700 dark:bg-red-900/40 dark:text-red-300">{nVencidos}</span>}
          </button>
          <button onClick={() => setAjustesDlg(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent">
            <Settings2 size={16} className="w-5 shrink-0 text-muted-foreground" />
            <span className="flex-1 whitespace-nowrap text-left">Ajustes</span>
          </button>

          <div className="my-2 border-t" />
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Espacios</span>
            <button onClick={() => setNuevoEspacioDlg(true)} title="Nuevo espacio" aria-label="Nuevo espacio"
              className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"><Plus size={13} /></button>
          </div>
          <button onClick={() => setEspacioActualId(null)}
            className={'flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm ' + (espacioActualId === null ? 'bg-accent font-semibold' : 'hover:bg-accent')}>
            <span className="w-5 shrink-0 text-center">📋</span>
            <span className="flex-1 whitespace-nowrap text-left">Todos</span>
          </button>
          {espacios.map(e => (
            <button key={e.id} onClick={() => setEspacioActualId(e.id)}
              className={'flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm ' + (espacioActualId === e.id ? 'bg-accent font-semibold' : 'hover:bg-accent')}>
              <span className="w-5 shrink-0 text-center">{e.icono}</span>
              <span className="flex-1 truncate text-left">{e.nombre}</span>
              <span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + (PROYECTO_COLORES[e.color]?.dot || '')} />
            </button>
          ))}
          {!espacios.length && (
            <button onClick={() => setNuevoEspacioDlg(true)} className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent">
              + Crea tu primer espacio
            </button>
          )}
        </div>
        <div className="space-y-0.5 border-t p-1.5">
          <button onClick={exportarJSON} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"><Download size={16} className="w-5 shrink-0" /><span className="whitespace-nowrap">Exportar JSON</span></button>
          <button onClick={exportarCSV} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"><FileSpreadsheet size={16} className="w-5 shrink-0" /><span className="whitespace-nowrap">Exportar CSV</span></button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"><FileText size={16} className="w-5 shrink-0" /><span className="whitespace-nowrap">Más formatos…</span></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-48">
              <DropdownMenuItem onClick={exportarICS}><CalendarClock size={13} className="mr-2" /> Calendario (.ics)</DropdownMenuItem>
              <DropdownMenuItem onClick={exportarMarkdown}><FileText size={13} className="mr-2" /> Markdown (.md)</DropdownMenuItem>
              <DropdownMenuItem onClick={exportarHTML}><FileText size={13} className="mr-2" /> HTML imprimible</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"><Upload size={16} className="w-5 shrink-0" /><span className="whitespace-nowrap">Importar JSON</span></button>
          <button onClick={() => setImportarCsvDlg(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent"><Upload size={16} className="w-5 shrink-0" /><span className="whitespace-nowrap">Importar CSV / Todoist</span></button>
          {inputImport}
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-3 border-b bg-card px-4 py-2 shadow-sm">
          <div className="max-w-2xl flex-1 space-y-1">
            <input ref={quickRef} value={quickTexto} onChange={e => setQuickTexto(e.target.value)}
              placeholder='Captura rápida ( / ):  "cotización Soriana !alta @Liz mañana"'
              onKeyDown={e => { if (e.key === 'Enter') quickAdd() }}
              className="w-full rounded-full border bg-muted/60 px-4 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary" />
            <PreviaParseo texto={quickTexto} />
          </div>
          <button onClick={() => setAyudaAbierta(true)} title="Ayuda y atajos (?)" aria-label="Ayuda y atajos" className="rounded-md bg-muted p-1.5"><HelpCircle size={14} /></button>
          <button onClick={toggleDark} title="Modo oscuro" aria-label="Cambiar tema" className="rounded-md bg-muted p-1.5">{dark ? <Sun size={14} /> : <Moon size={14} />}</button>
          <SyncBadge />
          {!sync.modoLocal && (
            <button onClick={() => setCuentasGoogleDlg(true)} className="flex items-center gap-1 whitespace-nowrap text-xs font-medium hover:underline">
              <CalendarClock size={13} /> {cuentasGoogle.length ? `Calendar (${cuentasGoogle.length})` : 'Conectar Calendar'}
            </button>
          )}
          {sync.modoLocal ? (
            <button onClick={sync.activarSync} className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-primary hover:underline"><LogIn size={13} /> Sincronizar</button>
          ) : (
            <button onClick={sync.logout} title={sync.email || ''} className="flex items-center gap-1 whitespace-nowrap text-xs font-medium hover:underline"><LogOut size={13} /> Salir</button>
          )}
          <button onClick={abrirNombreDlg}
            className="flex items-center gap-1 whitespace-nowrap text-xs font-medium hover:underline"><User size={13} /> {usuario}</button>
        </div>

        <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-auto p-4 pb-24 scroll-thin outline-none">
          <div key={vistaMostrada} className="animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">{vistaActual}</div>
        </main>
      </div>

      {dockEscritorio}
      <WidgetsLayer />
      <TaskModal />
      <PendientePeek />
      {dialogosGlobales}
      <Toaster position="bottom-right" richColors />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <SyncProvider>
          <WidgetsProvider>
            <Shell />
          </WidgetsProvider>
        </SyncProvider>
      </AppProvider>
    </ErrorBoundary>
  )
}
