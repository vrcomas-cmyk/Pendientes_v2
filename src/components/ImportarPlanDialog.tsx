import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/store'
import type { Prioridad } from '@/types'
import { parsearFechaFlexible, parsearHoraFlexible } from '@/lib/app-utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'

type Columna = 'fecha' | 'hora' | 'material' | 'actividad' | 'ponderacion' | 'modalidad' | 'ignorar'

const OPCIONES_COLUMNA: { valor: Columna; label: string }[] = [
  { valor: 'fecha', label: 'Fecha límite' },
  { valor: 'hora', label: 'Horario' },
  { valor: 'material', label: 'Material' },
  { valor: 'actividad', label: 'Actividad' },
  { valor: 'ponderacion', label: 'Ponderación' },
  { valor: 'modalidad', label: 'Individual/Equipo' },
  { valor: 'ignorar', label: 'Ignorar' },
]

/** Adivina la columna por su nombre de encabezado, para no obligar a mapear a mano si el
    encabezado ya es claro (el usuario puede corregir cualquier suposición incorrecta). */
function adivinarPorEncabezado(encabezado: string): Columna {
  const h = encabezado.toLowerCase()
  if (/fecha|entrega|límite|limite|deadline/.test(h)) return 'fecha'
  if (/hora|horario/.test(h)) return 'hora'
  if (/material|recurso|lectura/.test(h)) return 'material'
  if (/actividad|tarea|título|titulo|descripción|descripcion/.test(h)) return 'actividad'
  if (/ponderaci|peso|%|valor/.test(h)) return 'ponderacion'
  if (/modalidad|equipo|individual/.test(h)) return 'modalidad'
  return 'ignorar'
}

function parsearModalidad(texto: string): 'individual' | 'equipo' | undefined {
  const t = texto.trim().toLowerCase()
  if (!t) return undefined
  if (/equipo|grupal|grupo/.test(t)) return 'equipo'
  if (/individual/.test(t)) return 'individual'
  return undefined
}

interface FilaPreview {
  incluir: boolean
  actividad: string
  fecha: string
  fechaOriginal: string
  hora: string
  material: string
  ponderacion?: number
  modalidad?: 'individual' | 'equipo'
}

function sugerirPrioridad(ponderacion?: number): Prioridad {
  if (ponderacion == null) return 'Media'
  if (ponderacion >= 20) return 'Alta'
  if (ponderacion >= 10) return 'Media'
  return 'Baja'
}

