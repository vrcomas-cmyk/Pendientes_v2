import { describe, it, expect, vi, beforeEach } from 'vitest'

const invoke = vi.fn()
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ functions: { invoke } }) }))
vi.mock('@/lib/googleCalendarConfig', () => ({ getGoogleClientId: () => 'cid', isGoogleConfigurado: () => true }))

import { manejarCallbackOAuth } from '@/lib/googleCalendar'

const irA = (qs: string) => window.history.replaceState(null, '', '/' + qs)

describe('manejarCallbackOAuth (state anti-CSRF)', () => {
  beforeEach(() => { invoke.mockReset(); sessionStorage.clear(); irA('') })

  it('ignora un ?code= sin state de Google Calendar (p. ej. login de Supabase) y no toca la URL', async () => {
    irA('?code=abc')
    expect(await manejarCallbackOAuth()).toBeNull()
    expect(window.location.search).toBe('?code=abc')
    expect(invoke).not.toHaveBeenCalled()
  })
  it('rechaza un state que no coincide con el guardado', async () => {
    sessionStorage.setItem('gcal_oauth_state', 'gcal_bueno')
    irA('?code=abc&state=gcal_malo')
    await expect(manejarCallbackOAuth()).rejects.toThrow(/no es válida/)
    expect(invoke).not.toHaveBeenCalled()
    expect(window.location.search).toBe('')
  })
  it('con state válido intercambia el code una sola vez', async () => {
    invoke.mockResolvedValue({ data: { id: '1', email: 'a@b.c' }, error: null })
    sessionStorage.setItem('gcal_oauth_state', 'gcal_ok')
    irA('?code=abc&state=gcal_ok')
    expect(await manejarCallbackOAuth()).toEqual({ id: '1', email: 'a@b.c' })
    expect(sessionStorage.getItem('gcal_oauth_state')).toBeNull()
    expect(invoke).toHaveBeenCalledTimes(1)
  })
})

import { scopeParaDireccion } from '@/lib/googleCalendar'

describe('permisos mínimos por dirección', () => {
  it('«solo ver» pide únicamente lectura; enviar/ambas piden escritura', () => {
    expect(scopeParaDireccion('leer')).toContain('calendar.events.readonly')
    expect(scopeParaDireccion('leer')).not.toMatch(/calendar\.events(\s|$)/)
    expect(scopeParaDireccion('ambas')).toMatch(/calendar\.events(\s|$)/)
    expect(scopeParaDireccion('enviar')).not.toContain('readonly')
  })
  it('la dirección elegida viaja al intercambio del code y se limpia', async () => {
    invoke.mockReset(); sessionStorage.clear()
    invoke.mockResolvedValue({ data: { id: '1', email: 'a@b.c' }, error: null })
    sessionStorage.setItem('gcal_oauth_state', 'gcal_ok')
    sessionStorage.setItem('gcal_oauth_direccion', 'leer')
    window.history.replaceState(null, '', '/?code=abc&state=gcal_ok')
    await manejarCallbackOAuth()
    expect(invoke.mock.calls[0][1].body).toMatchObject({ action: 'exchange', direccion: 'leer' })
    expect(sessionStorage.getItem('gcal_oauth_direccion')).toBeNull()
  })
})
