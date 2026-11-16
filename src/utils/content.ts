// Contenido editable (tabla `site_content`) con valores por defecto en `content-defaults.json`.
// Si la base no responde, el build NO falla: usa los textos por defecto y avisa en el log.
import { db } from '../lib/db';
import defaults from '../data/content-defaults.json';
import { SITE_ID } from '../data/site-id';

let cache: Promise<Map<string, string>> | null = null;

async function load(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const { data, error } = await db.from('site_content').select('page, key, lang, value').eq('site', SITE_ID);
    if (error) throw error;
    for (const r of (data ?? []) as { page: string; key: string; lang: string; value: string }[]) {
      map.set(`${r.page}.${r.key}.${r.lang}`, r.value);
    }
  } catch (e) {
    console.warn('No se pudo cargar site_content; se usan los textos por defecto:', (e as Error).message ?? e);
  }
  return map;
}

/** Texto editable de una página: `c('home', 'banner_title')`. */
export async function c(page: string, key: string, lang = 'es'): Promise<string> {
  cache ??= load();
  const v = (await cache).get(`${page}.${key}.${lang}`);
  if (v && v.trim()) return v;
  return (defaults as Record<string, string>)[`${page}.${key}`] ?? '';
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Markdown mínimo para párrafos: **negrita** y [texto](enlace). Todo lo demás se escapa. */
export function md(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a class="pt-link-gold" href="$2">$1</a>');
}
