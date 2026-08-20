import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas
const SESSION_START_KEY = 'spa_session_start';
export const DEFAULT_USER_EMAIL = 'cervantes@mauricioglab.local';

export function markSessionStart() {
  try {
    localStorage.setItem(SESSION_START_KEY, String(Date.now()));
  } catch (e) {
    console.warn('No se pudo guardar inicio de sesión:', e);
  }
}

export function clearSessionStart() {
  try {
    localStorage.removeItem(SESSION_START_KEY);
  } catch (e) { /* ignore */ }
}

export function sessionExpired() {
  try {
    const start = Number(localStorage.getItem(SESSION_START_KEY) || 0);
    return start > 0 && Date.now() - start >= SESSION_DURATION_MS;
  } catch (e) {
    return false;
  }
}

export async function enforceSessionExpiry() {
  if (sessionExpired()) {
    await supabase.auth.signOut();
    clearSessionStart();
    return true;
  }
  return false;
}

export function scheduleSessionEnd(callback) {
  const start = Number(localStorage.getItem(SESSION_START_KEY) || 0);
  const remaining = start > 0 ? Math.max(0, SESSION_DURATION_MS - (Date.now() - start)) : SESSION_DURATION_MS;
  return setTimeout(callback, remaining);
}

export function resolveLoginUser(input) {
  const v = (input || '').trim();
  if (v.includes('@')) return v;
  if (v.toLowerCase() === 'cervantes') return DEFAULT_USER_EMAIL;
  return v;
}
