import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Adjunto } from '@/types'
import { esImagen, eliminarAdjunto, formatoTamano, subirAdjunto, urlAdjunto } from '@/lib/adjuntos'
import { Button } from '@/components/ui/button'
import { Paperclip, X, FileText, Loader2, Download } from 'lucide-react'

export function Miniatura({ a }: { a: Adjunto }) {
  const [url, setUrl] = useState<string | null>(a.dataUrl || null)
  useEffect(() => {
    let vivo = true
    if (!url) urlAdjunto(a).then(u => { if (vivo) setUrl(u) })
    return () => { vivo = false }
  }, [a, url])

  const abrir = async () => {
    const u = url || await urlAdjunto(a)
    if (u) window.open(u, '_blank')
  }

  if (esImagen(a) && url) {
    return <img src={url} alt={a.nombre} onClick={abrir} className="h-16 w-16 cursor-pointer rounded-lg object-cover" />
  }
  return (
    <button onClick={abrir} className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border bg-muted text-muted-foreground hover:bg-accent">
      {esImagen(a) ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
      <Download size={11} />
    </button>
  )
}

export default function AdjuntosUI({
  adjuntos, taskId, onChange, compact,
}: { adjuntos: Adjunto[]; taskId: string; onChange: (a: Adjunto[]) => void; compact?: boolean }) {
  const [subiendo, setSubiendo] = useState(false)

  const elegir = () => {
    const inp = document.createElement('input')
    inp.type = 'file'
    inp.multiple = true
    inp.onchange = async () => {
      const files = Array.from(inp.files || [])
      if (!files.length) return
      setSubiendo(true)
      const nuevos: Adjunto[] = []
      for (const f of files) {
        try { nuevos.push(await subirAdjunto(f, taskId)) }
        catch (e) { toast.error((e as Error).message || 'Error al subir ' + f.name) }
      }
      if (nuevos.length) onChange([...adjuntos, ...nuevos])
      setSubiendo(false)
    }
    inp.click()
  }

  const quitar = async (a: Adjunto) => {
    try { await eliminarAdjunto(a) } catch { /* noop */ }
    onChange(adjuntos.filter(x => x.id !== a.id))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {adjuntos.map(a => (
          <div key={a.id} className="group relative">
            <Miniatura a={a} />
            <button onClick={() => quitar(a)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-90 shadow">
              <X size={12} />
            </button>
            {!compact && <div className="mt-0.5 w-16 truncate text-[9px] text-muted-foreground" title={a.nombre}>{a.nombre}</div>}
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={elegir} disabled={subiendo}
          className="h-16 w-16 flex-col gap-1 text-[10px]">
          {subiendo ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
          {subiendo ? '' : 'Adjuntar'}
        </Button>
      </div>
      {adjuntos.length > 0 && !compact && (
        <p className="mt-1 text-[10px] text-muted-foreground">{adjuntos.length} archivo(s) · {formatoTamano(adjuntos.reduce((s, a) => s + a.tamano, 0))}</p>
      )}
    </div>
  )
}
