/**
 * Layout Features Configuration
 * Define qué elementos aparecen en cada tipo de página
 */

export type LayoutType = 'public' | 'blog' | 'landing' | 'caseStudy' | 'admin' | 'tool' | 'index';

export interface LayoutFeatures {
  showMainHeader: boolean;    // Header "by MG LAB" con link al index
  showMainFooter: boolean;    // Footer principal de BaseTailwind
  showMateGame: boolean;      // Juego del mate (botón + modal)
  showBackToIndex: boolean;   // Link "Volver al inicio" (para layouts con header propio)
}

/**
 * Configuración de features por tipo de layout
 */
export const layoutFeatures: Record<LayoutType, LayoutFeatures> = {
  // Páginas públicas: Header, Footer, MateGame
  public: {
    showMainHeader: true,
    showMainFooter: true,
    showMateGame: true,
    showBackToIndex: false,
  },
  
  // Blog: Link sutil al index, footer propio, sin MateGame
  blog: {
    showMainHeader: false,
    showMainFooter: false,
    showMateGame: false,
    showBackToIndex: true,  // Link en el header del blog
  },
  
  // Landings: Header/Footer propios, SÍ MateGame
  landing: {
    showMainHeader: false,
    showMainFooter: false,
    showMateGame: true,
    showBackToIndex: false,
  },
  
  // Case Studies: Header/Footer propios, SÍ MateGame
  caseStudy: {
    showMainHeader: false,
    showMainFooter: false,
    showMateGame: true,
    showBackToIndex: false,
  },
  
  // Admin: Sin header, con footer, con MateGame
  admin: {
    showMainHeader: false,
    showMainFooter: true,
    showMateGame: true,
    showBackToIndex: false,
  },
  
  // Tools (calculadora): Sin header, con footer, con MateGame
  tool: {
    showMainHeader: false,
    showMainFooter: true,
    showMateGame: true,
    showBackToIndex: false,
  },
  
  // Index principal: Con header, con footer, con MateGame
  index: {
    showMainHeader: true,
    showMainFooter: true,
    showMateGame: true,
    showBackToIndex: false,
  },
};

/**
 * Helper para obtener features de un layout
 */
export function getLayoutFeatures(type: LayoutType): LayoutFeatures {
  return layoutFeatures[type];
}
