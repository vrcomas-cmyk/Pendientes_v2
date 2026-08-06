import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/store'
import { fechaPorPrioridad } from '@/lib/app-utils'
import { parsearCSV, detectarFormato, mapearFilas, type FilaImportada, type FormatoCSV } from '@/lib/importCsv'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

const NOMBRE_FORMATO: Record<FormatoCSV, string> = { propio: 'Pendientes Pro (exportado desde aquí)', todoist: 'Todoist', generico: 'Genérico (solo título, primera columna)' }

/** Diálogo de importación CSV/Todoist (Fase 8.8): muestra una vista previa de lo que se va a
    crear antes de confirmar — nunca importa a ciegas, coherente con el resto de confirmaciones
    destructivas/masivas de la app. */
export default function ImportarCsvDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { crearPendiente, proyectos } = useApp()
  const [filas, setFilas] = useState<FilaImportada[]>([])
  const [formato, setFormato] = useState<FormatoCSV>('generico')
  const fileRef = useRef<HTMLInputElement>(null)

  const elegirArchivo = () => fileRef.current?.click()

  const onArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => {
      try {
        const texto = String(ev.target?.result || '')
        const tabla = parsearCSV(texto)
        if (!tabla.length) { toast.error('El archivo está vacío'); return }
        const [headers, ...datos] = tabla
        const fmt = detectarFormato(headers)
        setFormato(fmt)
        setFilas(mapearFilas(headers, datos, fmt))
      } catch { toast.error('No se pudo leer el CSV') }
    }
    r.readAsText(f)
    e.target.value = ''
  }

  const confirmarImportacion = () => {
    filas.forEach(f => {
      const proyectoExistente = f.proyecto ? proyectos.find(p => p.nombre.toLowerCase() === f.proyecto!.toLowerCase()) : null
      crearPendiente({
        titulo: f.titulo, descripcion: f.descripcion || '', responsable: f.responsable || '', solicitante: f.solicitante || '',
        prioridad: f.prioridad, proyecto: f.proyecto || '', proyectoId: proyectoExistente?.id,
        fechaLimite: f.fechaLimite || fechaPorPrioridad(f.prioridad),
      })
    })
    toast.success(`${filas.length} pendiente(s) importado(s)`)
    setFilas([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); if (!o) setFilas([]) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="text-base">Importar CSV / Todoist</DialogTitle></DialogHeader>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onArchivo} />

        {!filas.length ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Acepta un CSV exportado desde aquí (roundtrip), un export de Todoist, o un CSV
              genérico (se usa la primera columna como título).
            </p>
            <Button onClick={elegirArchivo}><Upload size={14} className="mr-1.5" /> Elegir archivo CSV</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Formato detectado: <b>{NOMBRE_FORMATO[formato]}</b> · {filas.length} pendiente{filas.length === 1 ? '' : 's'} a crear.
            </p>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-1.5 scroll-thin">
              {filas.slice(0, 50).map((f, i) => (
                <div key={i} className="rounded-md border px-2 py-1.5 text-xs">
                  <div className="font-medium">{f.titulo}</div>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span>{f.prioridad}</span>
                    {f.fechaLimite && <span>{f.fechaLimite}</span>}
                    {f.responsable && <span>👤 {f.responsable}</span>}
                    {f.proyecto && <span>📁 {f.proyecto}</span>}
                  </div>
                </div>
              ))}
              {filas.length > 50 && <p className="p-1 text-center text-[10px] text-muted-foreground">…y {filas.length - 50} más.</p>}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {!!filas.length && <Button onClick={confirmarImportacion}>Importar {filas.length} pendiente{filas.length === 1 ? '' : 's'}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
