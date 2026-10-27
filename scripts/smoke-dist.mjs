import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareDaysDesc } from './edition-order.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(repoRoot, 'dist');
const failures = [];
const SECTION_IDS = ['tech', 'world', 'business', 'china'];

function fail(message) {
  failures.push(message);
}

function read(rel) {
  const full = path.join(dist, rel);
  if (!fs.existsSync(full)) {
    fail(`missing dist/${rel}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}

function walkContent(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkContent(full, out);
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function escapeText(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function partHasStories(block) {
  if (!block) return false;
  return SECTION_IDS.some((id) => (block[id] || []).length > 0);
}

const required = [
  'index.html',
  'archive/index.html',
  'sections/tech/index.html',
  'sections/world/index.html',
  'sections/business/index.html',
  'sections/china/index.html',
  'rss.xml',
  'sitemap.xml',
  'robots.txt',
  '404.html',
  'favicon.svg',
];
for (const rel of required) read(rel);

const days = walkContent(path.join(repoRoot, 'content'))
  .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')))
  .sort(compareDaysDesc);

if (days.length === 0) fail('no content days to smoke-test');

const home = read('index.html');
const rss = read('rss.xml');
const sitemap = read('sitemap.xml');
const robots = read('robots.txt');
const notFound = read('404.html');
if (notFound && !notFound.includes('未找到')) fail('404 page missing 未找到');
const latest = days[0];

if (home && latest) {
  for (const name of ['朝夕', '科技与AI', '国际与政治', '商业与市场', '中国']) {
    if (!home.includes(name)) fail(`homepage missing ${name}`);
  }
  if (!home.includes('lang="zh-Hans"')) fail('homepage missing lang="zh-Hans"');
  if (!home.includes('id="theme-toggle"')) fail('homepage missing theme toggle');
  if (!home.includes('id="ui-toggle"')) fail('homepage missing language toggle');
  if (!home.includes('application/rss+xml')) fail('homepage missing RSS autodiscovery');
  if (!home.includes('card-grid')) fail('homepage missing the story grid');
  if (!home.includes('text-toggle')) fail('homepage missing the original/translation toggle');
  if (!home.includes('mark-original') || !home.includes('mark-translation')) {
    fail('homepage missing original and translation icons');
  }
  const [year, month, day] = latest.date.split('-').map(Number);
  const dateLabel = `${year}年${month}月${day}日`;
  if (!home.includes(dateLabel)) fail(`homepage missing latest date ${dateLabel}`);
  if (partHasStories(latest.am) && !home.includes('上午')) fail('homepage missing 上午');
  if (partHasStories(latest.pm) && !home.includes('下午')) fail('homepage missing 下午');
  const lead = latest.lead && (latest.lead.zh || latest.lead.en);
  if (lead && !home.includes(escapeText(lead))) fail('homepage missing latest lead');
  if (latest.sample && !home.includes('noindex')) fail('sample homepage should be noindex');
  if (!home.includes('https://naijoug.github.io/news/')) {
    fail('homepage canonical is not https://naijoug.github.io/news/');
  }
  if (home.includes('/editions/')) fail('homepage still links to the old edition route');
}

for (const day of days) {
  const html = read(`days/${day.date}/index.html`);
  if (html && day.sample && !html.includes('noindex')) fail(`sample day ${day.date} should be noindex`);
  for (const partId of ['am', 'pm']) {
    const block = day[partId];
    if (!block) continue;
    for (const sectionId of SECTION_IDS) {
      for (const story of block[sectionId] || []) {
        const page = read(`stories/${day.date}/${story.id}/index.html`);
        const title = story.title?.zh || story.title?.en;
        if (title && page && !page.includes(escapeText(title))) {
          fail(`story ${day.date}/${story.id} missing its title`);
        }
        if (story.title?.zh && story.title?.en && page) {
          if (!page.includes(escapeText(story.title.zh)) || !page.includes(escapeText(story.title.en))) {
            fail(`story ${day.date}/${story.id} missing a bilingual title`);
          }
        }
        if (day.sample && title) {
          if (rss.includes(escapeText(title))) fail(`RSS includes sample story ${story.id}`);
          if (sitemap.includes(`/stories/${day.date}/${story.id}/`)) {
            fail(`sitemap includes sample story ${story.id}`);
          }
        }
        if (page && story.body && !page.includes('prose')) {
          fail(`story ${day.date}/${story.id} with a body is missing prose`);
        }
      }
    }
  }
}

function collectCss(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectCss(full, out);
    else if (entry.name.endsWith('.css')) out.push(fs.readFileSync(full, 'utf8'));
  }
  return out;
}

const builtCss = collectCss(dist).join('\n');
if (!builtCss.includes('Fira Code')) fail('built CSS does not declare Fira Code');
if (!builtCss.includes('woff2')) fail('Fira Code is not self-hosted as woff2');
if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(`${builtCss}\n${home}`)) {
  fail('page requests a third-party font host');
}

if (!rss.includes('<rss') || !rss.includes('朝夕')) fail('RSS feed is missing its channel');
if (!sitemap.includes('<urlset')) fail('sitemap is missing urlset');

const real = days.filter((day) => day.sample !== true);
if (real.length === 0) {
  if (!/Disallow:\s*\//.test(robots)) fail('sample-only site should disallow crawlers');
} else if (!/Sitemap:/.test(robots)) {
  fail('robots.txt is missing a sitemap');
}

if (failures.length > 0) {
  console.error('Smoke test failed:');
  for (const message of failures) console.error(`  - ${message}`);
  process.exit(1);
}

console.log(`Smoke-tested dist/ (${days.length} day file(s)).`);
