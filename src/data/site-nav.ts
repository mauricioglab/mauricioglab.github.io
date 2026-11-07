import { isCompanyBuild, PERSONAL_ORIGIN, COMPANY_ORIGIN } from './site-target';

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

const t = (lang: Lang, es: string, en: string) => (lang === 'es' ? es : en);

// Fuente única del header/menú de cada dominio. Los ítems y botones son los mismos
// en todas las páginas del dominio; solo cambia cuál está marcado como actual.
export function getSiteNav(lang: Lang = 'es'): SiteNav {
  if (isCompanyBuild) {
    return {
      brand: { name: 'VeloCityLab', icon: '/logo-vl-icon.svg', href: '/' },
      items: [
        { id: 'servicios', label: t(lang, 'Servicios', 'Services'), href: `/${lang}/servicios/` },
        { id: 'velocity', label: t(lang, 'Quiénes somos', 'About us'), href: `/${lang}/velocity/` },
        { id: 'portfolio', label: 'Portfolio', href: `/${lang}/portfolio/` },
        { id: 'disertaciones', label: t(lang, 'Disertaciones', 'Talks'), href: `/${lang}/disertaciones/` },
        { id: 'personal', label: 'Mauricio González', href: `${PERSONAL_ORIGIN}/`, external: true },
      ],
      contact: { label: t(lang, 'Conversemos', "Let's talk"), kind: 'button' },
      langSwitch: true,
    };
  }

  return {
    brand: { name: 'Mauricio González', href: '/' },
    items: [
      { id: 'portfolio', label: 'Portfolio', href: '/es/portfolio/' },
      { id: 'disertaciones', label: 'Disertaciones', href: '/es/disertaciones/' },
      { id: 'blog', label: 'Blog', href: '/blog/' },
      { id: 'zona-lab', label: 'Zona Lab', href: '/zona-lab/' },
      {
        id: 'herramientas',
        label: 'Herramientas',
        href: '#',
        children: [
          { id: 'prompt', label: 'Teleprompter', href: '/prompt/' },
          { id: 'videos', label: 'Video Organizer', href: '/videos/' },
          { id: 'extensions', label: 'Extensiones', href: '/extensions/' },
          { id: 'calculadora', label: 'Calculadora 3D', href: '/calculadora/' },
          { id: 'urls', label: 'URLs útiles', href: '/urls/' },
        ],
      },
      { id: 'estudio', label: 'VeloCityLab', href: `${COMPANY_ORIGIN}/`, external: true },
    ],
    contact: { label: 'Contacto', kind: 'link' },
    langSwitch: false,
  };
}
