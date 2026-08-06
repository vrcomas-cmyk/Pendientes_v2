import { useState } from 'react'
import { useApp } from '@/store'
import { colorColumna } from '@/lib/columnas'
import { PROYECTO_COLORES, PROYECTO_COLORES_KEYS } from '@/types'
import { ACENTOS, leerAcento, guardarAcento, aplicarAcento } from '@/lib/tema'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Moon, Sun, Settings2, Tag, X, Plus, Bookmark, Bell } from 'lucide-react'
import { recordatoriosActivos, setRecordatoriosActivos } from '@/hooks/use-recordatorios-locales'
import { toast } from 'sonner'

/** Panel centralizado de personalización: tema, color de acento, y un resumen de las columnas del
    Kanban (edición completa — renombrar/recolorear/reordenar/añadir/eliminar — vive en el propio
    Tablero, donde arrastrar y ver el resultado en vivo tiene más sentido; aquí solo se enlaza). */
export default function AjustesDialog({
  open, onOpenChange, dark, toggleDark, onIrTablero,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  dark: boolean
  toggleDark: () => void
  onIrTablero: () => void
}) {
  const { columnas, etiquetas, crearEtiqueta, actualizarEtiqueta, eliminarEtiqueta, plantillas, eliminarPlantilla } = useApp()
  const [acento, setAcento] = useState(leerAcento)
  const [etiquetaVal, setEtiquetaVal] = useState('')
  const [recordatorios, setRecordatorios] = useState(recordatoriosActivos)

  const toggleRecordatorios = async () => {
    if (recordatorios) { setRecordatoriosActivos(false); setRecordatorios(false); return }
    if (typeof Notification === 'undefined') { toast.error('Este navegador no soporta notificaciones'); return }
    const permiso = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permiso !== 'granted') { toast.error('Necesitas permitir notificaciones para activar los recordatorios'); return }
    setRecordatoriosActivos(true); setRecordatorios(true)
    toast.success('Recordatorios activados — avisan mientras esta pestaña siga abierta')
  }

  const agregarEtiqueta = () => {
    const n = etiquetaVal.trim()
    if (!n || etiquetas.some(e => e.nombre.toLowerCase() === n.toLowerCase())) { setEtiquetaVal(''); return }
    crearEtiqueta(n)
    setEtiquetaVal('')
  }
  const siguienteColor = (actual: string) => PROYECTO_COLORES_KEYS[(PROYECTO_COLORES_KEYS.indexOf(actual) + 1) % PROYECTO_COLORES_KEYS.length]

  const elegirAcento = (key: string) => {
    setAcento(key)
    guardarAcento(key)
    aplicarAcento(key, dark)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-base"><Settings2 size={17} /> Ajustes</DialogTitle></DialogHeader>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase text-muted-foreground">Apariencia</p>
          <button onClick={toggleDark} className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-accent">
            <span className="flex items-center gap-2">{dark ? <Moon size={15} /> : <Sun size={15} />} Modo {dark ? 'oscuro' : 'claro'}</span>
            <span className="text-xs text-muted-foreground">Cambiar</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase text-muted-foreground">Color de acento</p>
          <div className="flex flex-wrap gap-2">
            {ACENTOS.map(a => (
              <button key={a.key} onClick={() => elegirAcento(a.key)} title={a.nombre}
                className={'h-7 w-7 rounded-full ring-offset-2 ring-offset-background ' + (acento === a.key ? 'ring-2 ring-foreground' : '')}
                style={{ backgroundColor: `hsl(${a.hue} 65% 58%)` }} />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase text-muted-foreground">Columnas del tablero ({columnas.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {columnas.map(c => (
              <span key={c.id} className={'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ' + colorColumna(c).badge}>
                <span className={'h-1.5 w-1.5 rounded-full ' + colorColumna(c).dot} /> {c.nombre}
              </span>
            ))}
          </div>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => { onIrTablero(); onOpenChange(false) }}>
            Editar columnas en el Tablero
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Se comparten con todas las cuentas de tu espacio: renombrar, recolorear, reordenar,
            añadir o eliminar columnas ahí se ve reflejado para todos.
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground"><Bell size={11} /> Recordatorios</p>
          <button onClick={toggleRecordatorios} className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-accent">
            <span className="flex items-center gap-2"><Bell size={15} /> Recordatorios locales</span>
            <span className={'text-xs ' + (recordatorios ? 'text-primary' : 'text-muted-foreground')}>{recordatorios ? 'Activados' : 'Desactivados'}</span>
          </button>
          <p className="text-[10px] text-muted-foreground">
            Avisan de pendientes con hora agendada, vía notificación del navegador. Sin servidor de
            push: solo funcionan mientras esta pestaña siga abierta (puede estar en segundo plano).
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground"><Tag size={11} /> Etiquetas ({etiquetas.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {etiquetas.map(e => (
              <span key={e.id} className={'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ' + PROYECTO_COLORES[e.color].badge}>
                <button onClick={() => actualizarEtiqueta(e.id, { color: siguienteColor(e.color) })} title="Cambiar color"
                  className={'h-2 w-2 rounded-full ' + PROYECTO_COLORES[e.color].dot} />
                #{e.nombre}
                <button onClick={() => eliminarEtiqueta(e.id)} aria-label={'Eliminar etiqueta ' + e.nombre} className="hover:text-destructive"><X size={10} /></button>
              </span>
            ))}
            {!etiquetas.length && <p className="text-[11px] text-muted-foreground">Sin etiquetas todavía.</p>}
          </div>
          <div className="flex gap-1.5">
            <Input value={etiquetaVal} onChange={e => setEtiquetaVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarEtiqueta() } }}
              placeholder="Nueva etiqueta" className="h-8 text-xs" />
            <Button size="icon" variant="secondary" className="h-8 w-8 shrink-0" onClick={agregarEtiqueta}><Plus size={14} /></Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Da color a las etiquetas que ya usas en pendientes y notas (clic en el punto de color
            para rotarlo). Escribir el mismo nombre en un pendiente o nota adopta ese color.
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground"><Bookmark size={11} /> Plantillas ({plantillas.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {plantillas.map(t => (
              <span key={t.id} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]">
                {t.nombre}
                <button onClick={() => eliminarPlantilla(t.id)} aria-label={'Eliminar plantilla ' + t.nombre} className="hover:text-destructive"><X size={10} /></button>
              </span>
            ))}
            {!plantillas.length && <p className="text-[11px] text-muted-foreground">Sin plantillas todavía — guarda una desde "Nuevo pendiente" → Más detalles.</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
