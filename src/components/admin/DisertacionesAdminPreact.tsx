import { useSignal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import WizardModal from './shared/WizardModal';
import type { OpState } from './shared/BusyOverlay';
import { db } from '../../lib/db';
import { SITE_ID, SITE_AUTHOR } from '../../data/site-id';
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
  display_photos?: string[];
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
  const [slideFiles, setSlideFiles] = useState<File[]>([]);
  const [textResumen, setTextResumen] = useState('');
  const [slideUrls, setSlideUrls] = useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(-1);
  const [coverUrl, setCoverUrl] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [displayPhotos, setDisplayPhotos] = useState<string[]>([]);
  const [showInAbout, setShowInAbout] = useState(false);
  const [featuredHome, setFeaturedHome] = useState(false);
  const [mainPhoto, setMainPhoto] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [disertaciones, setDisertaciones] = useState<Disertacion[]>([]);
  const [opHistory, setOpHistory] = useState<OpHistoryEntry[]>([]);

  async function loadDisertaciones() {
    const { data, error } = await db.from('disertaciones').select('*').eq('site', SITE_ID).order('event_date', { ascending: false });
    if (!error) setDisertaciones(data || []);
  }

  useEffect(() => {
    loadDisertaciones();
  }, []);

  function nuevaDisertacion() {
    setShowInAbout(false);
    setFeaturedHome(false);
    setMainPhoto('');
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
    setDisplayPhotos([]);
    setPptFile(null);
    setCertFile(null);
    setSlideFiles([]);
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
    const removed = galleryUrls[index];
    setGalleryUrls((g) => g.filter((_, i) => i !== index));
    if (removed) setDisplayPhotos((d) => d.filter((u) => u !== removed));
  }

  function removeSlide(index: number) {
    const removed = slideUrls[index];
    setSlideUrls((s) => s.filter((_, i) => i !== index));
    if (selectedCoverIndex === index) {
      setSelectedCoverIndex(-1);
      setCoverUrl('');
    } else if (selectedCoverIndex > index) {
      setSelectedCoverIndex((i) => i - 1);
    }
    if (removed) setDisplayPhotos((d) => d.filter((u) => u !== removed));
  }

  function quitarCertificado() {
    if (certificateUrl) setDisplayPhotos((d) => d.filter((u) => u !== certificateUrl));
    setCertificateUrl('');
    setCertFile(null);
  }

  function toggleDisplayPhoto(url: string) {
    setDisplayPhotos((d) => {
      if (d.includes(url)) return d.filter((u) => u !== url);
      if (d.length >= 3) return d;
      return [...d, url];
    });
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
    return db.storage.from('disertaciones-files').getPublicUrl(data.path).data.publicUrl;
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

  async function subirDiapositivas() {
    if (!slideFiles.length) {
      status.value = 'Elegí una o más imágenes de diapositivas.';
      return;
    }
    busy.value = true;
    status.value = 'Subiendo diapositivas…';
    try {
      const urls: string[] = [];
      for (const f of slideFiles) urls.push(await uploadImage(f, 'slides'));
      setSlideUrls((x) => [...x, ...urls]);
      setSlideFiles([]);
      status.value = 'Diapositivas subidas.';
    } catch (e) {
      status.value = (e as Error).message;
    } finally {
      busy.value = false;
    }
  }

  async function uniqueSlug(base: string) {
    const { data } = await db.from('disertaciones').select('slug').eq('site', SITE_ID);
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
        site: SITE_ID,
        author: SITE_AUTHOR,
        categories: selectedCategories,
        description: form.description,
        bullets: bullets.filter((b) => b.trim()),
        cover_url: coverUrl || null,
        certificate_url: certificateUrl || null,
        slides_urls: slideUrls,
        gallery_urls: galleryUrls,
        display_photos: displayPhotos,
        show_in_about: showInAbout,
        featured_home: featuredHome,
        main_photo: mainPhoto || null,
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
      finishOp(draft ? 'Borrador guardado.' : '¡Publicado! Aparece en Eventos, Sobre mí e Inicio en 1 o 2 minutos (el sitio se reconstruye solo).');
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
    setDisplayPhotos(Array.isArray(p.display_photos) ? p.display_photos : []);
    setShowInAbout(!!(p as any).show_in_about);
    setFeaturedHome(!!(p as any).featured_home);
    setMainPhoto((p as any).main_photo || '');
    setSelectedCoverIndex(cover ? slides.indexOf(cover) : -1);
    wizardStep.value = 3;
    wizardOpen.value = true;
  }

  return (
    <div class="max-w-4xl mx-auto p-4 md:p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">🎤 Eventos</h1>
        <div class="flex items-center gap-3">
          <a href={`${DISERT_BASE}es/eventos/`} class="text-sm text-[#5c6785] hover:text-[#082D3A]">
            Ver sitio →
          </a>
          <button onClick={abrirWizardNueva} class="px-4 py-2 bg-[#082D3A] hover:bg-[#0b6e7d] text-white text-sm font-bold rounded-lg">
            + Nuevo evento
          </button>
        </div>
      </div>

      {opHistory.length > 0 && (
        <div class="mb-4">
          <details class="group text-xs bg-[#f4f6fa] rounded-xl p-3">
            <summary class="text-[#5c6785] hover:text-[#082D3A] cursor-pointer select-none font-bold">
              Actividad reciente ({opHistory.length})
            </summary>
            <div class="mt-1.5 space-y-1">
              {opHistory.map((h) => (
                <div key={h.ts} class={'flex items-start gap-2 ' + (h.ok ? 'text-[#5c6785]' : 'text-[#b32d2e]')}>
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

      <div class="bg-[#f4f6fa] rounded-xl p-5">
        <h2 class="text-base font-bold mb-3">Eventos existentes</h2>
        {!disertaciones.length && <div class="text-sm text-[#5c6785]">Sin eventos todavía.</div>}
        <div class="space-y-2">
          {disertaciones.map((p) => (
            <div key={p.id} class="bg-white border border-[#d7dce5] rounded-lg p-3">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-bold">{p.title}</p>
                <span
                  class={
                    'text-[10px] px-2 py-0.5 rounded-full shrink-0 ' +
                    (p.draft ? 'bg-[#9a6b00]/10 text-[#9a6b00]' : 'bg-[#1f7a3d]/10 text-[#1f7a3d]')
                  }
                >
                  {p.draft ? 'borrador' : 'publicado'}
                </span>
              </div>
              <p class="text-xs text-[#5c6785] mt-1">
                {p.event_date} · {p.event_name || '—'}
              </p>
              <div class="flex gap-2 mt-2 text-xs">
                <button onClick={() => cargarDisertacion(p)} class="text-[#0b6e7d] hover:text-[#16B6C9] font-bold">
                  Editar
                </button>
                <button onClick={() => toggleDraft(p)} class="text-[#5c6785] hover:text-[#082D3A] font-bold">
                  {p.draft ? 'Publicar' : 'A borrador'}
                </button>
                <button onClick={() => borrarDisertacion(p)} class="text-[#b32d2e] hover:text-[#8f2223] font-bold">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WizardModal
        steps={['Datos', 'PPT/Resumen', 'Imágenes', 'Publicar']}
        newLabel="Nuevo evento"
        editLabel="Editar evento"
        isEditing={!!editingId}
        wizardOpen={wizardOpen}
        wizardStep={wizardStep}
        busy={busy}
        op={op}
        status={status}
      >
        {wizardStep.value === 1 && (
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-[#082D3A]">Datos del evento</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-[#082D3A] mb-1">Título *</label>
                <input
                  value={form.title}
                  onInput={(e) => setForm({ ...form, title: (e.target as HTMLInputElement).value })}
                  type="text"
                  class="w-full px-3 py-2 bg-white border border-[#c5ccd8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16B6C9]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#082D3A] mb-1">Fecha de la charla</label>
                <input
                  value={form.eventDate}
                  onInput={(e) => setForm({ ...form, eventDate: (e.target as HTMLInputElement).value })}
                  type="date"
                  class="w-full px-3 py-2 bg-white border border-[#c5ccd8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16B6C9]"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#082D3A] mb-1">Evento / Institución</label>
                <input
                  value={form.eventName}
                  onInput={(e) => setForm({ ...form, eventName: (e.target as HTMLInputElement).value })}
                  type="text"
                  placeholder="Ej: Congreso de Informática 2026"
                  class="w-full px-3 py-2 bg-white border border-[#c5ccd8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16B6C9]"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-[#082D3A] mb-1">Descripción (SEO)</label>
                <input
                  value={form.description}
                  onInput={(e) => setForm({ ...form, description: (e.target as HTMLInputElement).value })}
                  type="text"
                  class="w-full px-3 py-2 bg-white border border-[#c5ccd8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16B6C9]"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-[#082D3A] mb-1">Categorías</label>
                <div class="flex flex-col gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => addCategory((e.target as HTMLSelectElement).value)}
                    class="w-full px-3 py-2 bg-white border border-[#c5ccd8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16B6C9]"
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
                          class="inline-flex items-center gap-1.5 bg-[#e9edf3] rounded-full px-3 py-1 text-xs font-bold text-[#082D3A]"
                        >
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => removeCategory(i)}
                            class="text-[#082D3A] hover:text-[#8f2223] font-bold leading-none"
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
                class="px-4 py-2 bg-[#082D3A] hover:bg-[#0b6e7d] disabled:opacity-60 text-white text-sm font-bold rounded-lg"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {wizardStep.value === 2 && (
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-[#082D3A]">Subí el PPT (.pptx) para generar el resumen</h3>
            <p class="text-xs text-[#5c6785]">
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
                class="flex-1 text-sm text-[#082D3A] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#e9edf3] file:text-[#082D3A] file:text-sm file:font-bold hover:file:bg-[#d9dfe9]"
              />
              <button
                onClick={procesarPpt}
                disabled={busy.value || !pptFile}
                class="shrink-0 px-4 py-2 bg-[#082D3A] hover:bg-[#0b6e7d] disabled:opacity-60 text-sm font-bold rounded-lg"
              >
                ⚙️ Procesar PPT
              </button>
            </div>

            <div class="border-t border-[#d7dce5] pt-3 space-y-2">
              <label class="block text-xs font-bold text-[#082D3A]">¿No tenés el PPT? Escribí un resumen y la IA lo mejora</label>
              <textarea
                value={textResumen}
                onInput={(e) => setTextResumen((e.target as HTMLTextAreaElement).value)}
                rows={5}
                class="w-full px-3 py-2 bg-white border border-[#c5ccd8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16B6C9]"
                placeholder="Escribí con tus palabras de qué trató la charla: tema, puntos que tocaste, ejemplos, audiencia…"
              />
              <button
                onClick={mejorarTexto}
                disabled={busy.value || !textResumen}
                class="px-4 py-2 bg-[#e9edf3] hover:bg-[#d9dfe9] disabled:opacity-60 text-sm font-bold rounded-lg"
              >
                ✨ Mejorar con IA
              </button>
            </div>

            {slideUrls.length > 0 && (
              <div class="space-y-3">
                <p class="text-xs font-bold text-[#082D3A]">Diapositivas extraídas ({slideUrls.length}):</p>
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slideUrls.map((s, i) => (
                    <div
                      key={i}
                      class={
                        'relative group rounded-lg overflow-hidden border ' +
                        (selectedCoverIndex === i ? 'border-[#16B6C9] ring-2 ring-[#16B6C9]' : 'border-[#c5ccd8]')
                      }
                    >
                      <img src={s} class="w-full aspect-video object-cover" alt={`Slide ${i + 1}`} />
                      <button
                        onClick={() => removeSlide(i)}
                        type="button"
                        class="absolute top-1 right-1 text-[10px] font-bold text-white bg-[#b32d2e] hover:bg-[#8f2223] rounded px-1.5 py-0.5"
                        title="Borrar esta diapositiva"
                      >
                        ✕
                      </button>
                      <div class="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => setCover(i)}
                          type="button"
                          class="text-[10px] font-bold text-white bg-[#082D3A] hover:bg-[#0b6e7d] m-1 px-2 py-1 rounded"
                          title="Usar como portada"
                        >
                          Portada
                        </button>
                        {selectedCoverIndex === i && (
                          <button
                            onClick={() => setCover(i)}
                            type="button"
                            class="text-[10px] font-bold text-[#082D3A] bg-[#e9edf3] hover:bg-[#d9dfe9] m-1 px-2 py-1 rounded"
                            title="Es la portada actual"
                          >
                            ★
                          </button>
                        )}
                      </div>
                      {selectedCoverIndex === i && (
                        <span class="absolute top-1 left-1 text-[10px] font-bold text-white bg-[#082D3A] px-1.5 py-0.5 rounded">
                          portada
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p class="text-xs text-[#5c6785]">Tip: la slide 1 suele ser la portada. Hacé clic en "Portada" sobre la que quieras.</p>
              </div>
            )}

            {bullets.length > 0 && (
              <div class="border-t border-[#d7dce5] pt-3 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-[#082D3A]">Bullets "De qué trató la charla" (editables)</label>
                  <button onClick={addBullet} type="button" class="text-xs text-[#0b6e7d] hover:text-[#16B6C9] font-bold">
                    + agregar
                  </button>
                </div>
                {bullets.map((b, i) => (
                  <div key={i} class="flex items-center gap-2">
                    <input
                      value={b}
                      onInput={(e) => updateBullet(i, (e.target as HTMLInputElement).value)}
                      type="text"
                      class="flex-1 px-3 py-2 bg-white border border-[#c5ccd8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16B6C9]"
                    />
                    <button onClick={() => removeBullet(i)} type="button" class="text-[#b32d2e] hover:text-[#8f2223] font-bold shrink-0" title="Quitar">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div class="flex justify-end">
              <button onClick={() => (wizardStep.value = 3)} class="px-4 py-2 bg-[#082D3A] hover:bg-[#0b6e7d] text-white text-sm font-bold rounded-lg">
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {wizardStep.value === 3 && (
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#082D3A]">Imágenes del evento</h3>
            <p class="text-xs text-[#5c6785]">
              Cada imagen se sube según su tipo. En la tarjeta se muestran las fotos (hasta 3); si el evento no tiene fotos, se
              muestran una diapositiva y el certificado. Las diapositivas no se usan en Sobre mí ni en el Inicio.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="border border-[#d7dce5] p-3 space-y-2">
                <label class="block text-xs font-bold text-[#082D3A]">📷 Fotos del evento</label>
                <input type="file" accept="image/*" multiple onChange={(e) => { const i = e.target as HTMLInputElement; setGalleryFiles(i.files ? Array.from(i.files) : []); }} class="text-xs text-[#082D3A] file:mr-2 file:py-1.5 file:px-3 file:border-0 file:bg-[#e9edf3] file:text-[#082D3A] file:text-xs file:font-bold hover:file:bg-[#d9dfe9]" />
                <button onClick={subirGaleria} disabled={busy.value || !galleryFiles.length} class="px-3 py-1.5 bg-[#e9edf3] hover:bg-[#d9dfe9] disabled:opacity-60 text-xs font-bold">
                  {galleryUrls.length ? 'Agregar fotos' : 'Subir fotos'}
                </button>
                {galleryUrls.length > 0 && (
                  <div class="grid grid-cols-3 gap-1.5">
                    {galleryUrls.map((g, i) => (
                      <div key={g} class="relative overflow-hidden border border-[#c5ccd8]">
                        <img src={g} alt="Foto del evento" class="w-full aspect-square object-cover" />
                        <button onClick={() => removeGallery(i)} type="button" class="absolute top-0.5 right-0.5 text-[9px] font-bold text-white bg-[#b32d2e] px-1" title="Quitar foto">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div class="border border-[#d7dce5] p-3 space-y-2">
                <label class="block text-xs font-bold text-[#082D3A]">🎓 Certificado</label>
                <input type="file" accept="image/*" onChange={(e) => { const i = e.target as HTMLInputElement; setCertFile(i.files && i.files[0] ? i.files[0] : null); }} class="text-xs text-[#082D3A] file:mr-2 file:py-1.5 file:px-3 file:border-0 file:bg-[#e9edf3] file:text-[#082D3A] file:text-xs file:font-bold hover:file:bg-[#d9dfe9]" />
                <button onClick={subirCertificado} disabled={busy.value || !certFile} class="px-3 py-1.5 bg-[#e9edf3] hover:bg-[#d9dfe9] disabled:opacity-60 text-xs font-bold">
                  {certificateUrl ? 'Reemplazar' : 'Subir certificado'}
                </button>
                {certificateUrl && (
                  <div class="relative overflow-hidden border border-[#c5ccd8]">
                    <img src={certificateUrl} alt="Certificado" class="w-full aspect-square object-cover" />
                    <button onClick={quitarCertificado} type="button" class="absolute top-1 right-1 text-[10px] font-bold text-white bg-[#b32d2e] px-1.5 py-0.5" title="Quitar certificado">✕</button>
                  </div>
                )}
              </div>

              <div class="border border-[#d7dce5] p-3 space-y-2">
                <label class="block text-xs font-bold text-[#082D3A]">🖥️ Diapositivas (PPT)</label>
                <p class="text-[10px] text-[#6b7490]">Las que salen de procesar el PPT en el paso anterior, más las que subas acá.</p>
                <input type="file" accept="image/*" multiple onChange={(e) => { const i = e.target as HTMLInputElement; setSlideFiles(i.files ? Array.from(i.files) : []); }} class="text-xs text-[#082D3A] file:mr-2 file:py-1.5 file:px-3 file:border-0 file:bg-[#e9edf3] file:text-[#082D3A] file:text-xs file:font-bold hover:file:bg-[#d9dfe9]" />
                <button onClick={subirDiapositivas} disabled={busy.value || !slideFiles.length} class="px-3 py-1.5 bg-[#e9edf3] hover:bg-[#d9dfe9] disabled:opacity-60 text-xs font-bold">
                  Agregar diapositivas
                </button>
                {slideUrls.length > 0 && (
                  <div class="grid grid-cols-3 gap-1.5">
                    {slideUrls.map((u, i) => (
                      <div key={u} class={'relative overflow-hidden border ' + (selectedCoverIndex === i ? 'border-[#16B6C9] ring-2 ring-[#16B6C9]' : 'border-[#c5ccd8]')}>
                        <img src={u} alt={`Diapositiva ${i + 1}`} class="w-full aspect-video object-cover" />
                        <button onClick={() => removeSlide(i)} type="button" class="absolute top-0.5 right-0.5 text-[9px] font-bold text-white bg-[#b32d2e] px-1" title="Quitar diapositiva">✕</button>
                        <button onClick={() => setCover(i)} type="button" class="absolute bottom-0.5 left-0.5 text-[9px] font-bold text-white bg-[#082D3A] px-1" title="Usar como imagen de la tarjeta cuando no hay fotos">
                          {selectedCoverIndex === i ? '★ portada' : 'portada'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {galleryUrls.length > 3 && (
              <div class="border-t border-[#d7dce5] pt-4 space-y-2">
                <label class="block text-xs font-bold text-[#082D3A]">
                  Fotos a mostrar en la tarjeta <span class="font-normal text-[#6b7490]">(elegí hasta 3; si no elegís, se usan las primeras)</span>
                </label>
                <div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {galleryUrls.map((u) => {
                    const order = displayPhotos.indexOf(u);
                    return (
                      <div key={u} onClick={() => toggleDisplayPhoto(u)} class={'relative overflow-hidden border cursor-pointer ' + (order !== -1 ? 'border-[#16B6C9] ring-2 ring-[#16B6C9]' : 'border-[#c5ccd8] hover:border-[#16B6C9]')}>
                        <img src={u} class="w-full aspect-square object-cover" alt="" />
                        {order !== -1 && <span class="absolute top-0.5 left-0.5 text-[10px] font-bold text-white bg-[#082D3A] w-4 h-4 flex items-center justify-center">{order + 1}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(galleryUrls.length > 0 || certificateUrl) && (
              <div class="border-t border-[#d7dce5] pt-4 space-y-3">
                <label class="block text-xs font-bold text-[#082D3A]">Dónde se usan las fotos de este evento</label>
                <p class="text-[10px] text-[#6b7490]">Subís las fotos una sola vez acá. Si las marcás, también aparecen en Sobre mí y en el Inicio.</p>
                <label class="flex items-center gap-2 text-sm text-[#082D3A]">
                  <input type="checkbox" checked={showInAbout} onChange={(e) => setShowInAbout((e.target as HTMLInputElement).checked)} />
                  Aparece en Sobre mí (mosaico y trayectoria)
                </label>
                <label class="flex items-center gap-2 text-sm text-[#082D3A]">
                  <input type="checkbox" checked={featuredHome} onChange={(e) => setFeaturedHome((e.target as HTMLInputElement).checked)} />
                  Foto del Inicio (bloque de la frase destacada)
                </label>
                <label class="block text-xs font-bold text-[#082D3A]">Foto principal <span class="font-normal text-[#6b7490]">(si no elegís, se usa la primera foto)</span></label>
                <div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {[...galleryUrls, certificateUrl].filter((u, i, a) => u && a.indexOf(u) === i).map((u) => (
                    <div key={u} onClick={() => setMainPhoto(mainPhoto === u ? '' : u)} class={'relative overflow-hidden border cursor-pointer ' + (mainPhoto === u ? 'border-[#16B6C9] ring-2 ring-[#16B6C9]' : 'border-[#c5ccd8] hover:border-[#16B6C9]')}>
                      <img src={u} class="w-full aspect-square object-cover" alt="" />
                      {mainPhoto === u && <span class="absolute top-0.5 left-0.5 text-[10px] font-bold text-white bg-[#082D3A] px-1">Principal</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div class="flex justify-end">
              <button onClick={() => (wizardStep.value = 4)} class="px-4 py-2 bg-[#082D3A] hover:bg-[#0b6e7d] text-white text-sm font-bold">
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {wizardStep.value === 4 && (
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#082D3A]">Publicar</h3>
            <p class="text-xs text-[#5c6785]">Revisá los datos en los pasos anteriores y publicá cuando esté listo.</p>
            <div class="flex flex-wrap gap-3">
              <button
                onClick={() => publicar(false)}
                disabled={busy.value}
                class="px-5 py-2 bg-[#1f7a3d] hover:bg-[#17602f] disabled:opacity-60 text-sm font-bold rounded-lg"
              >
                {editingId ? 'Actualizar y publicar' : 'Publicar'}
              </button>
              <button
                onClick={() => publicar(true)}
                disabled={busy.value}
                class="px-5 py-2 bg-[#e9edf3] hover:bg-[#d9dfe9] disabled:opacity-60 text-sm font-bold rounded-lg"
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
