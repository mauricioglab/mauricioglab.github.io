import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { supabase } from '../lib/supabase';

/**
 * Forma unificada de un post de blog: puede venir de un archivo markdown local
 * (source: 'local') o de la base de datos de Supabase (source: 'db').
 */
export interface BlogPost {
  slug: string;
  title: string;
  pubDate: Date;
  author: string;
  categories: string[];
  description: string;
  body: string;
  /** URL de la tapa cuando el post vive en la BD (Storage de Supabase). */
  coverUrl?: string;
  /** Imagen local (astro:assets) cuando el post es markdown legacy. */
  localImage?: CollectionEntry<'blog'>['data']['image'];
  source: 'local' | 'db';
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];

  // Posts locales (markdown legacy en src/content/blog)
  try {
    const localPosts = await getCollection('blog', ({ data }) => !data.draft);
    for (const post of localPosts) {
      posts.push({
        slug: post.slug,
        title: post.data.title,
        pubDate: post.data.pubDate,
        author: post.data.author,
        categories: post.data.categories,
        description: post.data.description,
        body: post.body,
        localImage: post.data.image,
        source: 'local',
      });
    }
  } catch (e) {
    console.warn('No se pudieron cargar los posts locales:', e);
  }

  // Posts desde Supabase (solo publicados)
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select(
        'slug, title, pub_date, author, categories, description, body_markdown, cover_url'
      )
      .eq('draft', false);

    if (!error && data) {
      for (const row of data) {
        posts.push({
          slug: row.slug,
          title: row.title,
          pubDate: new Date(`${row.pub_date}T00:00:00`),
          author: row.author,
          categories: Array.isArray(row.categories) ? row.categories : [],
          description: row.description ?? '',
          body: row.body_markdown ?? '',
          coverUrl: row.cover_url ?? undefined,
          source: 'db',
        });
      }
    } else if (error) {
      console.warn('No se pudieron cargar los posts de Supabase:', error.message);
    }
  } catch (e) {
    console.warn('No se pudieron cargar los posts de Supabase:', e);
  }

  return posts.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Calculates estimated reading time in minutes
 * @param content - The content to analyze
 * @returns Reading time in minutes (minimum 1)
 */
export function calculateReadingTime(content: string): number {
  if (!content || content.trim().length === 0) return 1;

  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Normalizes baseUrl to always end with a slash
 */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}