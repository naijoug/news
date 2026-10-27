import type { APIRoute } from 'astro';
import { getDays, storyPath, type Story } from '../lib/editions';
import { absolute } from '../lib/urls';
import { renderRss, renderStoryHtml, renderStoryText, storyPubDate } from '../../scripts/feed.mjs';

function preferZh(story: Story): string {
  return story.title.zh || story.title.en || story.id;
}

export const GET: APIRoute = () => {
  const items = getDays()
    .filter((day) => !day.sample)
    .flatMap((day) => {
      const pm = day.stories.filter((story) => story.part === 'pm');
      const am = day.stories.filter((story) => story.part === 'am');
      return [...pm, ...am].map((story) => ({
        title: preferZh(story),
        link: absolute(storyPath(story)),
        pubDate: storyPubDate(day.date, story.part),
        text: renderStoryText(story),
        html: renderStoryHtml(story),
      }));
    });

  const body = renderRss({
    title: '朝夕',
    link: absolute('/'),
    selfUrl: absolute('rss.xml'),
    description: '每日一刊。上午与下午在同一天里。栏目为科技与AI、国际与政治、商业与市场、中国。',
    items,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
