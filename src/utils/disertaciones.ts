import { supabase } from '../lib/supabase';

/**
 * Forma unificada de una disertación (charla dada). Vive en la base de datos
 * de Supabase (source: 'db'). El origen es siempre la BD; no hay markdown local.
 */
export interface Disertacion {
  id: string;
  slug: string;
  title: string;
  eventDate: Date;
  eventName: string;
  author: string;
  categories: string[];
  description: string;
  /** Bullets de "de qué trató la charla", generados por IA y editables. */
  bullets: string[];
  /** URL de la portada (imagen extraída de una slide o subida aparte). */
  coverUrl?: string;
  /** URL de la foto del certificado. */
  certificateUrl?: string;
  /** URLs de las diapositivas (galería). */
  slidesUrls: string[];
  draft: boolean;
}

export async function getDisertaciones(): Promise<Disertacion[]> {
  const items: Disertacion[] = [];

  try {
    const { data, error } = await supabase
      .from('disertaciones')
      .select(
        'id, slug, title, event_date, event_name, author, categories, description, bullets, cover_url, certificate_url, slides_urls, draft'
      )
      .eq('draft', false)
      .order('event_date', { ascending: false });

    if (!error && data) {
      for (const row of data) {
        items.push({
          id: row.id,
          slug: row.slug,
          title: row.title,
          eventDate: new Date(`${row.event_date}T00:00:00`),
          eventName: row.event_name ?? '',
          author: row.author ?? 'Mauricio Gonzalez',
          categories: Array.isArray(row.categories) ? row.categories : [],
          description: row.description ?? '',
          bullets: Array.isArray(row.bullets) ? row.bullets : [],
          coverUrl: row.cover_url ?? undefined,
          certificateUrl: row.certificate_url ?? undefined,
          slidesUrls: Array.isArray(row.slides_urls) ? row.slides_urls : [],
          draft: row.draft ?? false,
        });
      }
    } else if (error) {
      console.warn('No se pudieron cargar las disertaciones de Supabase:', error.message);
    }
  } catch (e) {
    console.warn('No se pudieron cargar las disertaciones de Supabase:', e);
  }

  return items.sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
}

/**
 * Busca una disertación por slug dentro de una lista ya cargada.
 */
export function findDisertacion(list: Disertacion[], slug: string): Disertacion | undefined {
  return list.find((d) => d.slug === slug);
}

export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}
