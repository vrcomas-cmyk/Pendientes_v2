// Edge Function: intermediario entre la app y Google Calendar — soporta VARIAS cuentas de
// Google por usuario (una fila en `pnp_google_calendar` por cuenta conectada). El fan-out de
// escritura es asimétrico por `modo_espejo`: las cuentas en 'todo' reciben cualquier pendiente
// agendado; las cuentas en 'propio' solo reciben los pendientes cuyo proyecto las tiene como
// dueña (`origenCuentaId`). La lectura de "ocupado" (list-events) no se filtra por modo.
// Nunca expone refresh_token/client_secret al navegador: el cliente solo habla con esta función
// (autenticado con su JWT de Supabase); los tokens de Google viven en una tabla con RLS deny-all,
// solo accesible aquí vía service_role.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

interface Cuenta {
  id: string
  user_id: string
  refresh_token: string
  access_token: string | null
  expires_at: string | null
  google_email: string
  calendar_id: string
  modo_espejo: 'todo' | 'propio'
}

async function cuentasDelUsuario(admin: SupabaseClient, userId: string): Promise<Cuenta[]> {
  const { data } = await admin.from('pnp_google_calendar').select('*').eq('user_id', userId)
  return (data || []) as Cuenta[]
}

/** Access token vigente para una cuenta, refrescándolo si expiró. Null si no se pudo renovar. */
async function tokenVigente(admin: SupabaseClient, cuenta: Cuenta): Promise<string | null> {
  const vence = cuenta.expires_at ? new Date(cuenta.expires_at).getTime() : 0
  if (cuenta.access_token && vence > Date.now() + 60_000) return cuenta.access_token
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: cuenta.refresh_token, grant_type: 'refresh_token' }),
  })
  const j = await r.json()
  if (!r.ok) return null
  const expires_at = new Date(Date.now() + (j.expires_in ?? 3600) * 1000).toISOString()
  await admin.from('pnp_google_calendar').update({ access_token: j.access_token, expires_at, updated_at: new Date().toISOString() }).eq('id', cuenta.id)
  return j.access_token as string
}

function urlEventos(cuenta: Cuenta, eventId?: string): string {
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cuenta.calendar_id)}/events`
  return eventId ? `${base}/${encodeURIComponent(eventId)}` : base
}

async function accionExchange(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  if (!CLIENT_ID || !CLIENT_SECRET) return json({ error: 'Google Calendar no está configurado en el servidor (faltan credenciales).' }, 400)
  const { code, redirect_uri } = body as { code?: string; redirect_uri?: string }
  if (!code || !redirect_uri) return json({ error: 'Falta code o redirect_uri' }, 400)
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri, grant_type: 'authorization_code' }),
  })
  const j = await r.json()
  if (!r.ok) return json({ error: j.error_description || 'No se pudo conectar con Google' }, 400)
  const perfilRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${j.access_token}` } })
  const perfil = perfilRes.ok ? await perfilRes.json() : {}
  const email = perfil.email as string | undefined
  if (!email) return json({ error: 'No se pudo obtener el correo de la cuenta de Google' }, 400)
  let refreshToken: string | undefined = j.refresh_token
  if (!refreshToken) {
    const { data: existente } = await admin.from('pnp_google_calendar').select('refresh_token').eq('user_id', userId).eq('google_email', email).maybeSingle()
    refreshToken = existente?.refresh_token as string | undefined
  }
  if (!refreshToken) return json({ error: 'Google no otorgó acceso permanente. Vuelve a intentar y acepta todos los permisos solicitados.' }, 400)
  const expires_at = new Date(Date.now() + (j.expires_in ?? 3600) * 1000).toISOString()
  const { data: fila, error } = await admin.from('pnp_google_calendar')
    .upsert(
      { user_id: userId, google_email: email, refresh_token: refreshToken, access_token: j.access_token, expires_at, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,google_email' },
    )
    .select('id, google_email')
    .single()
  if (error) return json({ error: error.message }, 400)
  return json({ id: fila.id, email: fila.google_email })
}

async function accionListConnections(admin: SupabaseClient, userId: string) {
  if (!CLIENT_ID || !CLIENT_SECRET) return json({ configurado: false, cuentas: [] })
  const { data } = await admin.from('pnp_google_calendar').select('id, google_email, modo_espejo').eq('user_id', userId).order('updated_at')
  return json({ configurado: true, cuentas: (data || []).map(d => ({ id: d.id, email: d.google_email, modoEspejo: d.modo_espejo })) })
}

