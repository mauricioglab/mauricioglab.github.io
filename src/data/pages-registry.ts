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
  { id: 'noticias', name: 'Noticias IA', url: '/noticias/', category: 'public', icon: '📰' },
  { id: 'main', name: 'Main (Retro)', url: '/main/', category: 'public', icon: '🏠' },
  { id: 'seguimiento', name: 'Panel de Seguimiento de Alumnos', url: '/seguimiento/', category: 'public', icon: '📊' },
  { id: 'floppy', name: 'Disquete 3½', url: '/floppy/', category: 'public', icon: '💾' },

  // =====================
  // LANDINGS (solo en admin, solo español)
  // =====================
  { id: 'portfolio', name: 'Portfolio', url: '/es/portfolio/', category: 'landing', icon: '📁', active: true },
  { id: 'servicios', name: 'Servicios', url: '/es/servicios/', category: 'landing', icon: '🤝', active: true },
  { id: 'cv', name: 'CV', url: '/es/cv/', category: 'landing', icon: '📄' },

  // =====================
  // HERRAMIENTAS (solo en admin)
  // =====================
  { id: 'calculadora', name: 'Calculadora', url: '/calculadora/', category: 'tool', icon: '🧮' },
  { id: 'nutricion', name: 'Nutrición', url: '/nutricion/', category: 'tool', icon: '🥗' },
  { id: 'entrenamiento', name: 'Entrenamiento', url: '/entrenamiento/', category: 'tool', icon: '🏋️' },
  { id: 'movilidad', name: 'Movilidad', url: '/movilidad/', category: 'tool', icon: '🧘' },
  { id: 'pausas-activas', name: 'Pausas Activas', url: '/pausas-activas/', category: 'tool', icon: '☀️' },
  { id: 'workspace-mapper', name: 'Workspace Mapper', url: '/workspace-mapper/', category: 'tool', icon: '🖥️' },
  { id: 'vsagenda', name: 'vsagenda', url: '/vsagenda/', category: 'tool', icon: '🗓️' },
  { id: 'admin-blog', name: 'Admin Blog', url: '/admin/blog/', category: 'tool', icon: '📝' },

  // =====================
  // CASE STUDIES (solo en admin)
  // =====================
  { id: 'project-validacion-biometrica', name: 'Case: Validación Biométrica', url: '/es/proyectos/validacion-biometrica/', category: 'project', icon: '🪪' },
  { id: 'project-billetera-virtual', name: 'Case: Billetera Virtual', url: '/es/proyectos/billetera-virtual/', category: 'project', icon: '💳' },
  { id: 'project-monitoreo-agricola', name: 'Case: Monitoreo Agrícola', url: '/es/proyectos/monitoreo-agricola/', category: 'project', icon: '🌱' },
  { id: 'project-auditorias-datos', name: 'Case: Auditorías con Datos', url: '/es/proyectos/auditorias-datos/', category: 'project', icon: '📊' },
  { id: 'project-coca-cola-embonor', name: 'Case: Coca-Cola Embonor', url: '/es/proyectos/coca-cola-embonor/', category: 'project', icon: '🥤' },
  { id: 'project-mundial-2026', name: 'Case: Mundial 2026', url: '/es/proyectos/mundial-2026/', category: 'project', icon: '⚽' },
  { id: 'project-abandono-estudiantil', name: 'Case: Abandono Estudiantil', url: '/es/proyectos/abandono-estudiantil/', category: 'project', icon: '🎓' },
  { id: 'project-caso-arquitectura', name: 'Case: Analista de Sistemas (ArqStudio)', url: '/caso-arquitectura/', category: 'project', icon: '📐' },
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
