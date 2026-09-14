import { useSignal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import WizardModal from './shared/WizardModal';
import type { OpState } from './shared/BusyOverlay';
import { db } from '../../lib/db';
import { DISERTACION_CATEGORIES } from '../../data/disertacion-categories';

const BASE = import.meta.env.BASE_URL;
const DISERT_BASE = BASE.endsWith('/') ? BASE : `${BASE}/`;

function slugify(text: string) {
  return (
    (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'disertacion'
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const OP_STEPS: Record<string, string[]> = {
  parse: ['Conectar', 'Descomprimir PPTX', 'Extraer texto e imágenes', 'Generar bullets con IA', 'Subir imágenes'],
  texto: ['Conectar', 'Analizar el texto', 'Generar bullets con IA'],
  publicar: ['Guardar en la base'],
};
const OP_MSGS: Record<string, string[]> = {
  parse: ['Conectando…', 'Leyendo el .pptx…', 'Extrayendo diapositivas…', 'Generando resumen con IA…', 'Subiendo imágenes a storage…'],
  texto: ['Conectando con DeepSeek…', 'Analizando tu resumen…', 'Armando bullets…'],
  publicar: ['Guardando en la base…'],
};

interface Form {
  title: string;
  eventDate: string;
  eventName: string;
  description: string;
}

interface Disertacion {
  id: string;
  title: string;
  draft: boolean;
  event_date: string;
  event_name?: string;
  description?: string;
  categories?: string[];
  bullets?: string[];
  slides_urls?: string[];
  cover_url?: string;
  certificate_url?: string;
  gallery_urls?: string[];
}

interface OpHistoryEntry {
  id: string;
  label: string;
  ok: boolean;
  result: string;
  elapsed: string;
  ts: number;
}

const emptyForm: Form = { title: '', eventDate: '', eventName: '', description: '' };

export default function DisertacionesAdminPreact() {
  const wizardOpen = useSignal(false);
  const wizardStep = useSignal(1);
  const busy = useSignal(false);
  const status = useSignal('');
  const op = useSignal<OpState | null>(null);

  const [form, setForm] = useState<Form>(emptyForm);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bullets, setBullets] = useState<string[]>([]);
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [textResumen, setTextResumen] = useState('');
  const [slideUrls, setSlideUrls] = useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(-1);
  const [coverUrl, setCoverUrl] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [disertaciones, setDisertaciones] = useState<Disertacion[]>([]);
  const [opHistory, setOpHistory] = useState<OpHistoryEntry[]>([]);

  async function loadDisertaciones() {
    const { data, error } = await db.from('disertaciones').select('*').order('event_date', { ascending: false });
    if (!error) setDisertaciones(data || []);
  }

  useEffect(() => {
    loadDisertaciones();
  }, []);

  function nuevaDisertacion() {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedCategories([]);
    setBullets([]);
    setSlideUrls([]);
    setSelectedCoverIndex(-1);
    setCoverUrl('');
    setCertificateUrl('');
    setGalleryUrls([]);
    setGalleryFiles([]);
    setPptFile(null);
    setCertFile(null);
    setCoverFile(null);
    setTextResumen('');
  }

  function abrirWizardNueva() {
    nuevaDisertacion();
    wizardStep.value = 1;
    wizardOpen.value = true;
  }

  const availableCategories = DISERTACION_CATEGORIES.filter((c) => !selectedCategories.includes(c));

  function addCategory(cat: string) {
    if (cat && !selectedCategories.includes(cat)) setSelectedCategories([...selectedCategories, cat]);
    setSelectedCategory('');
  }

  function removeCategory(index: number) {
    setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
  }

  function addBullet() {
    setBullets((b) => [...b, '']);
  }

  function updateBullet(index: number, value: string) {
    setBullets((b) => b.map((x, i) => (i === index ? value : x)));
  }

  function removeBullet(index: number) {
    setBullets((b) => b.filter((_, i) => i !== index));
  }

  async function subirGaleria() {
    if (!galleryFiles.length) {
      status.value = 'Elegí una o más fotos.';
      return;
    }
    busy.value = true;
    status.value = 'Subiendo fotos…';
    try {
      const urls: string[] = [];
      for (const f of galleryFiles) urls.push(await uploadImage(f, 'galeria'));
      setGalleryUrls((g) => {
        const merged = [...g, ...urls];
        status.value = `Fotos subidas (${merged.length} en el álbum).`;
        return merged;
      });
      setGalleryFiles([]);
    } catch (e) {
      status.value = (e as Error).message;
    } finally {
      busy.value = false;
    }
  }

  function removeGallery(index: number) {
    setGalleryUrls((g) => g.filter((_, i) => i !== index));
  }

  function setCover(index: number) {
    setSelectedCoverIndex(index);
    setCoverUrl(slideUrls[index] || '');
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

  async function procesarPpt() {
    if (!pptFile) {
      status.value = 'Elegí un archivo .pptx primero.';
      return;
    }
    startOp('parse', 'Procesar PPT', OP_STEPS.parse, OP_MSGS.parse);
    try {
      const fileBase64 = await fileToBase64(pptFile);
      const { data, error } = await db.functions.invoke('disertacion-parse', {
        body: { file: fileBase64, fileName: pptFile.name, title: form.title || null, eventName: form.eventName || null },
      });
      if (error) throw new Error(error.context?.error || error.message);
      if (data.error) throw new Error(data.error);

      if (data.bullets?.length) setBullets(data.bullets);
      if (data.title) setForm((f) => (f.title ? f : { ...f, title: data.title }));
      setSlideUrls(data.slideUrls || []);

      if (data.firstSlideUrl) {
        setCoverUrl((c) => {
          if (c) return c;
          setSelectedCoverIndex(0);
          return data.firstSlideUrl;
        });
      }
      finishOp('PPT procesado. Revisá bullets, portada y galería, y subí el certificado.');
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  async function mejorarTexto() {
    if (!textResumen) {
      status.value = 'Escribí un resumen de la charla primero.';
      return;
    }
    startOp('texto', 'Mejorar resumen con IA', OP_STEPS.texto, OP_MSGS.texto);
    try {
      const { data, error } = await db.functions.invoke('disertacion-parse', {
        body: { text: textResumen, title: form.title || null, eventName: form.eventName || null },
      });
      if (error) throw new Error(error.context?.error || error.message);
      if (data.error) throw new Error(data.error);

      if (data.bullets?.length) setBullets(data.bullets);
      if (data.title) setForm((f) => (f.title ? f : { ...f, title: data.title }));
      finishOp('Resumen generado. Revisá los bullets y editalos si hace falta.');
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  async function uploadImage(file: File, prefix: string): Promise<string> {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `${prefix}/${slugify(form.title || 'disertacion')}-${Date.now()}.${ext}`;
    const { data, error } = await db.storage.from('disertaciones-files').upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const pbUrl = ((import.meta.env.PUBLIC_POCKETBASE_URL as string) || 'https://spa-depot.46-225-2-192.nip.io').replace(/\/$/, '');
    return `${pbUrl}/storage/disertaciones-files/${data.path}`;
  }

  async function subirCertificado() {
    if (!certFile) {
      status.value = 'Elegí la foto del certificado.';
      return;
    }
    busy.value = true;
    status.value = 'Subiendo certificado…';
    try {
      setCertificateUrl(await uploadImage(certFile, 'certificados'));
      status.value = 'Certificado subido.';
    } catch (e) {
      status.value = (e as Error).message;
    } finally {
      busy.value = false;
    }
  }

  async function subirPortada() {
    if (!coverFile) {
      status.value = 'Elegí la imagen de portada.';
      return;
    }
    busy.value = true;
    status.value = 'Subiendo portada…';
    try {
      setCoverUrl(await uploadImage(coverFile, 'portadas'));
      setSelectedCoverIndex(-1);
      status.value = 'Portada subida.';
    } catch (e) {
      status.value = (e as Error).message;
    } finally {
      busy.value = false;
    }
  }

  async function uniqueSlug(base: string) {
    const { data } = await db.from('disertaciones').select('slug');
    const existing = new Set((data || []).map((r: any) => r.slug));
    if (!existing.has(base)) return base;
    let i = 2;
    while (existing.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }

  async function publicar(draft: boolean) {
    if (!form.title) {
      status.value = 'Falta el título.';
      return;
    }
    if (!draft && bullets.length === 0) {
      status.value = 'Generá o cargá al menos un bullet.';
      return;
    }
    startOp('publicar', draft ? 'Guardar borrador' : 'Publicar', OP_STEPS.publicar, OP_MSGS.publicar);
    try {
      const payload: any = {
        title: form.title,
        event_date: form.eventDate || new Date().toISOString().slice(0, 10),
        event_name: form.eventName || '',
        author: 'Mauricio Gonzalez',
        categories: selectedCategories,
        description: form.description,
        bullets: bullets.filter((b) => b.trim()),
        cover_url: coverUrl || null,
        certificate_url: certificateUrl || null,
        slides_urls: slideUrls,
        gallery_urls: galleryUrls,
        draft,
      };
      if (editingId) {
        payload.slug = slugify(form.title);
        const res = await db.from('disertaciones').update(payload).eq('id', editingId);
        if (res.error) throw new Error(res.error.message);
      } else {
        payload.slug = await uniqueSlug(slugify(form.title));
        const res = await db.from('disertaciones').insert(payload);
        if (res.error) throw new Error(res.error.message);
      }
      setEditingId(null);
      await loadDisertaciones();
      finishOp(draft ? 'Borrador guardado.' : '¡Publicada! Aparece en /disertaciones tras el próximo build (cron 12 hs o deploy manual).');
      wizardOpen.value = false;
    } catch (e) {
      failOp((e as Error).message);
    }
  }

  async function toggleDraft(p: Disertacion) {
    const res = await db.from('disertaciones').update({ draft: !p.draft }).eq('id', p.id);
    if (!res.error) loadDisertaciones();
  }

  async function borrarDisertacion(p: Disertacion) {
    if (!window.confirm(`¿Eliminar "${p.title}"? Esta acción no se puede deshacer.`)) return;
    const res = await db.from('disertaciones').delete().eq('id', p.id);
    if (!res.error) {
      if (editingId === p.id) nuevaDisertacion();
      loadDisertaciones();
    }
  }

  function cargarDisertacion(p: Disertacion) {
    setEditingId(p.id);
    setForm({
      title: p.title || '',
      eventDate: p.event_date || '',
      eventName: p.event_name || '',
      description: p.description || '',
    });
    setSelectedCategories(Array.isArray(p.categories) ? p.categories : []);
    setBullets(Array.isArray(p.bullets) ? p.bullets : []);
    const slides = Array.isArray(p.slides_urls) ? p.slides_urls : [];
    setSlideUrls(slides);
    const cover = p.cover_url || '';
    setCoverUrl(cover);
    setCertificateUrl(p.certificate_url || '');
    setGalleryUrls(Array.isArray(p.gallery_urls) ? p.gallery_urls : []);
    setGalleryFiles([]);
    setSelectedCoverIndex(cover ? slides.indexOf(cover) : -1);
    wizardStep.value = 3;
    wizardOpen.value = true;
  }

  return (
    <div class="max-w-4xl mx-auto p-4 md:p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">🎤 Disertaciones</h1>
        <div class="flex items-center gap-3">
          <a href={`${DISERT_BASE}disertaciones/`} class="text-sm text-slate-400 hover:text-white">
            Ver sitio →
          </a>
          <button onClick={abrirWizardNueva} class="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold rounded-lg">
            + Nueva disertación
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
        <h2 class="text-base font-bold mb-3">Disertaciones existentes</h2>
        {!disertaciones.length && <div class="text-sm text-slate-400">Sin disertaciones todavía.</div>}
        <div class="space-y-2">
          {disertaciones.map((p) => (
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
                {p.event_date} · {p.event_name || '—'}
              </p>
              <div class="flex gap-2 mt-2 text-xs">
                <button onClick={() => cargarDisertacion(p)} class="text-indigo-400 hover:text-indigo-300 font-bold">
                  Editar
                </button>
                <button onClick={() => toggleDraft(p)} class="text-slate-400 hover:text-white font-bold">
                  {p.draft ? 'Publicar' : 'A borrador'}
                </button>
                <button onClick={() => borrarDisertacion(p)} class="text-red-400 hover:text-red-300 font-bold">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WizardModal
        steps={['Datos', 'PPT/Resumen', 'Certificado y portada', 'Publicar']}
        newLabel="Nueva disertación"
        editLabel="Editar disertación"
        isEditing={!!editingId}
        wizardOpen={wizardOpen}
        wizardStep={wizardStep}
        busy={busy}
        op={op}
        status={status}
      >
        {wizardStep.value === 1 && (
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-slate-200">Datos de la disertación</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-300 mb-1">Título *</label>
                <input
                  value={form.title}
                  onInput={(e) => setForm({ ...form, title: (e.target as HTMLInputElement).value })}
                  type="text"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Fecha de la charla</label>
                <input
                  value={form.eventDate}
                  onInput={(e) => setForm({ ...form, eventDate: (e.target as HTMLInputElement).value })}
                  type="date"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Evento / Institución</label>
                <input
                  value={form.eventName}
                  onInput={(e) => setForm({ ...form, eventName: (e.target as HTMLInputElement).value })}
                  type="text"
                  placeholder="Ej: Congreso de Informática 2026"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-slate-300 mb-1">Descripción (SEO)</label>
                <input
                  value={form.description}
                  onInput={(e) => setForm({ ...form, description: (e.target as HTMLInputElement).value })}
                  type="text"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div class="md:col-span-2">
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
            </div>
            <div class="flex justify-end">
              <button
                onClick={() => (wizardStep.value = 2)}
                disabled={!form.title}
                class="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white text-sm font-bold rounded-lg"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {wizardStep.value === 2 && (
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-slate-200">Subí el PPT (.pptx) para generar el resumen</h3>
            <p class="text-xs text-slate-400">
              Se extraen el texto y las imágenes de las diapositivas, se genera un resumen en bullets con IA y se arma la
              galería. Se toma la slide 1 como portada y la 2 como primer item de la galería.
            </p>

            <div class="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={(e) => {
                  const input = e.target as HTMLInputElement;
                  setPptFile(input.files && input.files[0] ? input.files[0] : null);
                }}
                class="flex-1 text-sm text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-200 file:text-sm file:font-bold hover:file:bg-slate-600"
              />
              <button
                onClick={procesarPpt}
                disabled={busy.value || !pptFile}
                class="shrink-0 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-sm font-bold rounded-lg"
              >
                ⚙️ Procesar PPT
              </button>
            </div>

            <div class="border-t border-slate-700 pt-3 space-y-2">
              <label class="block text-xs font-bold text-slate-300">¿No tenés el PPT? Escribí un resumen y la IA lo mejora</label>
              <textarea
                value={textResumen}
                onInput={(e) => setTextResumen((e.target as HTMLTextAreaElement).value)}
                rows={5}
                class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="Escribí con tus palabras de qué trató la charla: tema, puntos que tocaste, ejemplos, audiencia…"
              />
              <button
                onClick={mejorarTexto}
                disabled={busy.value || !textResumen}
                class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-sm font-bold rounded-lg"
              >
                ✨ Mejorar con IA
              </button>
            </div>

            {slideUrls.length > 0 && (
              <div class="space-y-3">
                <p class="text-xs font-bold text-slate-300">Diapositivas extraídas ({slideUrls.length}):</p>
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slideUrls.map((s, i) => (
                    <div
                      key={i}
                      class={
                        'relative group rounded-lg overflow-hidden border ' +
                        (selectedCoverIndex === i ? 'border-indigo-400 ring-2 ring-indigo-500' : 'border-slate-600')
                      }
                    >
                      <img src={s} class="w-full aspect-video object-cover" alt={`Slide ${i + 1}`} />
                      <div class="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => setCover(i)}
                          type="button"
                          class="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 m-1 px-2 py-1 rounded"
                          title="Usar como portada"
                        >
                          Portada
                        </button>
                        {selectedCoverIndex === i && (
                          <button
                            onClick={() => setCover(i)}
                            type="button"
                            class="text-[10px] font-bold text-white bg-slate-700 hover:bg-slate-600 m-1 px-2 py-1 rounded"
                            title="Es la portada actual"
                          >
                            ★
                          </button>
                        )}
                      </div>
                      {selectedCoverIndex === i && (
                        <span class="absolute top-1 left-1 text-[10px] font-bold text-white bg-indigo-600 px-1.5 py-0.5 rounded">
                          portada
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p class="text-xs text-slate-400">Tip: la slide 1 suele ser la portada. Hacé clic en "Portada" sobre la que quieras.</p>
              </div>
            )}

            {bullets.length > 0 && (
              <div class="border-t border-slate-700 pt-3 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-slate-300">Bullets "De qué trató la charla" (editables)</label>
                  <button onClick={addBullet} type="button" class="text-xs text-indigo-400 hover:text-indigo-300 font-bold">
                    + agregar
                  </button>
                </div>
                {bullets.map((b, i) => (
                  <div key={i} class="flex items-center gap-2">
                    <input
                      value={b}
                      onInput={(e) => updateBullet(i, (e.target as HTMLInputElement).value)}
                      type="text"
                      class="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <button onClick={() => removeBullet(i)} type="button" class="text-red-400 hover:text-red-300 font-bold shrink-0" title="Quitar">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div class="flex justify-end">
              <button onClick={() => (wizardStep.value = 3)} class="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold rounded-lg">
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {wizardStep.value === 3 && (
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-slate-200">Certificado y portada</h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Certificado</label>
                <div class="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const input = e.target as HTMLInputElement;
                      setCertFile(input.files && input.files[0] ? input.files[0] : null);
                    }}
                    class="text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-200 file:text-xs file:font-bold hover:file:bg-slate-600"
                  />
                  <button
                    onClick={subirCertificado}
                    disabled={busy.value || !certFile}
                    class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-xs font-bold rounded-lg"
                  >
                    {certificateUrl ? 'Reemplazar' : 'Subir'}
                  </button>
                  {certificateUrl && (
                    <div class="rounded-lg overflow-hidden border border-slate-600">
                      <img src={certificateUrl} alt="Certificado" class="w-full aspect-video object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">
                  Portada <span class="font-normal text-slate-500">(si no elegís slide, se usa la 1ra)</span>
                </label>
                <div class="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const input = e.target as HTMLInputElement;
                      setCoverFile(input.files && input.files[0] ? input.files[0] : null);
                    }}
                    class="text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-200 file:text-xs file:font-bold hover:file:bg-slate-600"
                  />
                  <button
                    onClick={subirPortada}
                    disabled={busy.value || !coverFile}
                    class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-xs font-bold rounded-lg"
                  >
                    {coverUrl ? 'Reemplazar' : 'Subir'}
                  </button>
                  {coverUrl && (
                    <div class="rounded-lg overflow-hidden border border-slate-600">
                      <img src={coverUrl} alt="Portada" class="w-full aspect-video object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">
                  Fotos adicionales <span class="font-normal text-slate-500">(álbum si no hay certificado)</span>
                </label>
                <div class="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const input = e.target as HTMLInputElement;
                      setGalleryFiles(input.files ? Array.from(input.files) : []);
                    }}
                    class="text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-200 file:text-xs file:font-bold hover:file:bg-slate-600"
                  />
                  <button
                    onClick={subirGaleria}
                    disabled={busy.value || !galleryFiles.length}
                    class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-xs font-bold rounded-lg"
                  >
                    {galleryUrls.length ? 'Agregar' : 'Subir fotos'}
                  </button>
                  {galleryUrls.length > 0 && (
                    <div class="grid grid-cols-3 gap-1.5">
                      {galleryUrls.map((g, i) => (
                        <div key={i} class="relative rounded-lg overflow-hidden border border-slate-600 group">
                          <img src={g} alt="Foto del álbum" class="w-full aspect-video object-cover" />
                          <button
                            onClick={() => removeGallery(i)}
                            type="button"
                            class="absolute top-0.5 right-0.5 text-[9px] font-bold text-white bg-red-600 hover:bg-red-500 rounded px-1"
                            title="Quitar foto"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button onClick={() => (wizardStep.value = 4)} class="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-bold rounded-lg">
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {wizardStep.value === 4 && (
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-slate-200">Publicar</h3>
            <p class="text-xs text-slate-400">Revisá los datos en los pasos anteriores y publicá cuando esté listo.</p>
            <div class="flex flex-wrap gap-3">
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