async function accionSetModo(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const { connectionId, modo } = body as { connectionId?: string; modo?: string }
  if (!connectionId || (modo !== 'todo' && modo !== 'propio')) return json({ error: 'Falta connectionId o modo inválido' }, 400)
  const { error } = await admin.from('pnp_google_calendar').update({ modo_espejo: modo }).eq('id', connectionId).eq('user_id', userId)
  if (error) return json({ error: error.message }, 400)
  return json({ ok: true })
}

async function accionDisconnect(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const { connectionId } = body as { connectionId?: string }
  if (!connectionId) return json({ error: 'Falta connectionId' }, 400)
  const { data } = await admin.from('pnp_google_calendar').select('access_token').eq('id', connectionId).eq('user_id', userId).maybeSingle()
  if (data?.access_token) {
    try { await fetch(`https://oauth2.googleapis.com/revoke?token=${data.access_token}`, { method: 'POST' }) } catch { /* noop */ }
  }
  await admin.from('pnp_google_calendar').delete().eq('id', connectionId).eq('user_id', userId)
  return json({ ok: true })
}

interface GEvento { id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }

async function accionListEvents(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  // desdeISO/hastaISO son instantes ISO completos (con offset), calculados por el cliente a
  // partir de la medianoche LOCAL del usuario — no se arman aquí con un "Z" fijo, porque eso
  // desalinea el rango en cualquier huso horario distinto de UTC+0.
  const { desdeISO, hastaISO } = body as { desdeISO?: string; hastaISO?: string }
  if (!desdeISO || !hastaISO) return json({ error: 'Falta desdeISO/hastaISO' }, 400)
  const cuentas = await cuentasDelUsuario(admin, userId)
  const eventos: { id: string; cuentaId: string; email: string; titulo: string; inicio?: string; fin?: string; todoElDia: boolean }[] = []
  const errores: Record<string, string> = {}
  await Promise.all(cuentas.map(async cuenta => {
    const token = await tokenVigente(admin, cuenta)
    if (!token) { errores[cuenta.id] = 'No se pudo renovar el acceso'; return }
    const params = new URLSearchParams({ timeMin: desdeISO, timeMax: hastaISO, singleEvents: 'true', orderBy: 'startTime' })
    const r = await fetch(`${urlEventos(cuenta)}?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    const j = await r.json()
    if (!r.ok) { errores[cuenta.id] = j.error?.message || 'Error al leer Google Calendar'; return }
    for (const e of (j.items || []) as GEvento[]) {
      eventos.push({
        id: e.id, cuentaId: cuenta.id, email: cuenta.google_email, titulo: e.summary || '(sin título)',
        inicio: e.start?.dateTime || e.start?.date, fin: e.end?.dateTime || e.end?.date, todoElDia: !e.start?.dateTime,
      })
    }
  }))
  return json({ eventos, errores })
}

/** Cuentas destinatarias del espejo para un pendiente dado: las que reflejan "todo", más la
    dueña del proyecto (si tiene) cuando esa cuenta está en modo "propio". Una cuenta "propio"
    cuyo id no coincide con `origenCuentaId` queda fuera del fan-out por completo. */
function cuentasDestino(cuentas: Cuenta[], origenCuentaId?: string): Cuenta[] {
  return cuentas.filter(c => c.modo_espejo === 'todo' || (c.modo_espejo === 'propio' && c.id === origenCuentaId))
}

async function accionCreateEvent(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const { titulo, descripcion, inicioISO, finISO, origenCuentaId, soloEstaCuenta } = body as { titulo?: string; descripcion?: string; inicioISO?: string; finISO?: string; origenCuentaId?: string; soloEstaCuenta?: boolean }
  if (!titulo || !inicioISO || !finISO) return json({ error: 'Falta titulo/inicioISO/finISO' }, 400)
  const todasLasCuentas = await cuentasDelUsuario(admin, userId)
  if (!todasLasCuentas.length) return json({ error: 'No hay ninguna cuenta de Google Calendar conectada' }, 400)
  // `soloEstaCuenta` es para eventos sueltos creados desde una cuenta "propio" (perfil laboral):
  // en vez del fan-out normal de espejo, el evento vive SOLO en esa cuenta, sin reflejarse en las
  // cuentas "todo" (perfil personal). Sin esta bandera se preserva el comportamiento de siempre
  // (usado por el time-blocking de pendientes, que sí debe reflejarse en todo lo que dice "todo").
  const cuentas = soloEstaCuenta && origenCuentaId
    ? todasLasCuentas.filter(c => c.id === origenCuentaId)
    : cuentasDestino(todasLasCuentas, origenCuentaId)
  const eventos: Record<string, string> = {}
  const errores: Record<string, string> = {}
  await Promise.all(cuentas.map(async cuenta => {
    const token = await tokenVigente(admin, cuenta)
    if (!token) { errores[cuenta.id] = 'No se pudo renovar el acceso'; return }
    const r = await fetch(urlEventos(cuenta), {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: titulo, description: descripcion || undefined, start: { dateTime: inicioISO }, end: { dateTime: finISO } }),
    })
    const j = await r.json()
    if (!r.ok) { errores[cuenta.id] = j.error?.message || 'No se pudo crear el evento'; return }
    eventos[cuenta.id] = j.id
  }))
  return json({ eventos, errores })
}

async function accionUpdateEvent(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const { eventos: existentes, titulo, descripcion, inicioISO, finISO, origenCuentaId } = body as { eventos?: Record<string, string>; titulo?: string; descripcion?: string; inicioISO?: string; finISO?: string; origenCuentaId?: string }
  if (!inicioISO || !finISO) return json({ error: 'Falta inicioISO/finISO' }, 400)
  const todasLasCuentas = await cuentasDelUsuario(admin, userId)
  const cuentas = cuentasDestino(todasLasCuentas, origenCuentaId)
  const eventos: Record<string, string> = { ...(existentes || {}) }
  const errores: Record<string, string> = {}
  await Promise.all(cuentas.map(async cuenta => {
    const token = await tokenVigente(admin, cuenta)
    if (!token) { errores[cuenta.id] = 'No se pudo renovar el acceso'; return }
    // Si la cuenta no tenía evento propio (se conectó después de crear el bloque), se crea ahora.
    const idExistente = existentes?.[cuenta.id]
    const r = await fetch(urlEventos(cuenta, idExistente), {
      method: idExistente ? 'PATCH' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: titulo, description: descripcion || undefined, start: { dateTime: inicioISO }, end: { dateTime: finISO } }),
    })
    const j = await r.json()
    if (!r.ok) { errores[cuenta.id] = j.error?.message || 'No se pudo actualizar el evento'; return }
    eventos[cuenta.id] = j.id
  }))
  return json({ eventos, errores })
}

async function accionDeleteEvent(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const { eventos } = body as { eventos?: Record<string, string> }
  if (!eventos || !Object.keys(eventos).length) return json({ ok: true })
  const cuentas = await cuentasDelUsuario(admin, userId)
  const mapa = new Map(cuentas.map(c => [c.id, c]))
  const errores: Record<string, string> = {}
  await Promise.all(Object.entries(eventos).map(async ([cuentaId, eventId]) => {
    const cuenta = mapa.get(cuentaId)
    if (!cuenta) return // esa cuenta ya no está conectada; nada que borrar ahí
    const token = await tokenVigente(admin, cuenta)
    if (!token) { errores[cuentaId] = 'No se pudo renovar el acceso'; return }
    const r = await fetch(urlEventos(cuenta, eventId), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok && r.status !== 404 && r.status !== 410) {
      const j = await r.json().catch(() => ({}))
      errores[cuentaId] = j.error?.message || 'No se pudo eliminar el evento'
    }
  }))
  return json({ ok: true, errores })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'No autenticado' }, 401)

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)
    const body = await req.json().catch(() => ({}))
    const action = body.action as string

    switch (action) {
      case 'exchange': return await accionExchange(admin, user.id, body)
      case 'list-connections': return await accionListConnections(admin, user.id)
      case 'set-modo': return await accionSetModo(admin, user.id, body)
      case 'disconnect': return await accionDisconnect(admin, user.id, body)
      case 'list-events': return await accionListEvents(admin, user.id, body)
      case 'create-event': return await accionCreateEvent(admin, user.id, body)
      case 'update-event': return await accionUpdateEvent(admin, user.id, body)
      case 'delete-event': return await accionDeleteEvent(admin, user.id, body)
      default: return json({ error: 'Acción desconocida: ' + action }, 400)
    }
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error interno' }, 500)
  }
})