export default function ImportarPlanDialog({ open, onOpenChange, proyectoId }: { open: boolean; onOpenChange: (o: boolean) => void; proyectoId: string }) {
  const { crearPendiente, proyectos } = useApp()
  const [texto, setTexto] = useState('')
  const [tieneEncabezado, setTieneEncabezado] = useState(true)
  const [asignaciones, setAsignaciones] = useState<Columna[]>([])

  const filas = useMemo(() => texto.split(/\r?\n/).map(l => l.split('\t')).filter(cols => cols.some(c => c.trim())), [texto])
  const numCols = useMemo(() => Math.max(0, ...filas.map(f => f.length)), [filas])

  // Al pegar texto nuevo: detecta encabezado y propone asignaciones automáticas
  const onPegar = (v: string) => {
    setTexto(v)
    const nuevasFilas = v.split(/\r?\n/).map(l => l.split('\t')).filter(cols => cols.some(c => c.trim()))
    if (!nuevasFilas.length) { setAsignaciones([]); return }
    const primera = nuevasFilas[0]
    const cols = Math.max(0, ...nuevasFilas.map(f => f.length))
    // Heurística: si la primera fila no tiene ninguna fecha reconocible pero alguna fila siguiente sí, es encabezado
    const primeraTieneFecha = primera.some(c => parsearFechaFlexible(c))
    const otraTieneFecha = nuevasFilas.slice(1).some(f => f.some(c => parsearFechaFlexible(c)))
    const esEncabezado = !primeraTieneFecha && otraTieneFecha
    setTieneEncabezado(esEncabezado)
    const base = Array.from({ length: cols }, (_, i) =>
      esEncabezado ? adivinarPorEncabezado(primera[i] || '') : 'ignorar' as Columna)
    setAsignaciones(base)
  }

  const filasDatos = tieneEncabezado ? filas.slice(1) : filas

  const [excluidas, setExcluidas] = useState<Set<number>>(new Set())

  const preview: FilaPreview[] = useMemo(() => filasDatos.map((cols, i) => {
    const get = (col: Columna) => {
      const idx = asignaciones.indexOf(col)
      return idx >= 0 ? (cols[idx] || '').trim() : ''
    }
    const fechaOriginal = get('fecha')
    const ponderacionTxt = get('ponderacion').replace('%', '').trim()
    const ponderacion = ponderacionTxt ? Number(ponderacionTxt) : undefined
    return {
      incluir: !excluidas.has(i),
      actividad: get('actividad'),
      fecha: parsearFechaFlexible(fechaOriginal),
      fechaOriginal,
      hora: parsearHoraFlexible(get('hora')),
      material: get('material'),
      ponderacion: ponderacion != null && !Number.isNaN(ponderacion) ? ponderacion : undefined,
      modalidad: parsearModalidad(get('modalidad')),
    }
  }), [filasDatos, asignaciones, excluidas])

  const cambiarAsignacion = (idx: number, valor: Columna) =>
    setAsignaciones(arr => arr.map((v, i) => i === idx ? valor : v))

  const toggleExcluir = (i: number) =>
    setExcluidas(prev => { const s = new Set(prev); if (s.has(i)) s.delete(i); else s.add(i); return s })

  const nombreProyecto = proyectos.find(p => p.id === proyectoId)?.nombre || ''
  const aIncluir = preview.filter(f => f.incluir && f.actividad)

  const confirmar = () => {
    if (!aIncluir.length) { toast.error('No hay filas para crear (revisa que "Actividad" esté asignada)'); return }
    aIncluir.forEach(f => {
      crearPendiente({
        titulo: f.actividad,
        descripcion: f.material,
        fechaLimite: f.fecha,
        hora: f.hora || undefined,
        ponderacion: f.ponderacion,
        modalidad: f.modalidad,
        prioridad: sugerirPrioridad(f.ponderacion),
        proyecto: nombreProyecto,
        proyectoId,
      })
    })
    toast.success(`${aIncluir.length} pendiente(s) creado(s)`)
    setTexto(''); setAsignaciones([]); setExcluidas(new Set())
    onOpenChange(false)
  }

  const cerrar = (o: boolean) => {
    if (!o) { setTexto(''); setAsignaciones([]); setExcluidas(new Set()) }
    onOpenChange(o)
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto scroll-thin">
        <DialogHeader><DialogTitle>Importar plan de estudio</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase text-muted-foreground">
              1. Pega las filas copiadas de Excel (Ctrl+C en Excel, Ctrl+V aquí)
            </label>
            <Textarea rows={5} value={texto} onChange={e => onPegar(e.target.value)}
              placeholder={'Fecha\tHorario\tMaterial\tActividad\tPonderación\tModalidad\n15/08/2026\t23:59\tCap. 3\tEnsayo\t20\tIndividual'} />
          </div>

          {numCols > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox checked={tieneEncabezado} onCheckedChange={v => setTieneEncabezado(!!v)} id="chk-encabezado" />
                <label htmlFor="chk-encabezado" className="text-xs">La primera fila es encabezado</label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-muted-foreground">2. Asigna cada columna</label>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${numCols}, minmax(120px, 1fr))` }}>
                  {Array.from({ length: numCols }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <div className="truncate text-[10px] text-muted-foreground" title={filas[0]?.[i]}>
                        {tieneEncabezado ? (filas[0]?.[i] || `Col ${i + 1}`) : `Columna ${i + 1}`}
                      </div>
                      <Select value={asignaciones[i] || 'ignorar'} onValueChange={v => cambiarAsignacion(i, v as Columna)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OPCIONES_COLUMNA.map(o => <SelectItem key={o.valor} value={o.valor}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase text-muted-foreground">
                  3. Vista previa ({aIncluir.length} de {preview.length} se crearán)
                </label>
                <div className="max-h-72 overflow-auto rounded-lg border scroll-thin">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="p-1.5"></th>
                        <th className="p-1.5">Actividad</th>
                        <th className="p-1.5">Fecha</th>
                        <th className="p-1.5">Hora</th>
                        <th className="p-1.5">Ponderación</th>
                        <th className="p-1.5">Modalidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((f, i) => (
                        <tr key={i} className={'border-t ' + (!f.incluir ? 'opacity-40' : !f.actividad ? 'bg-amber-50 dark:bg-amber-900/20' : '')}>
                          <td className="p-1.5">
                            <button onClick={() => toggleExcluir(i)} title={f.incluir ? 'Excluir esta fila' : 'Incluir esta fila'}>
                              <X size={13} className={f.incluir ? 'text-muted-foreground hover:text-destructive' : 'text-destructive'} />
                            </button>
                          </td>
                          <td className="p-1.5">{f.actividad || <span className="text-muted-foreground">(sin actividad)</span>}</td>
                          <td className="p-1.5">
                            {f.fechaOriginal ? (f.fecha || <span className="text-red-500" title={f.fechaOriginal}>⚠ formato no reconocido</span>) : '—'}
                          </td>
                          <td className="p-1.5">{f.hora || '—'}</td>
                          <td className="p-1.5">{f.ponderacion != null ? f.ponderacion + '%' : '—'}</td>
                          <td className="p-1.5">{f.modalidad || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!preview.length && <p className="p-3 text-center text-muted-foreground">Sin filas de datos.</p>}
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => cerrar(false)}>Cancelar</Button>
          <Button onClick={confirmar} disabled={!aIncluir.length}>Crear {aIncluir.length || ''} pendiente{aIncluir.length === 1 ? '' : 's'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
