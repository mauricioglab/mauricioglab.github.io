import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      'User-agent: *',
      'Disallow: /admin/',
      'Disallow: /nutricion/',
      'Disallow: /movimiento/',
      'Disallow: /vsagenda/',
      'Disallow: /workspace-mapper/',
      'Disallow: /es/cv/',
      'Disallow: /en/cv/',
      '',
      `Sitemap: ${new URL('sitemap-index.xml', site)}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
