// Edge Function `resumen-correo` (Hito 3): envía el resumen diario/semanal por correo.
//
// Modos de llamada:
//   POST  con cabecera `x-cron-secret` = CRON_SECRET  → ciclo de envío para todos los usuarios (pg_cron cada 15 min).
//   POST  con JWT de usuario y { action: 'prueba' }   → envía ahora un resumen de prueba al propio usuario.
//   GET   ?action=baja&t=<token_baja>                 → baja con un clic desde el correo (público).
// Se despliega con `--no-verify-jwt` (la baja y el cron no llevan JWT); cada rama valida lo suyo.
//
// Secretos requeridos: CRON_SECRET, RESEND_API_KEY, RESUMEN_FROM ("Nombre <correo@dominio-verificado>").
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY los inyecta Supabase.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { construirResumen, enZona, envioPendiente, eventosGoogleAItems, semanaDe, sumarDias, type EventoGoogleCrudo, type ItemEvento, type ItemPendiente, type PrefsResumen } from '../_shared/resumen.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''     // los mismos secretos que usa `google-calendar`
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''
// Tolera errores típicos al pegar el secreto en el panel: comillas alrededor, saltos de línea, espacios
// o el prefijo «RESUMEN_FROM=». Resend exige `correo@dominio` o `Nombre <correo@dominio>` tal cual.
const FROM = (Deno.env.get('RESUMEN_FROM') ?? '').replace(/^\s*RESUMEN_FROM\s*=\s*/, '').replace(/[\r\n]+/g, ' ').trim().replace(/^["'“”]+|["'“”]+$/g, '').trim()

const MAX_INTENTOS = 3
const ENVIANDO_CADUCA_MS = 15 * 60 * 1000

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
const html = (cuerpo: string) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;max-width:480px;margin:15vh auto;padding:16px;text-align:center">${cuerpo}</body>`, { headers: { ...CORS, 'Content-Type': 'text/html; charset=utf-8' } })

interface PrefsFila extends PrefsResumen { user_id: string; email: string; token_baja: string }

interface CuentaGoogleFila { id: string; google_email: string; calendar_id: string; refresh_token: string; access_token: string | null; expires_at: string | null; direccion?: string | null }

/** Access token vigente de una cuenta de Google (lo renueva si venció). Null si no se pudo. */
async function tokenGoogle(admin: SupabaseClient, c: CuentaGoogleFila): Promise<string | null> {
  const vence = c.expires_at ? new Date(c.expires_at).getTime() : 0
  if (c.access_token && vence > Date.now() + 60_000) return c.access_token
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, refresh_token: c.refresh_token, grant_type: 'refresh_token' }),
  })
  if (!r.ok) return null
  const j = await r.json()
  await admin.from('pnp_google_calendar').update({ access_token: j.access_token, expires_at: new Date(Date.now() + (j.expires_in ?? 3600) * 1000).toISOString(), updated_at: new Date().toISOString() }).eq('id', c.id)
  return j.access_token as string
}

/** Eventos de Google Calendar de las cuentas conectadas del espacio (excepto las «solo enviar»).
    Un fallo en una cuenta no impide el correo: se avisa con una nota al pie. */
async function eventosDeGoogle(admin: SupabaseClient, espacios: string[], zona: string, desde: string, hasta: string, espejados: Set<string>) {
  const avisos: string[] = []
  const { data: cuentas } = await admin.from('pnp_google_calendar').select('id, google_email, calendar_id, refresh_token, access_token, expires_at, direccion').in('espacio_id', espacios)
  const crudos: EventoGoogleCrudo[] = []
  for (const c of (cuentas ?? []) as CuentaGoogleFila[]) {
    if ((c.direccion ?? 'ambas') === 'enviar') continue
    try {
      const token = await tokenGoogle(admin, c)
      if (!token) throw new Error('sin acceso')
      // Ventana amplia en UTC (±1-2 días) para cubrir cualquier zona; el recorte exacto lo hace `eventosGoogleAItems`.
      const params = new URLSearchParams({ timeMin: `${sumarDias(desde, -1)}T00:00:00Z`, timeMax: `${sumarDias(hasta, 2)}T00:00:00Z`, singleEvents: 'true', orderBy: 'startTime', maxResults: '250' })
      const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(c.calendar_id)}/events?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) throw new Error(String(r.status))
      crudos.push(...(((await r.json()).items ?? []) as EventoGoogleCrudo[]))
    } catch { avisos.push(`No se pudieron leer los eventos de Google Calendar de ${c.google_email}.`) }
  }
  return { items: eventosGoogleAItems(crudos, zona, desde, hasta, espejados), avisos }
}

