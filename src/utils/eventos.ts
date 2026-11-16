// Eventos (tabla `disertaciones`, nombre visible «Eventos»): charlas, talleres, hackatones, premios.
// Las fotos de cada evento se suben UNA vez y alimentan también Sobre mí (mosaico y trayectoria) y la foto del Inicio.
// Si la base no responde, el build no falla: devuelve listas vacías y avisa en el log.
import { db } from '../lib/db';
import { SITE_ID, SITE_AUTHOR } from '../data/site-id';

export interface Evento {
  id: string;
  slug: string;
  title: string;
  date: Date | null;
  place: string;
  author: string;
  categories: string[];
  description: string;
  bullets: string[];
  cover?: string;
  certificate?: string;
  slides: string[];
  gallery: string[];
  displayPhotos: string[];
  showInAbout: boolean;
  featuredHome: boolean;
  mainPhoto?: string;
}

let cache: Promise<Evento[]> | null = null;

export function getEventos(): Promise<Evento[]> {
  cache ??= (async () => {
    try {
      const { data, error } = await db
        .from('disertaciones')
        .select('id, slug, title, event_date, event_name, author, categories, description, bullets, cover_url, certificate_url, slides_urls, gallery_urls, display_photos, show_in_about, featured_home, main_photo')
        .eq('site', SITE_ID)
        .eq('draft', false);
      if (error) throw error;
      const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]).filter(Boolean) : []);
      const items: Evento[] = (data ?? []).map((r: any) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        date: r.event_date ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(r.event_date) ? `${r.event_date}T00:00:00` : r.event_date) : null,
        place: r.event_name ?? '',
        author: r.author ?? SITE_AUTHOR,
        categories: arr(r.categories),
        description: r.description ?? '',
        bullets: arr(r.bullets),
        cover: r.cover_url || undefined,
        certificate: r.certificate_url || undefined,
        slides: arr(r.slides_urls),
        gallery: arr(r.gallery_urls),
        displayPhotos: arr(r.display_photos),
        showInAbout: !!r.show_in_about,
        featuredHome: !!r.featured_home,
        mainPhoto: r.main_photo || undefined,
      }));
      return items.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
    } catch (e) {
      console.warn('No se pudieron cargar los eventos:', (e as Error).message ?? e);
      return [];
    }
  })();
  return cache;
}

/** ¿La imagen es una diapositiva (de una presentación)? Esas no van a Sobre mí ni al Inicio. */
export function isSlide(e: Evento, url: string): boolean {
  return e.slides.includes(url) || /\/slides\//i.test(url);
}

/** Foto real del evento (nunca una diapositiva): la elegida a mano, el álbum, la portada o el certificado. */
export function photoOf(e: Evento): string {
  const candidates = [e.mainPhoto, ...e.displayPhotos, ...e.gallery, e.cover, e.certificate];
  return candidates.find((u): u is string => !!u && !isSlide(e, u)) ?? '';
}

/** Hasta 3 imágenes para la tarjeta de Eventos: portada + 2 más (elegidas a mano, o certificado/álbum y diapositivas). */
export function cardPhotos(e: Evento): string[] {
  const main = e.cover || e.slides[0] || e.gallery[0] || '';
  let secondary: string[];
  if (e.displayPhotos.length) {
    secondary = e.displayPhotos.filter((u) => u && u !== main);
  } else {
    secondary = e.certificate ? [e.certificate] : [...e.gallery];
    secondary.push(...e.slides.filter((u) => u !== main));
  }
  return [main, ...secondary.filter((u) => u && u !== main)].filter(Boolean).slice(0, 3);
}

export function formatEventDate(d: Date | null): string {
  return d ? new Intl.DateTimeFormat('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }).format(d) : 'fecha por confirmar';
}

const monthYear = (d: Date | null, lang: 'es' | 'en' = 'es') =>
  d ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-AR', { year: 'numeric', month: 'long' }).format(d) : lang === 'en' ? 'date to be confirmed' : 'fecha por confirmar';

export interface AboutItem { image_url: string; alt: string; caption: string }

/** Eventos marcados «Aparece en Sobre mí», del más reciente al más antiguo. El epígrafe sale del propio evento. */
export async function getAboutItems(lang: 'es' | 'en' = 'es'): Promise<AboutItem[]> {
  return (await getEventos())
    .filter((e) => e.showInAbout)
    .map((e) => ({
      image_url: photoOf(e),
      alt: e.title,
      caption: [e.title, e.place, monthYear(e.date, lang)].filter(Boolean).join(' · '),
    }));
}

/** Foto del Inicio: la del evento marcado «Foto del Inicio» o, si no hay, la primera foto de Sobre mí. */
export async function getHomePhoto(): Promise<{ url: string; alt: string } | null> {
  const eventos = await getEventos();
  const featured = eventos.find((e) => e.featuredHome && photoOf(e));
  if (featured) return { url: photoOf(featured), alt: featured.title };
  const first = eventos.find((e) => e.showInAbout && photoOf(e));
  return first ? { url: photoOf(first), alt: first.title } : null;
}
