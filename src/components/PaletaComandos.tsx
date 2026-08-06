import { useApp } from '@/store'
import { toast } from 'sonner'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Star, ListTodo, StickyNote, Briefcase, BarChart3, Plus, AlertTriangle, Moon, Download, FileSpreadsheet, FileText, CheckSquare, Inbox as InboxIcon, Trash2, Bookmark } from 'lucide-react'

type Vista = 'hoy' | 'inbox' | 'pendientes' | 'notas' | 'proyectos' | 'dashboard' | 'papelera'

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
  const { pendientes, notas, abrirModal, abrirPeek, setNotaActualId, crearNota, plantillas, crearPendienteDesdePlantilla } = useApp()

  const ejecutar = (fn: () => void) => { fn(); onOpenChange(false) }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput placeholder="Buscar pendientes, notas o una acción…" />
        <CommandList>
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
                {pendientes.slice(0, 200).map(p => (
                  <CommandItem key={p.id} value={p.titulo + ' ' + p.id} onSelect={() => ejecutar(() => abrirPeek(p.id))}>
                    <CheckSquare /> {p.titulo}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {notas.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Notas">
                {notas.slice(0, 200).map(n => (
                  <CommandItem key={n.id} value={n.titulo + ' ' + n.id} onSelect={() => ejecutar(() => { onIrVista('notas'); setNotaActualId(n.id) })}>
                    <FileText /> {n.titulo}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
