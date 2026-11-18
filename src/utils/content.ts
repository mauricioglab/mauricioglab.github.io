// Contenido editable (tabla `site_content`) con valores por defecto en `content-defaults.json`, en español e inglés.
// Los textos en inglés se guardan en la misma fila (`value_en`). Si falta el inglés se usa el valor por defecto en inglés
// (clave `página.clave@en`) y, en última instancia, el español. Si la base no responde, el build NO falla.
import { db } from '../lib/db';
import defaults from '../data/content-defaults.json';
import { SITE_ID } from '../data/site-id';

export type Lang = 'es' | 'en';
const D = defaults as Record<string, string>;

let cache: Promise<Map<string, { es: string; en: string }>> | null = null;

async function load() {
  const map = new Map<string, { es: string; en: string }>();
  try {
    const { data, error } = await db.from('site_content').select('page, key, value, value_en').eq('site', SITE_ID);
    if (error) throw error;
    for (const r of (data ?? []) as { page: string; key: string; value: string; value_en: string | null }[]) {
      map.set(`${r.page}.${r.key}`, { es: r.value ?? '', en: r.value_en ?? '' });
    }
  } catch (e) {
    console.warn('No se pudo cargar site_content; se usan los textos por defecto:', (e as Error).message ?? e);
  }
  return map;
}

/** Texto editable de una página: `c('home', 'banner_title', 'en')`. */
export async function c(page: string, key: string, lang: Lang = 'es'): Promise<string> {
  cache ??= load();
  const row = (await cache).get(`${page}.${key}`);
  const id = `${page}.${key}`;
  const es = row?.es?.trim() ? row.es : D[id] ?? '';
  if (lang === 'es') return es;
  return row?.en?.trim() ? row.en : D[`${id}@en`] ?? es;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Solo enlaces http(s), mailto, rutas relativas y anclas: nada de javascript: ni data:. */
const safeHref = (u: string): string => (/^(https?:\/\/|mailto:|\/|#)/i.test(u) ? u : '#');

/** Markdown mínimo para párrafos: **negrita** y [texto](enlace). Todo lo demás se escapa. */
export function md(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => `<a class="pt-link-gold" href="${safeHref(url)}">${text}</a>`);
}
