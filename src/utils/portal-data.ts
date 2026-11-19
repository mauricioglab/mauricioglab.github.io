// Galería, menú, ajustes y proyectos editables (tablas `gallery_items`, `nav_items`, `site_settings`, `projects`)
// con valores por defecto en JSON, en español e inglés. Si la base no responde, el build NO falla: usa los valores por defecto.
import { db } from '../lib/db';
import { SITE_ID } from '../data/site-id';
import { getAboutItems } from './eventos';
import { resolveSlots, type GalleryItem } from '../data/gallery-slots';
import galleryDefaults from '../data/gallery-defaults.json';
import navDefaults from '../data/nav-defaults.json';
import settingsDefaults from '../data/settings-defaults.json';
import projectsDefaults from '../data/projects-defaults.json';

export type Lang = 'es' | 'en';
export type { GalleryItem };

/**
 * Galería de Sobre mí (13 espacios). Prioridad por espacio:
 *   1) imagen cargada a mano en `gallery_items`;
 *   2) fotos de los eventos marcados «Aparece en Sobre mí» (se suben una sola vez, en Eventos);
 *   3) valor por defecto del código (marcador con epígrafe).
 * Devuelve alt y epígrafe en el idioma pedido (inglés si existe, si no español).
 */
export async function getGallery(lang: Lang = 'es'): Promise<Map<string, GalleryItem>> {
  let rows: GalleryItem[] = [];
  try {
    const { data, error } = await db.from('gallery_items').select('slot, image_url, alt, caption, alt_en, caption_en').eq('site', SITE_ID).eq('published', true);
    if (error) throw error;
    rows = (data ?? []) as GalleryItem[];
  } catch (e) {
    console.warn('No se pudo cargar gallery_items; se usan los valores por defecto:', (e as Error).message ?? e);
  }
  const map: Map<string, GalleryItem> = resolveSlots(galleryDefaults as GalleryItem[], rows, await getAboutItems(lang));
  if (lang === 'en') {
    for (const [k, v] of map) map.set(k, { ...v, alt: v.alt_en || v.alt, caption: v.caption_en || v.caption });
  }
  return map;
}

export interface NavLink { label: string; href: string; label_en?: string; href_en?: string }
export interface SocialItem { key: string; url: string; show: boolean }
export interface SiteSettings { tagline: string; tagline_en?: string; networks: SocialItem[]; sections: { eventos: boolean; recursos: boolean; curiosidades: boolean } }

const navCache: Partial<Record<Lang, Promise<{ label: string; href: string }[]>>> = {};
/** Menú principal en el idioma pedido (etiqueta y enlace en inglés si existen). */
export function getNavItems(lang: Lang = 'es'): Promise<{ label: string; href: string }[]> {
  navCache[lang] ??= (async () => {
    let rows = navDefaults as NavLink[];
    try {
      const { data, error } = await db.from('nav_items').select('label, href, label_en, href_en').eq('site', SITE_ID).eq('area', 'menu').eq('visible', true).order('position', { ascending: true });
      if (error) throw error;
      if (data && data.length) rows = data as NavLink[];
    } catch (e) {
      console.warn('No se pudo cargar nav_items; se usa el menú por defecto:', (e as Error).message ?? e);
    }
    return rows.map((r) => (lang === 'en' ? { label: r.label_en || r.label, href: r.href_en || r.href } : { label: r.label, href: r.href }));
  })();
  return navCache[lang]!;
}

/** Acepta la forma nueva (lista ordenada) y la vieja (mapa clave → URL). */
function normNetworks(v: unknown, fallback: SocialItem[]): SocialItem[] {
  if (Array.isArray(v)) return v.filter((n: any) => n && n.key).map((n: any) => ({ key: String(n.key), url: String(n.url ?? ''), show: n.show !== false }));
  if (v && typeof v === 'object') return Object.entries(v as Record<string, string>).map(([key, url]) => ({ key, url: String(url ?? ''), show: true }));
  return fallback;
}

let settingsCache: Promise<SiteSettings> | null = null;
function loadSettings(): Promise<SiteSettings> {
  settingsCache ??= (async () => {
    const base = settingsDefaults as SiteSettings;
    try {
      const { data, error } = await db.from('site_settings').select('data').eq('site', SITE_ID).maybeSingle();
      if (error) throw error;
      const d = (data?.data ?? {}) as Partial<SiteSettings>;
      return { tagline: d.tagline || base.tagline, tagline_en: d.tagline_en || base.tagline_en, networks: normNetworks(d.networks, base.networks), sections: { ...base.sections, ...(d.sections ?? {}) } };
    } catch (e) {
      console.warn('No se pudo cargar site_settings; se usan los ajustes por defecto:', (e as Error).message ?? e);
      return base;
    }
  })();
  return settingsCache;
}
/** Ajustes del sitio; `tagline` ya viene en el idioma pedido. */
export async function getSettings(lang: Lang = 'es'): Promise<SiteSettings> {
  const s = await loadSettings();
  return lang === 'en' ? { ...s, tagline: s.tagline_en || s.tagline } : s;
}

export interface ProjectRow { slug: string; title: string; summary: string; category: string; tags: string[]; links: Record<string, string>; featured: boolean; position: number; title_en?: string; summary_en?: string }

/** Proyectos del portafolio (tabla `projects`), con título y resumen en el idioma pedido. */
export async function getProjectRows(lang: Lang = 'es'): Promise<ProjectRow[]> {
  let rows = projectsDefaults as ProjectRow[];
  try {
    const { data, error } = await db
      .from('projects')
      .select('slug, title, summary, title_en, summary_en, category, tags, links, featured, position')
      .eq('site', SITE_ID).eq('lang', 'es').eq('published', true)
      .order('position', { ascending: true });
    if (error) throw error;
    if (data && data.length) rows = data as ProjectRow[];
  } catch (e) {
    console.warn('No se pudo cargar projects; se usan los valores por defecto:', (e as Error).message ?? e);
  }
  return rows.map((r) => (lang === 'en' ? { ...r, title: r.title_en || r.title, summary: r.summary_en || r.summary } : r));
}
