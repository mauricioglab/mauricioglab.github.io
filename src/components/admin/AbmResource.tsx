// ABM genérico de un recurso (tabla): lista + formulario generado desde un esquema de campos.
// Archivo IDÉNTICO en los sitios de Mauricio y de Fernanda. La carcasa (AdminShell) pone el login y el menú.
import { useEffect, useState } from 'preact/hooks';
import { db } from '../../lib/db';

export type FieldType = 'text' | 'textarea' | 'markdown' | 'date' | 'checkbox' | 'number' | 'json' | 'tags' | 'select' | 'image' | 'images' | 'text-i18n' | 'textarea-i18n';
export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  bucket?: string; // para type 'image'
  help?: string;
  nameEn?: string; // para text-i18n / textarea-i18n: columna del inglés (name es la del español)
}
export interface Resource {
  table: string;
  label: string;
  fields: Field[];
  listColumns: string[];
  orderBy?: { column: string; ascending?: boolean };
  defaults?: Record<string, unknown>;
  siteScoped?: boolean; // por defecto true
  preview?: boolean; // muestra una vista previa imprimible del campo JSON (CV)
}

type Row = Record<string, any>;

const toForm = (fields: Field[], row: Row | null, defaults: Record<string, unknown> = {}): Row => {
  const out: Row = {};
  for (const f of fields) {
    const v = row ? row[f.name] : defaults[f.name];
    if (f.nameEn) out[f.nameEn] = (row ? row[f.nameEn] : defaults[f.nameEn]) ?? '';
    if (f.type === 'tags') out[f.name] = Array.isArray(v) ? v.join(', ') : '';
    else if (f.type === 'images') out[f.name] = Array.isArray(v) ? v : [];
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
    if (f.nameEn) out[f.nameEn] = String(form[f.nameEn] ?? '').trim() || null;
    if (f.type === 'tags') out[f.name] = String(v).split(',').map((s) => s.trim()).filter(Boolean);
    else if (f.type === 'images') out[f.name] = Array.isArray(v) ? v : [];
    else if (f.type === 'json') out[f.name] = String(v).trim() ? JSON.parse(String(v)) : null;
    else if (f.type === 'number') out[f.name] = v === '' ? 0 : Number(v);
    else if (f.type === 'date') out[f.name] = v || null;
    else out[f.name] = v;
  }
  return out;
};

