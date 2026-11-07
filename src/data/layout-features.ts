/**
 * Layout Features Configuration
 * Define qué elementos aparecen en cada tipo de página.
 * showMainHeader/showMainFooter se refieren al shell del dominio (SiteHeader/SiteFooter).
 */

export type LayoutType = 'public' | 'landing' | 'admin' | 'tool' | 'index' | 'private';

export interface LayoutFeatures {
  showMainHeader: boolean;    // SiteHeader del dominio
  showMainFooter: boolean;    // SiteFooter del dominio (incluye el modal de contacto)
  showMateGame: boolean;      // Juego del mate (botón + modal); nunca en el dominio empresa
}

const shell: LayoutFeatures = { showMainHeader: true, showMainFooter: true, showMateGame: true };
const bare: LayoutFeatures = { showMainHeader: false, showMainFooter: false, showMateGame: false };

export const layoutFeatures: Record<LayoutType, LayoutFeatures> = {
  public: shell,
  landing: shell,
  index: shell,
  tool: shell,
  // Panel de login del admin: sin navegación pública.
  admin: { ...bare, showMateGame: true },
  // Herramientas privadas: sin shell público (llevan guard de sesión + barra de dueño).
  private: bare,
};

export function getLayoutFeatures(type: LayoutType): LayoutFeatures {
  return layoutFeatures[type];
}
