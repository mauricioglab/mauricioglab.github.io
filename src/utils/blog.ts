import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export async function getBlogPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog', ({ data }) => {
    return !data.draft;
  });
  
  return posts.sort((a, b) => 
    b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );
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
