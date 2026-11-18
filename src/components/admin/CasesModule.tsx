// Casos de estudio del portafolio: lista + asistente paso a paso (Datos → una pantalla por sección → Vista previa → Publicar).
// Archivo IDÉNTICO en Mauricio y Fernanda.
import { useSignal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import WizardModal from './shared/WizardModal';
import type { OpState } from './shared/BusyOverlay';
import { db } from '../../lib/db';
import { SITE_ID } from '../../data/site-id';
import { localizeSections, type CaseType, type RawBlock, type RawSection } from '../../data/case-model';
import { TEMPLATES, CASE_TYPES, BLOCK_LABELS, type BlockKind } from '../../data/case-templates';
import { getAnalystOverview, isAnalystField } from '../../data/analyst-overview';
import { SAMPLE_SLUG, sampleSections, sampleCard } from '../../data/analyst-sample';
import AnalystCaseOverview from '../shared/AnalystCaseOverview';

type View = 'both' | 'es' | 'en';
interface CaseRow {
  id?: string; project_slug: string; type: CaseType; title: string; title_en: string; badge: string; badge_en: string;
  description: string; description_en: string; sections: RawSection[]; published: boolean; updated_at?: string;
}
const emptyCase = (type: CaseType = 'desarrollo'): CaseRow => ({
  project_slug: '', type, title: '', title_en: '', badge: '', badge_en: '', description: '', description_en: '',
  sections: TEMPLATES[type].map((t) => ({ key: t.key, title: t.title, title_en: t.title_en, blocks: [] })), published: false,
});
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function newBlock(kind: BlockKind): RawBlock {
  switch (kind) {
    case 'texto': return { kind, text: '', text_en: '' };
    case 'subtitulo': return { kind, text: '', text_en: '' };
    case 'lista': return { kind, items: [{ text: '', text_en: '' }] };
    case 'pasos': return { kind, steps: [{ title: '', title_en: '', text: '', text_en: '', items: [] }] };
    case 'metricas': return { kind, items: [{ value: '', label: '', label_en: '' }] };
    case 'tabla': return { kind, caption: '', caption_en: '', columns: [{ label: '', label_en: '' }, { label: '', label_en: '' }], rows: [[{ text: '', text_en: '' }, { text: '', text_en: '' }]] };
    case 'diagrama': return { kind, url: '', alt: '', alt_en: '', caption: '', caption_en: '' };
    case 'enlaces': return { kind, items: [{ label: '', label_en: '', url: '' }] };
  }
}

// Una línea por elemento: junta pares es/en en dos textareas.
const toLines = (items: { text?: string; text_en?: string }[], key: 'text' | 'text_en') => items.map((i) => i[key] ?? '').join('\n');
function fromLines(es: string, en: string) {
  const a = es.split('\n'); const b = en.split('\n'); const n = Math.max(a.length, b.length);
  const out: { text: string; text_en: string }[] = [];
  for (let i = 0; i < n; i++) if ((a[i] ?? '') !== '' || (b[i] ?? '') !== '') out.push({ text: a[i] ?? '', text_en: b[i] ?? '' });
  return out;
}

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'caso';
}

// ---------- campos en dos idiomas ----------
function Pair({ label, es, en, onEs, onEn, multiline, view }: { label: string; es: string; en: string; onEs: (v: string) => void; onEn: (v: string) => void; multiline?: boolean; view: View }) {
  const field = (value: string, on: (v: string) => void, tag: string) => (
    <div class="pt-i18n-col">
      <span class="pt-i18n-tag">{tag}</span>
      {multiline
        ? <textarea value={value} onInput={(e) => on((e.target as HTMLTextAreaElement).value)} />
        : <input type="text" value={value} onInput={(e) => on((e.target as HTMLInputElement).value)} />}
    </div>
  );
  return (
    <div class="pt-field">
      <label>{label}</label>
      <div class={'pt-i18n pt-i18n-' + view}>
        {view !== 'en' && field(es, onEs, 'Español')}
        {view !== 'es' && field(en, onEn, 'English')}
      </div>
    </div>
  );
}

// ---------- editores de bloque ----------
interface EditorProps { b: any; set: (patch: any) => void; view: View; upload: (f: File) => Promise<string | null> }

