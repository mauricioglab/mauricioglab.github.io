/**
 * Zona Lab Categories
 * Categorías canónicas para los recursos. El admin las elige desde un dropdown
 * y la IA solo puede usar estas (ver recurso-generate).
 */

export const RECURSOS_CATEGORIES = [
  'Video',
  'Artículo',
  'Reporte',
  'Tutorial',
  'Curso',
  'Libro',
  'Podcast',
] as const;

export function normalizeCategories(list: string[]): string[] {
  return [...new Set((list || []).map((c) => c.trim()).filter(Boolean))];
}