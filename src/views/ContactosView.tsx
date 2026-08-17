import { useMemo, useState } from 'react'
import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import { PROYECTO_COLORES } from '@/types'
import type { Contacto } from '@/types'
import NuevoContactoDialog from '@/components/NuevoContactoDialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Plus, Search, Mail, Phone, Trash2 } from 'lucide-react'

/** Vista «Contactos» (Fase 1b del plan de Contactos/Equipos, ver workspace-doctrine): directorio
    de la entidad `Contacto` creada en la Fase 1a. Lista + diálogo de detalle con los pendientes
    delegados/solicitados a esa persona — resuelve tanto por `responsableId`/`solicitanteId`
    (referencia real) como por el string legacy `responsable`/`solicitante` para no dejar
    invisibles las tareas viejas que todavía no tienen id asociado. */
export default function ContactosView() {
  const { contactos, eliminarContacto, pendientes } = useApp()
  const { abrirModal } = useUI()
  const [dlgNuevo, setDlgNuevo] = useState(false)
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const activos = useMemo(() => contactos.filter(c => !c.borrado), [contactos])
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return activos
    return activos.filter(c => c.nombre.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
  }, [activos, busqueda])

  const pendientesDe = (c: Contacto) => {
    const nombre = c.nombre.trim().toLowerCase()
    return pendientes.filter(p => !p.borrado && (
      p.responsableId === c.id || p.solicitanteId === c.id ||
      p.responsable?.trim().toLowerCase() === nombre || p.solicitante?.trim().toLowerCase() === nombre
    ))
  }

  const detalle = detalleId ? activos.find(c => c.id === detalleId) : null
  const pendientesDetalle = detalle ? pendientesDe(detalle) : []
  const abiertosDetalle = pendientesDetalle.filter(p => !p.fechaCompletado).length

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold"><Users size={15} className="text-primary" /> Contactos</h2>
        <Button size="sm" onClick={() => setDlgNuevo(true)}><Plus size={13} className="mr-1" /> Nuevo contacto</Button>
      </div>

      <div className="relative shrink-0">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o email…" className="pl-8" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1 scroll-thin">
        {filtrados.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Users size={28} className="text-muted-foreground/50" />
            <p>{activos.length === 0 ? 'Todavía no tenés contactos. Creá el primero.' : 'Sin resultados para esa búsqueda.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map(c => {
              const colores = PROYECTO_COLORES[c.color] || PROYECTO_COLORES[Object.keys(PROYECTO_COLORES)[0]]
              const nAbiertos = pendientesDe(c).filter(p => !p.fechaCompletado).length
              return (
                <Card key={c.id} interactive onClick={() => setDetalleId(c.id)}
                  className="flex items-center gap-3 p-3 text-left">
                  <span aria-hidden className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ' + colores.bg}>
                    {c.avatar || '👤'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.nombre}</p>
                    {c.email && <p className="truncate text-[11px] text-muted-foreground">{c.email}</p>}
                  </div>
                  {nAbiertos > 0 && (
                    <span className={'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ' + colores.badge}>{nAbiertos}</span>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <NuevoContactoDialog open={dlgNuevo} onOpenChange={setDlgNuevo} />

      <Dialog open={!!detalle} onOpenChange={o => { if (!o) setDetalleId(null) }}>
        <DialogContent className="max-w-md">
          {detalle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <span aria-hidden className="text-xl">{detalle.avatar || '👤'}</span> {detalle.nombre}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {(detalle.email || detalle.telefono) && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {detalle.email && <p className="flex items-center gap-1.5"><Mail size={13} /> {detalle.email}</p>}
                    {detalle.telefono && <p className="flex items-center gap-1.5"><Phone size={13} /> {detalle.telefono}</p>}
                  </div>
                )}
                <div>
                  <p className="mb-1.5 text-[11px] uppercase text-muted-foreground">
                    Pendientes ({abiertosDetalle} abiertos de {pendientesDetalle.length})
                  </p>
                  {pendientesDetalle.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin pendientes delegados ni solicitados por esta persona.</p>
                  ) : (
                    <div className="max-h-60 space-y-1 overflow-y-auto scroll-thin">
                      {pendientesDetalle.map(p => (
                        <button key={p.id} onClick={() => { abrirModal(p.id); setDetalleId(null) }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-accent">
                          <span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + (p.fechaCompletado ? 'bg-emerald-500' : 'bg-amber-500')} />
                          <span className="flex-1 truncate">{p.titulo}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                  onClick={() => { eliminarContacto(detalle.id); setDetalleId(null) }}>
                  <Trash2 size={13} className="mr-1.5" /> Eliminar contacto
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
