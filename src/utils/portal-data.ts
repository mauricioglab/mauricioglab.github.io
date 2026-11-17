// Galería, menú, ajustes y proyectos editables (tablas `gallery_items`, `nav_items`, `site_settings`, `projects`)
// con valores por defecto en JSON, en español e inglés. Si la base no responde, el build NO falla: usa los valores por defecto.
import { db } from '../lib/db';
import { SITE_ID } from '../data/site-id';
import { getAboutItems } from './eventos';
import galleryDefaults from '../data/gallery-defaults.json';
import navDefaults from '../data/nav-defaults.json';
import settingsDefaults from '../data/settings-defaults.json';
import projectsDefaults from '../data/projects-defaults.json';

export type Lang = 'es' | 'en';
export interface GalleryItem { slot: string; image_url: string; alt: string; caption: string; alt_en?: string; caption_en?: string }

const SLOTS = [
  'mosaico-1', 'mosaico-2', 'mosaico-3',
  ...Array.from({ length: 10 }, (_, i) => `trayectoria-${i + 1}`),
];

/**
 * Galería de Sobre mí (13 espacios). Prioridad por espacio:
 *   1) imagen cargada a mano en `gallery_items`;
 *   2) fotos de los eventos marcados «Aparece en Sobre mí» (se suben una sola vez, en Eventos);
 *   3) valor por defecto del código (marcador con epígrafe).
 * Devuelve alt y epígrafe en el idioma pedido (inglés si existe, si no español).
 */
export async function getGallery(lang: Lang = 'es'): Promise<Map<string, GalleryItem>> {
  const map = new Map<string, GalleryItem>((galleryDefaults as GalleryItem[]).map((g) => [g.slot, g]));
  try {
    const { data, error } = await db.from('gallery_items').select('slot, image_url, alt, caption, alt_en, caption_en').eq('site', SITE_ID).eq('published', true);
    if (error) throw error;
    for (const r of (data ?? []) as GalleryItem[]) {
      const base = map.get(r.slot);
      map.set(r.slot, { slot: r.slot, image_url: r.image_url ?? '', alt: r.alt ?? '', caption: r.caption ?? base?.caption ?? '', alt_en: r.alt_en ?? '', caption_en: r.caption_en ?? base?.caption_en ?? '' });
    }
  } catch (e) {
    console.warn('No se pudo cargar gallery_items; se usan los valores por defecto:', (e as Error).message ?? e);
  }
  const auto = await getAboutItems(lang);
  const withPhoto = auto.filter((a) => a.image_url);
  const withoutPhoto = auto.filter((a) => !a.image_url);
  const empty = SLOTS.filter((s) => !map.get(s)?.image_url);
  empty.slice(0, withPhoto.length).forEach((slot, i) => {
    const a = withPhoto[i];
    map.set(slot, { slot, image_url: a.image_url, alt: a.alt, caption: a.caption, alt_en: a.alt, caption_en: a.caption });
  });
  empty.slice(withPhoto.length).filter((s) => s.startsWith('trayectoria-')).slice(0, withoutPhoto.length).forEach((slot, i) => {
    const a = withoutPhoto[i];
    map.set(slot, { slot, image_url: '', alt: a.alt, caption: a.caption, alt_en: a.alt, caption_en: a.caption });
  });
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
