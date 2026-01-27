---
import { getBlogPosts, normalizeBaseUrl } from '../../utils/blog';
import rss from '@astrojs/rss';

export async function GET(context: { site: string | undefined }) {
  const posts = await getBlogPosts();
  const site = context.site || 'https://mauricioglab.github.io/mglab-spa-depot/';
  const normalizedBase = normalizeBaseUrl(import.meta.env.BASE_URL);

  return rss({
    title: 'Blog | MG Lab',
    description: 'Artículos y publicaciones',
    site: `${site}${normalizedBase}`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `${site}${normalizedBase}blog/${post.slug}/`,
      categories: post.data.categories,
      author: post.data.author,
      content: post.body,
    })),
    customData: `<language>es</language>`,
  });
}
