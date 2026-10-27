import fs from 'node:fs';
import path from 'node:path';
import sectionFile from '../../schemas/sections.json';
import { compareDaysDesc } from '../../scripts/edition-order.mjs';
import { renderMarkdown } from '../../scripts/markdown.mjs';

export type Lang = 'zh' | 'en';
export type PartId = 'am' | 'pm';

export interface Localized {
  zh?: string;
  en?: string;
}

export interface Source {
  name: string;
  url: string;
  lang?: Lang;
}

export interface Story {
  id: string;
  originalLang: Lang;
  title: Localized;
  summary: Localized;
  body?: Localized;
  bodyHtml?: Localized;
  sources: Source[];
  part: PartId;
  sectionId: string;
  date: string;
}

export interface SectionInfo {
  id: string;
  name: Localized;
  description: Localized;
}

export interface Part {
  id: PartId;
  storiesBySection: Record<string, Story[]>;
}

export interface Day {
  date: string;
  sample: boolean;
  lead?: Localized;
  parts: Part[];
  stories: Story[];
  weekday: string;
  weekdayEn: string;
  dateLabel: string;
  dateLabelEn: string;
  monthLabel: string;
  monthLabelEn: string;
  dayLabel: string;
  dayLabelEn: string;
  storyCount: number;
}

export const SECTIONS = sectionFile as SectionInfo[];

export const PARTS: { id: PartId; zh: string; en: string }[] = [
  { id: 'am', zh: '上午', en: 'Morning' },
  { id: 'pm', zh: '下午', en: 'Afternoon' },
];

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const FILE_RE = /^(\d{4})\/(\d{2})\/(\d{4}-\d{2}-\d{2})\.json$/;

export function partMeta(id: PartId) {
  return PARTS.find((part) => part.id === id) ?? PARTS[0];
}

export function sectionById(id: string): SectionInfo | undefined {
  return SECTIONS.find((section) => section.id === id);
}

export function formatDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const monthEn = MONTHS_EN[month - 1] ?? '';
  return {
    weekday: WEEKDAYS[utc.getUTCDay()] ?? '',
    weekdayEn: WEEKDAYS_EN[utc.getUTCDay()] ?? '',
    dateLabel: `${year}年${month}月${day}日`,
    dateLabelEn: `${monthEn} ${day}, ${year}`,
    monthLabel: `${year}年${month}月`,
    monthLabelEn: `${monthEn} ${year}`,
    dayLabel: `${day}日`,
    dayLabelEn: `${monthEn} ${day}`,
  };
}

export function dayPath(day: Pick<Day, 'date'>): string {
  return `days/${day.date}/`;
}

export function storyPath(story: Pick<Story, 'date' | 'id'>): string {
  return `stories/${story.date}/${story.id}/`;
}

export function sectionPath(id: string): string {
  return `sections/${id}/`;
}

export function hasLang(text: Localized | undefined, lang: Lang): boolean {
  return Boolean(text && text[lang]);
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function fail(message: string): never {
  throw new Error(message);
}

function asLocalized(value: unknown): Localized | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as Record<string, unknown>;
  const out: Localized = {};
  if (typeof row.zh === 'string') out.zh = row.zh;
  if (typeof row.en === 'string') out.en = row.en;
  return out;
}

function asStory(value: unknown, label: string, date: string, part: PartId, sectionId: string): Story {
  if (!value || typeof value !== 'object') fail(`${label} is not an object`);
  const story = value as Record<string, unknown>;
  const id = story.id;
  const originalLang = story.originalLang;
  if (typeof id !== 'string' || (originalLang !== 'zh' && originalLang !== 'en')) {
    fail(`${label} is missing id or originalLang`);
  }
  const title = asLocalized(story.title);
  const summary = asLocalized(story.summary);
  if (!title || !summary) fail(`${label} is missing title or summary`);
  if (!Array.isArray(story.sources)) fail(`${label} is missing sources`);
  const sources = story.sources.map((source, index) => {
    if (!source || typeof source !== 'object') fail(`${label} source ${index} is not an object`);
    const row = source as Record<string, unknown>;
    if (typeof row.name !== 'string' || typeof row.url !== 'string') {
      fail(`${label} source ${index} is missing name or url`);
    }
    const rawLang = row.lang;
    const lang: Lang | undefined = rawLang === 'zh' || rawLang === 'en' ? rawLang : undefined;
    return { name: row.name, url: row.url, lang };
  });
  const body = asLocalized(story.body);
  const bodyHtml = body
    ? {
        zh: body.zh ? renderMarkdown(body.zh) : undefined,
        en: body.en ? renderMarkdown(body.en) : undefined,
      }
    : undefined;
  return {
    id,
    originalLang,
    title,
    summary,
    body,
    bodyHtml,
    sources,
    part,
    sectionId,
    date,
  };
}

