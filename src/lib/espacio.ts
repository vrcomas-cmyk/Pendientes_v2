import { getSupabase } from '@/lib/supabase'

function codigoAleatorio(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export interface Invitacion { id: string; codigo: string; email: string | null; expira: string }

/** Genera un código de invitación para vincular una cuenta hija a este espacio. Solo la padre puede
    (lo aplica la política RLS de `pnp_invitaciones`, no este código). */
export async function crearInvitacion(espacioId: string, creadorId: string, email?: string): Promise<Invitacion> {
  const sb = getSupabase()
  if (!sb) throw new Error('Sin conexión a Supabase')
  const { data, error } = await sb.from('pnp_invitaciones')
    .insert({ espacio_id: espacioId, codigo: codigoAleatorio(), email: email?.trim().toLowerCase() || null, creado_por: creadorId })
    .select('id, codigo, email, expira').single()
  if (error) throw error
  return data as Invitacion
}

/** Canjea un código: une la cuenta actual como "hija" al espacio de la invitación. */
export async function canjearInvitacion(codigo: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Sin conexión a Supabase')
  const { error } = await sb.rpc('pnp_canjear_invitacion', { p_codigo: codigo.trim().toUpperCase() })
  if (error) throw error
}

/** Quita una cuenta hija del espacio (solo la padre puede, vía RLS). */
export async function quitarMiembro(userId: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) throw new Error('Sin conexión a Supabase')
  const { error } = await sb.from('pnp_espacio_miembros').delete().eq('user_id', userId)
  if (error) throw error
}
