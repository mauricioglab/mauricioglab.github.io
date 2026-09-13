import { getBlogPosts, type BlogPost } from './blog';
import { getRecursos, type Recurso } from './recursos';
import { normalizeTemas } from '../data/temas';

/**
 * Puente de similitud Blog <-> Zona Lab.
 *
 * El blog y la lab matchean por TEMAS compartidos (topicos), no por categorías
 * (son ortogonales: el blog usa temas, la lab usa formatos). Esto se calcula en
 * build-time porque todo el sitio es prerender.
 *
 * Si un ítem no tiene topicos (contenido viejo) o no matchea a nadie, se cae a
 * los más recientes del otro lado: el banner siempre tiene algo que mostrar.
 */

function resolveTopicos(topicos: string[] | undefined, categories: string[]): string[] {
  const fromTopicos = normalizeTemas(topicos || []);
  if (fromTopicos.length > 0) return fromTopicos;

  // Fallback: derivar temas de las categorías (ej. "Inteligencia Artificial" -> "IA").
  const fromCategories = normalizeTemas(categories);
  if (fromCategories.length > 0) return fromCategories;

  return [];
}

export async function getRelacionadosRecursos(
  post: BlogPost,
  limit = 3
): Promise<Recurso[]> {
  const recursos = await getRecursos();
  const temasPost = resolveTopicos(post.topicos, post.categories);

  if (temasPost.length === 0) {
    return recursos.slice(0, limit);
  }

  const scored = recursos.map((r) => {
    const temasRecurso = resolveTopicos(r.topicos, r.categories);
    const overlap = temasRecurso.filter((t) => temasPost.includes(t)).length;
    return { r, score: overlap };
  });

  const matched = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.r.createdAt.getTime() - a.r.createdAt.getTime())
    .map((s) => s.r);

  if (matched.length >= limit) return matched.slice(0, limit);

  const matchedIds = new Set(matched.map((r) => r.id));
  const fill = scored
    .filter((s) => !matchedIds.has(s.r.id))
    .sort((a, b) => b.r.createdAt.getTime() - a.r.createdAt.getTime())
    .map((s) => s.r);

  return [...matched, ...fill].slice(0, limit);
}

export async function getRelacionadosPosts(
  recurso: Recurso,
  limit = 3
): Promise<BlogPost[]> {
  const posts = await getBlogPosts();
  const temasRecurso = resolveTopicos(recurso.topicos, recurso.categories);

  if (temasRecurso.length === 0) {
    return posts.slice(0, limit);
  }

  const scored = posts.map((p) => {
    const temasPost = resolveTopicos(p.topicos, p.categories);
    const overlap = temasPost.filter((t) => temasRecurso.includes(t)).length;
    return { p, score: overlap };
  });

  const matched = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.p.pubDate.getTime() - a.p.pubDate.getTime())
    .map((s) => s.p);

  if (matched.length >= limit) return matched.slice(0, limit);

  const matchedIds = new Set(matched.map((p) => p.slug));
  const fill = scored
    .filter((s) => !matchedIds.has(s.p.slug))
    .sort((a, b) => b.p.pubDate.getTime() - a.p.pubDate.getTime())
    .map((s) => s.p);

  return [...matched, ...fill].slice(0, limit);
}

/** Últimos recursos, excluyendo los que ya se muestran en el banner contextual. */
export async function getUltimosRecursos(
  limit = 3,
  excluir: Recurso[] = []
): Promise<Recurso[]> {
  const recursos = await getRecursos();
  const excluirIds = new Set(excluir.map((r) => r.id));
  return recursos.filter((r) => !excluirIds.has(r.id)).slice(0, limit);
}

/** Últimos posts, excluyendo los que ya se muestran en el banner contextual. */
export async function getUltimosPosts(
  limit = 3,
  excluir: BlogPost[] = []
): Promise<BlogPost[]> {
  const posts = await getBlogPosts();
  const excluirSlugs = new Set(excluir.map((p) => p.slug));
  return posts.filter((p) => !excluirSlugs.has(p.slug)).slice(0, limit);
}