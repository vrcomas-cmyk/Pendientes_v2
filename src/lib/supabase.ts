import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// =============================================================
//  CONFIGURACIÓN DE SUPABASE
//  Opción A (recomendada): pega aquí tu Project URL y anon key.
//    Así quedan "horneadas" en el build y cada dispositivo solo
//    inicia sesión, sin configurar nada.
//  Opción B: déjalas vacías y la app te pedirá pegarlas la primera
//    vez en cada dispositivo (se guardan localmente).
//  La anon key es pública por diseño: la seguridad la dan las
//  políticas RLS de la base de datos.
// =============================================================
const HARDCODED_URL = 'https://fiplfsuhsqibzrpvjvbx.supabase.co'
const HARDCODED_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpcGxmc3Voc3FpYnpycHZqdmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODAyNjgsImV4cCI6MjA4OTg1NjI2OH0.YG3Fk8XJ_n9PGIYUHtoiy-MJNuWqJTsFBwooKnt1X5s'

export function getConfig(): { url: string; anon: string } {
  let url = HARDCODED_URL
  let anon = HARDCODED_ANON
  try {
    url = url || localStorage.getItem('sb_url') || ''
    anon = anon || localStorage.getItem('sb_anon') || ''
  } catch { /* noop */ }
  return { url, anon }
}

export function isConfigured(): boolean {
  const { url, anon } = getConfig()
  return !!url && !!anon
}

export function saveConfig(url: string, anon: string) {
  try {
    localStorage.setItem('sb_url', url.trim())
    localStorage.setItem('sb_anon', anon.trim())
  } catch { /* noop */ }
  _client = null
}

let _client: SupabaseClient | null = null
export function getSupabase(): SupabaseClient | null {
  if (!isConfigured()) return null
  if (!_client) {
    const { url, anon } = getConfig()
    _client = createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return _client
}
