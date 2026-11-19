// Sección «Imágenes» del panel: espacios de Sobre mí, portadas y biblioteca del almacenamiento.
// Archivo IDÉNTICO en Mauricio y Fernanda: lo que cambia entre portales llega por props (AdminApp).
import { useEffect, useMemo, useState } from 'preact/hooks';
import { db } from '../../lib/db';
import galleryDefaults from '../../data/gallery-defaults.json';
import { GALLERY_SLOTS, resolveSlots, type AboutSource, type GalleryItem, type ResolvedSlot } from '../../data/gallery-slots';

interface Props {
  siteId: string;
  /** Pasa a otro módulo del panel (por id). */
  go: (id: string) => void;
  /** Ids de los módulos de este panel a los que se puede enlazar; los que no existan no se ofrecen. */
  links: { eventos?: string; blog?: string; recursos?: string };
  /** Fotos de Eventos que llenan Sobre mí (la misma función que usa el sitio al construirse). */
  loadAbout: (lang: 'es' | 'en') => Promise<AboutSource[]>;
}

const BUCKETS = ['blog-images', 'disertaciones-files', 'blog-files'] as const;
const IMG = /\.(jpe?g|png|webp|gif|svg|avif)$/i;
// Tablas que pueden mencionar archivos del almacenamiento (se buscan por la ruta del archivo).
const USAGE_TABLES: { table: string; label: string }[] = [
  { table: 'gallery_items', label: 'Sobre mí' },
  { table: 'disertaciones', label: 'Eventos' },
  { table: 'blogs', label: 'Blog' },
  { table: 'recursos', label: 'Zona Lab' },
  { table: 'project_cases', label: 'Casos de estudio' },
  { table: 'projects', label: 'Proyectos' },
  { table: 'site_content', label: 'Textos del sitio' },
  { table: 'site_settings', label: 'Ajustes' },
];

type Tab = 'slots' | 'covers' | 'library';
const slotName = (s: string) => (s.startsWith('mosaico') ? `Mosaico ${s.split('-')[1]}` : `Trayectoria ${s.split('-')[1]}`);
const extOf = (f: File) => (f.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
const publicUrl = (bucket: string, path: string) => db.storage.from(bucket).getPublicUrl(path).data.publicUrl;

async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const { error } = await db.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  return publicUrl(bucket, path);
}

export default function ImagesModule({ siteId, go, links, loadAbout }: Props) {
  const [tab, setTab] = useState<Tab>('slots');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await db.auth.getUser();
      if (!u.user) return;
      const { data } = await db.from('profiles').select('site').eq('id', u.user.id).maybeSingle();
      setIsGlobalAdmin(data?.site === '*');
    })();
  }, []);

  const tabs: [Tab, string][] = [['slots', 'Sobre mí'], ['covers', 'Portadas y fotos'], ['library', 'Biblioteca']];
  return (
    <div class="pt-img">
      <p class="pt-form-note">Todas las imágenes del sitio en un solo lugar. Cuando una imagen no está cargada, el sitio no muestra el espacio ni su epígrafe.</p>
      <div class="pt-img-tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button type="button" role="tab" aria-selected={tab === id} class={tab === id ? 'is-on' : ''} onClick={() => { setTab(id); setStatus(''); }}>{label}</button>
        ))}
      </div>
      {status && <p class="pt-form-status" role="status">{status}</p>}
      {tab === 'slots' && <SlotsTab siteId={siteId} go={go} links={links} loadAbout={loadAbout} setStatus={setStatus} busy={busy} setBusy={setBusy} />}
      {tab === 'covers' && <CoversTab siteId={siteId} go={go} links={links} setStatus={setStatus} busy={busy} setBusy={setBusy} />}
      {tab === 'library' && <LibraryTab siteId={siteId} isGlobalAdmin={isGlobalAdmin} setStatus={setStatus} busy={busy} setBusy={setBusy} />}
    </div>
  );
}

interface TabProps { siteId: string; setStatus: (s: string) => void; busy: boolean; setBusy: (b: boolean) => void }

// ---------------------------------------------------------------- Sobre mí
interface Row extends GalleryItem { id: string; published: boolean }

