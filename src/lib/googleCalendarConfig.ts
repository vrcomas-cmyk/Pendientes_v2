// =============================================================
//  CONFIGURACIÓN DE GOOGLE CALENDAR (time-blocking / Agenda)
//  El Client ID de Google NO es secreto (se embebe en apps públicas por diseño,
//  igual que la anon key de Supabase) — puede pegarse aquí o configurarse desde
//  la app. El Client Secret NUNCA va aquí: vive solo como secret de la Edge
//  Function `google-calendar` en Supabase. Ver GOOGLE_CALENDAR_SETUP.md.
// =============================================================
const HARDCODED_CLIENT_ID = '486155380991-39j6t51gapu47e2rvehbesv45h6sjlbf.apps.googleusercontent.com'

export function getGoogleClientId(): string {
  let id = HARDCODED_CLIENT_ID
  try { id = id || localStorage.getItem('google_client_id') || '' } catch { /* noop */ }
  return id
}

export function isGoogleConfigurado(): boolean {
  return !!getGoogleClientId()
}

export function saveGoogleClientId(id: string) {
  try { localStorage.setItem('google_client_id', id.trim()) } catch { /* noop */ }
}
