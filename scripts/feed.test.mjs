import assert from 'node:assert/strict';
import test from 'node:test';
import { renderRss, renderStoryHtml, storyPubDate, xmlEscape } from './feed.mjs';

test('publish times are 08:00 and 16:00 in Asia/Shanghai', () => {
  assert.equal(storyPubDate('2026-10-27', 'am'), 'Tue, 27 Oct 2026 00:00:00 GMT');
  assert.equal(storyPubDate('2026-10-27', 'pm'), 'Tue, 27 Oct 2026 08:00:00 GMT');
});

test('rss escapes titles and keeps html in CDATA', () => {
  const html = renderStoryHtml({
    title: { zh: '标题 <script>' },
    summary: { zh: '摘要含 ]]> 结尾。' },
    sources: [{ name: '来源', url: 'https://example.com/a?x=1&y=2' }],
  });
  assert.match(html, /标题 &lt;script&gt;/);
  assert.match(html, /摘要含 \]\]&gt; 结尾。/);
  assert.doesNotMatch(html, /<script>/);
  const rss = renderRss({
    title: '朝夕 & 日览',
    link: 'https://naijoug.github.io/news/',
    selfUrl: 'https://naijoug.github.io/news/rss.xml',
    description: 'digest',
    items: [
      {
        title: '示例标题',
        link: 'https://naijoug.github.io/news/stories/2026-10-27/sample/',
        pubDate: storyPubDate('2026-10-27', 'pm'),
        text: 'plain & text',
        html: `${html}<p>]]></p>`,
      },
    ],
  });
  assert.match(rss, /<title>朝夕 &amp; 日览<\/title>/);
  assert.match(rss, /plain &amp; text/);
  assert.match(rss, /<!\[CDATA\[/);
  assert.match(rss, /\]\]\]\]><!\[CDATA\[>/);
  assert.equal(xmlEscape(`a&b<c>"'`), 'a&amp;b&lt;c&gt;&quot;&apos;');
});
