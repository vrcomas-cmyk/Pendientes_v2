import { FunctionsHttpError } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import { getGoogleClientId, isGoogleConfigurado } from '@/lib/googleCalendarConfig'

const SCOPE = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email'

export { isGoogleConfigurado }

function redirectUri(): string {
  // Siempre la raíz del dominio, sin importar desde qué pantalla de la app se dio clic en
  // "Conectar" — así el redirect_uri enviado a Google es siempre el mismo string por dominio,
  // y solo hace falta registrar esa única URL raíz en Google Cloud Console (no una por ruta).
  return window.location.origin + '/'
}

/** Navega a la pantalla de consentimiento de Google. `prompt=consent select_account` fuerza que
    Google siempre pida elegir cuenta y devuelva un refresh_token — imprescindible para conectar
    una SEGUNDA cuenta sin que Google reuse en silencio la sesión de la primera. */
export function iniciarConexionGoogle() {
  const clientId = getGoogleClientId()
  if (!clientId) throw new Error('Falta configurar el Client ID de Google (ver guía de conexión)')
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent select_account',
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

async function invocar<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const sb = getSupabase()
  if (!sb) throw new Error('Necesitas tener una sesión sincronizada para usar Google Calendar')
  const { data, error } = await sb.functions.invoke('google-calendar', { body: { action, ...body } })
  if (error) {
    // FunctionsHttpError trae el mensaje genérico "Edge Function returned a non-2xx status code" en
    // vez del error real que devolvió nuestra función (que sí viaja en el cuerpo de la respuesta).
    let mensajeReal: string | null = null
    if (error instanceof FunctionsHttpError) {
      try { const cuerpo = await error.context.json(); if (cuerpo?.error) mensajeReal = String(cuerpo.error) }
      catch { /* el cuerpo no era JSON; se usa el error genérico */ }
    }
    throw mensajeReal ? new Error(mensajeReal) : error
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(String(data.error))
  return data as T
}

/** Si la URL trae `?code=...` (volviendo del consentimiento de Google), lo intercambia
    y limpia la URL. Se llama una vez al montar la app. Devuelve null si no había code. */
export async function manejarCallbackOAuth(): Promise<{ id: string; email: string } | null> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  if (!code) return null
  url.searchParams.delete('code'); url.searchParams.delete('scope'); url.searchParams.delete('state')
  window.history.replaceState(null, '', url.toString())
  return invocar('exchange', { code, redirect_uri: redirectUri() })
}

export interface CuentaGoogle { id: string; email: string; modoEspejo: 'todo' | 'propio' }

/** Todas las cuentas de Google Calendar conectadas para el usuario actual (puede haber varias). */
export async function listarCuentasGoogle(): Promise<{ configurado: boolean; cuentas: CuentaGoogle[]; error?: string }> {
  if (!isGoogleConfigurado()) return { configurado: false, cuentas: [] }
  try { return await invocar('list-connections') }
  catch (err) { return { configurado: true, cuentas: [], error: (err as Error).message || 'No se pudo consultar Google Calendar' } }
}

export async function desconectarGoogle(cuentaId: string): Promise<void> {
  await invocar('disconnect', { connectionId: cuentaId })
}

/** 'todo' = refleja cualquier pendiente agendado; 'propio' = solo los de proyectos que tengan
    esta cuenta como dueña. */
export async function actualizarModoEspejo(cuentaId: string, modo: 'todo' | 'propio'): Promise<void> {
  await invocar('set-modo', { connectionId: cuentaId, modo })
}

export interface EventoGCal { id: string; cuentaId: string; email: string; titulo: string; inicio?: string; fin?: string; todoElDia: boolean }
interface RespuestaConErrores { errores?: Record<string, string> }

/** Eventos de un rango arbitrario (de TODAS las cuentas conectadas, fusionados) para pintar los
    bloques "ocupado" en día/semana/mes. `desdeISO`/`hastaISO` son instantes ISO completos. */
export async function listarEventosRango(desdeISO: string, hastaISO: string): Promise<{ eventos: EventoGCal[]; errores?: Record<string, string> }> {
  return invocar<{ eventos: EventoGCal[]; errores?: Record<string, string> }>('list-events', { desdeISO, hastaISO })
}

/** Eventos de un solo día. El rango se calcula en hora LOCAL del usuario, no en UTC fijo, para no
    desalinear el día. Envoltorio de `listarEventosRango` para el caso más común (vista Día). */
export async function listarEventosDia(iso: string): Promise<{ eventos: EventoGCal[]; errores?: Record<string, string> }> {
  const desdeISO = new Date(`${iso}T00:00:00`).toISOString()
  const hastaISO = new Date(`${iso}T23:59:59`).toISOString()
  return listarEventosRango(desdeISO, hastaISO)
}

function combinarFechaHora(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora}:00`).toISOString()
}

/** Crea el bloque como evento real en las cuentas destinatarias (espejo): las que reflejan
    "todo", más la dueña del proyecto (`origenCuentaId`) si esa cuenta está en modo "propio".
    Devuelve el mapa cuentaId -> eventId para guardarlo en el pendiente, y los errores por cuenta
    si alguna falló (no se revierte lo que sí funcionó en las demás). */
export async function agendarPendiente(fecha: string, hora: string, duracionMin: number, titulo: string, descripcion?: string, origenCuentaId?: string, soloEstaCuenta?: boolean): Promise<{ eventos: Record<string, string> } & RespuestaConErrores> {
  const inicioISO = combinarFechaHora(fecha, hora)
  const finISO = new Date(new Date(inicioISO).getTime() + duracionMin * 60_000).toISOString()
  return invocar('create-event', { titulo, descripcion, inicioISO, finISO, origenCuentaId, soloEstaCuenta })
}

export async function actualizarEventoAgenda(eventos: Record<string, string>, fecha: string, hora: string, duracionMin: number, titulo: string, descripcion?: string, origenCuentaId?: string): Promise<{ eventos: Record<string, string> } & RespuestaConErrores> {
  const inicioISO = combinarFechaHora(fecha, hora)
  const finISO = new Date(new Date(inicioISO).getTime() + duracionMin * 60_000).toISOString()
  return invocar('update-event', { eventos, titulo, descripcion, inicioISO, finISO, origenCuentaId })
}

export async function eliminarEventoAgenda(eventos: Record<string, string>): Promise<void> {
  await invocar('delete-event', { eventos })
}
