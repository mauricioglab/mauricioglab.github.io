// Galería y proyectos editables (tablas `gallery_items` y `projects`) con valores por defecto en JSON.
// Si la base no responde, el build NO falla: usa los valores por defecto y avisa en el log.
import { db } from '../lib/db';
import { SITE_ID } from '../data/site-id';
import galleryDefaults from '../data/gallery-defaults.json';
import navDefaults from '../data/nav-defaults.json';
import settingsDefaults from '../data/settings-defaults.json';
import projectsDefaults from '../data/projects-defaults.json';

export interface GalleryItem { slot: string; image_url: string; alt: string; caption: string }

export async function getGallery(): Promise<Map<string, GalleryItem>> {
  const map = new Map<string, GalleryItem>((galleryDefaults as GalleryItem[]).map((g) => [g.slot, g]));
  try {
    const { data, error } = await db.from('gallery_items').select('slot, image_url, alt, caption').eq('site', SITE_ID).eq('published', true);
    if (error) throw error;
    for (const r of (data ?? []) as GalleryItem[]) {
      const base = map.get(r.slot);
      map.set(r.slot, { slot: r.slot, image_url: r.image_url ?? '', alt: r.alt ?? '', caption: r.caption ?? base?.caption ?? '' });
    }
  } catch (e) {
    console.warn('No se pudo cargar gallery_items; se usan los valores por defecto:', (e as Error).message ?? e);
  }
  return map;
}


export interface NavLink { label: string; href: string }
export interface SiteSettings { tagline: string; networks: Record<string, string> }

let navCache: Promise<NavLink[]> | null = null;
export function getNavItems(): Promise<NavLink[]> {
  navCache ??= (async () => {
    try {
      const { data, error } = await db.from('nav_items').select('label, href').eq('site', SITE_ID).eq('area', 'menu').eq('visible', true).order('position', { ascending: true });
      if (error) throw error;
      if (data && data.length) return data as NavLink[];
    } catch (e) {
      console.warn('No se pudo cargar nav_items; se usa el menú por defecto:', (e as Error).message ?? e);
    }
    return navDefaults as NavLink[];
  })();
  return navCache;
}

let settingsCache: Promise<SiteSettings> | null = null;
export function getSettings(): Promise<SiteSettings> {
  settingsCache ??= (async () => {
    const base = settingsDefaults as SiteSettings;
    try {
      const { data, error } = await db.from('site_settings').select('data').eq('site', SITE_ID).maybeSingle();
      if (error) throw error;
      const d = (data?.data ?? {}) as Partial<SiteSettings>;
      return { tagline: d.tagline || base.tagline, networks: { ...base.networks, ...(d.networks ?? {}) } };
    } catch (e) {
      console.warn('No se pudo cargar site_settings; se usan los ajustes por defecto:', (e as Error).message ?? e);
      return base;
    }
  })();
  return settingsCache;
}

export interface ProjectRow { slug: string; title: string; summary: string; category: string; tags: string[]; links: Record<string, string>; featured: boolean; position: number }

/** Proyectos del portafolio (tabla `projects`). Si la base no responde, usa projects-defaults.json. */
export async function getProjectRows(lang = 'es'): Promise<ProjectRow[]> {
  try {
    const { data, error } = await db
      .from('projects')
      .select('slug, title, summary, category, tags, links, featured, position')
      .eq('site', SITE_ID).eq('lang', lang).eq('published', true)
      .order('position', { ascending: true });
    if (error) throw error;
    if (data && data.length) return data as ProjectRow[];
  } catch (e) {
    console.warn('No se pudo cargar projects; se usan los valores por defecto:', (e as Error).message ?? e);
  }
  return lang === 'es' ? (projectsDefaults as ProjectRow[]) : [];
}
