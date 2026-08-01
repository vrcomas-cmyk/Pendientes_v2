import { useState } from 'react'
import { useApp } from '@/store'
import { isoMasDias, isoProximoFinDeSemana, hoyISO } from '@/lib/app-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { CalendarClock, Sun, CalendarDays, Coffee, X, CalendarCheck, CalendarSearch } from 'lucide-react'
import { toast } from 'sonner'

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const conDia = (iso: string) => `${DIAS[new Date(iso + 'T00:00').getDay()]} ${iso.slice(5)}`

/** Menú de "posponer": mueve la fecha límite sin abrir el editor completo. */
export default function PosponerMenu({ id, size = 'sm', variant = 'secondary' }: { id: string; size?: 'sm' | 'icon'; variant?: 'secondary' | 'ghost' }) {
  const { actualizarPendiente, pendientes } = useApp()
  const [fechaDlg, setFechaDlg] = useState(false)
  const [fechaVal, setFechaVal] = useState('')
  const actual = pendientes.find(p => p.id === id)?.fechaLimite || ''

  const poner = (fecha: string, etiqueta: string) => {
    actualizarPendiente(id, { fechaLimite: fecha })
    toast.success(fecha ? 'Pospuesto: ' + etiqueta : 'Fecha eliminada')
  }
  const abrirElegirFecha = () => { setFechaVal(actual || hoyISO()); setFechaDlg(true) }
  const confirmarFecha = () => { if (fechaVal) poner(fechaVal, conDia(fechaVal)); setFechaDlg(false) }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={size === 'icon' ? 'icon' : 'sm'} variant={variant} className={size === 'icon' ? 'h-8 w-8' : 'h-8'} title="Posponer">
            <CalendarClock size={14} className={size === 'icon' ? '' : 'mr-1'} />{size !== 'icon' && 'Posponer'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {actual && <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">Actual: {conDia(actual)}</DropdownMenuLabel>}
          <DropdownMenuItem onClick={() => poner(hoyISO(), 'Hoy')}><CalendarCheck size={14} className="mr-2 text-primary" /> Hoy <span className="ml-auto text-[10px] text-muted-foreground">{conDia(hoyISO())}</span></DropdownMenuItem>
          <DropdownMenuItem onClick={() => poner(isoMasDias(1), 'Mañana')}><Sun size={14} className="mr-2 text-amber-500" /> Mañana <span className="ml-auto text-[10px] text-muted-foreground">{conDia(isoMasDias(1))}</span></DropdownMenuItem>
          <DropdownMenuItem onClick={() => poner(isoMasDias(3), 'En 3 días')}><CalendarDays size={14} className="mr-2 text-primary" /> En 3 días <span className="ml-auto text-[10px] text-muted-foreground">{conDia(isoMasDias(3))}</span></DropdownMenuItem>
          <DropdownMenuItem onClick={() => poner(isoProximoFinDeSemana(), 'Fin de semana')}><Coffee size={14} className="mr-2 text-emerald-500" /> Fin de semana <span className="ml-auto text-[10px] text-muted-foreground">{conDia(isoProximoFinDeSemana())}</span></DropdownMenuItem>
          <DropdownMenuItem onClick={() => poner(isoMasDias(7), 'Próxima semana')}><CalendarDays size={14} className="mr-2 text-primary" /> Próxima semana <span className="ml-auto text-[10px] text-muted-foreground">{conDia(isoMasDias(7))}</span></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={abrirElegirFecha}><CalendarSearch size={14} className="mr-2 text-muted-foreground" /> Elegir fecha…</DropdownMenuItem>
          <DropdownMenuItem onClick={() => poner('', '')}><X size={14} className="mr-2 text-muted-foreground" /> Quitar fecha</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={fechaDlg} onOpenChange={setFechaDlg}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="text-base">Elegir fecha límite</DialogTitle></DialogHeader>
          <Input type="date" autoFocus value={fechaVal} onChange={e => setFechaVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmarFecha() } }} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setFechaDlg(false)}>Cancelar</Button>
            <Button onClick={confirmarFecha}>Posponer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
