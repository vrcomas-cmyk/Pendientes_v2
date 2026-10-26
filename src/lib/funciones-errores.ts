import { FunctionsHttpError } from '@supabase/supabase-js'

/** `functions.invoke` devuelve «Edge Function returned a non-2xx status code» cuando la función
    responde con error; el motivo real viaja en el cuerpo JSON (`{ error }`). Lo extrae para poder
    mostrárselo al usuario en vez de un mensaje genérico. */
export async function mensajeDeFuncion(error: unknown, data?: unknown): Promise<string | null> {
  if (data && typeof data === 'object' && 'error' in data && (data as { error?: unknown }).error) return String((data as { error: unknown }).error)
  if (error instanceof FunctionsHttpError) {
    try {
      const cuerpo = await error.context.json()
      if (cuerpo?.error) return String(cuerpo.error)
    } catch { /* el cuerpo no era JSON */ }
  }
  return error instanceof Error ? error.message : null
}
