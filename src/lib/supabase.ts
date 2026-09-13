// Compatibility shim: exposes a supabase-js-like `supabase` object (`.from()`, `.auth`, `.storage`,
// `.rpc()`) backed by the self-hosted PocketBase instance, so existing call sites across the app
// keep working with minimal changes after moving off Supabase Cloud.
import { pb } from './pb';

const LEGACY_ID_COLLECTIONS = new Set([
  'grupos', 'integrantes', 'criterios', 'evaluaciones', 'asistencias', 'planilla',
  'carreras', 'practicas', 'comisiones', 'alertas_tipos', 'encuentros_meta',
]);

// grupo_id / encuentro_meta_id / evaluacion_id (old FK-by-legacy-int columns) -> new relation field name
const RELATION_FIELD_MAP: Record<string, string> = {
  grupo_id: 'grupo',
  encuentro_meta_id: 'encuentro_meta',
  evaluacion_id: 'evaluacion',
};

function isLegacyId(v: any) {
  return typeof v === 'number' || (typeof v === 'string' && /^-?\d+$/.test(v));
}

function pbFilterField(collection: string, col: string) {
  if (col === 'id' && LEGACY_ID_COLLECTIONS.has(collection)) return 'legacy_id';
  return RELATION_FIELD_MAP[col] || col;
}

// Renames old FK-by-legacy-int payload keys (grupo_id, etc.) to the new relation field name
// before sending a create/update body to PocketBase.
function mapPayloadFields(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    out[RELATION_FIELD_MAP[k] || k] = v;
  }
  return out;
}

function esc(v: any) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return `"${String(v).replace(/"/g, '\\"')}"`;
}

// `profiles` no longer exists as its own collection - role/nombre now live directly on `users`
// (see the plan's PocketBase migration: RLS policies referencing `profiles` were folded in).
const TABLE_ALIAS: Record<string, string> = { profiles: 'users' };

class QueryBuilder implements PromiseLike<{ data: any; error: any }> {
  private table: string;
  private filters: string[] = [];
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;
  private wantSingle = false;
  private wantMaybe = false;
  private sortStr = '';
  private limitN = 0;
  private upsertConflictCols: string[] | null = null;

  constructor(table: string) {
    this.table = TABLE_ALIAS[table] || table;
  }

  select(_cols?: string) {
    return this;
  }

