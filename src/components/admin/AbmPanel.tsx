// Panel ABM genérico del CMS: lista + formulario generado desde un esquema de campos.
// Mismo componente en el sitio de Mauricio y en el de Fernanda; cambia solo `siteId` y la lista de recursos.
import { useEffect, useState } from 'preact/hooks';
import { db } from '../../lib/db';

export type FieldType = 'text' | 'textarea' | 'markdown' | 'date' | 'checkbox' | 'number' | 'json' | 'tags' | 'select' | 'image';
export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  bucket?: string; // para type 'image'
  help?: string;
}
export interface Resource {
  table: string;
  label: string;
  fields: Field[];
  listColumns: string[];
  orderBy?: { column: string; ascending?: boolean };
  defaults?: Record<string, unknown>;
  siteScoped?: boolean; // por defecto true
}

interface Props { siteId: string; resources: Resource[]; siteName: string }
type Row = Record<string, any>;

const toForm = (fields: Field[], row: Row | null, defaults: Record<string, unknown> = {}): Row => {
  const out: Row = {};
  for (const f of fields) {
    const v = row ? row[f.name] : defaults[f.name];
    if (f.type === 'tags') out[f.name] = Array.isArray(v) ? v.join(', ') : '';
    else if (f.type === 'json') out[f.name] = v == null ? '' : JSON.stringify(v, null, 2);
    else if (f.type === 'checkbox') out[f.name] = !!v;
    else if (f.type === 'date') out[f.name] = v ? String(v).slice(0, 10) : '';
    else out[f.name] = v ?? '';
  }
  return out;
};

const fromForm = (fields: Field[], form: Row): Row => {
  const out: Row = {};
  for (const f of fields) {
    const v = form[f.name];
    if (f.type === 'tags') out[f.name] = String(v).split(',').map((s) => s.trim()).filter(Boolean);
    else if (f.type === 'json') out[f.name] = String(v).trim() ? JSON.parse(String(v)) : null;
    else if (f.type === 'number') out[f.name] = v === '' ? 0 : Number(v);
    else if (f.type === 'date') out[f.name] = v || null;
    else out[f.name] = v;
  }
  return out;
};

