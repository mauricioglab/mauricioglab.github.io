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
  { id: 'blog', name: 'Blog', url: '/blog/', category: 'public', icon: '📝' },
  { id: 'prompt', name: 'Prompts', url: '/prompt/', category: 'public', icon: '🤖' },
  { id: 'videos', name: 'Videos', url: '/videos/', category: 'public', icon: '🎬' },
  { id: 'extensions', name: 'Extensiones', url: '/extensions/', category: 'public', icon: '🧩' },
  { id: 'urls', name: 'URLs Útiles', url: '/urls/', category: 'public', icon: '🔗' },
  { id: 'main', name: 'Main (Retro)', url: '/main/', category: 'public', icon: '🏠' },

  // =====================
  // LANDINGS (solo en admin, solo español)
  // =====================
  { id: 'landing-developer', name: 'Landing Developer', url: '/es/landing/developer/', category: 'landing', icon: '💻' },
  { id: 'landing-analista', name: 'Landing Analista', url: '/es/landing/analista/', category: 'landing', icon: '📊', active: false },
  { id: 'landing-ia', name: 'Landing IA Engineer', url: '/es/landing/ia-engineer/', category: 'landing', icon: '🤖', active: false },
  { id: 'landing-freelance', name: 'Landing Freelance', url: '/es/landing/freelance/', category: 'landing', icon: '🚀' },
  { id: 'landing-speaker', name: 'Landing Speaker', url: '/es/landing/speaker/', category: 'landing', icon: '🎤' },
  { id: 'landing-docente', name: 'Landing Docente', url: '/es/landing/docente/', category: 'landing', icon: '🎓' },

  // =====================
  // HERRAMIENTAS (solo en admin)
  // =====================
  { id: 'calculadora', name: 'Calculadora', url: '/calculadora/', category: 'tool', icon: '🧮' },

  // =====================
  // CASE STUDIES (solo en admin)
  // =====================
  { id: 'project-ecommerce', name: 'Case: E-commerce', url: '/es/proyectos/ecommerce-platform/', category: 'project', icon: '🛒' },
  { id: 'project-microservicios', name: 'Case: Microservicios', url: '/es/proyectos/microservicios-api/', category: 'project', icon: '🔧' },
  { id: 'project-taskmanager', name: 'Case: Task Manager DDD', url: '/es/proyectos/task-manager-ddd/', category: 'project', icon: '✅' },
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
