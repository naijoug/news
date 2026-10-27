import type { APIRoute } from 'astro';
import { SECTIONS, dayPath, getDays, sectionPath, storyPath } from '../lib/editions';
import { absolute } from '../lib/urls';
import { xmlEscape } from '../../scripts/feed.mjs';

export const GET: APIRoute = () => {
  const real = getDays().filter((day) => !day.sample);
  const paths: string[] = [];
  if (real.length > 0) {
    paths.push('/', 'archive/');
    for (const section of SECTIONS) {
      if (real.some((day) => day.stories.some((story) => story.sectionId === section.id))) {
        paths.push(sectionPath(section.id));
      }
    }
    for (const day of real) {
      paths.push(dayPath(day));
      for (const story of day.stories) paths.push(storyPath(story));
    }
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
