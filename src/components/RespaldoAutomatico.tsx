import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/store'
import { contar, debeGuardar, describirFaltantes, faltantes, guardarSnapshot, leerSnapshots, total, type Datos, type Snapshot } from '@/lib/respaldo-local'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ConfirmDialog'
import { ShieldCheck } from 'lucide-react'

/** Datos actuales del store con la forma del respaldo. */
function useDatosActuales() {
  const a = useApp()
  const datos: Datos & { usuario?: string } = {
    pendientes: a.pendientes, notas: a.notas, proyectos: a.proyectos, eventos: a.eventos, espacios: a.espacios, contactos: a.contactos,
    metas: a.metas, rocas: a.rocas, etiquetas: a.etiquetas, plantillas: a.plantillas, filtrosGuardados: a.filtrosGuardados, usuario: a.usuario,
  }
  return { app: a, datos }
}

function useRestaurar() {
  const { app } = useDatosActuales()
  const appRef = useRef(app)
  useEffect(() => { appRef.current = app }) // referencia estable: así `restaurar` no cambia en cada render y no reinicia los temporizadores
  return useCallback((s: Snapshot) => {
    const app = appRef.current
    const d = s.datos
    app.reemplazarTodo(
      (d.pendientes ?? []) as Parameters<typeof app.reemplazarTodo>[0], (d.notas ?? []) as Parameters<typeof app.reemplazarTodo>[1], d.usuario,
      d.proyectos as never, d.eventos as never, d.espacios as never, d.contactos as never, d.rocas as never,
      { metas: d.metas as never, etiquetas: d.etiquetas as never, plantillas: d.plantillas as never, filtrosGuardados: d.filtrosGuardados as never },
    )
    toast.success('Datos restaurados desde el respaldo automático')
  }, [])
}

/** Sin interfaz: guarda cada cambio (con pausa de 5 s) en IndexedDB y, al abrir, si detecta que FALTAN datos
    respecto al último respaldo, ofrece restaurarlos (nunca lo hace solo). */
export default function RespaldoAutomatico() {
  const { app: a, datos } = useDatosActuales()
  const restaurar = useRestaurar()
  const datosRef = useRef(datos)
  useEffect(() => { datosRef.current = datos })
  const avisado = useRef(false)

  // Al abrir: ¿faltan datos respecto al respaldo?
  useEffect(() => {
    const t = setTimeout(async () => {
      if (avisado.current) return
      const snaps = await leerSnapshots()
      const ultimo = snaps.find(s => s.id === 'actual') ?? snaps[0]
      if (!ultimo) return
      const f = faltantes(contar(datosRef.current), ultimo.conteo)
      if (!f.length) return
      avisado.current = true
      toast.warning(`Parece que faltan datos: el respaldo automático del ${new Date(ultimo.fecha).toLocaleString()} tiene ${describirFaltantes(f)}.`, {
        duration: 60000, action: { label: 'Restaurar', onClick: () => restaurar(ultimo) },
      })
    }, 2500)
    return () => clearTimeout(t)
  }, [restaurar])

  // Guardado con pausa tras cada cambio.
  const huella = JSON.stringify(Object.values(contar(datos))) + a.rocas.map(r => r.modificado).join('') + a.notas.map(n => n.modificado).join('') + a.pendientes.map(p => p.modificado).join('') + a.eventos.map(e => e.modificado).join('')
  useEffect(() => {
    const t = setTimeout(async () => {
      const snaps = await leerSnapshots()
      const ultimo = snaps.find(s => s.id === 'actual')
      if (debeGuardar(contar(datosRef.current), ultimo?.conteo)) await guardarSnapshot(datosRef.current)
    }, 5000)
    return () => clearTimeout(t)
  }, [huella])

  return null
}

/** Sección de Ajustes: respaldos diarios disponibles y restauración manual. */
export function SeccionRespaldo() {
  const { datos } = useDatosActuales()
  const restaurar = useRestaurar()
  const [snaps, setSnaps] = useState<Snapshot[] | null>(null)
  const [aRestaurar, setARestaurar] = useState<Snapshot | null>(null)

  useEffect(() => { let vivo = true; leerSnapshots().then(s => { if (vivo) setSnaps(s.filter(x => x.id !== 'actual')) }); return () => { vivo = false } }, [])

  if (snaps === null) return <p className="text-[11px] text-muted-foreground">Cargando…</p>
  if (!snaps.length) return <p className="text-[11px] text-muted-foreground">Todavía no hay respaldos automáticos (se crean solos unos segundos después de tus cambios).</p>
  const actual = contar(datos)
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><ShieldCheck size={12} className="text-primary" /> Copia automática en este navegador (últimos {snaps.length} día(s)); sobrevive aunque se borre el almacenamiento local.</p>
      {snaps.map(s => (
        <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs">
          <span className="min-w-0 flex-1 truncate">{new Date(s.fecha).toLocaleDateString()} · {s.conteo.pendientes ?? 0} pend., {s.conteo.notas ?? 0} notas, {s.conteo.rocas ?? 0} rocas, {s.conteo.eventos ?? 0} eventos</span>
          <Button size="sm" variant="secondary" className="h-7 shrink-0 text-xs" onClick={() => setARestaurar(s)}>Restaurar</Button>
        </div>
      ))}
      <ConfirmDialog
        open={!!aRestaurar} onOpenChange={o => { if (!o) setARestaurar(null) }}
        titulo="Restaurar respaldo"
        descripcion={aRestaurar ? `Esto reemplazará tus datos actuales (${total(actual)} elementos) por los del ${new Date(aRestaurar.fecha).toLocaleString()} (${total(aRestaurar.conteo)} elementos). ¿Continuar?` : ''}
        textoConfirmar="Restaurar"
        onConfirmar={() => { if (aRestaurar) restaurar(aRestaurar) }}
      />
    </div>
  )
}
