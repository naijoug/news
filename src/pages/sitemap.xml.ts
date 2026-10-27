import type { APIRoute } from 'astro';
import { SECTIONS, editionPath, getEditions, sectionPath } from '../lib/editions';
import { absolute } from '../lib/urls';
import { xmlEscape } from '../../scripts/feed.mjs';

export const GET: APIRoute = () => {
  const real = getEditions().filter((edition) => !edition.sample);
  const paths: string[] = [];
  if (real.length > 0) {
    paths.push('/', 'archive/');
    for (const section of SECTIONS) {
      if (real.some((edition) => (edition.sections[section.id]?.length ?? 0) > 0)) {
        paths.push(sectionPath(section.id));
      }
    }
    for (const edition of real) paths.push(editionPath(edition));
  }
  const urls = paths.map((path) => `<url><loc>${xmlEscape(absolute(path))}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
