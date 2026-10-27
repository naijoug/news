import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareEditionsDesc } from './edition-order.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(repoRoot, 'dist');
const failures = [];

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

const editions = walkContent(path.join(repoRoot, 'content'))
  .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')))
  .sort(compareEditionsDesc);

if (editions.length === 0) fail('no content editions to smoke-test');

const home = read('index.html');
const rss = read('rss.xml');
const sitemap = read('sitemap.xml');
const robots = read('robots.txt');
const notFound = read('404.html');
if (notFound && !notFound.includes('未找到')) fail('404 page missing 未找到');
const latest = editions[0];

if (home) {
  for (const name of ['朝夕', '科技与AI', '国际与政治', '商业与市场', '中国']) {
    if (!home.includes(name)) fail(`homepage missing ${name}`);
  }
  if (!home.includes('lang="zh-Hans"')) fail('homepage missing lang="zh-Hans"');
  if (!home.includes('id="theme-toggle"')) fail('homepage missing theme toggle');
  if (!home.includes('application/rss+xml')) fail('homepage missing RSS autodiscovery');
  const [year, month, day] = latest.date.split('-').map(Number);
  const dateLabel = `${year}年${month}月${day}日`;
  const kind = latest.edition === 'evening' ? '晚报' : '早报';
  if (!home.includes(dateLabel)) fail(`homepage missing latest date ${dateLabel}`);
  if (!home.includes(kind)) fail(`homepage missing latest edition label ${kind}`);
  if (latest.lead && !home.includes(escapeText(latest.lead))) fail('homepage missing latest lead');
  if (latest.sample && !home.includes('noindex')) fail('sample homepage should be noindex');
  if (!home.includes('https://naijoug.github.io/news/')) {
    fail('homepage canonical is not https://naijoug.github.io/news/');
  }
}

for (const edition of editions) {
  const slug = `${edition.date}-${edition.edition}`;
  const html = read(`editions/${slug}/index.html`);
  if (!html) continue;
  const title = edition.sections?.tech?.[0]?.title;
  if (title && !html.includes(escapeText(title))) fail(`edition ${slug} missing its first tech title`);
  if (edition.sample) {
    if (rss.includes(escapeText(title ?? slug))) fail(`RSS includes sample edition ${slug}`);
    if (sitemap.includes(`/editions/${slug}/`)) fail(`sitemap includes sample edition ${slug}`);
    if (!html.includes('noindex')) fail(`sample edition ${slug} should be noindex`);
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

const real = editions.filter((edition) => edition.sample !== true);
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

console.log(`Smoke-tested dist/ (${editions.length} edition file(s)).`);
