// Modelo de los casos de estudio: tipos y paso del texto bilingüe a un solo idioma. Sin dependencias (lo usan el sitio y el panel).
// Archivo IDÉNTICO en Mauricio y Fernanda.
export type Lang = 'es' | 'en';
export type CaseType = 'desarrollo' | 'analista';

// Formas guardadas en la base (cada texto con su par *_en).
export interface Tx { text?: string; text_en?: string }
export type RawBlock =
  | { kind: 'texto'; text?: string; text_en?: string }
  | { kind: 'subtitulo'; text?: string; text_en?: string }
  | { kind: 'lista'; items?: Tx[] }
  | { kind: 'pasos'; steps?: { title?: string; title_en?: string; text?: string; text_en?: string; items?: Tx[] }[] }
  | { kind: 'metricas'; items?: { value?: string; label?: string; label_en?: string }[] }
  | { kind: 'tabla'; caption?: string; caption_en?: string; columns?: { label?: string; label_en?: string }[]; rows?: Tx[][] }
  | { kind: 'diagrama'; url?: string; alt?: string; alt_en?: string; caption?: string; caption_en?: string }
  | { kind: 'enlaces'; items?: { label?: string; label_en?: string; url?: string }[] };
export interface RawSection { key: string; title?: string; title_en?: string; blocks?: RawBlock[] }

// Formas ya resueltas al idioma pedido (lo que consume la ventana pública).
export type Block =
  | { kind: 'texto'; text: string }
  | { kind: 'subtitulo'; text: string }
  | { kind: 'lista'; items: string[] }
  | { kind: 'pasos'; steps: { title: string; text: string; items: string[] }[] }
  | { kind: 'metricas'; items: { value: string; label: string }[] }
  | { kind: 'tabla'; caption: string; columns: string[]; rows: string[][] }
  | { kind: 'diagrama'; url: string; alt: string; caption: string }
  | { kind: 'enlaces'; items: { label: string; url: string }[] };
export interface Section { key: string; title: string; blocks: Block[] }
export interface CaseStudy { slug: string; type: CaseType; title: string; badge: string; description: string; sections: Section[] }

export const pick = (es: string | undefined, en: string | undefined, lang: Lang) => (lang === 'en' ? en || es || '' : es || en || '');

export function localizeBlock(b: RawBlock, lang: Lang): Block | null {
  switch (b.kind) {
    case 'texto': return { kind: 'texto', text: pick(b.text, b.text_en, lang) };
    case 'subtitulo': return { kind: 'subtitulo', text: pick(b.text, b.text_en, lang) };
    case 'lista': return { kind: 'lista', items: (b.items ?? []).map((i) => pick(i.text, i.text_en, lang)).filter(Boolean) };
    case 'pasos': return { kind: 'pasos', steps: (b.steps ?? []).map((s) => ({ title: pick(s.title, s.title_en, lang), text: pick(s.text, s.text_en, lang), items: (s.items ?? []).map((i) => pick(i.text, i.text_en, lang)).filter(Boolean) })) };
    case 'metricas': return { kind: 'metricas', items: (b.items ?? []).map((i) => ({ value: i.value ?? '', label: pick(i.label, i.label_en, lang) })) };
    case 'tabla': return { kind: 'tabla', caption: pick(b.caption, b.caption_en, lang), columns: (b.columns ?? []).map((c) => pick(c.label, c.label_en, lang)), rows: (b.rows ?? []).map((r) => r.map((c) => pick(c.text, c.text_en, lang))) };
    case 'diagrama': return b.url ? { kind: 'diagrama', url: b.url, alt: pick(b.alt, b.alt_en, lang), caption: pick(b.caption, b.caption_en, lang) } : null;
    case 'enlaces': return { kind: 'enlaces', items: (b.items ?? []).filter((i) => i.url).map((i) => ({ label: pick(i.label, i.label_en, lang), url: i.url as string })) };
    default: return null;
  }
}

export function localizeSections(sections: RawSection[], lang: Lang): Section[] {
  return (sections ?? [])
    .map((s) => ({ key: s.key, title: pick(s.title, s.title_en, lang), blocks: (s.blocks ?? []).map((b) => localizeBlock(b, lang)).filter((b): b is Block => !!b) }))
    .filter((s) => s.blocks.length > 0);
}

