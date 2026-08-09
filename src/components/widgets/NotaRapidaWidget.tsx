import { useState } from 'react'
import { useApp } from '@/store'
import { useUI } from '@/ui-store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

/** Crea una `Nota` real usando `crearNota`/`actualizarNota` del store — no un borrador aparte que
    luego haya que reconciliar; el widget es solo una entrada rápida a la misma entidad de siempre. */
export default function NotaRapidaWidget() {
  const { crearNota, actualizarNota } = useApp()
  const { setNotaActualId } = useUI()
  const [texto, setTexto] = useState('')

  const guardar = () => {
    const t = texto.trim()
    if (!t) return
    const n = crearNota()
    actualizarNota(n.id, { titulo: t.slice(0, 60), contenidoHTML: '<div>' + t + '</div>' })
    setNotaActualId(null) // el widget no navega a la vista Notas; solo captura
    setTexto('')
    toast.success('Nota guardada')
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <textarea
        value={texto} onChange={e => setTexto(e.target.value)}
        placeholder="Escribe algo…"
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); guardar() } }}
        className="min-h-0 flex-1 resize-none rounded-lg border bg-background/60 p-2 text-xs outline-none focus:ring-2 focus:ring-primary"
      />
      <Button size="sm" onClick={guardar} disabled={!texto.trim()}>Guardar (Ctrl+Enter)</Button>
    </div>
  )
}