function ListItems({ items, set, view, label }: { items: { text?: string; text_en?: string }[]; set: (v: any[]) => void; view: View; label: string }) {
  return (
    <div class="pt-cs-rows">
      {items.map((it, i) => (
        <div class="pt-cs-row">
          <Pair label={`${label} ${i + 1}`} es={it.text ?? ''} en={it.text_en ?? ''} view={view}
            onEs={(v) => set(items.map((x, j) => (j === i ? { ...x, text: v } : x)))} onEn={(v) => set(items.map((x, j) => (j === i ? { ...x, text_en: v } : x)))} />
          <button type="button" class="pt-admin-link pt-admin-danger" onClick={() => set(items.filter((_, j) => j !== i))}>Quitar</button>
        </div>
      ))}
      <button type="button" class="pt-admin-link" onClick={() => set([...items, { text: '', text_en: '' }])}>+ Agregar</button>
    </div>
  );
}

function BlockEditor({ b, set, view, upload }: EditorProps) {
  if (b.kind === 'subtitulo') return <Pair label="Subtítulo" es={b.text} en={b.text_en} view={view} onEs={(v) => set({ text: v })} onEn={(v) => set({ text_en: v })} />;
  if (b.kind === 'texto') return <Pair label="Texto" multiline es={b.text} en={b.text_en} view={view} onEs={(v) => set({ text: v })} onEn={(v) => set({ text_en: v })} />;
  if (b.kind === 'lista') return <ListItems items={b.items} set={(items) => set({ items })} view={view} label="Ítem" />;
  if (b.kind === 'pasos') {
    const setStep = (i: number, patch: any) => set({ steps: b.steps.map((s: any, j: number) => (j === i ? { ...s, ...patch } : s)) });
    return (
      <div class="pt-cs-rows">
        {b.steps.map((s: any, i: number) => (
          <div class="pt-cs-card">
            <Pair label={`Paso ${i + 1}: título`} es={s.title} en={s.title_en} view={view} onEs={(v) => setStep(i, { title: v })} onEn={(v) => setStep(i, { title_en: v })} />
            <Pair label="Descripción" multiline es={s.text} en={s.text_en} view={view} onEs={(v) => setStep(i, { text: v })} onEn={(v) => setStep(i, { text_en: v })} />
            <Pair label="Puntos (uno por línea)" multiline es={toLines(s.items, 'text')} en={toLines(s.items, 'text_en')} view={view}
              onEs={(v) => setStep(i, { items: fromLines(v, toLines(s.items, 'text_en')) })} onEn={(v) => setStep(i, { items: fromLines(toLines(s.items, 'text'), v) })} />
            <button type="button" class="pt-admin-link pt-admin-danger" onClick={() => set({ steps: b.steps.filter((_: any, j: number) => j !== i) })}>Quitar paso</button>
          </div>
        ))}
        <button type="button" class="pt-admin-link" onClick={() => set({ steps: [...b.steps, { title: '', title_en: '', text: '', text_en: '', items: [] }] })}>+ Agregar paso</button>
      </div>
    );
  }
  if (b.kind === 'metricas') {
    const setItem = (i: number, patch: any) => set({ items: b.items.map((x: any, j: number) => (j === i ? { ...x, ...patch } : x)) });
    return (
      <div class="pt-cs-rows">
        {b.items.map((m: any, i: number) => (
          <div class="pt-cs-row">
            <div class="pt-field"><label>Valor</label><input type="text" value={m.value} placeholder="-40%" onInput={(e) => setItem(i, { value: (e.target as HTMLInputElement).value })} /></div>
            <Pair label="Etiqueta" es={m.label} en={m.label_en} view={view} onEs={(v) => setItem(i, { label: v })} onEn={(v) => setItem(i, { label_en: v })} />
            <button type="button" class="pt-admin-link pt-admin-danger" onClick={() => set({ items: b.items.filter((_: any, j: number) => j !== i) })}>Quitar</button>
          </div>
        ))}
        <button type="button" class="pt-admin-link" onClick={() => set({ items: [...b.items, { value: '', label: '', label_en: '' }] })}>+ Agregar métrica</button>
      </div>
    );
  }
  if (b.kind === 'tabla') {
    const cols = b.columns as { label: string; label_en: string }[];
    const setCell = (r: number, c: number, patch: any) => set({ rows: b.rows.map((row: any[], i: number) => (i === r ? row.map((cell, j) => (j === c ? { ...cell, ...patch } : cell)) : row)) });
    const addCol = () => set({ columns: [...cols, { label: '', label_en: '' }], rows: b.rows.map((r: any[]) => [...r, { text: '', text_en: '' }]) });
    const delCol = (c: number) => set({ columns: cols.filter((_, j) => j !== c), rows: b.rows.map((r: any[]) => r.filter((_, j) => j !== c)) });
    return (
      <div class="pt-cs-rows">
        <Pair label="Título de la tabla" es={b.caption} en={b.caption_en} view={view} onEs={(v) => set({ caption: v })} onEn={(v) => set({ caption_en: v })} />
        <div class="pt-cs-tablewrap">
          <table class="pt-cs-table">
            <thead>
              <tr>
                {cols.map((c, ci) => (
                  <th>
                    {view !== 'en' && <input type="text" placeholder="Columna" value={c.label} onInput={(e) => set({ columns: cols.map((x, j) => (j === ci ? { ...x, label: (e.target as HTMLInputElement).value } : x)) })} />}
                    {view !== 'es' && <input type="text" placeholder="Column" value={c.label_en} onInput={(e) => set({ columns: cols.map((x, j) => (j === ci ? { ...x, label_en: (e.target as HTMLInputElement).value } : x)) })} />}
                    {cols.length > 1 && <button type="button" class="pt-admin-link pt-admin-danger" onClick={() => delCol(ci)}>Quitar</button>}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row: any[], ri: number) => (
                <tr>
                  {row.map((cell, ci) => (
                    <td>
                      {view !== 'en' && <textarea rows={2} value={cell.text} onInput={(e) => setCell(ri, ci, { text: (e.target as HTMLTextAreaElement).value })} />}
                      {view !== 'es' && <textarea rows={2} class="pt-cs-en" value={cell.text_en} onInput={(e) => setCell(ri, ci, { text_en: (e.target as HTMLTextAreaElement).value })} />}
                    </td>
                  ))}
                  <td><button type="button" class="pt-admin-link pt-admin-danger" onClick={() => set({ rows: b.rows.filter((_: any, j: number) => j !== ri) })}>Quitar fila</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <button type="button" class="pt-admin-link" onClick={() => set({ rows: [...b.rows, cols.map(() => ({ text: '', text_en: '' }))] })}>+ Agregar fila</button>{' '}
          <button type="button" class="pt-admin-link" onClick={addCol}>+ Agregar columna</button>
        </div>
      </div>
    );
  }
  if (b.kind === 'diagrama') {
    return (
      <div class="pt-cs-rows">
        <div class="pt-field">
          <label>Imagen</label>
          <input type="file" accept="image/*" onChange={async (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) { const u = await upload(f); if (u) set({ url: u }); } }} />
          <input type="text" value={b.url} placeholder="URL de la imagen" onInput={(e) => set({ url: (e.target as HTMLInputElement).value })} />
          {b.url && <img class="pt-admin-thumb" src={b.url} alt="" />}
        </div>
        <Pair label="Texto alternativo" es={b.alt} en={b.alt_en} view={view} onEs={(v) => set({ alt: v })} onEn={(v) => set({ alt_en: v })} />
        <Pair label="Pie de imagen" es={b.caption} en={b.caption_en} view={view} onEs={(v) => set({ caption: v })} onEn={(v) => set({ caption_en: v })} />
      </div>
    );
  }
  // enlaces
  const setLink = (i: number, patch: any) => set({ items: b.items.map((x: any, j: number) => (j === i ? { ...x, ...patch } : x)) });
  return (
    <div class="pt-cs-rows">
      {b.items.map((l: any, i: number) => (
        <div class="pt-cs-row">
          <Pair label="Texto del enlace" es={l.label} en={l.label_en} view={view} onEs={(v) => setLink(i, { label: v })} onEn={(v) => setLink(i, { label_en: v })} />
          <div class="pt-field"><label>URL</label><input type="text" value={l.url} placeholder="https://…" onInput={(e) => setLink(i, { url: (e.target as HTMLInputElement).value })} /></div>
          <button type="button" class="pt-admin-link pt-admin-danger" onClick={() => set({ items: b.items.filter((_: any, j: number) => j !== i) })}>Quitar</button>
        </div>
      ))}
      <button type="button" class="pt-admin-link" onClick={() => set({ items: [...b.items, { label: '', label_en: '', url: '' }] })}>+ Agregar enlace</button>
    </div>
  );
}

// ---------- vista previa (mismo marcado que la ventana pública) ----------
function Preview({ data, lang }: { data: CaseRow; lang: 'es' | 'en' }) {
  const pick = (es: string, en: string) => (lang === 'en' ? en || es : es || en);
  const sections = localizeSections(data.sections, lang);
  const overview = data.type === 'analista' ? getAnalystOverview(sections, lang) : null;
  const [cur, setCur] = useState(0);
  const sec = sections[Math.min(cur, Math.max(sections.length - 1, 0))];
  return (
    <div class="pt-case-box pt-cs-preview">
      <header class="pt-case-head">
        {pick(data.badge, data.badge_en) && <p class="pt-case-badge">{pick(data.badge, data.badge_en)}</p>}
        <h2>{pick(data.title, data.title_en)}</h2>
        {pick(data.description, data.description_en) && <p>{pick(data.description, data.description_en)}</p>}
      </header>
      {overview ? <AnalystCaseOverview overview={overview} lang={lang} /> : sections.length === 0 ? <p class="pt-sample">Todavía no hay secciones con contenido.</p> : (
        <div class="pt-case-layout">
          <nav class="pt-case-nav">
            {sections.map((s, i) => <button type="button" aria-current={i === cur ? 'true' : undefined} onClick={() => setCur(i)}>{s.title}</button>)}
          </nav>
          <div class="pt-case-sections">
            <section class="pt-case-sec">
              <h3>{sec.title}</h3>
              {sec.blocks.map((b) => {
                if (b.kind === 'texto') return b.text.split(/\n{2,}/).map((p) => <p>{p}</p>);
                if (b.kind === 'subtitulo') return <h4>{b.text}</h4>;
                if (b.kind === 'lista') return <ul>{b.items.map((t) => <li>{t}</li>)}</ul>;
                if (b.kind === 'pasos') return <ol class="pt-case-steps">{b.steps.map((st) => <li>{st.title && <strong>{st.title}</strong>}{st.text && <p>{st.text}</p>}{st.items.length > 0 && <ul>{st.items.map((t) => <li>{t}</li>)}</ul>}</li>)}</ol>;
                if (b.kind === 'metricas') return <dl class="pt-case-metrics">{b.items.map((m) => <div><dt>{m.value}</dt><dd>{m.label}</dd></div>)}</dl>;
                if (b.kind === 'tabla') return (
                  <div class="pt-case-table"><table>{b.caption && <caption>{b.caption}</caption>}{b.columns.length > 0 && <thead><tr>{b.columns.map((h) => <th>{h}</th>)}</tr></thead>}<tbody>{b.rows.map((r) => <tr>{r.map((c) => <td>{c}</td>)}</tr>)}</tbody></table></div>
                );
                if (b.kind === 'diagrama') return <figure class="pt-case-figure"><img src={b.url} alt={b.alt} />{b.caption && <figcaption>{b.caption}</figcaption>}</figure>;
                return <p class="pt-case-links">{b.items.map((l) => <a class="pt-link-gold" href={l.url}>{l.label || l.url}</a>)}</p>;
              })}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- módulo ----------
export default function CasesModule() {
  const wizardOpen = useSignal(false);
  const wizardStep = useSignal(1);
  const busy = useSignal(false);
  const status = useSignal('');
  const op = useSignal<OpState | null>(null);

  const [cases, setCases] = useState<CaseRow[]>([]);
  const [projects, setProjects] = useState<{ slug: string; title: string }[]>([]);
  const [data, setData] = useState<CaseRow>(emptyCase());
  const [msg, setMsg] = useState('');
  const [view, setViewState] = useState<View>(() => { try { return (localStorage.getItem('pt_admin_lang_view') as View) || 'both'; } catch { return 'both'; } });
  const setView = (v: View) => { setViewState(v); try { localStorage.setItem('pt_admin_lang_view', v); } catch { /* ignore */ } };
  const [previewLang, setPreviewLang] = useState<'es' | 'en'>('es');
  const [translating, setTranslating] = useState(false);
  const [showLegacy, setShowLegacy] = useState(false);

  async function load() {
    const c = await db.from('project_cases').select('*').eq('site', SITE_ID).order('updated_at', { ascending: false });
    if (!c.error) setCases((c.data || []) as CaseRow[]);
    const p = await db.from('projects').select('slug, title').eq('site', SITE_ID).eq('lang', 'es').order('position');
    if (!p.error) setProjects((p.data || []) as any[]);
  }
  useEffect(() => { load(); }, []);

  const mutate = (fn: (d: CaseRow) => void) => setData((prev) => { const d = clone(prev); fn(d); return d; });

  function nuevo() { setShowLegacy(false); setData(emptyCase()); wizardStep.value = 1; status.value = ''; wizardOpen.value = true; }
  function editar(c: CaseRow) {
    const d = clone(c);
    setShowLegacy(false);
    if (d.type === 'analista' && sampleCard && d.project_slug === SAMPLE_SLUG && !d.sections.some((s) => isAnalystField(s.key))) {
      const card = sampleCard;
      d.title = card.title;
      d.badge = 'Caso de estudio · Análisis funcional';
      d.description = card.context;
      d.sections = [...clone(sampleSections), ...d.sections];
    }
    const sectionsByKey = new Map(d.sections.map((section) => [section.key, section]));
    const templates = TEMPLATES[d.type];
    const missing = templates.filter((t) => !sectionsByKey.has(t.key)).map((t) => ({ key: t.key, title: t.title, title_en: t.title_en, blocks: [] as RawBlock[] }));
    d.sections = [...d.sections, ...missing];
    if (d.type === 'analista') {
      const positions = new Map(templates.map(({ key }, i) => [key, i]));
      d.sections.sort((a, b) => (positions.get(a.key) ?? templates.length) - (positions.get(b.key) ?? templates.length));
    }
    d.title_en ??= ''; d.badge ??= ''; d.badge_en ??= ''; d.description ??= ''; d.description_en ??= '';
    setData(d); wizardStep.value = 1; status.value = ''; wizardOpen.value = true;
  }

  function changeType(type: CaseType) {
    const empty = data.sections.every((s) => (s.blocks ?? []).length === 0);
    if (!empty && !window.confirm('Cambiar el tipo reemplaza las secciones. ¿Seguir?')) return;
    mutate((d) => { d.type = type; d.sections = emptyCase(type).sections; });
  }

  async function upload(file: File): Promise<string | null> {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `${SITE_ID}/casos/${slugify(data.project_slug || 'caso')}-${Date.now()}.${ext}`;
    const { error } = await db.storage.from('blog-images').upload(path, file, { upsert: true });
    if (error) { status.value = `No se pudo subir la imagen: ${error.message}`; return null; }
    return db.storage.from('blog-images').getPublicUrl(path).data.publicUrl;
  }

  async function tr(text: string, from: 'es' | 'en', to: 'es' | 'en'): Promise<string | null> {
    const { data: r, error } = await db.functions.invoke('blog-translate', { body: { text, from, to } });
    return error || !r?.text ? null : String(r.text);
  }

  // Traduce al inglés lo que está escrito en español y todavía no tiene inglés (en la sección actual).
  async function translateSection(si: number) {
    setTranslating(true); status.value = '';
    const d = clone(data);
    const jobs: { obj: any; es: string; en: string }[] = [];
    const add = (obj: any, es: string, en: string) => { if (obj && String(obj[es] ?? '').trim() && !String(obj[en] ?? '').trim()) jobs.push({ obj, es, en }); };
    const sec = d.sections[si];
    add(sec, 'title', 'title_en');
    let skipped = 0;
    for (const b of sec.blocks ?? []) {
      const x = b as any;
      if (x.kind === 'texto' || x.kind === 'subtitulo') add(x, 'text', 'text_en');
      if (x.kind === 'lista') x.items.forEach((i: any) => add(i, 'text', 'text_en'));
      if (x.kind === 'pasos') x.steps.forEach((s: any) => { add(s, 'title', 'title_en'); add(s, 'text', 'text_en'); s.items.forEach((i: any) => add(i, 'text', 'text_en')); });
      if (x.kind === 'metricas') x.items.forEach((i: any) => add(i, 'label', 'label_en'));
      if (x.kind === 'diagrama') { add(x, 'alt', 'alt_en'); add(x, 'caption', 'caption_en'); }
      if (x.kind === 'enlaces') x.items.forEach((i: any) => add(i, 'label', 'label_en'));
      if (x.kind === 'tabla') {
        add(x, 'caption', 'caption_en'); x.columns.forEach((c: any) => add(c, 'label', 'label_en'));
        if (x.rows.length > 40) skipped++; else x.rows.forEach((r: any[]) => r.forEach((c) => add(c, 'text', 'text_en')));
      }
    }
    let done = 0;
    for (const j of jobs) {
      const out = await tr(String(j.obj[j.es]), 'es', 'en');
      if (!out) { status.value = `Se tradujeron ${done} de ${jobs.length}; falló una (revisá la conexión y volvé a intentar).`; break; }
      j.obj[j.en] = out; done++;
    }
    setData(d); setTranslating(false);
    if (done === jobs.length) status.value = jobs.length ? `Traducido (${done}).${skipped ? ' Las tablas de más de 40 filas se traducen a mano.' : ''}` : 'No había nada por traducir en esta sección.';
  }

  async function save(published: boolean) {
    if (!data.project_slug) { status.value = 'Elegí el proyecto al que pertenece el caso.'; wizardStep.value = 1; return; }
    if (!data.title.trim()) { status.value = 'Falta el título del caso.'; wizardStep.value = 1; return; }
    busy.value = true; status.value = 'Guardando…';
    const row: any = {
      site: SITE_ID, project_slug: data.project_slug, type: data.type, title: data.title, title_en: data.title_en || null,
      badge: data.badge || null, badge_en: data.badge_en || null, description: data.description || null, description_en: data.description_en || null,
      sections: data.sections.filter((s) => (s.blocks ?? []).length > 0), published,
    };
    const res = await db.from('project_cases').upsert(row, { onConflict: 'site,project_slug' });
    busy.value = false;
    if (res.error) { status.value = res.error.message; return; }
    await load();
    setMsg(published ? 'Caso publicado. Aparece en el portafolio en 1 o 2 minutos (el sitio se reconstruye solo).' : 'Borrador guardado.');
    wizardOpen.value = false;
  }

  async function togglePublished(c: CaseRow) {
    const r = await db.from('project_cases').update({ published: !c.published }).eq('id', c.id!);
    if (!r.error) load();
  }
  async function remove(c: CaseRow) {
    if (!window.confirm(`¿Eliminar el caso «${c.title}»? No se puede deshacer.`)) return;
    const r = await db.from('project_cases').delete().eq('id', c.id!);
    if (!r.error) load();
  }

  const step = wizardStep.value;
  const editorSections = data.sections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => data.type !== 'analista' || showLegacy || isAnalystField(section.key));
  const nSec = editorSections.length;
  const secIndex = editorSections[step - 2]?.index ?? -1;
  const hasLegacy = data.type === 'analista' && data.sections.some((section) => !isAnalystField(section.key));
  const steps = ['Datos', ...editorSections.map(({ section }) => section.title || section.key), 'Vista previa', 'Publicar'];
  const usedSlugs = new Set(cases.filter((c) => c.project_slug !== data.project_slug).map((c) => c.project_slug));
  const selectableProjects = projects.filter((p) => !usedSlugs.has(p.slug));
  const next = <div class="pt-cs-next"><button type="button" class="pt-button" onClick={() => (wizardStep.value = step + 1)}>Siguiente →</button></div>;

  const viewSwitch = (
    <div class="pt-lang-view" role="group" aria-label="Idiomas que se muestran">
      <span>Ver:</span>
      {([['both', 'Ambos'], ['es', 'Español'], ['en', 'English']] as const).map(([v, label]) => (
        <button type="button" class={view === v ? 'is-on' : ''} aria-pressed={view === v} onClick={() => setView(v)}>{label}</button>
      ))}
    </div>
  );

  return (
    <div class="pt-abm">
      <h2>Casos de estudio</h2>
      {msg && <p class="pt-form-status" role="status">{msg}</p>}
      <div class="pt-admin-actions"><button class="pt-button" type="button" onClick={nuevo}>Nuevo caso</button></div>
      <p class="pt-form-note">Cada caso pertenece a un proyecto del Portafolio. En el sitio se abre en una ventana al hacer clic en el proyecto.</p>
      {cases.length === 0 ? <p class="pt-sample">No hay casos todavía.</p> : (
        <ul class="pt-admin-list">
          {cases.map((c) => (
            <li>
              <div class="pt-admin-row pt-cs-listrow">
                <span>{c.title}</span>
                <span>{c.project_slug}</span>
                <span>{CASE_TYPES.find((t) => t.id === c.type)?.label}</span>
                <span>{c.published ? 'Publicado' : 'Borrador'}</span>
                <span class="pt-cs-actions">
                  <button type="button" class="pt-admin-link" onClick={() => editar(c)}>Editar</button>
                  <button type="button" class="pt-admin-link" onClick={() => togglePublished(c)}>{c.published ? 'A borrador' : 'Publicar'}</button>
                  <button type="button" class="pt-admin-link pt-admin-danger" onClick={() => remove(c)}>Eliminar</button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <WizardModal steps={steps} newLabel="Nuevo caso de estudio" editLabel="Editar caso de estudio" isEditing={!!data.id} wizardOpen={wizardOpen} wizardStep={wizardStep} busy={busy} op={op} status={status}>
        <div class="pt-form pt-cs-wizard">
          {status.value && !busy.value && <p class="pt-form-status" role="status">{status.value}</p>}

          {step === 1 && (
            <>
              <h3>Datos del caso</h3>
              <div class="pt-field">
                <label>Proyecto del portafolio</label>
                <select value={data.project_slug} onChange={(e) => mutate((d) => { d.project_slug = (e.target as HTMLSelectElement).value; if (!d.title) d.title = projects.find((p) => p.slug === d.project_slug)?.title ?? ''; })}>
                  <option value="">— elegí un proyecto —</option>
                  {selectableProjects.map((p) => <option value={p.slug}>{p.title}</option>)}
                </select>
                <span class="pt-form-note">Si el proyecto no está, creálo antes en «Portafolio».</span>
              </div>
              <div class="pt-field">
                <label>Tipo de caso</label>
                <div class="pt-lang-view" role="group">
                  {CASE_TYPES.map((t) => <button type="button" class={data.type === t.id ? 'is-on' : ''} aria-pressed={data.type === t.id} onClick={() => changeType(t.id)}>{t.label}</button>)}
                </div>
                <span class="pt-form-note">{CASE_TYPES.find((t) => t.id === data.type)?.hint}</span>
                {hasLegacy && <label><input type="checkbox" checked={showLegacy} onChange={(e) => setShowLegacy(e.currentTarget.checked)} /> Mostrar secciones anteriores</label>}
              </div>
              {viewSwitch}
              <Pair label="Título" es={data.title} en={data.title_en} view={view} onEs={(v) => mutate((d) => { d.title = v; })} onEn={(v) => mutate((d) => { d.title_en = v; })} />
              <Pair label="Etiqueta superior (cliente · rubro)" es={data.badge} en={data.badge_en} view={view} onEs={(v) => mutate((d) => { d.badge = v; })} onEn={(v) => mutate((d) => { d.badge_en = v; })} />
              <Pair label="Descripción breve" multiline es={data.description} en={data.description_en} view={view} onEs={(v) => mutate((d) => { d.description = v; })} onEn={(v) => mutate((d) => { d.description_en = v; })} />
              {next}
            </>
          )}

          {step >= 2 && step < 2 + nSec && data.sections[secIndex] && (() => {
            const sec = data.sections[secIndex];
            const tpl = TEMPLATES[data.type].find((t) => t.key === sec.key);
            const setBlock = (bi: number, patch: any) => mutate((d) => { Object.assign(d.sections[secIndex].blocks![bi], patch); });
            return (
              <>
                <h3>{sec.title || sec.key} <span class="pt-form-note">(sección {step - 1} de {nSec})</span></h3>
                {tpl && <p class="pt-form-note">{tpl.hint} Podés dejarla vacía: no se muestra.</p>}
                {viewSwitch}
                <Pair label="Título de la sección" es={sec.title ?? ''} en={sec.title_en ?? ''} view={view} onEs={(v) => mutate((d) => { d.sections[secIndex].title = v; })} onEn={(v) => mutate((d) => { d.sections[secIndex].title_en = v; })} />
                {(sec.blocks ?? []).map((b, bi) => (
                  <div class="pt-cs-block">
                    <div class="pt-cs-blockbar">
                      <strong>{BLOCK_LABELS[b.kind as BlockKind]}</strong>
                      <span>
                        <button type="button" class="pt-admin-link" disabled={bi === 0} onClick={() => mutate((d) => { const a = d.sections[secIndex].blocks!; [a[bi - 1], a[bi]] = [a[bi], a[bi - 1]]; })}>↑</button>{' '}
                        <button type="button" class="pt-admin-link" disabled={bi === (sec.blocks?.length ?? 0) - 1} onClick={() => mutate((d) => { const a = d.sections[secIndex].blocks!; [a[bi + 1], a[bi]] = [a[bi], a[bi + 1]]; })}>↓</button>{' '}
                        <button type="button" class="pt-admin-link pt-admin-danger" onClick={() => mutate((d) => { d.sections[secIndex].blocks!.splice(bi, 1); })}>Quitar bloque</button>
                      </span>
                    </div>
                    <BlockEditor b={b} view={view} set={(p) => setBlock(bi, p)} upload={upload} />
                  </div>
                ))}
                <div class="pt-cs-addblock">
                  <span>Agregar bloque:</span>
                  {(tpl?.kinds ?? Object.keys(BLOCK_LABELS) as BlockKind[]).map((k) => (
                    <button type="button" class="pt-admin-link" onClick={() => mutate((d) => { (d.sections[secIndex].blocks ??= []).push(newBlock(k)); })}>{BLOCK_LABELS[k]}</button>
                  ))}
                </div>
                <div class="pt-cs-next">
                  <button type="button" class="pt-admin-link" disabled={translating} onClick={() => translateSection(secIndex)}>{translating ? 'Traduciendo…' : 'Traducir al inglés lo que falta (IA)'}</button>
                  {step === nSec + 1 && (data.type !== 'analista' || showLegacy) && <button type="button" class="pt-admin-link" onClick={() => { const t = window.prompt('Título de la nueva sección'); if (t) mutate((d) => { d.sections.push({ key: `extra-${Date.now()}`, title: t, title_en: '', blocks: [] }); }); }}>+ Agregar sección propia</button>}
                  <button type="button" class="pt-button" onClick={() => (wizardStep.value = step + 1)}>Siguiente →</button>
                </div>
              </>
            );
          })()}

          {step === 2 + nSec && (
            <>
              <h3>Vista previa</h3>
              <div class="pt-lang-view" role="group">
                <span>Idioma:</span>
                {(['es', 'en'] as const).map((l) => <button type="button" class={previewLang === l ? 'is-on' : ''} aria-pressed={previewLang === l} onClick={() => setPreviewLang(l)}>{l === 'es' ? 'Español' : 'English'}</button>)}
              </div>
              <Preview data={data} lang={previewLang} />
              {next}
            </>
          )}

          {step === 3 + nSec && (
            <>
              <h3>Publicar</h3>
              <p class="pt-form-note">Las secciones sin contenido no se guardan. Un caso publicado aparece en el portafolio al reconstruirse el sitio (1 o 2 minutos).</p>
              <div class="pt-form-actions">
                <button class="pt-button" type="button" disabled={busy.value} onClick={() => save(true)}>{data.id ? 'Actualizar y publicar' : 'Publicar'}</button>
                <button class="pt-admin-link" type="button" disabled={busy.value} onClick={() => save(false)}>Guardar borrador</button>
              </div>
            </>
          )}
        </div>
      </WizardModal>
    </div>
  );
}
