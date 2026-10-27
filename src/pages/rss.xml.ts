import type { APIRoute } from 'astro';
import { SECTIONS, editionPath, getEditions } from '../lib/editions';
import { absolute } from '../lib/urls';
import { editionPubDate, renderEditionHtml, renderEditionText, renderRss } from '../../scripts/feed.mjs';

export const GET: APIRoute = () => {
  const items = getEditions()
    .filter((edition) => !edition.sample)
    .map((edition) => {
      const model = {
        lead: edition.lead,
        sections: SECTIONS.map((section) => ({
          name: section.name,
          stories: edition.sections[section.id] ?? [],
        })).filter((section) => section.stories.length > 0),
      };
      return {
        title: `${edition.dateLabel}${edition.editionLabel}`,
        link: absolute(editionPath(edition)),
        pubDate: editionPubDate(edition.date, edition.edition),
        text: renderEditionText(model),
        html: renderEditionHtml(model),
      };
    });

  const body = renderRss({
    title: '朝夕',
    link: absolute('/'),
    selfUrl: absolute('rss.xml'),
    description: '每日新闻简报，分早报与晚报。涵盖科技与AI、国际与政治、商业与市场、中国。',
    items,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
