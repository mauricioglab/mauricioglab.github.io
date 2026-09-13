// Cliente Supabase real, usado solo por el módulo de Seguimiento (grupos/practicantes),
// que se queda en Supabase Cloud mientras el resto del sitio corre sobre PocketBase
// self-hosted (ver src/lib/supabase.ts). Se mantiene separado a propósito para que sacar
// Seguimiento de spa-depot en el futuro sea borrar este archivo + los que lo importan.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SEGUIMIENTO_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SEGUIMIENTO_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase (Seguimiento) env vars not configured. Set PUBLIC_SEGUIMIENTO_SUPABASE_URL and PUBLIC_SEGUIMIENTO_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export {
  SESSION_DURATION_MS,
  DEFAULT_USER_EMAIL,
  markSessionStart,
  clearSessionStart,
  sessionExpired,
  scheduleSessionEnd,
  resolveLoginUser,
} from './session';
import { sessionExpired, clearSessionStart } from './session';

export async function enforceSessionExpiry() {
  if (sessionExpired()) {
    await supabase.auth.signOut();
    clearSessionStart();
    return true;
  }
  return false;
}
