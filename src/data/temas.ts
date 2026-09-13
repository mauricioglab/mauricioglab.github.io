/**
 * Temas compartidos entre Blog y Zona Lab
 * Eje de similitud transversal: los posts del blog y los recursos de la
 * Zona Lab se etiquetan con 1-3 de estos temas. Es la única dimensión
 * en la que ambas secciones pueden matchear (sus categorías actuales son
 * ortogonales: el blog usa temas, la lab usa formatos).
 *
 * Esta lista es canónica: la IA solo puede usar estos nombres exactos y
 * se normaliza a estas formas (ver normalizeTemas).
 */

export const TEMAS = [
  'IA',
  'Tecnología',
  'Ciencia',
  'Productividad',
  'Filosofía',
  'Libros',
  'Estudio',
  'Salud',
  'Sociedad',
  'Creatividad',
] as const;

/**
 * Alias que se normalizan a un tema canónico (ej. "inteligencia artificial" → "IA").
 */
export const TEMA_ALIASES: Record<string, string> = {
  'inteligencia artificial': 'IA',
  'ia': 'IA',
  'machine learning': 'IA',
  'ciencia de datos': 'Ciencia',
};

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza un tema a la forma canónica (sin importar mayúsculas, acentos
 * ni alias). Si no matchea nada, devuelve el nombre tal cual viene.
 */
export function normalizeTema(name: string): string {
  const value = (name || '').trim();
  const key = stripAccents(value.toLowerCase());
  if (!key) return '';

  const exact = TEMAS.find((t) => stripAccents(t.toLowerCase()) === key);
  if (exact) return exact;

  const alias = Object.entries(TEMA_ALIASES).find(
    ([aliasKey]) => stripAccents(aliasKey.toLowerCase()) === key
  );
  if (alias) return alias[1];

  return value;
}

/**
 * Normaliza una lista de temas: aplica normalizeTema y elimina duplicados.
 */
export function normalizeTemas(list: string[]): string[] {
  return [...new Set((list || []).map(normalizeTema).filter(Boolean))];
}