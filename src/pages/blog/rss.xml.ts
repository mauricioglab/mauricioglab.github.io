import { getBlogPosts, normalizeBaseUrl } from '../../utils/blog';
import rss from '@astrojs/rss';
import { SITE_CONFIG } from '../../data/config';

export async function GET(context: { site: string | undefined }) {
  const posts = await getBlogPosts();
  const site = context.site || 'https://mauricioglab.github.io/';
  const normalizedBase = normalizeBaseUrl(import.meta.env.BASE_URL);

  return rss({
    title: `${SITE_CONFIG.blogName} | ${SITE_CONFIG.author}`,
    description: 'Artículos y publicaciones',
    site: `${site}${normalizedBase}`,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: post.pubDate,
      link: `${site}${normalizedBase}blog/${post.slug}/`,
      categories: post.categories,
      author: post.author,
      content: post.body,
    })),
    customData: `<language>es</language>`,
  });
}
