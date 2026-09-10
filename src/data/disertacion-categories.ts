/**
 * Disertacion Categories
 * Categorías canónicas para las disertaciones. El admin las elige desde un
 * dropdown y la base se normaliza a estos nombres exactos.
 */

export const DISERTACION_CATEGORIES = [
  'Conferencia',
  'Keynote',
  'Taller',
  'Workshop',
  'Clase magistral',
  'Defensa',
  'Panel',
  'Webinar',
] as const;

export function normalizeCategories(list: string[]): string[] {
  return [...new Set((list || []).map((c) => c.trim()).filter(Boolean))];
}
