import { useSignal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import WizardModal from './shared/WizardModal';
import type { OpState } from './shared/BusyOverlay';
import { db } from '../../lib/db';
import { RECURSOS_CATEGORIES } from '../../data/recursos-categories';
import { TEMAS, normalizeTemas } from '../../data/temas';

const BASE = import.meta.env.BASE_URL;
const RECURSOS_BASE = BASE.endsWith('/') ? BASE : `${BASE}/`;

function slugify(text: string) {
  return (
    (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'recurso'
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
  generar: ['Conectar', 'Traer el texto de la fuente', 'Mejorar la frase con IA', 'Armar el recurso'],
  publicar: ['Guardar en la base'],
};
const OP_MSGS: Record<string, string[]> = {
  generar: ['Conectando…', 'Leyendo el link…', 'Mejorando tu frase con DeepSeek…', 'Armando el artículo…'],
  publicar: ['Guardando en la base…'],
};

interface Borrador {
  title: string;
  description: string;
  bodyMarkdown: string;
}

interface Recurso {
  id: string;
  title: string;
  draft: boolean;
  source_type: string;
  created: string;
  description?: string;
  body_markdown?: string;
  categories?: string[];
  topicos?: string[];
  cover_url?: string | null;
  source_url?: string;
  source_title?: string;
  video_id?: string | null;
}

interface OpHistoryEntry {
  id: string;
  label: string;
  ok: boolean;
  result: string;
  elapsed: string;
  ts: number;
}

export default function RecursosAdminPreact() {
  const wizardOpen = useSignal(false);
  const wizardStep = useSignal(1);
  const busy = useSignal(false);
  const status = useSignal('');
  const op = useSignal<OpState | null>(null);

  const [url, setUrl] = useState('');
  const [frase, setFrase] = useState('');
  const [borrador, setBorrador] = useState<Borrador>({ title: '', description: '', bodyMarkdown: '' });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTema, setSelectedTema] = useState('');
  const [selectedTemas, setSelectedTemas] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceType, setSourceType] = useState('web');
  const [sourceTitle, setSourceTitle] = useState('');
  const [videoId, setVideoId] = useState('');
  const [hadSource, setHadSource] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [opHistory, setOpHistory] = useState<OpHistoryEntry[]>([]);

  useEffect(() => {
    // No repetimos el chequeo de auth/rol acá: GestionAdminPreact ya lo hace
    // y solo muestra este tab una vez confirmado admin.
    loadRecursos();
  }, []);

  async function loadRecursos() {
    const { data, error } = await db.from('recursos').select('*').order('created', { ascending: false });
    if (!error) setRecursos(data || []);
  }

  function nuevoRecurso() {
    setEditingId(null);
    setBorrador({ title: '', description: '', bodyMarkdown: '' });
    setUrl('');
    setFrase('');
    setSelectedCategory('');
    setSelectedCategories([]);
    setSelectedTema('');
    setSelectedTemas([]);
    setCoverUrl('');
    setSourceUrl('');
    setSourceType('web');
    setSourceTitle('');
    setVideoId('');
    setHadSource(true);
    setShowPreview(false);
  }

  function abrirWizardNuevo() {
    nuevoRecurso();
    wizardStep.value = 1;
    wizardOpen.value = true;
  }

  const availableCategories = RECURSOS_CATEGORIES.filter((c) => !selectedCategories.includes(c));
  const availableTemas = TEMAS.filter((t) => !selectedTemas.includes(t));

  function addCategory(cat: string) {
    if (cat && !selectedCategories.includes(cat)) {
      setSelectedCategories([...selectedCategories, cat]);
    }
    setSelectedCategory('');
  }

  function removeCategory(index: number) {
    setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
  }

  function addTema(tema: string) {
    if (tema && !selectedTemas.includes(tema)) {
      setSelectedTemas([...selectedTemas, tema]);
    }
    setSelectedTema('');
  }

  function removeTema(index: number) {
    setSelectedTemas(selectedTemas.filter((_, i) => i !== index));
  }

  function setCategoriesFromList(list: string[]) {
    setSelectedCategories((list || []).filter((c) => (RECURSOS_CATEGORIES as readonly string[]).includes(c)));
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
    const initial: OpState = {
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
    op.value = initial;
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

  async function generar() {
    if (!url || !frase) {
      status.value = 'Completá link y frase.';
      return;
    }
    startOp('generar', 'Generar recurso', OP_STEPS.generar, OP_MSGS.generar);
    try {
      const { data, error } = await db.functions.invoke('recurso-generate', {
        body: { url: url.trim(), frase: frase.trim() },
      });
      if (error) throw new Error(error.context?.error || error.message);
      if (data.error) throw new Error(data.error);

      setBorrador({
        title: data.title || '',
        description: data.description || '',
        bodyMarkdown: data.bodyMarkdown || '',
      });
      setCategoriesFromList(data.categories || []);
      setTemasFromList(data.topicos || []);
      setCoverUrl(data.coverUrl || '');
      setSourceUrl(data.sourceUrl || url.trim());
      setSourceType(data.sourceType || 'web');
      setSourceTitle(data.sourceTitle || '');
      setVideoId(data.videoId || '');
      setHadSource(data.hadSource !== false);
      setEditingId(null);
      setShowPreview(false);
      finishOp('Recurso generado. Revisalo, ajustalo y publicá.');
      wizardStep.value = 2;
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  function togglePreview() {
    setPreviewHtml(renderMarkdown(borrador?.bodyMarkdown || ''));
    setShowPreview((v) => !v);
  }

  async function uniqueSlug(base: string) {
    const { data } = await db.from('recursos').select('slug');
    const existing = new Set((data || []).map((r: any) => r.slug));
    if (!existing.has(base)) return base;
    let i = 2;
    while (existing.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }

  async function publicar(draft: boolean) {
    if (!borrador?.title || !borrador?.bodyMarkdown) {
      status.value = 'No hay recurso para publicar.';
      return;
    }
    startOp('publicar', draft ? 'Guardar borrador' : 'Publicar', OP_STEPS.publicar, OP_MSGS.publicar);
    try {
      const payload: any = {
        title: borrador.title,
        source_url: sourceUrl,
        source_type: sourceType,
        source_title: sourceTitle,
        video_id: videoId || null,
        description: borrador.description,
        body_markdown: borrador.bodyMarkdown,
        categories: selectedCategories,
        topicos: normalizeTemas(selectedTemas),
        cover_url: coverUrl || null,
        draft,
      };
      if (editingId) {
        payload.slug = slugify(borrador.title);
        const res = await db.from('recursos').update(payload).eq('id', editingId);
        if (res.error) throw new Error(res.error.message);
      } else {
        payload.slug = await uniqueSlug(slugify(borrador.title));
        const res = await db.from('recursos').insert(payload);
        if (res.error) throw new Error(res.error.message);
      }
      setEditingId(null);
      await loadRecursos();
      finishOp(draft ? 'Borrador guardado.' : '¡Publicado! Aparece en /zona-lab tras el próximo build (cron 12 hs o deploy manual).');
      wizardOpen.value = false;
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  async function toggleDraft(p: Recurso) {
    const res = await db.from('recursos').update({ draft: !p.draft }).eq('id', p.id);
    if (!res.error) loadRecursos();
  }

  async function borrarRecurso(p: Recurso) {
    if (!window.confirm(`¿Eliminar "${p.title}"? Esta acción no se puede deshacer.`)) return;
    const res = await db.from('recursos').delete().eq('id', p.id);
    if (!res.error) {
      if (editingId === p.id) nuevoRecurso();
      loadRecursos();
    }
  }

  function cargarRecurso(p: Recurso) {
    setEditingId(p.id);
    setBorrador({
      title: p.title,
      description: p.description || '',
      bodyMarkdown: p.body_markdown || '',
    });
    setCategoriesFromList(p.categories || []);
    setTemasFromList(p.topicos || []);
    setCoverUrl(p.cover_url || '');
    setSourceUrl(p.source_url || '');
    setSourceType(p.source_type || 'web');
    setSourceTitle(p.source_title || '');
    setVideoId(p.video_id || '');
    setHadSource(true);
    setShowPreview(false);
    setUrl('');
    setFrase('');
    wizardStep.value = 2;
    wizardOpen.value = true;
  }

  return (
    <div class="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">📚 Zona Lab</h1>
        <div class="flex items-center gap-3">
          <a href={`${RECURSOS_BASE}zona-lab/`} class="text-sm text-slate-400 hover:text-white">
            Ver sitio →
          </a>
          <button
            onClick={abrirWizardNuevo}
            class="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold rounded-lg"
          >
            + Nuevo recurso
          </button>
        </div>
      </div>

      {/* Actividad reciente */}
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

      {/* Lista */}
      <div class="bg-slate-800 rounded-xl p-5">
        <h2 class="text-base font-bold mb-3">Recursos existentes</h2>
        {!recursos.length && <div class="text-sm text-slate-400">Sin recursos todavía.</div>}
        <div class="space-y-2">
          {recursos.map((p) => (
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
                {p.source_type === 'youtube' ? '🎬 ' : '🌐 '}
                {new Date(p.created).toLocaleDateString('es-ES')}
              </p>
              <div class="flex gap-2 mt-2 text-xs">
                <button onClick={() => cargarRecurso(p)} class="text-indigo-400 hover:text-indigo-300 font-bold">
                  Editar
                </button>
                <button onClick={() => toggleDraft(p)} class="text-slate-400 hover:text-white font-bold">
                  {p.draft ? 'Publicar' : 'A borrador'}
                </button>
                <button onClick={() => borrarRecurso(p)} class="text-red-400 hover:text-red-300 font-bold">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Asistente ===== */}
      <WizardModal
        steps={['Link + frase', 'Revisar y publicar']}
        newLabel="Nuevo recurso"
        editLabel="Editar recurso"
        isEditing={!!editingId}
        wizardOpen={wizardOpen}
        wizardStep={wizardStep}
        busy={busy}
        op={op}
        status={status}
      >
        {/* Paso 1: Link + frase */}
        {wizardStep.value === 1 && (
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-slate-200">Link + frase → recurso</h3>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Link de YouTube o reporte *</label>
              <input
                value={url}
                onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
                type="url"
                placeholder="https://www.youtube.com/watch?v=... o https://..."
                class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">
                Frase / idea semilla * <span class="font-normal text-slate-500">(la IA la mejora)</span>
              </label>
              <textarea
                value={frase}
                onInput={(e) => setFrase((e.target as HTMLTextAreaElement).value)}
                rows={4}
                class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="Ej: 'Esto explica por qué no conviene usar la misma contraseña en todos lados y cómo se roban las cuentas'"
              />
            </div>
            <div class="flex justify-end">
              <button
                onClick={generar}
                disabled={busy.value || !url || !frase}
                class="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-sm font-bold rounded-lg"
              >
                ⚡ Generar recurso →
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: Revisar y publicar */}
        {wizardStep.value === 2 && (
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-slate-200">Revisá y ajustá el recurso</h3>

            {sourceUrl && (
              <div class="text-xs text-slate-400 bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-wrap items-center gap-2">
                <span class="font-bold text-slate-200">Fuente:</span>
                <span class="font-mono truncate max-w-full">{sourceUrl}</span>
                <span
                  class={
                    'px-2 py-0.5 rounded-full text-[10px] font-bold ' +
                    (sourceType === 'youtube' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400')
                  }
                >
                  {sourceType === 'youtube' ? 'YouTube' : 'Web'}
                </span>
                {!hadSource && <span class="text-amber-300">(sin transcripción — se usó solo tu frase)</span>}
              </div>
            )}

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
                        <span
                          key={i}
                          class="inline-flex items-center gap-1.5 bg-slate-700 rounded-full px-3 py-1 text-xs font-bold text-slate-100"
                        >
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => removeCategory(i)}
                            class="text-slate-300 hover:text-red-400 font-bold leading-none"
                            title="Quitar categoría"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Temas (puente con el Blog)</label>
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
                        <span
                          key={i}
                          class="inline-flex items-center gap-1.5 bg-indigo-600/30 border border-indigo-500/40 rounded-full px-3 py-1 text-xs font-bold text-indigo-200"
                        >
                          <span>{tema}</span>
                          <button
                            type="button"
                            onClick={() => removeTema(i)}
                            class="text-indigo-300 hover:text-red-400 font-bold leading-none"
                            title="Quitar tema"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p class="text-[10px] text-slate-500">Estos temas matchean este recurso con los posts del Blog.</p>
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
                  class="bg-slate-900 border border-slate-600 rounded-lg p-4 text-sm max-h-[420px] overflow-y-auto markdown-preview"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>

            {coverUrl && (
              <div class="rounded-lg overflow-hidden border border-slate-600 max-w-sm">
                <img src={coverUrl} alt="Portada" class="w-full aspect-video object-cover" />
              </div>
            )}

            <div class="border-t border-slate-700 pt-4 flex flex-wrap gap-3">
              <button
                onClick={() => publicar(false)}
                disabled={busy.value}
                class="px-5 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-sm font-bold rounded-lg"
              >
                {editingId ? 'Actualizar y publicar' : 'Publicar'}
              </button>
              <button
                onClick={() => publicar(true)}
                disabled={busy.value}
                class="px-5 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-sm font-bold rounded-lg"
              >
                Guardar borrador
              </button>
            </div>
          </div>
        )}
      </WizardModal>
    </div>
  );
}
