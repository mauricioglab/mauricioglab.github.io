import { useSignal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import WizardModal from './shared/WizardModal';
import type { OpState } from './shared/BusyOverlay';
import { db } from '../../lib/db';
import { BLOG_CATEGORIES, normalizeCategories } from '../../data/blog-categories';
import { TEMAS, normalizeTemas } from '../../data/temas';

const BASE = import.meta.env.BASE_URL;
const BLOG_BASE = BASE.endsWith('/') ? BASE : `${BASE}/`;

function slugify(text: string) {
  return (
    (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'post'
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function inlineMd(s: string) {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
function renderMarkdown(md: string) {
  if (!md) return '';
  const lines = md.split(/\r?\n/);
  let html = '';
  let inCode = false;
  let listType: string | null = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (line.startsWith('```')) {
      if (inCode) {
        html += '</code></pre>';
        inCode = false;
      } else {
        html += '<pre><code>';
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      html += escapeHtml(line) + '\n';
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      if (listType) {
        html += `</${listType}>`;
        listType = null;
      }
      html += `<h${lvl}>${inlineMd(h[2])}</h${lvl}>`;
      continue;
    }
    if (/^\s*(-|\*|\+)\s+/.test(line)) {
      const content = line.replace(/^\s*(-|\*|\+)\s+/, '');
      if (listType !== 'ul') {
        if (listType) html += `</${listType}>`;
        html += '<ul>';
        listType = 'ul';
      }
      html += `<li>${inlineMd(content)}</li>`;
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const content = line.replace(/^\s*\d+\.\s+/, '');
      if (listType !== 'ol') {
        if (listType) html += `</${listType}>`;
        html += '<ol>';
        listType = 'ol';
      }
      html += `<li>${inlineMd(content)}</li>`;
      continue;
    }
    if (line.startsWith('> ')) {
      if (listType) {
        html += `</${listType}>`;
        listType = null;
      }
      html += `<blockquote>${inlineMd(line.slice(2))}</blockquote>`;
      continue;
    }
    if (listType) {
      html += `</${listType}>`;
      listType = null;
    }
    if (line.trim() === '') continue;
    html += `<p>${inlineMd(line)}</p>`;
  }
  if (inCode) html += '</code></pre>';
  if (listType) html += `</${listType}>`;
  return html;
}

const OP_STEPS: Record<string, string[]> = {
  url: ['Conectar', 'Extraer el texto', 'Limpiar el texto'],
  propuestas: ['Conectar', 'Analizar el tema', 'Buscar ángulos', 'Armar respuesta'],
  redactar: ['Conectar', 'Redactar el borrador', 'Parsear respuesta'],
  revisar: ['Conectar', 'Revisar calidad', 'Chequear extensión'],
  corregir: ['Conectar', 'Aplicar correcciones', 'Parsear respuesta'],
  imagen: ['Conectar', 'Prompt de tapa', 'Generar imagen', 'Subir a storage'],
  publicar: ['Guardar en la base'],
};
const OP_MSGS: Record<string, string[]> = {
  url: ['Conectando…', 'Extrayendo el artículo…', 'Limpiando el texto…'],
  propuestas: ['Conectando con DeepSeek…', 'Analizando el tema…', 'Buscando ángulos distintos…', 'Redactando resúmenes…'],
  redactar: ['Redactando el borrador…', 'Puliendo el hook…', 'Ajustando la estructura…'],
  revisar: ['Revisando hook y precisión…', 'Chequeando tono…', 'Verificando extensión…'],
  corregir: ['Aplicando correcciones…', 'Reescribiendo pasajes…', 'Puliendo detalles…'],
  imagen: ['Consultando al director de arte…', 'Generando la imagen 16:9…', 'Subiendo a storage…'],
  publicar: ['Guardando en la base…'],
};

interface Form {
  tema: string;
  enfoque: string;
  tono: string;
  fraseClave: string;
  tiempoLecturaMin: string;
}

interface Propuesta {
  tituloSugerido: string;
  angulo: string;
  resumen: string;
}

interface Borrador {
  title: string;
  description: string;
  bodyMarkdown: string;
  categories?: string[];
  topicos?: string[];
}

interface ReviewProblema {
  tipo: string;
  donde?: string;
  fixSugerido?: string;
}

interface Review {
  aprobado: boolean;
  nota?: number | null;
  resumen?: string;
  problemas?: ReviewProblema[];
}

interface TemaHistoryEntry {
  id: string;
  tema: string;
  enfoque: string | null;
  tono: string | null;
  fraseClave: string | null;
  savedAt: string;
}

interface Post {
  id: string;
  title: string;
  draft: boolean;
  pub_date: string;
  categories?: string[];
  description?: string;
  body_markdown?: string;
  topicos?: string[];
  cover_url?: string;
}

interface OpHistoryEntry {
  id: string;
  label: string;
  ok: boolean;
  result: string;
  elapsed: string;
  ts: number;
}

const emptyForm: Form = { tema: '', enfoque: '', tono: 'Cercano y directo', fraseClave: '', tiempoLecturaMin: '5' };
const emptyBorrador: Borrador = { title: '', description: '', bodyMarkdown: '' };

export default function BlogAdminPreact() {
  const wizardOpen = useSignal(false);
  const wizardStep = useSignal(1);
  const busy = useSignal(false);
  const status = useSignal('');
  const op = useSignal<OpState | null>(null);

  const [form, setForm] = useState<Form>(emptyForm);
  const [urlRef, setUrlRef] = useState('');
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [propuestaIndex, setPropuestaIndex] = useState(-1);
  const [borrador, setBorrador] = useState<Borrador>(emptyBorrador);
  const [review, setReview] = useState<Review | null>(null);
  const [iteracion, setIteracion] = useState(0);
  const [correccionPrompt, setCorreccionPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTema, setSelectedTema] = useState('');
  const [selectedTemas, setSelectedTemas] = useState<string[]>([]);
  const [temasHistory, setTemasHistory] = useState<TemaHistoryEntry[]>([]);
  const [coverPrompt, setCoverPrompt] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [opHistory, setOpHistory] = useState<OpHistoryEntry[]>([]);

  async function loadPosts() {
    const { data, error } = await db.from('blogs').select('*').order('pub_date', { ascending: false });
    if (!error) setPosts(data || []);
  }

  function loadTemasHistory() {
    try {
      const raw = localStorage.getItem('mglab_blog_temas_history');
      const arr = raw ? JSON.parse(raw) : [];
      setTemasHistory(Array.isArray(arr) ? arr : []);
    } catch {
      setTemasHistory([]);
    }
  }

  useEffect(() => {
    loadPosts();
    loadTemasHistory();
  }, []);

  function persistTemasHistory(list: TemaHistoryEntry[]) {
    try {
      localStorage.setItem('mglab_blog_temas_history', JSON.stringify(list));
    } catch {}
  }

  function saveTemaEntry() {
    const tema = (form.tema || '').trim();
    if (!tema) return;
    const entry: TemaHistoryEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      tema,
      enfoque: (form.enfoque || '').trim() || null,
      tono: (form.tono || '').trim() || null,
      fraseClave: (form.fraseClave || '').trim() || null,
      savedAt: new Date().toISOString(),
    };
    setTemasHistory((history) => {
      const next = [entry, ...history.filter((e) => (e.tema || '').toLowerCase() !== tema.toLowerCase())].slice(0, 10);
      persistTemasHistory(next);
      return next;
    });
  }

  function deleteTemaEntry(id: string) {
    setTemasHistory((history) => {
      const next = history.filter((e) => e.id !== id);
      persistTemasHistory(next);
      return next;
    });
  }

  function useTemaEntry(id: string) {
    const e = temasHistory.find((x) => x.id === id);
    if (!e) return;
    setForm({ ...form, tema: e.tema || '', enfoque: e.enfoque || '', tono: e.tono || 'Cercano y directo', fraseClave: e.fraseClave || '' });
  }

  function nuevoPost() {
    setEditingId(null);
    setBorrador(emptyBorrador);
    setReview(null);
    setIteracion(0);
    setCorreccionPrompt('');
    setCoverUrl('');
    setCoverPrompt('');
    setPropuestas([]);
    setPropuestaIndex(-1);
    setShowPreview(false);
    setForm(emptyForm);
    setUrlRef('');
    setSelectedCategory('');
    setSelectedCategories([]);
    setSelectedTema('');
    setSelectedTemas([]);
  }

  function abrirWizardNuevo() {
    nuevoPost();
    wizardStep.value = 1;
    wizardOpen.value = true;
  }

  const availableCategories = BLOG_CATEGORIES.filter((c) => !selectedCategories.includes(c));
  const availableTemas = TEMAS.filter((t) => !selectedTemas.includes(t));

  function addCategory(cat: string) {
    if (cat && !selectedCategories.includes(cat)) setSelectedCategories([...selectedCategories, cat]);
    setSelectedCategory('');
  }

  function removeCategory(index: number) {
    setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
  }

  function setCategoriesFromList(list: string[]) {
    setSelectedCategories(normalizeCategories(list || []));
  }

  function addTema(tema: string) {
    if (tema && !selectedTemas.includes(tema)) setSelectedTemas([...selectedTemas, tema]);
    setSelectedTema('');
  }

  function removeTema(index: number) {
    setSelectedTemas(selectedTemas.filter((_, i) => i !== index));
  }

  function setTemasFromList(list: string[]) {
    setSelectedTemas(normalizeTemas(list || []));
  }

  let opInterval: ReturnType<typeof setInterval> | null = null;
  let opMsgInterval: ReturnType<typeof setInterval> | null = null;

  function clearOpIntervals() {
    if (opInterval) {
      clearInterval(opInterval);
      opInterval = null;
    }
    if (opMsgInterval) {
      clearInterval(opMsgInterval);
      opMsgInterval = null;
    }
  }

  function opElapsed(startedAt: number) {
    const secs = Math.floor((Date.now() - startedAt) / 1000);
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  }

  function startOp(id: string, label: string, steps: string[], messages: string[]) {
    clearOpIntervals();
    const now = Date.now();
    op.value = {
      id,
      label,
      startedAt: now,
      elapsed: '0:00',
      messages,
      msgIndex: 0,
      stepIndex: 0,
      steps: steps.map((s, i) => ({ label: s, status: i === 0 ? 'active' : 'pending' })),
      finished: false,
    };
    busy.value = true;
    status.value = messages[0] || '';

    opInterval = setInterval(() => {
      const cur = op.value;
      if (!cur || cur.finished) return;
      const elapsed = opElapsed(cur.startedAt);
      const steps = [...cur.steps];
      let stepIndex = cur.stepIndex;
      const active = steps[stepIndex];
      if (active && active.status === 'active' && Date.now() - cur.startedAt > 8000 * (stepIndex + 1)) {
        steps[stepIndex] = { ...active, status: 'done' };
        const next = stepIndex + 1;
        if (next < steps.length) {
          steps[next] = { ...steps[next], status: 'active' };
          stepIndex = next;
        }
      }
      op.value = { ...cur, elapsed, steps, stepIndex };
    }, 1000);

    opMsgInterval = setInterval(() => {
      const cur = op.value;
      if (!cur || cur.finished) return;
      const len = cur.messages?.length || 1;
      op.value = { ...cur, msgIndex: (cur.msgIndex + 1) % len };
    }, 3000);
  }

  function finishOp(successMsg: string) {
    const cur = op.value;
    if (!cur) {
      busy.value = false;
      return;
    }
    clearOpIntervals();
    setOpHistory((h) =>
      [{ id: cur.id, label: cur.label, ok: true, result: successMsg, elapsed: opElapsed(cur.startedAt), ts: Date.now() }, ...h].slice(0, 5)
    );
    status.value = successMsg;
    busy.value = false;
    op.value = null;
  }

  function failOp(errorMsg: string) {
    const cur = op.value;
    if (!cur) {
      busy.value = false;
      return;
    }
    clearOpIntervals();
    setOpHistory((h) =>
      [{ id: cur.id, label: cur.label, ok: false, result: errorMsg, elapsed: opElapsed(cur.startedAt), ts: Date.now() }, ...h].slice(0, 5)
    );
    status.value = errorMsg;
    busy.value = false;
    op.value = null;
  }

  async function traerTextoUrl() {
    const url = (urlRef || '').trim();
    if (!url) {
      status.value = 'Pegá una URL primero.';
      return;
    }
    startOp('url', 'Traer texto de la URL', OP_STEPS.url, OP_MSGS.url);
    try {
      const { data, error } = await db.functions.invoke('blog-fetch-url', { body: { url } });
      if (error) throw new Error(error.context?.error || error.message);
      setForm((f) => ({ ...f, fraseClave: data.text || '' }));
      finishOp('Texto traído. Ajustalo si hace falta y generá propuestas.');
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  async function generarPropuestas() {
    if (!form.tema) {
      status.value = 'Ingresá un tema.';
      return;
    }
    startOp('propuestas', 'Generar propuestas', OP_STEPS.propuestas, OP_MSGS.propuestas);
    try {
      const { data, error } = await db.functions.invoke('blog-proposals', { body: form });
      if (error) throw new Error(error.context?.error || error.message);
      const props: Propuesta[] = data.propuestas || [];
      setPropuestas(props);
      setPropuestaIndex(-1);
      saveTemaEntry();
      finishOp(`${props.length} propuesta(s) generadas. Elegí una.`);
      wizardStep.value = 2;
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  async function redactar() {
    if (propuestaIndex < 0) {
      status.value = 'Elegí una propuesta.';
      return;
    }
    startOp('redactar', 'Redactar el post', OP_STEPS.redactar, OP_MSGS.redactar);
    try {
      const { data, error } = await db.functions.invoke('blog-write', {
        body: { ...form, propuesta: propuestas[propuestaIndex] },
      });
      if (error) throw new Error(error.context?.error || error.message);
      setBorrador(data.borrador);
      setReview(null);
      setIteracion(0);
      setCorreccionPrompt('');
      setCategoriesFromList(data.borrador.categories || []);
      setTemasFromList(data.borrador.topicos || []);
      setCoverUrl('');
      setCoverPrompt('');
      setShowPreview(false);
      finishOp('Borrador listo. Revisalo, ajustá y publicá.');
      wizardStep.value = 3;
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  async function revisar() {
    if (!borrador?.bodyMarkdown) {
      status.value = 'Primero redactá el post.';
      return;
    }
    startOp('revisar', 'Revisar con el crítico IA', OP_STEPS.revisar, OP_MSGS.revisar);
    try {
      const { data, error } = await db.functions.invoke('blog-review', {
        body: {
          borrador: { title: borrador.title, categories: borrador.categories || [], description: borrador.description, bodyMarkdown: borrador.bodyMarkdown },
          tiempoLecturaMin: Number(form.tiempoLecturaMin) || null,
        },
      });
      if (error) throw new Error(error.context?.error || error.message);
      const rev: Review | null = data.review || null;
      setReview(rev);
      finishOp(rev?.aprobado ? 'El crítico aprobó el borrador. Listo para publicar.' : 'El crítico marcó problemas. Podés aplicar correcciones o editarlas a mano.');
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  async function aplicarCorrecciones() {
    if (!borrador?.bodyMarkdown) {
      status.value = 'Primero redactá el post.';
      return;
    }
    const instruccion = (correccionPrompt || '').trim();
    if (!review && !instruccion) {
      status.value = 'Escribí una corrección abajo o corré el crítico con "Revisar con IA".';
      return;
    }
    if (iteracion >= 2) {
      status.value = 'Tope de revisiones alcanzado.';
      return;
    }
    startOp('corregir', 'Aplicar corrección', OP_STEPS.corregir, OP_MSGS.corregir);
    try {
      const { data, error } = await db.functions.invoke('blog-revise', {
        body: {
          borrador: { title: borrador.title, categories: borrador.categories || [], description: borrador.description, bodyMarkdown: borrador.bodyMarkdown },
          problemas: review?.problemas || [],
          instruccion,
          tiempoLecturaMin: Number(form.tiempoLecturaMin) || null,
        },
      });
      if (error) throw new Error(error.context?.error || error.message);
      setBorrador(data.borrador);
      setCategoriesFromList(data.borrador.categories || []);
      setTemasFromList(data.borrador.topicos || selectedTemas);
      setIteracion((i) => i + 1);
      setReview(null);
      setCorreccionPrompt('');
      setShowPreview(false);
      finishOp(`Corrección aplicada (iteración ${iteracion + 1}/2). Revisá de nuevo.`);
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  async function generarImagen() {
    if (!borrador?.bodyMarkdown) {
      status.value = 'Primero redactá el post.';
      return;
    }
    startOp('imagen', 'Generar imagen de tapa', OP_STEPS.imagen, OP_MSGS.imagen);
    try {
      const { data, error } = await db.functions.invoke('blog-cover', {
        body: { title: borrador.title, description: borrador.description, bodyMarkdown: borrador.bodyMarkdown, prompt: coverPrompt || null },
      });
      if (error) throw new Error(error.context?.error || error.message);
      setCoverUrl(data.coverUrl);
      setCoverPrompt(data.prompt);
      finishOp('Imagen de tapa lista.');
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  async function uniqueSlug(base: string) {
    const { data } = await db.from('blogs').select('slug');
    const existing = new Set((data || []).map((r: any) => r.slug));
    if (!existing.has(base)) return base;
    let i = 2;
    while (existing.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }

  async function publicar(draft: boolean) {
    if (!borrador?.title || !borrador?.bodyMarkdown) {
      status.value = 'No hay borrador para publicar.';
      return;
    }
    startOp('publicar', draft ? 'Guardar borrador' : 'Publicar', OP_STEPS.publicar, OP_MSGS.publicar);
    try {
      const payload: any = {
        title: borrador.title,
        pub_date: new Date().toISOString().slice(0, 10),
        author: 'Mauricio Gonzalez',
        categories: normalizeCategories(selectedCategories),
        topicos: normalizeTemas(selectedTemas),
        description: borrador.description,
        body_markdown: borrador.bodyMarkdown,
        cover_url: coverUrl || null,
        draft,
      };
      if (editingId) {
        payload.slug = slugify(borrador.title);
        const res = await db.from('blogs').update(payload).eq('id', editingId);
        if (res.error) throw new Error(res.error.message);
      } else {
        payload.slug = await uniqueSlug(slugify(borrador.title));
        const res = await db.from('blogs').insert(payload);
        if (res.error) throw new Error(res.error.message);
      }
      setEditingId(null);
      await loadPosts();
      finishOp(draft ? 'Borrador guardado.' : '¡Publicado! Aparece en /blog tras el próximo build (cron 12 hs o deploy manual).');
      wizardOpen.value = false;
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  async function toggleDraft(p: Post) {
    const res = await db.from('blogs').update({ draft: !p.draft }).eq('id', p.id);
    if (!res.error) loadPosts();
  }

  async function borrarPost(p: Post) {
    if (!window.confirm(`¿Eliminar "${p.title}"? Esta acción no se puede deshacer.`)) return;
    const res = await db.from('blogs').delete().eq('id', p.id);
    if (!res.error) {
      if (editingId === p.id) nuevoPost();
      loadPosts();
    }
  }

  function cargarPost(p: Post) {
    setEditingId(p.id);
    setBorrador({ title: p.title, description: p.description || '', bodyMarkdown: p.body_markdown || '', categories: p.categories || [] });
    setCategoriesFromList(p.categories || []);
    setTemasFromList(p.topicos || []);
    setReview(null);
    setIteracion(0);
    setCorreccionPrompt('');
    setCoverUrl(p.cover_url || '');
    setCoverPrompt('');
    setShowPreview(false);
    wizardStep.value = 3;
    wizardOpen.value = true;
  }

  function togglePreview() {
    setPreviewHtml(renderMarkdown(borrador?.bodyMarkdown || ''));
    setShowPreview((v) => !v);
  }

  return (
    <div class="max-w-4xl mx-auto p-4 md:p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">📝 Blog</h1>
        <div class="flex items-center gap-3">
          <a href={`${BLOG_BASE}blog/`} class="text-sm text-slate-400 hover:text-white">
            Ver blog →
          </a>
          <button onClick={abrirWizardNuevo} class="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold rounded-lg">
            + Nuevo post
          </button>
        </div>
      </div>

      {opHistory.length > 0 && (
        <div class="mb-4">
          <details class="group text-xs bg-slate-800 rounded-xl p-3">
            <summary class="text-slate-400 hover:text-slate-200 cursor-pointer select-none font-bold">
              Actividad reciente ({opHistory.length})
            </summary>
            <div class="mt-1.5 space-y-1">
              {opHistory.map((h) => (
                <div key={h.ts} class={'flex items-start gap-2 ' + (h.ok ? 'text-slate-400' : 'text-red-400')}>
                  <span>{h.ok ? '✓' : '✗'}</span>
                  <span class="font-bold">{h.label}</span>
                  <span class="font-mono">{h.elapsed}</span>
                  <span class="truncate">{h.result}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      <div class="bg-slate-800 rounded-xl p-5">
        <h2 class="text-base font-bold mb-3">Posts existentes</h2>
        {!posts.length && <div class="text-sm text-slate-400">Sin posts todavía.</div>}
        <div class="space-y-2">
          {posts.map((p) => (
            <div key={p.id} class="bg-slate-900 border border-slate-700 rounded-lg p-3">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-bold">{p.title}</p>
                <span
                  class={
                    'text-[10px] px-2 py-0.5 rounded-full shrink-0 ' +
                    (p.draft ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400')
                  }
                >
                  {p.draft ? 'borrador' : 'publicado'}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                {p.pub_date} · {(p.categories || []).join(', ')}
              </p>
              <div class="flex gap-2 mt-2 text-xs">
                <button onClick={() => cargarPost(p)} class="text-indigo-400 hover:text-indigo-300 font-bold">
                  Editar
                </button>
                <button onClick={() => toggleDraft(p)} class="text-slate-400 hover:text-white font-bold">
                  {p.draft ? 'Publicar' : 'A borrador'}
                </button>
                <button onClick={() => borrarPost(p)} class="text-red-400 hover:text-red-300 font-bold">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WizardModal
        steps={['Tema', 'Ángulo', 'Borrador', 'Imagen']}
        newLabel="Nuevo post"
        editLabel="Editar post"
        isEditing={!!editingId}
        wizardOpen={wizardOpen}
        wizardStep={wizardStep}
        busy={busy}
        op={op}
        status={status}
      >
        {wizardStep.value === 1 && (
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-slate-200">Tema del post</h3>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Tema *</label>
              <input
                value={form.tema}
                onInput={(e) => setForm({ ...form, tema: (e.target as HTMLInputElement).value })}
                type="text"
                class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div class="flex flex-col sm:flex-row gap-2">
              <input
                value={urlRef}
                onInput={(e) => setUrlRef((e.target as HTMLInputElement).value)}
                type="text"
                placeholder="Pegá la URL de un reportaje o artículo para traer su texto..."
                class="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button onClick={traerTextoUrl} disabled={busy.value} class="shrink-0 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-sm font-bold rounded-lg">
                ⬇ Traer texto
              </button>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">
                Frase / idea semilla o referencia <span class="font-normal text-slate-500">(acepta varios párrafos)</span>
              </label>
              <textarea
                value={form.fraseClave}
                onInput={(e) => setForm({ ...form, fraseClave: (e.target as HTMLTextAreaElement).value })}
                rows={6}
                class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">
                  Enfoque <span class="font-normal text-slate-500">(opcional)</span>
                </label>
                <input
                  value={form.enfoque}
                  onInput={(e) => setForm({ ...form, enfoque: (e.target as HTMLInputElement).value })}
                  type="text"
                  placeholder="Ej: el caso real detrás del tema"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Tono</label>
                <select
                  value={form.tono}
                  onChange={(e) => setForm({ ...form, tono: (e.target as HTMLSelectElement).value })}
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="Cercano y directo">Cercano y directo</option>
                  <option value="Técnico y profesional">Técnico y profesional</option>
                  <option value="Formal">Formal</option>
                  <option value="Motivador">Motivador</option>
                  <option value="Con humor / irónico">Con humor / irónico</option>
                  <option value="Periodístico">Periodístico</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Min. lectura</label>
                <input
                  value={form.tiempoLecturaMin}
                  onInput={(e) => setForm({ ...form, tiempoLecturaMin: (e.target as HTMLInputElement).value })}
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
            <div class="flex justify-end">
              <button onClick={generarPropuestas} disabled={busy.value} class="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-sm font-bold rounded-lg">
                Generar propuestas →
              </button>
            </div>
            {temasHistory.length > 0 && (
              <div class="border-t border-slate-700 pt-3 space-y-1.5">
                <p class="text-xs font-bold text-slate-400">
                  Historial de temas <span class="font-normal text-slate-500">(últimos {temasHistory.length}/10)</span>
                </p>
                <div class="space-y-1">
                  {temasHistory.map((e) => (
                    <div key={e.id} class="flex items-start gap-2 bg-slate-900 rounded-lg p-2 text-xs">
                      <div class="flex-1 min-w-0">
                        <p class="text-slate-200 truncate">{e.tema}</p>
                        <p class="text-slate-500 text-[10px] mt-0.5">
                          {e.enfoque && `enfoque: ${e.enfoque} · `}
                          {new Date(e.savedAt).toLocaleString()}
                        </p>
                      </div>
                      <button onClick={() => useTemaEntry(e.id)} class="text-indigo-400 hover:text-indigo-300 font-bold shrink-0">
                        Usar
                      </button>
                      <button onClick={() => deleteTemaEntry(e.id)} class="text-red-400 hover:text-red-300 font-bold shrink-0" title="Borrar">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {wizardStep.value === 2 && (
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-slate-200">Elegí un ángulo</h3>
            {op.value?.id === 'propuestas' ? (
              <div class="space-y-2">
                {[0, 1, 2].map((n) => (
                  <div key={n} class="skeleton h-20 w-full"></div>
                ))}
              </div>
            ) : (
              <div class="space-y-2">
                {propuestas.map((prop, i) => (
                  <label key={i} class="block cursor-pointer">
                    <div
                      class={
                        'p-3 rounded-lg border transition flex gap-3 items-start ' +
                        (propuestaIndex === i ? 'border-indigo-500 bg-indigo-600/20' : 'border-slate-600 bg-slate-900 hover:border-slate-500')
                      }
                    >
                      <input type="radio" name="propuesta" checked={propuestaIndex === i} onChange={() => setPropuestaIndex(i)} class="mt-1" />
                      <div>
                        <p class="font-bold text-sm">{prop.tituloSugerido}</p>
                        <p class="text-xs text-indigo-300 italic">{prop.angulo}</p>
                        <p class="text-sm text-slate-300 mt-1">{prop.resumen}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div class="flex justify-end">
              <button onClick={redactar} disabled={busy.value || propuestaIndex < 0} class="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-sm font-bold rounded-lg">
                Redactar post →
              </button>
            </div>
          </div>
        )}

        {wizardStep.value === 3 && (
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-slate-200">Revisá y ajustá el borrador</h3>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Título</label>
                <input
                  value={borrador.title}
                  onInput={(e) => setBorrador({ ...borrador, title: (e.target as HTMLInputElement).value })}
                  type="text"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">Categorías</label>
                  <div class="flex flex-col gap-2">
                    <select
                      value={selectedCategory}
                      onChange={(e) => addCategory((e.target as HTMLSelectElement).value)}
                      class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="">Elegí una categoría…</option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {selectedCategories.length > 0 && (
                      <div class="flex flex-wrap gap-2">
                        {selectedCategories.map((cat, i) => (
                          <span key={i} class="inline-flex items-center gap-1.5 bg-slate-700 rounded-full px-3 py-1 text-xs font-bold text-slate-100">
                            <span>{cat}</span>
                            <button type="button" onClick={() => removeCategory(i)} class="text-slate-300 hover:text-red-400 font-bold leading-none" title="Quitar categoría">
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">Temas (puente con la Zona Lab)</label>
                  <div class="flex flex-col gap-2">
                    <select
                      value={selectedTema}
                      onChange={(e) => addTema((e.target as HTMLSelectElement).value)}
                      class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="">Elegí un tema…</option>
                      {availableTemas.map((tema) => (
                        <option key={tema} value={tema}>
                          {tema}
                        </option>
                      ))}
                    </select>
                    {selectedTemas.length > 0 && (
                      <div class="flex flex-wrap gap-2">
                        {selectedTemas.map((tema, i) => (
                          <span key={i} class="inline-flex items-center gap-1.5 bg-indigo-600/30 border border-indigo-500/40 rounded-full px-3 py-1 text-xs font-bold text-indigo-200">
                            <span>{tema}</span>
                            <button type="button" onClick={() => removeTema(i)} class="text-indigo-300 hover:text-red-400 font-bold leading-none" title="Quitar tema">
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Descripción (SEO)</label>
                <input
                  value={borrador.description}
                  onInput={(e) => setBorrador({ ...borrador, description: (e.target as HTMLInputElement).value })}
                  type="text"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-bold text-slate-300">Contenido (Markdown)</label>
                  <div class="flex gap-2">
                    <button onClick={togglePreview} type="button" class="text-xs text-indigo-400 hover:text-indigo-300 font-bold">
                      {showPreview ? 'Editar' : 'Vista previa'}
                    </button>
                    {showPreview && (
                      <span onClick={() => setShowPreview(false)} class="text-xs text-slate-500 cursor-pointer">
                        ✕
                      </span>
                    )}
                  </div>
                </div>
                {!showPreview && (
                  <textarea
                    value={borrador.bodyMarkdown}
                    onInput={(e) => setBorrador({ ...borrador, bodyMarkdown: (e.target as HTMLTextAreaElement).value })}
                    rows={12}
                    class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                )}
                {showPreview && (
                  <div
                    class="prose-pre:bg-slate-950 bg-slate-900 border border-slate-600 rounded-lg p-4 text-sm max-h-[420px] overflow-y-auto markdown-preview"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                )}
              </div>
            </div>

            <div class="border-t border-slate-700 pt-4 space-y-3">
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Herramientas de IA <span class="font-normal normal-case text-slate-500">(opcional)</span>
              </h4>
              <div class="flex flex-wrap items-center gap-3">
                <button onClick={revisar} disabled={busy.value} class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-sm font-bold rounded-lg">
                  {review ? 'Volver a revisar' : '🔍 Revisar con IA'}
                </button>
                {iteracion > 0 && <span class="text-xs text-slate-500">Correcciones aplicadas: {iteracion}/2</span>}
              </div>
              {review && (
                <div class={'rounded-lg border p-4 space-y-3 ' + (review.aprobado ? 'bg-green-600/10 border-green-500/30' : 'bg-amber-600/10 border-amber-500/30')}>
                  <div class="flex items-center justify-between gap-2">
                    <p class={'text-sm font-bold ' + (review.aprobado ? 'text-green-300' : 'text-amber-300')}>
                      {review.aprobado ? '✓ Aprobado por el crítico' : '✗ Necesita ajustes'}
                    </p>
                    {review.nota != null && <span class="text-xs opacity-80">Nota {review.nota}/10</span>}
                  </div>
                  {review.resumen && <p class="text-xs text-slate-300">{review.resumen}</p>}
                  {review.problemas && review.problemas.length > 0 && (
                    <div class="space-y-1.5">
                      <p class="text-xs font-bold text-slate-300">Problemas a corregir:</p>
                      {review.problemas.map((prob, i) => (
                        <div key={i} class="text-xs bg-slate-900 rounded-lg p-2">
                          <p>
                            <span class="font-bold text-indigo-300">{prob.tipo}</span>
                            {prob.donde && <span class="text-slate-500"> · {prob.donde}</span>}
                          </p>
                          {prob.fixSugerido && <p class="text-slate-300 mt-0.5">{prob.fixSugerido}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {review.aprobado && <p class="text-xs text-green-300">El crítico lo aprobó. Si igual querés, pedile un ajuste abajo.</p>}
                  {!review.aprobado && iteracion >= 2 && (
                    <p class="text-xs text-amber-300">Tope de revisiones alcanzado. Editá a mano o publicá el borrador.</p>
                  )}
                </div>
              )}
              <div class="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2">
                <label class="block text-xs font-bold text-slate-300">
                  Pedile una corrección al IA <span class="font-normal text-slate-500">(opcional)</span>
                </label>
                <textarea
                  value={correccionPrompt}
                  onInput={(e) => setCorreccionPrompt((e.target as HTMLTextAreaElement).value)}
                  rows={2}
                  class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Ej: 'Hacelo más corto (5 min)', 'Agregá una sección sobre deploy', 'Cambiá el tono a más formal', 'Reescribí el hook'"
                />
                <div class="flex flex-wrap items-center gap-3">
                  <button
                    onClick={aplicarCorrecciones}
                    disabled={busy.value || iteracion >= 2}
                    class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-sm font-bold rounded-lg"
                  >
                    ✨ Aplicar corrección
                  </button>
                  {iteracion >= 2 && <span class="text-xs text-amber-300">Tope de 2 correcciones alcanzado.</span>}
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button onClick={() => (wizardStep.value = 4)} class="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold rounded-lg">
                Siguiente: Imagen →
              </button>
            </div>
          </div>
        )}

        {wizardStep.value === 4 && (
          <div class="space-y-4">
            <div class="space-y-3">
              <h3 class="text-sm font-bold text-slate-200">Imagen de tapa (800x450)</h3>
              {op.value?.id === 'imagen' ? (
                <div class="rounded-lg overflow-hidden border border-slate-700">
                  <div class="skeleton aspect-video w-full"></div>
                </div>
              ) : (
                coverUrl && (
                  <div class="rounded-lg overflow-hidden border border-slate-600">
                    <img src={coverUrl} alt="Tapa generada" class="w-full aspect-video object-cover" />
                  </div>
                )
              )}
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Prompt de la tapa (generado por DeepSeek, editable)</label>
                <textarea
                  value={coverPrompt}
                  onInput={(e) => setCoverPrompt((e.target as HTMLTextAreaElement).value)}
                  rows={2}
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Dejalo vacío para que DeepSeek lo genere solo."
                />
              </div>
              <button onClick={generarImagen} disabled={busy.value} class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-sm font-bold rounded-lg">
                {coverUrl ? 'Regenerar imagen' : 'Generar imagen'}
              </button>
            </div>

            <div class="border-t border-slate-700 pt-4 flex flex-wrap gap-3">
              <button onClick={() => publicar(false)} disabled={busy.value} class="px-5 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-sm font-bold rounded-lg">
                {editingId ? 'Actualizar y publicar' : 'Publicar'}
              </button>
              <button onClick={() => publicar(true)} disabled={busy.value} class="px-5 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-sm font-bold rounded-lg">
                Guardar borrador
              </button>
            </div>
          </div>
        )}
      </WizardModal>
    </div>
  );
}
