import type { Adjunto } from '@/types'
import { getSupabase } from '@/lib/supabase'
import { uid } from '@/lib/app-utils'

const BUCKET = 'pnp_adjuntos'
const urlCache = new Map<string, string>()

function leerComoDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(new Error('No se pudo leer el archivo'))
    r.readAsDataURL(file)
  })
}

/** Sube un archivo. En modo nube usa Storage; en local guarda imágenes como dataUrl. */
export async function subirAdjunto(file: File, taskId: string): Promise<Adjunto> {
  const sb = getSupabase()
  const userId = sb ? (await sb.auth.getUser()).data.user?.id : null

  if (sb && userId) {
    const safe = file.name.replace(/[^\w.-]+/g, '_')
    const path = `${userId}/${taskId}/${uid()}-${safe}`
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
    if (error) throw error
    return { id: uid(), nombre: file.name, tipo: file.type, tamano: file.size, path }
  }

  // Modo local: solo imágenes y archivos pequeños (se guardan en el dato, sin nube)
  if (file.size > 1.5 * 1024 * 1024) {
    throw new Error('Sin sesión, solo se pueden adjuntar archivos menores a 1.5 MB')
  }
  const dataUrl = await leerComoDataUrl(file)
  return { id: uid(), nombre: file.name, tipo: file.type, tamano: file.size, dataUrl }
}

/** Devuelve una URL utilizable (firmada para Storage, o el dataUrl local) */
export async function urlAdjunto(a: Adjunto): Promise<string | null> {
  if (a.dataUrl) return a.dataUrl
  if (!a.path) return null
  if (urlCache.has(a.path)) return urlCache.get(a.path)!
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(a.path, 60 * 60) // 1 h
  if (error || !data) return null
  urlCache.set(a.path, data.signedUrl)
  return data.signedUrl
}

export async function eliminarAdjunto(a: Adjunto): Promise<void> {
  if (a.path) {
    const sb = getSupabase()
    if (sb) await sb.storage.from(BUCKET).remove([a.path])
    urlCache.delete(a.path)
  }
}

export function esImagen(a: Adjunto): boolean {
  return a.tipo?.startsWith('image/')
}

export function formatoTamano(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}