  eq(col: string, val: any) {
    if (col === 'id' && LEGACY_ID_COLLECTIONS.has(this.table) && !isLegacyId(val)) {
      // real PocketBase id (post-migration record) - filter by id directly
      this.filters.push(`id = ${esc(val)}`);
      return this;
    }
    const field = pbFilterField(this.table, col);
    const value = field === col && RELATION_FIELD_MAP[col] === undefined ? val : val;
    this.filters.push(`${field} = ${esc(value)}`);
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    const dir = opts && opts.ascending === false ? '-' : '+';
    this.sortStr = `${dir}${col}`;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  maybeSingle() {
    this.wantSingle = true;
    this.wantMaybe = true;
    return this;
  }

  insert(payload: any) {
    this.op = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.op = 'update';
    this.payload = payload;
    return this;
  }

  upsert(payload: any, opts?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = payload;
    this.upsertConflictCols = opts?.onConflict ? opts.onConflict.split(',').map((c) => c.trim()) : null;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  private async resolveIdForUpdateOrDelete(): Promise<string | null> {
    const idFilter = this.filters.find((f) => f.startsWith('legacy_id = ') || f.startsWith('id = '));
    if (!idFilter) return null;
    if (idFilter.startsWith('id = ') && !idFilter.includes('legacy_id')) {
      const m = idFilter.match(/^id = "?(.+?)"?$/);
      if (m) return m[1];
    }
    const rec = await pb.collection(this.table).getFirstListItem(this.filters.join(' && ')).catch(() => null);
    return rec ? rec.id : null;
  }

  private async execute() {
    try {
      if (this.op === 'select') {
        if (this.wantSingle) {
          const rec = await pb.collection(this.table).getFirstListItem(this.filters.join(' && ') || '');
          return { data: rec, error: null };
        }
        const result = await pb.collection(this.table).getList(1, this.limitN || 200, {
          filter: this.filters.join(' && ') || undefined,
          sort: this.sortStr || undefined,
        });
        return { data: result.items, error: null };
      }
      if (this.op === 'insert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const created = [];
        for (const item of items) created.push(await pb.collection(this.table).create(mapPayloadFields(item)));
        return { data: Array.isArray(this.payload) ? created : created[0], error: null };
      }
      if (this.op === 'update') {
        const id = await this.resolveIdForUpdateOrDelete();
        if (!id) return { data: null, error: new Error('No matching record to update') };
        const rec = await pb.collection(this.table).update(id, mapPayloadFields(this.payload));
        return { data: rec, error: null };
      }
      if (this.op === 'delete') {
        const id = await this.resolveIdForUpdateOrDelete();
        if (!id) return { data: null, error: new Error('No matching record to delete') };
        await pb.collection(this.table).delete(id);
        return { data: null, error: null };
      }
      if (this.op === 'upsert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const results = [];
        for (const item of items) {
          let filter: string | null = null;
          const createItem = { ...item };

          if (this.upsertConflictCols) {
            filter = this.upsertConflictCols
              .map((col) => `${pbFilterField(this.table, col)} = ${esc(item[col])}`)
              .join(' && ');
          } else if (item.id !== undefined && isLegacyId(item.id) && LEGACY_ID_COLLECTIONS.has(this.table)) {
            filter = `legacy_id = ${esc(item.id)}`;
            delete createItem.id;
            createItem.legacy_id = item.id;
          } else if (item.legacy_id !== undefined) {
            filter = `legacy_id = ${esc(item.legacy_id)}`;
          } else if (item.id !== undefined) {
            filter = `id = ${esc(item.id)}`;
          }

          const existing = filter
            ? await pb.collection(this.table).getFirstListItem(filter).catch(() => null)
            : null;
          if (existing) results.push(await pb.collection(this.table).update(existing.id, mapPayloadFields(createItem)));
          else results.push(await pb.collection(this.table).create(mapPayloadFields(createItem)));
        }
        return { data: results, error: null };
      }
      return { data: null, error: new Error('Unsupported operation') };
    } catch (error: any) {
      if (this.wantMaybe && error?.status === 404) return { data: null, error: null };
      return { data: null, error };
    }
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }
}

function toSupabaseUser(record: any) {
  if (!record) return null;
  return {
    id: record.id,
    email: record.email,
    user_metadata: { nombre: record.nombre },
  };
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },

  async rpc(fn: string, _args?: any) {
    if (fn === 'get_profesores') {
      try {
        const users = await pb.collection('users').getFullList({ sort: 'nombre' });
        const data = users.map((u: any) => ({
          nombre: u.nombre || (u.email || '').split('@')[0],
          email: u.email,
          role: u.role || 'profesor',
        }));
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
    return { data: null, error: new Error(`rpc "${fn}" not implemented in PocketBase shim`) };
  },

  auth: {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const result = await pb.collection('users').authWithPassword(email, password);
        return { data: { user: toSupabaseUser(result.record), session: { access_token: pb.authStore.token } }, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error };
      }
    },

    async signOut() {
      pb.authStore.clear();
      return { error: null };
    },

    async getSession() {
      if (pb.authStore.isValid) {
        return { data: { session: { access_token: pb.authStore.token, user: toSupabaseUser(pb.authStore.record) } }, error: null };
      }
      return { data: { session: null }, error: null };
    },

    async resetPasswordForEmail(email: string, _opts?: any) {
      try {
        await pb.collection('users').requestPasswordReset(email);
        return { data: {}, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },

    async updateUser({ password }: { password: string }) {
      // Password-reset confirmation flow: PocketBase needs the reset token + email from the
      // recovery link's query params, not just the new password (unlike Supabase's session-based flow).
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (!token) throw new Error('Falta el token de recuperación en el link');
        await pb.collection('users').confirmPasswordReset(token, password, password);
        return { data: {}, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
  },

  functions: {
    async invoke(name: string, opts?: { body?: any }) {
      try {
        const res = await fetch(`${(pb as any).baseURL}/api/functions/${name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
          },
          body: JSON.stringify(opts?.body || {}),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          return { data: null, error: new Error(json?.error || `Function "${name}" failed (${res.status})`) };
        }
        return { data: json, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(filePath: string, file: File, opts?: { upsert?: boolean }) {
          try {
            const form = new FormData();
            form.append('bucket', bucket);
            form.append('path', filePath);
            form.append('file', file);
            const res = await fetch(`${(pb as any).baseURL}/api/storage-upload`, {
              method: 'POST',
              headers: pb.authStore.token ? { Authorization: pb.authStore.token } : {},
              body: form,
            });
            if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
            const json = await res.json();
            return { data: { path: json.path }, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
      };
    },
  },

  SESSION_DURATION_MS: 2 * 60 * 60 * 1000,
};

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
