// Equivalencias de rutas entre español e inglés (solo las páginas fijas tienen versión en inglés).
// Para Blog, Eventos y Zona Lab (solo en español) el botón de idioma lleva al inicio del otro idioma.
export type Lang = 'es' | 'en';

const PAIRS: [string, string][] = [
  ['/', '/en/'],
  ['/es/sobre-mi/', '/en/about/'],
  ['/es/portfolio/', '/en/portfolio/'],
  ['/es/contacto/', '/en/contact/'],
];

const norm = (p: string) => (p.endsWith('/') ? p : p + '/');

/** Ruta equivalente en el otro idioma (o el inicio del otro idioma si no hay equivalente). */
export function altPath(path: string, lang: Lang): string {
  const p = norm(path);
  const found = PAIRS.find(([es, en]) => (lang === 'es' ? es === p : en === p));
  if (found) return lang === 'es' ? found[1] : found[0];
  return lang === 'es' ? '/en/' : '/';
}
