import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import { toast } from 'sonner'
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Star, ListTodo, StickyNote, Briefcase, BarChart3, Plus, AlertTriangle, Moon, Download, FileSpreadsheet, FileText, CheckSquare, Inbox as InboxIcon, Trash2, Bookmark, ChevronDown } from 'lucide-react'

type Vista = 'hoy' | 'inbox' | 'pendientes' | 'notas' | 'proyectos' | 'dashboard' | 'papelera'

const MAX_VISIBLE_ITEMS = 50

export default function PaletaComandos({
  open, onOpenChange, onIrVista, onAlternarTema, onExportarJSON, onExportarCSV, onVerVencidos,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onIrVista: (v: Vista) => void
  onAlternarTema: () => void
  onExportarJSON: () => void
  onExportarCSV: () => void
  onVerVencidos: () => void
}) {
  const { pendientes, notas, crearNota, plantillas, crearPendienteDesdePlantilla } = useApp()
  const { abrirModal, abrirPeek, setNotaActualId } = useUI()

  const [pendientesVisibles, setPendientesVisibles] = useState(MAX_VISIBLE_ITEMS)
  const [notasVisibles, setNotasVisibles] = useState(MAX_VISIBLE_ITEMS)
  const listRef = useRef<HTMLDivElement>(null)

  const ejecutar = useCallback((fn: () => void) => { fn(); onOpenChange(false) }, [onOpenChange])

  // Reset visible counts when dialog closes
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendientesVisibles(MAX_VISIBLE_ITEMS)
      setNotasVisibles(MAX_VISIBLE_ITEMS)
    }
  }, [open])

  const pendientesFiltrados = useMemo(() => pendientes.slice(0, pendientesVisibles), [pendientes, pendientesVisibles])
  const notasFiltradas = useMemo(() => notas.slice(0, notasVisibles), [notas, notasVisibles])

  const cargarMasPendientes = () => setPendientesVisibles(v => v + MAX_VISIBLE_ITEMS)
  const cargarMasNotas = () => setNotasVisibles(v => v + MAX_VISIBLE_ITEMS)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput placeholder="Buscar pendientes, notas o una acción…" />
        <CommandList ref={listRef}>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandGroup heading="Acciones">
            <CommandItem onSelect={() => ejecutar(() => abrirModal())}><Plus /> Nuevo pendiente</CommandItem>
            <CommandItem onSelect={() => ejecutar(() => crearNota())}><StickyNote /> Nueva nota</CommandItem>
            <CommandItem onSelect={() => ejecutar(onVerVencidos)}><AlertTriangle /> Ver vencidos</CommandItem>
            <CommandItem onSelect={() => ejecutar(onAlternarTema)}><Moon /> Alternar tema claro/oscuro</CommandItem>
            <CommandItem onSelect={() => ejecutar(onExportarJSON)}><Download /> Exportar JSON</CommandItem>
            <CommandItem onSelect={() => ejecutar(onExportarCSV)}><FileSpreadsheet /> Exportar CSV</CommandItem>
          </CommandGroup>
          {plantillas.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Plantillas">
                {plantillas.map(t => (
                  <CommandItem key={t.id} onSelect={() => ejecutar(() => {
                    const p = crearPendienteDesdePlantilla(t.id)
                    if (p) { abrirPeek(p.id); toast.success('Creado desde plantilla: ' + t.nombre) }
                  })}>
                    <Bookmark /> {t.nombre}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          <CommandSeparator />
          <CommandGroup heading="Ir a">
            <CommandItem onSelect={() => ejecutar(() => onIrVista('hoy'))}><Star /> Hoy</CommandItem>
            <CommandItem onSelect={() => ejecutar(() => onIrVista('inbox'))}><InboxIcon /> Inbox</CommandItem>
            <CommandItem onSelect={() => ejecutar(() => onIrVista('pendientes'))}><ListTodo /> Pendientes</CommandItem>
            <CommandItem onSelect={() => ejecutar(() => onIrVista('notas'))}><StickyNote /> Notas</CommandItem>
            <CommandItem onSelect={() => ejecutar(() => onIrVista('proyectos'))}><Briefcase /> Proyectos</CommandItem>
            <CommandItem onSelect={() => ejecutar(() => onIrVista('dashboard'))}><BarChart3 /> Panel</CommandItem>
            <CommandItem onSelect={() => ejecutar(() => onIrVista('papelera'))}><Trash2 /> Papelera</CommandItem>
          </CommandGroup>
          {pendientes.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Pendientes">
                {pendientesFiltrados.map(p => (
                  <CommandItem key={p.id} value={p.titulo + ' ' + p.id} onSelect={() => ejecutar(() => abrirPeek(p.id))}>
                    <CheckSquare /> {p.titulo}
                  </CommandItem>
                ))}
                {pendientesVisibles < pendientes.length && (
                  <CommandItem onSelect={cargarMasPendientes} className="text-muted-foreground">
                    <ChevronDown className="mr-2" /> Cargar más ({pendientes.length - pendientesVisibles} restantes)
                  </CommandItem>
                )}
              </CommandGroup>
            </>
          )}
          {notas.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Notas">
                {notasFiltradas.map(n => (
                  <CommandItem key={n.id} value={n.titulo + ' ' + n.id} onSelect={() => ejecutar(() => { onIrVista('notas'); setNotaActualId(n.id) })}>
                    <FileText /> {n.titulo}
                  </CommandItem>
                ))}
                {notasVisibles < notas.length && (
                  <CommandItem onSelect={cargarMasNotas} className="text-muted-foreground">
                    <ChevronDown className="mr-2" /> Cargar más ({notas.length - notasVisibles} restantes)
                  </CommandItem>
                )}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