/** Pendientes abiertos, eventos (de la app y de Google Calendar) y vencidos de los espacios del usuario. */
async function datosDelRango(admin: SupabaseClient, userId: string, desde: string, hasta: string, zona: string) {
  const { data: miembros } = await admin.from('pnp_espacio_miembros').select('espacio_id').eq('user_id', userId)
  const espacios = (miembros ?? []).map(m => m.espacio_id as string)
  if (!espacios.length) return { pendientes: [] as ItemPendiente[], eventos: [] as ItemEvento[], vencidos: [] as ItemPendiente[], notas: [] as string[] }

  // Columna «completado» configurable por espacio; por defecto el id 'completado'.
  const { data: cfg } = await admin.from('pnp_espacios').select('config').in('id', espacios)
  const completados = new Set<string>(['completado'])
  for (const e of cfg ?? []) for (const c of ((e.config as { columnas?: { id: string; esCompletado?: boolean }[] })?.columnas ?? [])) if (c.esCompletado) completados.add(c.id)

  const { data: ps } = await admin.from('pnp_pendientes').select('data').in('espacio_id', espacios)
    .gte('data->>fechaLimite', desde).lte('data->>fechaLimite', hasta).limit(2000)
  const { data: es } = await admin.from('pnp_eventos').select('data').in('espacio_id', espacios)
    .gte('data->>fecha', desde).lte('data->>fecha', hasta).limit(2000)

  const abierto = (p: Record<string, unknown>) => !p.borrado && !p.archivado && !p.fechaCompletado && !completados.has(String(p.estado))
  const aItem = (p: Record<string, unknown>): ItemPendiente => ({ titulo: String(p.titulo ?? ''), hora: (p.hora as string) || undefined, fechaLimite: String(p.fechaLimite), prioridad: p.prioridad as string, proyecto: (p.proyecto as string) || undefined })
  const pendientesRaw = (ps ?? []).map(r => r.data as Record<string, unknown>)
  const eventosRaw = (es ?? []).map(r => r.data as Record<string, unknown>)
  const pendientes: ItemPendiente[] = pendientesRaw.filter(abierto).map(aItem)
  const eventos: ItemEvento[] = eventosRaw.filter(e => !e.borrado)
    .map(e => ({ titulo: String(e.titulo ?? ''), fecha: String(e.fecha), hora: String(e.hora ?? ''), duracionMin: Number(e.duracionMin ?? 0) }))

  // Vencidos: abiertos con fecha límite anterior al inicio del rango (los 100 más recientes alcanzan para un correo).
  const { data: vs } = await admin.from('pnp_pendientes').select('data').in('espacio_id', espacios)
    .gte('data->>fechaLimite', '2000-01-01').lt('data->>fechaLimite', desde).limit(300)
  const vencidos = (vs ?? []).map(r => r.data as Record<string, unknown>).filter(abierto).map(aItem)
    .sort((a, b) => b.fechaLimite.localeCompare(a.fechaLimite)).slice(0, 100)

  // Google Calendar: los eventos que la propia app espejó ya salen como pendiente/evento propio; no se repiten.
  const espejados = new Set<string>()
  for (const x of [...pendientesRaw, ...eventosRaw]) for (const id of Object.values((x.googleEventos as Record<string, string> | undefined) ?? {})) espejados.add(id)
  const google = await eventosDeGoogle(admin, espacios, zona, desde, hasta, espejados)
  return { pendientes, eventos: [...eventos, ...google.items], vencidos, notas: google.avisos }
}