function loadDay(contentRoot: string, file: string): Day {
  const rel = path.relative(contentRoot, file).split(path.sep).join('/');
  const match = FILE_RE.exec(rel);
  if (!match) {
    fail(`Unexpected file content/${rel}. Expected content/YYYY/MM/YYYY-MM-DD.json`);
  }
  let parsed: unknown;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file));
    parsed = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`Cannot parse content/${rel}: ${message}`);
  }
  if (!parsed || typeof parsed !== 'object') fail(`content/${rel} is not a JSON object`);
  const data = parsed as Record<string, unknown>;
  const date = data.date;
  if (typeof date !== 'string' || date !== match[3]) {
    fail(`content/${rel} does not match its date field`);
  }
  const parts: Part[] = [];
  const stories: Story[] = [];
  const seen = new Set<string>();
  for (const partId of ['am', 'pm'] as const) {
    if (partId === 'pm' && !Object.prototype.hasOwnProperty.call(data, 'pm')) continue;
    const block = data[partId];
    if (!block || typeof block !== 'object') fail(`content/${rel} is missing ${partId}`);
    const storiesBySection: Record<string, Story[]> = {};
    for (const section of SECTIONS) {
      const list = (block as Record<string, unknown>)[section.id];
      if (!Array.isArray(list)) fail(`content/${rel} is missing ${partId}.${section.id}`);
      storiesBySection[section.id] = list.map((story, index) => {
        const parsedStory = asStory(
          story,
          `content/${rel} ${partId}.${section.id}[${index}]`,
          date,
          partId,
          section.id,
        );
        if (seen.has(parsedStory.id)) fail(`content/${rel} repeats story id ${parsedStory.id}`);
        seen.add(parsedStory.id);
        return parsedStory;
      });
      stories.push(...storiesBySection[section.id]);
    }
    parts.push({ id: partId, storiesBySection });
  }
  const formatted = formatDate(date);
  return {
    date,
    sample: data.sample === true,
    lead: asLocalized(data.lead),
    parts,
    stories,
    ...formatted,
    storyCount: stories.length,
  };
}

export function getDays(): Day[] {
  const contentRoot = path.join(process.cwd(), 'content');
  const days = walk(contentRoot)
    .filter((file) => file.endsWith('.json'))
    .map((file) => loadDay(contentRoot, file));
  if (days.length === 0) {
    fail('No days found. Add content/YYYY/MM/YYYY-MM-DD.json');
  }
  days.sort(compareDaysDesc);
  return days;
}

export function hasRealDay(days: Day[] = getDays()): boolean {
  return days.some((day) => !day.sample);
}

export function partStoryCount(day: Day, id: PartId): number {
  const part = day.parts.find((item) => item.id === id);
  if (!part) return 0;
  return SECTIONS.reduce((count, section) => count + (part.storiesBySection[section.id]?.length ?? 0), 0);
}

export interface MonthGroup {
  key: string;
  label: string;
  labelEn: string;
  days: Day[];
}

export function groupByMonth(days: Day[]): MonthGroup[] {
  const months: MonthGroup[] = [];
  for (const day of days) {
    const key = day.date.slice(0, 7);
    let month = months.find((item) => item.key === key);
    if (!month) {
      month = { key, label: day.monthLabel, labelEn: day.monthLabelEn, days: [] };
      months.push(month);
    }
    month.days.push(day);
  }
  return months;
}

export function dayDescription(day: Day): string {
  if (day.lead?.zh) return day.lead.zh;
  if (day.lead?.en) return day.lead.en;
  const story = day.stories[0];
  return story?.summary.zh || story?.summary.en || '朝夕每日新闻。';
}
