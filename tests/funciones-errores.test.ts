import { describe, it, expect } from 'vitest'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { mensajeDeFuncion } from '@/lib/funciones-errores'

describe('mensajeDeFuncion', () => {
  it('extrae el motivo real del cuerpo de una respuesta de error', async () => {
    const err = new FunctionsHttpError(new Response(JSON.stringify({ error: 'Resend 403: dominio no verificado' }), { status: 500 }))
    expect(await mensajeDeFuncion(err)).toBe('Resend 403: dominio no verificado')
  })
  it('usa data.error cuando la función respondió 200 con error', async () => {
    expect(await mensajeDeFuncion(null, { error: 'Guarda primero tus preferencias' })).toBe('Guarda primero tus preferencias')
  })
  it('cae al mensaje del Error o null', async () => {
    expect(await mensajeDeFuncion(new Error('red caída'))).toBe('red caída')
    expect(await mensajeDeFuncion(null)).toBeNull()
  })
})
