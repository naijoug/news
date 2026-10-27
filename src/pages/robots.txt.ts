import type { APIRoute } from 'astro';
import { hasRealEdition } from '../lib/editions';
import { absolute } from '../lib/urls';

export const GET: APIRoute = () => {
  const body = hasRealEdition()
    ? `User-agent: *\nAllow: /\n\nSitemap: ${absolute('sitemap.xml')}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