export default function AbmPanel({ siteId, resources, siteName }: Props) {
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null); // fila original (o {} si es nueva)
  const [form, setForm] = useState<Row>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const res = resources[tab];

  async function checkSession() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) { setAdmin(false); setReady(true); return; }
    const { data: perfil } = await db.from('profiles').select('role, site').eq('id', session.user.id).maybeSingle();
    setAdmin(perfil?.role === 'admin' && (perfil.site === siteId || perfil.site === '*'));
    setReady(true);
  }
  useEffect(() => { checkSession(); }, []);

  async function load() {
    if (!admin) return;
    let q: any = db.from(res.table).select('*');
    if (res.siteScoped !== false) q = q.eq('site', siteId);
    if (res.orderBy) q = q.order(res.orderBy.column, { ascending: res.orderBy.ascending ?? true });
    const { data, error } = await q;
    if (error) { setStatus(`No se pudo cargar: ${error.message}`); setRows([]); return; }
    setRows(data ?? []);
  }
  useEffect(() => { setEditing(null); setStatus(''); load(); }, [tab, admin]);

  async function login(e: Event) {
    e.preventDefault();
    setLoginError('');
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) { setLoginError('Correo o contraseña incorrectos.'); return; }
    try { localStorage.setItem('spa_session_start', String(Date.now())); } catch { /* ignore */ }
    setPassword('');
    await checkSession();
  }
  async function logout() { await db.auth.signOut(); setAdmin(false); }

  function startNew() { setEditing({}); setForm(toForm(res.fields, null, res.defaults)); setStatus(''); }
  function startEdit(row: Row) { setEditing(row); setForm(toForm(res.fields, row)); setStatus(''); }

  async function save(e: Event) {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const payload: Row = fromForm(res.fields, form);
      if (res.siteScoped !== false) payload.site = siteId;
      const { error } = editing?.id
        ? await db.from(res.table).update(payload).eq('id', editing.id)
        : await db.from(res.table).insert(payload);
      if (error) throw error;
      setEditing(null);
      setStatus('Guardado. El sitio muestra el cambio en la próxima publicación.');
      await load();
    } catch (err) {
      setStatus(`No se pudo guardar: ${(err as Error).message}`);
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!editing?.id || !confirm('¿Borrar este elemento? No se puede deshacer.')) return;
    const { error } = await db.from(res.table).delete().eq('id', editing.id);
    if (error) { setStatus(`No se pudo borrar: ${error.message}`); return; }
    setEditing(null);
    setStatus('Elemento borrado.');
    await load();
  }

  async function upload(field: Field, file: File) {
    const bucket = field.bucket || 'blog-images';
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `${siteId}/${Date.now()}.${ext}`;
    const { error } = await db.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { setStatus(`No se pudo subir la imagen: ${error.message}`); return; }
    setForm({ ...form, [field.name]: db.storage.from(bucket).getPublicUrl(path).data.publicUrl });
  }

  if (!ready) return <p>Cargando…</p>;

  if (!admin) {
    return (
      <form class="pt-form pt-admin-login" onSubmit={login}>
        <h2>Ingresar al panel</h2>
        <div class="pt-field"><label for="a-mail">Correo electrónico</label><input id="a-mail" type="email" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} autocomplete="username" required /></div>
        <div class="pt-field"><label for="a-pass">Contraseña</label><input id="a-pass" type="password" value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} autocomplete="current-password" required /></div>
        {loginError && <p class="pt-error" role="alert">{loginError}</p>}
        <div class="pt-form-actions"><button class="pt-button" type="submit">Entrar</button></div>
      </form>
    );
  }

  return (
    <div class="pt-admin">
      <div class="pt-admin-bar">
        <strong>Panel de {siteName}</strong>
        <button class="pt-admin-link" type="button" onClick={logout}>Salir</button>
      </div>
      <div class="pt-admin-tabs" role="tablist">
        {resources.map((r, i) => (
          <button role="tab" aria-selected={i === tab} class={i === tab ? 'is-on' : ''} onClick={() => setTab(i)} type="button">{r.label}</button>
        ))}
      </div>
      {status && <p class="pt-form-status" role="status">{status}</p>}

      {editing === null ? (
        <>
          <div class="pt-admin-actions"><button class="pt-button" type="button" onClick={startNew}>Nuevo</button></div>
          {rows.length === 0 ? <p class="pt-sample">No hay elementos todavía.</p> : (
            <ul class="pt-admin-list">
              {rows.map((r) => (
                <li>
                  <button type="button" class="pt-admin-row" onClick={() => startEdit(r)}>
                    {res.listColumns.map((c) => <span>{typeof r[c] === 'boolean' ? (r[c] ? 'Sí' : 'No') : String(r[c] ?? '')}</span>)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <form class="pt-form" onSubmit={save}>
          <h2>{editing.id ? 'Editar' : 'Nuevo'}: {res.label}</h2>
          {res.fields.map((f) => (
            <div class="pt-field">
              <label for={`f-${f.name}`}>{f.label}{f.required && <span class="pt-req">(obligatorio)</span>}</label>
              {f.type === 'textarea' || f.type === 'json' ? (
                <textarea id={`f-${f.name}`} value={form[f.name]} required={f.required} onInput={(e) => setForm({ ...form, [f.name]: (e.target as HTMLTextAreaElement).value })} />
              ) : f.type === 'markdown' ? (
                <textarea id={`f-${f.name}`} class="pt-admin-md" value={form[f.name]} required={f.required} onInput={(e) => setForm({ ...form, [f.name]: (e.target as HTMLTextAreaElement).value })} />
              ) : f.type === 'checkbox' ? (
                <input id={`f-${f.name}`} type="checkbox" checked={!!form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: (e.target as HTMLInputElement).checked })} />
              ) : f.type === 'select' ? (
                <select id={`f-${f.name}`} value={form[f.name]} required={f.required} onChange={(e) => setForm({ ...form, [f.name]: (e.target as HTMLSelectElement).value })}>
                  <option value="">—</option>
                  {(f.options ?? []).map((o) => <option value={o}>{o}</option>)}
                </select>
              ) : f.type === 'image' ? (
                <>
                  <input id={`f-${f.name}`} type="text" value={form[f.name]} onInput={(e) => setForm({ ...form, [f.name]: (e.target as HTMLInputElement).value })} placeholder="URL de la imagen" />
                  <input type="file" accept="image/*" onChange={(e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) upload(f, file); }} />
                  {form[f.name] && <img class="pt-admin-thumb" src={form[f.name]} alt="" />}
                </>
              ) : (
                <input id={`f-${f.name}`} type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} value={form[f.name]} required={f.required} onInput={(e) => setForm({ ...form, [f.name]: (e.target as HTMLInputElement).value })} />
              )}
              {f.help && <span class="pt-form-note">{f.help}</span>}
            </div>
          ))}
          <div class="pt-form-actions">
            <button class="pt-button" type="submit" disabled={busy}>Guardar</button>
            <button class="pt-admin-link" type="button" onClick={() => setEditing(null)}>Cancelar</button>
            {editing.id && <button class="pt-admin-link pt-admin-danger" type="button" onClick={remove}>Borrar</button>}
          </div>
        </form>
      )}
    </div>
  );
}
