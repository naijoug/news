import type { APIRoute } from 'astro';
import { hasRealDay } from '../lib/editions';
import { absolute } from '../lib/urls';

export const GET: APIRoute = () => {
  const body = hasRealDay()
    ? `User-agent: *\nAllow: /\n\nSitemap: ${absolute('sitemap.xml')}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
