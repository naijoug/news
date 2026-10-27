export function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/** Nominal publish time: 08:00 Asia/Shanghai for am, 16:00 for pm. */
export function storyPubDate(date, part) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Bad story date: ${date}`);
  if (part !== 'am' && part !== 'pm') throw new Error(`Bad story part: ${part}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = part === 'pm' ? 8 : 0;
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0)).toUTCString();
}

function cdata(html) {
  return html.replaceAll(']]>', ']]]]><![CDATA[>');
}

function preferZh(text) {
  if (!text || typeof text !== 'object') return '';
  return text.zh || text.en || '';
}

export function renderStoryText(story) {
  return `${preferZh(story.title)}\n${preferZh(story.summary)}`;
}

export function renderStoryHtml(story) {
  const sources = (story.sources || [])
    .map((source) => `<a href="${xmlEscape(source.url)}">${xmlEscape(source.name)}</a>`)
    .join(' · ');
  return `<h3>${xmlEscape(preferZh(story.title))}</h3><p>${xmlEscape(preferZh(story.summary))}</p><p>来源：${sources}</p>`;
}

export function renderRss({ title, link, selfUrl, description, language = 'zh-Hans', items }) {
  const lastBuild = items[0] ? `<lastBuildDate>${xmlEscape(items[0].pubDate)}</lastBuildDate>\n` : '';
  const body = items
    .map(
      (item) => `<item>
<title>${xmlEscape(item.title)}</title>
<link>${xmlEscape(item.link)}</link>
<guid isPermaLink="true">${xmlEscape(item.link)}</guid>
<pubDate>${xmlEscape(item.pubDate)}</pubDate>
<description>${xmlEscape(item.text)}</description>
<content:encoded><![CDATA[${cdata(item.html)}]]></content:encoded>
</item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
<title>${xmlEscape(title)}</title>
<link>${xmlEscape(link)}</link>
<description>${xmlEscape(description)}</description>
<language>${xmlEscape(language)}</language>
${lastBuild}<atom:link href="${xmlEscape(selfUrl)}" rel="self" type="application/rss+xml"/>
${body}
</channel>
</rss>
`;
}