function SlotsTab({ siteId, go, links, loadAbout, setStatus, busy, setBusy }: TabProps & Pick<Props, 'go' | 'links' | 'loadAbout'>) {
  const [rows, setRows] = useState<Row[]>([]);
  const [auto, setAuto] = useState<AboutSource[]>([]);
  const [edit, setEdit] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<GalleryItem>>({});

  async function load() {
    const { data, error } = await db.from('gallery_items').select('id, slot, image_url, alt, caption, alt_en, caption_en, published').eq('site', siteId);
    if (error) { setStatus(`No se pudo cargar: ${error.message}`); return; }
    setRows((data ?? []) as Row[]);
    try { setAuto(await loadAbout('es')); } catch { setAuto([]); }
  }
  useEffect(() => { load(); }, []);

  // Lo que el sitio mostrará (solo filas publicadas, igual que al construirse).
  const slots = useMemo(() => resolveSlots(galleryDefaults as GalleryItem[], rows.filter((r) => r.published), auto), [rows, auto]);

  async function write(slot: string, patch: Partial<GalleryItem>) {
    const row = rows.find((r) => r.slot === slot);
    const res = row
      ? await db.from('gallery_items').update({ ...patch, published: true }).eq('id', row.id)
      : await db.from('gallery_items').insert({ site: siteId, slot, published: true, position: GALLERY_SLOTS.indexOf(slot) + 1, ...patch });
    if (res.error) throw new Error(res.error.message);
  }

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true); setStatus(`${label}…`);
    try { await fn(); await load(); setStatus('Guardado. El sitio se actualiza en 1 o 2 minutos.'); }
    catch (e) { setStatus(`No se pudo completar: ${(e as Error).message}`); }
    setBusy(false);
  }

  const onFile = (slot: string, file?: File | null) => {
    if (!file) return;
    run('Subiendo imagen', async () => {
      const url = await uploadFile('blog-images', `${siteId}/galeria/${slot}-${Date.now()}.${extOf(file)}`, file);
      const cur = slots.get(slot);
      await write(slot, { image_url: url, ...(cur?.source === 'manual' ? {} : { caption: cur?.caption ?? '', caption_en: cur?.caption_en ?? '', alt: cur?.alt ?? '', alt_en: cur?.alt_en ?? '' }) });
    });
  };

  function startEdit(s: ResolvedSlot) {
    setEdit(s.slot);
    setDraft({ caption: s.caption, caption_en: s.caption_en ?? '', alt: s.alt, alt_en: s.alt_en ?? '' });
  }

  return (
    <div class="pt-img-grid">
      {GALLERY_SLOTS.map((slot) => {
        const s = slots.get(slot);
        if (!s) return null;
        const fromEvent = s.source === 'evento' || s.source === 'evento-sin-foto';
        const editing = edit === slot;
        return (
          <article class={'pt-img-card' + (s.image_url ? '' : ' is-empty')}>
            <header><strong>{slotName(slot)}</strong>
              <span class={'pt-img-badge is-' + s.source}>
                {s.source === 'manual' ? 'Cargada a mano' : s.source === 'evento' ? 'Viene de un evento' : s.source === 'evento-sin-foto' ? 'Evento sin foto' : 'Vacío'}
              </span>
            </header>
            <div class="pt-img-thumb">{s.image_url ? <img src={s.image_url} alt={s.alt} loading="lazy" /> : <span>Sin foto: no se muestra en el sitio</span>}</div>
            {slot.startsWith('trayectoria') && (s.caption || s.caption_en) && <p class="pt-img-caption">{s.caption}{s.caption_en ? <em> · EN: {s.caption_en}</em> : null}</p>}
            {fromEvent && <p class="pt-form-note">Se arma sola con el evento «{s.origin}». {s.source === 'evento-sin-foto' ? 'Cuando el evento tenga foto, aparece acá.' : ''}</p>}

            {editing ? (
              <div class="pt-img-edit">
                <label>Epígrafe (ES)<input type="text" value={draft.caption ?? ''} onInput={(e) => setDraft({ ...draft, caption: (e.target as HTMLInputElement).value })} /></label>
                <label>Epígrafe (EN)<input type="text" value={draft.caption_en ?? ''} onInput={(e) => setDraft({ ...draft, caption_en: (e.target as HTMLInputElement).value })} /></label>
                <label>Texto alternativo (ES)<input type="text" value={draft.alt ?? ''} onInput={(e) => setDraft({ ...draft, alt: (e.target as HTMLInputElement).value })} /></label>
                <label>Texto alternativo (EN)<input type="text" value={draft.alt_en ?? ''} onInput={(e) => setDraft({ ...draft, alt_en: (e.target as HTMLInputElement).value })} /></label>
                <div class="pt-form-actions">
                  <button class="pt-button" type="button" disabled={busy} onClick={() => run('Guardando', async () => { await write(slot, { image_url: s.source === 'manual' ? s.image_url : '', ...draft }); setEdit(null); })}>Guardar</button>
                  <button class="pt-admin-link" type="button" onClick={() => setEdit(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div class="pt-img-actions">
                <label class="pt-admin-link pt-img-file">{s.image_url && !fromEvent ? 'Cambiar imagen' : fromEvent ? 'Usar imagen propia' : 'Subir imagen'}
                  <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { const el = e.target as HTMLInputElement; onFile(slot, el.files?.[0]); el.value = ''; }} />
                </label>
                {!fromEvent && <button class="pt-admin-link" type="button" disabled={busy} onClick={() => startEdit(s)}>Epígrafe y texto</button>}
                {s.source === 'manual' && s.image_url && (
                  <button class="pt-admin-link pt-admin-danger" type="button" disabled={busy} onClick={() => { if (confirm(`¿Quitar la imagen de «${slotName(slot)}»? El archivo sigue en la biblioteca.`)) run('Quitando imagen', () => write(slot, { image_url: '' })); }}>Quitar imagen</button>
                )}
                {fromEvent && links.eventos && <button class="pt-admin-link" type="button" onClick={() => go(links.eventos!)}>Editar en Eventos</button>}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- Portadas y fotos
interface CoverRow { id: string; title: string; cover_url: string | null }

function CoversTab({ siteId, go, links, setStatus, busy, setBusy }: TabProps & Pick<Props, 'go' | 'links'>) {
  const [blogs, setBlogs] = useState<CoverRow[]>([]);
  const [recursos, setRecursos] = useState<CoverRow[]>([]);
  const [events, setEvents] = useState<{ id: string; title: string; photo: string; extra: number }[]>([]);

  async function load() {
    const b = await db.from('blogs').select('id, title, cover_url').eq('site', siteId).order('created_at', { ascending: false });
    setBlogs((b.data ?? []) as CoverRow[]);
    if (links.recursos) {
      const r = await db.from('recursos').select('id, title, cover_url').eq('site', siteId).order('created_at', { ascending: false });
      setRecursos((r.data ?? []) as CoverRow[]);
    }
    const e = await db.from('disertaciones').select('id, title, cover_url, main_photo, display_photos, gallery_urls').eq('site', siteId).order('event_date', { ascending: false });
    setEvents(((e.data ?? []) as any[]).map((r) => {
      const all: string[] = [r.main_photo, ...(r.display_photos ?? []), ...(r.gallery_urls ?? []), r.cover_url].filter(Boolean);
      return { id: r.id, title: r.title, photo: all[0] ?? '', extra: Math.max(0, new Set(all).size - 1) };
    }));
  }
  useEffect(() => { load(); }, []);

  async function change(table: 'blogs' | 'recursos', id: string, file: File | null) {
    setBusy(true); setStatus('Subiendo portada…');
    try {
      let url: string | null = null;
      if (file) url = await uploadFile('blog-images', `${siteId}/portadas/${Date.now()}.${extOf(file)}`, file);
      const { error } = await db.from(table).update({ cover_url: url }).eq('id', id);
      if (error) throw new Error(error.message);
      await load();
      setStatus('Guardado. El sitio se actualiza en 1 o 2 minutos.');
    } catch (e) { setStatus(`No se pudo completar: ${(e as Error).message}`); }
    setBusy(false);
  }

  const list = (table: 'blogs' | 'recursos', items: CoverRow[]) => (
    <ul class="pt-img-list">
      {items.map((it) => (
        <li>
          <div class="pt-img-mini">{it.cover_url ? <img src={it.cover_url} alt="" loading="lazy" /> : <span>Sin portada</span>}</div>
          <span class="pt-img-title">{it.title}</span>
          <label class="pt-admin-link pt-img-file">{it.cover_url ? 'Cambiar' : 'Subir'}
            <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { const el = e.target as HTMLInputElement; const f = el.files?.[0]; el.value = ''; if (f) change(table, it.id, f); }} />
          </label>
          {it.cover_url && <button class="pt-admin-link pt-admin-danger" type="button" disabled={busy} onClick={() => { if (confirm('¿Quitar la portada?')) change(table, it.id, null); }}>Quitar</button>}
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      <h3>Blog</h3>
      {blogs.length ? list('blogs', blogs) : <p class="pt-form-note">No hay artículos.</p>}
      {links.recursos && (<><h3>Zona Lab</h3>{recursos.length ? list('recursos', recursos) : <p class="pt-form-note">No hay recursos.</p>}</>)}
      <h3>Eventos <span class="pt-form-note">(solo lectura: las fotos se editan en cada evento)</span></h3>
      <ul class="pt-img-list">
        {events.map((ev) => (
          <li>
            <div class="pt-img-mini">{ev.photo ? <img src={ev.photo} alt="" loading="lazy" /> : <span>Sin foto</span>}</div>
            <span class="pt-img-title">{ev.title}{ev.extra > 0 ? <em> · +{ev.extra} más</em> : null}</span>
            {links.eventos && <button class="pt-admin-link" type="button" onClick={() => go(links.eventos!)}>Editar en Eventos</button>}
          </li>
        ))}
        {events.length === 0 && <li class="pt-form-note">No hay eventos.</li>}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- Biblioteca
interface FileInfo { bucket: string; path: string; size: number; url: string; uses: string[]; image: boolean }

async function walk(bucket: string, prefix = ''): Promise<{ path: string; size: number }[]> {
  const out: { path: string; size: number }[] = [];
  const { data } = await db.storage.from(bucket).list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  for (const it of data ?? []) {
    const full = prefix ? `${prefix}/${it.name}` : it.name;
    if (it.id === null) out.push(...(await walk(bucket, full)));
    else if (it.name !== '.emptyFolderPlaceholder') out.push({ path: full, size: Number((it.metadata as any)?.size ?? 0) });
  }
  return out;
}

const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function LibraryTab({ siteId, isGlobalAdmin, setStatus, busy, setBusy }: TabProps & { isGlobalAdmin: boolean }) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [bucketF, setBucketF] = useState<string>('all');

  async function load() {
    setLoading(true);
    // Texto de todas las filas que pueden mencionar archivos (del sitio, o de todos si el admin es global).
    const hay: { label: string; text: string }[] = [{ label: 'Sobre mí (por defecto)', text: JSON.stringify(galleryDefaults) }];
    for (const t of USAGE_TABLES) {
      let q = db.from(t.table).select('*');
      if (!isGlobalAdmin) q = q.eq('site', siteId);
      const { data } = await q;
      for (const row of data ?? []) hay.push({ label: t.label, text: JSON.stringify(row) });
    }
    const all: FileInfo[] = [];
    for (const bucket of BUCKETS) {
      for (const f of await walk(bucket)) {
        const needles = [`/${bucket}/${f.path}`, `/${bucket}/${encodeURI(f.path)}`];
        const uses = [...new Set(hay.filter((h) => needles.some((n) => h.text.includes(n))).map((h) => h.label))];
        all.push({ bucket, path: f.path, size: f.size, url: publicUrl(bucket, f.path), uses, image: IMG.test(f.path) });
      }
    }
    setFiles(all);
    setLoading(false);
  }
  useEffect(() => { load(); }, [isGlobalAdmin]);

  // Un admin de un solo sitio no ve las filas de los otros: solo puede borrar bajo su propia carpeta.
  const canDelete = (f: FileInfo) => f.uses.length === 0 && (isGlobalAdmin || f.path.startsWith(`${siteId}/`));

  async function remove(f: FileInfo) {
    if (!confirm(`¿Borrar «${f.path}»?\n\nNo se puede deshacer. Ninguna página del sitio lo usa.`)) return;
    setBusy(true); setStatus('Borrando…');
    const { error } = await db.storage.from(f.bucket).remove([f.path]);
    if (error) setStatus(`No se pudo borrar: ${error.message}`);
    else { setFiles((cur) => cur.filter((x) => x !== f)); setStatus('Archivo borrado.'); }
    setBusy(false);
  }

  async function add(file?: File | null) {
    if (!file) return;
    setBusy(true); setStatus('Subiendo…');
    try {
      const name = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'archivo';
      await uploadFile('blog-images', `${siteId}/biblioteca/${Date.now()}-${name}.${extOf(file)}`, file);
      await load();
      setStatus('Archivo subido. Aparece como «Sin uso» hasta que lo asignes a un espacio.');
    } catch (e) { setStatus(`No se pudo subir: ${(e as Error).message}`); }
    setBusy(false);
  }

  const shown = files.filter((f) => (filter === 'all' || (filter === 'used') === f.uses.length > 0) && (bucketF === 'all' || f.bucket === bucketF));
  const unused = files.filter((f) => f.uses.length === 0).length;

  return (
    <div>
      <div class="pt-img-bar">
        <select value={filter} onChange={(e) => setFilter((e.target as HTMLSelectElement).value as any)} aria-label="Filtrar por uso">
          <option value="all">Todos ({files.length})</option><option value="used">En uso ({files.length - unused})</option><option value="unused">Sin uso ({unused})</option>
        </select>
        <select value={bucketF} onChange={(e) => setBucketF((e.target as HTMLSelectElement).value)} aria-label="Filtrar por carpeta">
          <option value="all">Todas las carpetas</option>{BUCKETS.map((b) => <option value={b}>{b}</option>)}
        </select>
        <label class="pt-admin-link pt-img-file">Subir imagen
          <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { const el = e.target as HTMLInputElement; const f = el.files?.[0]; el.value = ''; add(f); }} />
        </label>
        <button class="pt-admin-link" type="button" disabled={loading} onClick={load}>Actualizar</button>
      </div>
      <p class="pt-form-note">«En uso» se calcula buscando cada archivo en los contenidos {isGlobalAdmin ? 'de todos los sitios' : 'de este sitio'}. No se revisa el código fuente: un archivo usado solo ahí figuraría «Sin uso».{!isGlobalAdmin && ` Solo podés borrar archivos de la carpeta «${siteId}/».`}</p>
      {loading ? <p class="pt-form-note">Leyendo el almacenamiento…</p> : (
        <ul class="pt-img-list pt-img-lib">
          {shown.map((f) => (
            <li>
              <div class="pt-img-mini">{f.image ? <img src={f.url} alt="" loading="lazy" /> : <span>{f.path.split('.').pop()}</span>}</div>
              <span class="pt-img-title"><span class="pt-img-path">{f.bucket}/{f.path}</span> <em>{kb(f.size)}</em>
                <br />{f.uses.length ? <span class="pt-img-badge is-manual">En uso: {f.uses.join(', ')}</span> : <span class="pt-img-badge is-vacio">Sin uso</span>}
              </span>
              <button class="pt-admin-link" type="button" onClick={() => { navigator.clipboard?.writeText(f.url); setStatus('Enlace copiado.'); }}>Copiar enlace</button>
              <button class="pt-admin-link pt-admin-danger" type="button" disabled={busy || !canDelete(f)} title={f.uses.length ? 'Está en uso' : canDelete(f) ? '' : 'Es de otra carpeta'} onClick={() => remove(f)}>Borrar</button>
            </li>
          ))}
          {shown.length === 0 && <li class="pt-form-note">No hay archivos con ese filtro.</li>}
        </ul>
      )}
    </div>
  );
}
