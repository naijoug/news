import assert from 'node:assert/strict';
import test from 'node:test';
import { editionPubDate, renderEditionHtml, renderRss, xmlEscape } from './feed.mjs';

test('publish times are 08:00 and 20:00 in Asia/Shanghai', () => {
  assert.equal(editionPubDate('2026-10-27', 'morning'), 'Tue, 27 Oct 2026 00:00:00 GMT');
  assert.equal(editionPubDate('2026-10-27', 'evening'), 'Tue, 27 Oct 2026 12:00:00 GMT');
});

test('rss escapes titles and keeps html in CDATA', () => {
  const html = renderEditionHtml({
    lead: 'A & B',
    sections: [
      {
        name: '科技与AI',
        stories: [
          {
            title: '标题 <script>',
            summary: '摘要含 ]]> 结尾。',
            sources: [{ name: '来源', url: 'https://example.com/a?x=1&y=2' }],
          },
        ],
      },
    ],
  });
  assert.match(html, /A &amp; B/);
  assert.match(html, /标题 &lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  const rss = renderRss({
    title: '朝夕 & 日览',
    link: 'https://naijoug.github.io/news/',
    selfUrl: 'https://naijoug.github.io/news/rss.xml',
    description: 'digest',
    items: [
      {
        title: '2026年10月27日晚报',
        link: 'https://naijoug.github.io/news/editions/2026-10-27-evening/',
        pubDate: editionPubDate('2026-10-27', 'evening'),
        text: 'plain & text',
        html,
      },
    ],
  });
  assert.match(rss, /<title>朝夕 &amp; 日览<\/title>/);
  assert.match(rss, /plain &amp; text/);
  assert.match(rss, /<!\[CDATA\[/);
  assert.equal(xmlEscape(`a&b<c>"'`), 'a&amp;b&lt;c&gt;&quot;&apos;');
});
