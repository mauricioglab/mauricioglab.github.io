import { supabase } from '../lib/supabase';

/**
 * Forma unificada de un recurso de la Zona Lab. Vive en Supabase.
 */
export interface Recurso {
  id: string;
  slug: string;
  title: string;
  sourceUrl: string;
  sourceType: 'youtube' | 'web';
  sourceTitle: string;
  videoId?: string;
  description: string;
  body: string;
  categories: string[];
  coverUrl?: string;
  createdAt: Date;
  draft: boolean;
}

export async function getRecursos(): Promise<Recurso[]> {
  const items: Recurso[] = [];

  try {
    const { data, error } = await supabase
      .from('recursos')
      .select(
        'id, slug, title, source_url, source_type, source_title, video_id, description, body_markdown, categories, cover_url, created_at, draft'
      )
      .eq('draft', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      for (const row of data) {
        items.push({
          id: row.id,
          slug: row.slug,
          title: row.title,
          sourceUrl: row.source_url ?? '',
          sourceType: row.source_type === 'youtube' ? 'youtube' : 'web',
          sourceTitle: row.source_title ?? '',
          videoId: row.video_id ?? undefined,
          description: row.description ?? '',
          body: row.body_markdown ?? '',
          categories: Array.isArray(row.categories) ? row.categories : [],
          coverUrl: row.cover_url ?? undefined,
          createdAt: new Date(row.created_at),
          draft: row.draft ?? false,
        });
      }
    } else if (error) {
      console.warn('No se pudieron cargar los recursos de Supabase:', error.message);
    }
  } catch (e) {
    console.warn('No se pudieron cargar los recursos de Supabase:', e);
  }

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function formatFecha(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}