function JsonView({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') return null;
  if (Array.isArray(value)) return <ul>{value.map((v) => <li><JsonView value={v} /></li>)}</ul>;
  if (typeof value === 'object') {
    return (
      <div>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
            ? <p><strong>{k}:</strong> {String(v)}</p>
            : <div><p><strong>{k}</strong></p><JsonView value={v} /></div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

function CvPreview({ text }: { text: string }) {
  let parsed: unknown = null;
  try { parsed = text.trim() ? JSON.parse(text) : null; } catch { return <p class="pt-error">El JSON no es válido: corregilo para ver la vista previa.</p>; }
  return (
    <div class="pt-cv-preview">
      <div class="pt-form-actions"><strong>Vista previa (privada)</strong><button class="pt-admin-link" type="button" onClick={() => window.print()}>Imprimir / guardar como PDF</button></div>
      <JsonView value={parsed} />
    </div>
  );
}

export default function AbmResource({ siteId, resource: res }: { siteId: string; resource: Resource }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null); // fila original ({} si es nueva)
  const [form, setForm] = useState<Row>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setViewState] = useState<'both' | 'es' | 'en'>(() => {
    try { return (localStorage.getItem('pt_admin_lang_view') as 'both' | 'es' | 'en') || 'both'; } catch { return 'both'; }
  });
  const setView = (v: 'both' | 'es' | 'en') => { setViewState(v); try { localStorage.setItem('pt_admin_lang_view', v); } catch { /* ignore */ } };
  const [translating, setTranslating] = useState('');
  const hasI18n = res.fields.some((f) => f.nameEn);

  async function load() {
    let q: any = db.from(res.table).select('*');
    if (res.siteScoped !== false) q = q.eq('site', siteId);
    if (res.orderBy) q = q.order(res.orderBy.column, { ascending: res.orderBy.ascending ?? true });
    const { data, error } = await q;
    if (error) { setStatus(`No se pudo cargar: ${error.message}`); setRows([]); return; }
    setRows(data ?? []);
  }
  useEffect(() => { setEditing(null); setStatus(''); load(); }, [res.table]);

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
      setStatus('Guardado. El sitio se actualiza solo en 1 o 2 minutos.');
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

  async function uploadMany(field: Field, files: FileList) {
    const bucket = field.bucket || 'blog-images';
    const urls: string[] = [...(form[field.name] ?? [])];
    for (const file of Array.from(files)) {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `${siteId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await db.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) { setStatus(`No se pudo subir ${file.name}: ${error.message}`); continue; }
      urls.push(db.storage.from(bucket).getPublicUrl(path).data.publicUrl);
    }
    setForm({ ...form, [field.name]: urls });
  }

  async function translate(f: Field, from: 'es' | 'en') {
    const src = String(form[from === 'es' ? f.name : f.nameEn!] ?? '').trim();
    if (!src) { setStatus('Escribí primero el texto que querés traducir.'); return; }
    setTranslating(`${f.name}-${from}`);
    setStatus('');
    const { data, error } = await db.functions.invoke('blog-translate', { body: { text: src, from, to: from === 'es' ? 'en' : 'es' } });
    setTranslating('');
    if (error || !data?.text) { setStatus(`No se pudo traducir: ${error?.message ?? 'sin respuesta'}`); return; }
    setForm({ ...form, [from === 'es' ? f.nameEn! : f.name]: data.text });
  }

  async function upload(field: Field, file: File) {
    const bucket = field.bucket || 'blog-images';
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `${siteId}/${Date.now()}.${ext}`;
    const { error } = await db.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { setStatus(`No se pudo subir la imagen: ${error.message}`); return; }
    setForm({ ...form, [field.name]: db.storage.from(bucket).getPublicUrl(path).data.publicUrl });
  }

  return (
    <div class="pt-abm">
      <h2>{res.label}</h2>
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
          <h3>{editing.id ? 'Editar' : 'Nuevo'}</h3>
          {hasI18n && (
            <div class="pt-lang-view" role="group" aria-label="Idiomas que se muestran">
              <span>Ver:</span>
              {([['both', 'Ambos'], ['es', 'Español'], ['en', 'English']] as const).map(([v, label]) => (
                <button type="button" class={view === v ? 'is-on' : ''} aria-pressed={view === v} onClick={() => setView(v)}>{label}</button>
              ))}
            </div>
          )}
          {res.fields.map((f) => (
            <div class="pt-field">
              <label for={`f-${f.name}`}>{f.label}{f.required && <span class="pt-req">(obligatorio)</span>}</label>
              {f.type === 'text-i18n' || f.type === 'textarea-i18n' ? (
                <div class={'pt-i18n pt-i18n-' + view}>
                  {view !== 'en' && (
                    <div class="pt-i18n-col">
                      <span class="pt-i18n-tag">Español</span>
                      {f.type === 'text-i18n'
                        ? <input id={`f-${f.name}`} type="text" value={form[f.name]} required={f.required} onInput={(e) => setForm({ ...form, [f.name]: (e.target as HTMLInputElement).value })} />
                        : <textarea id={`f-${f.name}`} value={form[f.name]} required={f.required} onInput={(e) => setForm({ ...form, [f.name]: (e.target as HTMLTextAreaElement).value })} />}
                      {view === 'both' && <button type="button" class="pt-admin-link" disabled={translating !== ''} onClick={() => translate(f, 'es')}>{translating === `${f.name}-es` ? 'Traduciendo…' : 'Traducir al inglés →'}</button>}
                    </div>
                  )}
                  {view !== 'es' && (
                    <div class="pt-i18n-col">
                      <span class="pt-i18n-tag">English</span>
                      {f.type === 'text-i18n'
                        ? <input id={`f-${f.nameEn}`} type="text" value={form[f.nameEn!]} onInput={(e) => setForm({ ...form, [f.nameEn!]: (e.target as HTMLInputElement).value })} />
                        : <textarea id={`f-${f.nameEn}`} value={form[f.nameEn!]} onInput={(e) => setForm({ ...form, [f.nameEn!]: (e.target as HTMLTextAreaElement).value })} />}
                      {view === 'both' && <button type="button" class="pt-admin-link" disabled={translating !== ''} onClick={() => translate(f, 'en')}>{translating === `${f.name}-en` ? 'Traduciendo…' : '← Traducir al español'}</button>}
                    </div>
                  )}
                </div>
              ) : f.type === 'textarea' || f.type === 'json' ? (
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
              ) : f.type === 'images' ? (
                <>
                  <input type="file" accept="image/*" multiple onChange={(e) => { const fl = (e.target as HTMLInputElement).files; if (fl?.length) uploadMany(f, fl); }} />
                  <div class="pt-admin-thumbs">
                    {(form[f.name] as string[]).map((u) => (
                      <figure>
                        <img class="pt-admin-thumb" src={u} alt="" />
                        <button class="pt-admin-link pt-admin-danger" type="button" onClick={() => setForm({ ...form, [f.name]: (form[f.name] as string[]).filter((x) => x !== u) })}>Quitar</button>
                      </figure>
                    ))}
                  </div>
                </>
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
          {res.preview && <CvPreview text={String(form.data ?? '')} />}
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
