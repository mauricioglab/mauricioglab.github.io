export type Lang = 'es' | 'en';

export interface NavLink {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  children?: NavLink[];
}

export interface SiteNav {
  brand: { name: string; icon?: string; href: string };
  items: NavLink[];
  contact: { label: string; kind: 'button' | 'link' };
  langSwitch: boolean;
}

// Fuente única de la marca y del menú del sitio.
export function getSiteNav(_lang: Lang = 'es'): SiteNav {
  return {
    brand: { name: 'Mauricio González', href: '/' },
    items: [
      { id: 'sobre-mi', label: 'Sobre mí', href: '/es/sobre-mi/' },
      { id: 'portfolio', label: 'Portafolio', href: '/es/portfolio/' },
      { id: 'disertaciones', label: 'Disertaciones', href: '/es/disertaciones/' },
      { id: 'blog', label: 'Blog', href: '/blog/' },
    ],
    contact: { label: 'Contáctame', kind: 'link' },
    langSwitch: false,
  };
}