async function enviarCorreo(para: string, asunto: string, htmlCuerpo: string, texto: string, idempotencia: string, urlBaja: string): Promise<void> {
  if (!RESEND_API_KEY || !FROM) throw new Error('Faltan RESEND_API_KEY / RESUMEN_FROM en los secretos de la función')
  if (!/^(?:[^<>]+<[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>|[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)$/.test(FROM)) {
    // Se muestra el valor leído (es un remitente, no un secreto) para ver qué quedó guardado en realidad.
    throw new Error(`RESUMEN_FROM no tiene un formato válido; el valor leído es «${FROM}». Debe ser: Pendientes Pro <resumen@tu-dominio.com> (sin comillas).`)
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencia },
    body: JSON.stringify({
      from: FROM, to: [para], subject: asunto, html: htmlCuerpo, text: texto,
      headers: { 'List-Unsubscribe': `<${urlBaja}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    }),
  })
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 300)}`)
}

function construirDe(prefs: PrefsFila, tipo: 'diario' | 'semanal', fecha: string, datos: Awaited<ReturnType<typeof datosDelRango>>) {
  const urlBaja = `${SUPABASE_URL}/functions/v1/resumen-correo?action=baja&t=${prefs.token_baja}`
  return { urlBaja, resumen: construirResumen({ tipo, fecha, pendientes: datos.pendientes, eventos: datos.eventos, vencidos: datos.vencidos, notas: datos.notas, urlBaja }) }
}

/** Reclama el envío (user, tipo, clave). Devuelve true solo si ESTA ejecución debe enviar. */
async function reclamar(admin: SupabaseClient, userId: string, tipo: string, clave: string): Promise<boolean> {
  const ins = await admin.from('pnp_resumen_envios').insert({ user_id: userId, tipo, clave, estado: 'enviando', intentos: 1 })
  if (!ins.error) return true
  if (ins.error.code !== '23505') throw ins.error // 23505 = ya existe (otra ejecución o intento previo)
  const { data: fila } = await admin.from('pnp_resumen_envios').select('id, estado, intentos, actualizado').eq('user_id', userId).eq('tipo', tipo).eq('clave', clave).single()
  if (!fila) return false
  const caducado = fila.estado === 'enviando' && Date.now() - new Date(fila.actualizado).getTime() > ENVIANDO_CADUCA_MS
  if (!(fila.estado === 'error' || caducado) || fila.intentos >= MAX_INTENTOS) return false
  // Actualización condicional: si dos ejecuciones compiten, solo una cambia la fila.
  const { data: ganada } = await admin.from('pnp_resumen_envios')
    .update({ estado: 'enviando', intentos: fila.intentos + 1, actualizado: new Date().toISOString() })
    .eq('id', fila.id).eq('estado', fila.estado).eq('intentos', fila.intentos).select('id')
  return !!ganada?.length
}

async function marcar(admin: SupabaseClient, userId: string, tipo: string, clave: string, estado: 'enviado' | 'error' | 'omitido', error?: string) {
  await admin.from('pnp_resumen_envios').update({ estado, error: error ?? null, actualizado: new Date().toISOString() }).eq('user_id', userId).eq('tipo', tipo).eq('clave', clave)
}

async function cicloDeEnvio(admin: SupabaseClient) {
  const { data: lista, error } = await admin.from('pnp_resumen_prefs').select('*').eq('activo', true)
  if (error) throw error
  const ahora = new Date()
  const res = { revisados: 0, enviados: 0, omitidos: 0, errores: 0 }
  for (const prefs of (lista ?? []) as PrefsFila[]) {
    res.revisados++
    const toca = envioPendiente(prefs, ahora)
    if (!toca) continue
    try {
      if (!(await reclamar(admin, prefs.user_id, toca.tipo, toca.clave))) continue
      const rango = toca.tipo === 'diario' ? { d: toca.clave, h: toca.clave } : { d: semanaDe(toca.clave).lunes, h: semanaDe(toca.clave).domingo }
      const datos = await datosDelRango(admin, prefs.user_id, rango.d, rango.h, prefs.zona)
      const { urlBaja, resumen } = construirDe(prefs, toca.tipo, toca.clave, datos)
      if (resumen.vacio) { await marcar(admin, prefs.user_id, toca.tipo, toca.clave, 'omitido'); res.omitidos++; continue } // no se mandan correos vacíos
      try {
        await enviarCorreo(prefs.email, resumen.asunto, resumen.html, resumen.texto, `${prefs.user_id}:${toca.tipo}:${toca.clave}`, urlBaja)
        await marcar(admin, prefs.user_id, toca.tipo, toca.clave, 'enviado'); res.enviados++
      } catch (err) {
        await marcar(admin, prefs.user_id, toca.tipo, toca.clave, 'error', err instanceof Error ? err.message : String(err)); res.errores++
      }
    } catch { res.errores++ }
  }
  return res
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY)
    const url = new URL(req.url)

    // ---- Baja con un clic (público; el token es secreto y único por usuario) ----
    if (req.method === 'GET' && url.searchParams.get('action') === 'baja') {
      const t = url.searchParams.get('t') ?? ''
      if (!/^[0-9a-f-]{36}$/i.test(t)) return html('<h2>Enlace no válido</h2>')
      const { data } = await admin.from('pnp_resumen_prefs').update({ activo: false, actualizado: new Date().toISOString() }).eq('token_baja', t).select('user_id')
      return html(data?.length ? '<h2>Listo</h2><p>Ya no recibirás los resúmenes por correo. Puedes volver a activarlos en Ajustes.</p>' : '<h2>Enlace no válido</h2>')
    }
    if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

    // ---- Cron ----
    const secreto = req.headers.get('x-cron-secret')
    if (secreto) {
      if (!CRON_SECRET || secreto !== CRON_SECRET) return json({ error: 'No autorizado' }, 401)
      return json(await cicloDeEnvio(admin))
    }

    // ---- Resumen de prueba para el usuario autenticado ----
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'No autenticado' }, 401)
    const body = await req.json().catch(() => ({}))
    if (body.action !== 'prueba') return json({ error: 'Acción desconocida' }, 400)

    const { data: prefs } = await admin.from('pnp_resumen_prefs').select('*').eq('user_id', user.id).maybeSingle()
    if (!prefs) return json({ error: 'Guarda primero tus preferencias de resumen' }, 400)
    const tipo: 'diario' | 'semanal' = body.tipo === 'semanal' ? 'semanal' : 'diario'
    const z = enZona(new Date(), (prefs as PrefsFila).zona)
    const rango = tipo === 'diario' ? { d: z.fecha, h: z.fecha } : { d: semanaDe(z.fecha).lunes, h: semanaDe(z.fecha).domingo }
    const datos = await datosDelRango(admin, user.id, rango.d, rango.h, (prefs as PrefsFila).zona)
    const { urlBaja, resumen } = construirDe(prefs as PrefsFila, tipo, z.fecha, datos)
    await enviarCorreo((prefs as PrefsFila).email, '[Prueba] ' + resumen.asunto, resumen.html, resumen.texto, `prueba:${user.id}:${Date.now()}`, urlBaja)
    return json({ ok: true, vacio: resumen.vacio })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error interno' }, 500)
  }
})
