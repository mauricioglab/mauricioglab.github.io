// Casos de estudio del portafolio (tabla `project_cases`). Cada caso cuelga de un proyecto (`projects.slug`).
// Se leen en build; si la base no responde, el build no falla y los proyectos quedan sin caso.
// Archivo IDÉNTICO en Mauricio y Fernanda salvo la ruta de importación de `db`.
import { db } from '../lib/db';
import { SITE_ID } from '../data/site-id';
import { localizeSections, pick, type Lang, type CaseType, type CaseStudy, type RawSection } from '../data/case-model';
export type { Lang, CaseType, CaseStudy, Section, Block } from '../data/case-model';

let cache: Promise<any[]> | null = null;
function loadRaw() {
  cache ??= (async () => {
    try {
      const { data, error } = await db
        .from('project_cases')
        .select('project_slug, type, title, title_en, badge, badge_en, description, description_en, sections')
        .eq('site', SITE_ID).eq('published', true);
      if (error) throw error;
      return data ?? [];
    } catch (e) {
      console.warn('No se pudieron cargar los casos de estudio:', (e as Error).message ?? e);
      return [];
    }
  })();
  return cache;
}

/** Casos publicados del sitio, con todo el texto en el idioma pedido (cae al otro idioma si falta la traducción). */
export async function getCases(lang: Lang = 'es'): Promise<CaseStudy[]> {
  return (await loadRaw()).map((r) => ({
    slug: r.project_slug,
    type: r.type as CaseType,
    title: pick(r.title, r.title_en, lang),
    badge: pick(r.badge, r.badge_en, lang),
    description: pick(r.description, r.description_en, lang),
    sections: localizeSections(r.sections as RawSection[], lang),
  }));
}
