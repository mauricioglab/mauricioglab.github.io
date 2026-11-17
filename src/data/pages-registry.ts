/**
 * Pages Registry
 * Registro centralizado de todas las páginas del sitio
 * Controla qué páginas aparecen en cada índice
 */

export type PageCategory = 'public' | 'landing' | 'project' | 'tool';

export interface PageEntry {
  id: string;
  name: string;
  url: string;
  category: PageCategory;
  icon?: string;
  /** false = dormida, no aparece en admin */
  active?: boolean;
}

// Base URL helper
const getBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) {
    const base = import.meta.env.BASE_URL;
    return base.endsWith('/') ? base : `${base}/`;
  }
  return '/';
};

export const pagesRegistry: PageEntry[] = [
  // =====================
  // PÚBLICAS (aparecen en index y main)
  // =====================
  { id: 'blog', name: 'Parece que fue ayer (Blog)', url: '/blog/', category: 'public', icon: '📝' },
  { id: 'disertaciones', name: 'Disertaciones', url: '/es/disertaciones/', category: 'public', icon: '🎤' },
  { id: 'recursos', name: 'Zona Lab', url: '/zona-lab/', category: 'public', icon: '📚' },
  { id: 'teleprompter', name: 'Teleprompter (Zona Lab)', url: '/lab/teleprompter/', category: 'tool', icon: '🤖' },
  { id: 'curiosidades', name: 'Curiosidades', url: '/curiosidades/', category: 'public', icon: '🧉' },

  // =====================
  // LANDINGS (solo en admin, solo español)
  // =====================
  { id: 'portfolio', name: 'Portfolio', url: '/es/portfolio/', category: 'landing', icon: '📁', active: true },
  { id: 'servicios', name: 'Servicios', url: 'https://velocitylab.com.ar/es/servicios/', category: 'landing', icon: '🤝', active: true },
  { id: 'velocity', name: 'Velocity', url: 'https://velocitylab.com.ar/es/velocity/', category: 'landing', icon: '🤝', active: true },
  { id: 'cv', name: 'CV', url: '/es/cv/', category: 'landing', icon: '📄', active: false },

  // =====================
  // HERRAMIENTAS (solo en admin)
  // =====================
  { id: 'admin-gestion', name: 'Admin Gestión', url: '/admin/gestion/', category: 'tool', icon: '🗂️' },
];

// =====================
// HELPERS
// =====================

/**
 * Páginas públicas (para index y main)
 */
export const getPublicPages = (): PageEntry[] => 
  pagesRegistry.filter(p => p.category === 'public');

/**
 * Todas las páginas (para admin). Excluye las dormidas (active: false).
 */
export const getAllPages = (): PageEntry[] => 
  pagesRegistry.filter(p => p.active !== false);

/**
 * Páginas por categoría. Excluye las dormidas.
 */
export const getPagesByCategory = (category: PageCategory): PageEntry[] => 
  pagesRegistry.filter(p => p.category === category && p.active !== false);

/**
 * Obtener páginas con URLs absolutas (usando BASE_URL)
 */
export const getPagesWithBaseUrl = (pages: PageEntry[]): PageEntry[] => {
  const base = getBaseUrl();
  return pages.map(p => ({
    ...p,
    url: p.url.startsWith('/') ? `${base}${p.url.slice(1)}` : p.url
  }));
};

/**
 * Indica si una página está activa (no dormida)
 */
export const isPageActive = (id: string): boolean => {
  const entry = pagesRegistry.find(p => p.id === id);
  return entry?.active !== false;
};

/**
 * Categorías disponibles con labels
 */
export const categoryLabels: Record<PageCategory, string> = {
  public: 'Páginas Públicas',
  landing: 'Landings',
  project: 'Case Studies',
  tool: 'Herramientas',
};
