// Cliente de datos del sitio: Supabase self-hosted en Contabo (https://api.velocitylab.com.ar).
// Mantiene el export `db` con la API de supabase-js (`.from()`, `.auth`, `.storage`, `.functions`)
// que ya usan los paneles de administración y las utilidades de contenido.
import { createClient } from '@supabase/supabase-js';
import { sessionExpired, clearSessionStart } from './session';

const supabaseUrl = (import.meta.env.PUBLIC_SUPABASE_URL as string | undefined) || 'https://api.velocitylab.com.ar';
// Clave `anon`: es pública por diseño. La seguridad real está en las políticas RLS de la base.
const supabaseAnonKey = (import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined) || '';

const inBrowser = typeof window !== 'undefined';

export const db = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: inBrowser, autoRefreshToken: inBrowser, detectSessionInUrl: false },
});

export {
  SESSION_DURATION_MS,
  DEFAULT_USER_EMAIL,
  markSessionStart,
  clearSessionStart,
  sessionExpired,
  scheduleSessionEnd,
  resolveLoginUser,
} from './session';

/** Cierra la sesión de Supabase si pasó el tiempo máximo de sesión del panel. */
export async function enforceSessionExpiry() {
  if (sessionExpired()) {
    await db.auth.signOut();
    clearSessionStart();
    return true;
  }
  return false;
}
