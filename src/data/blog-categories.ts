/**
 * Blog Categories
 * Lista canónica de categorías del blog. Todas las categorías deben salir de
 * acá: el admin las elige desde un dropdown, la IA solo puede usar estas, y la
 * base de datos se normaliza a estos nombres exactos.
 */

export const BLOG_CATEGORIES = [
  'Inteligencia Artificial',
  'Tecnología',
  'Productividad',
  'Filosofía',
  'Mitología',
  'Libros',
  'Reflexiones',
] as const;

/**
 * Alias que se normalizan a una categoría canónica (por ej. "ia" → "Inteligencia Artificial").
 */
export const CATEGORY_ALIASES: Record<string, string> = {
  'ia': 'Inteligencia Artificial',
  'inteligencia artificial': 'Inteligencia Artificial',
};

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza un nombre de categoría a la forma canónica (sin importar mayúsculas,
 * acentos ni alias). Si no matchea nada, devuelve el nombre tal cual viene.
 */
export function normalizeCategory(name: string): string {
  const value = (name || '').trim();
  const key = stripAccents(value.toLowerCase());
  if (!key) return '';

  const exact = BLOG_CATEGORIES.find((c) => stripAccents(c.toLowerCase()) === key);
  if (exact) return exact;

  const alias = Object.entries(CATEGORY_ALIASES).find(
    ([aliasKey]) => stripAccents(aliasKey.toLowerCase()) === key
  );
  if (alias) return alias[1];

  return value;
}

/**
 * Normaliza una lista de categorías: aplica normalizeCategory y elimina duplicados.
 */
export function normalizeCategories(list: string[]): string[] {
  return [...new Set((list || []).map(normalizeCategory).filter(Boolean))];
}