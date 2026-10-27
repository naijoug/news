import fs from 'node:fs';
import path from 'node:path';
import sectionFile from '../../schemas/sections.json';
import { compareEditionsDesc } from '../../scripts/edition-order.mjs';

export interface Source {
  name: string;
  url: string;
}

export interface Story {
  title: string;
  summary: string;
  sources: Source[];
}

export interface SectionInfo {
  id: string;
  name: string;
  description: string;
}

export const SECTIONS = sectionFile as SectionInfo[];

export type EditionKind = 'morning' | 'evening';

export interface Edition {
  date: string;
  edition: EditionKind;
  sample: boolean;
  lead?: string;
  sections: Record<string, Story[]>;
  slug: string;
  weekday: string;
  dateLabel: string;
  editionLabel: string;
  storyCount: number;
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const FILE_RE = /^(\d{4})\/(\d{2})\/(\d{4}-\d{2}-\d{2})-(morning|evening)\.json$/;

export function editionKindLabel(kind: EditionKind): string {
  return kind === 'evening' ? '晚报' : '早报';
}

export function formatDate(iso: string): { weekday: string; dateLabel: string; monthLabel: string; dayLabel: string } {
  const [year, month, day] = iso.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return {
    weekday: WEEKDAYS[utc.getUTCDay()] ?? '',
    dateLabel: `${year}年${month}月${day}日`,
    monthLabel: `${year}年${month}月`,
    dayLabel: `${day}日`,
  };
}

export function editionPath(edition: Pick<Edition, 'slug'>): string {
  return `editions/${edition.slug}/`;
}

export function sectionPath(id: string): string {
  return `sections/${id}/`;
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

function asStory(value: unknown, label: string): Story {
  if (!value || typeof value !== 'object') fail(`${label} is not an object`);
  const story = value as Record<string, unknown>;
  if (typeof story.title !== 'string' || typeof story.summary !== 'string' || !Array.isArray(story.sources)) {
    fail(`${label} is missing title, summary, or sources`);
  }
  const sources = story.sources.map((source, index) => {
    if (!source || typeof source !== 'object') fail(`${label} source ${index} is not an object`);
    const row = source as Record<string, unknown>;
    if (typeof row.name !== 'string' || typeof row.url !== 'string') {
      fail(`${label} source ${index} is missing name or url`);
    }
    return { name: row.name, url: row.url };
  });
  return { title: story.title, summary: story.summary, sources };
}

function loadEdition(contentRoot: string, file: string): Edition {
  const rel = path.relative(contentRoot, file).split(path.sep).join('/');
  const match = FILE_RE.exec(rel);
  if (!match) {
    fail(
      `Unexpected file content/${rel}. Expected content/YYYY/MM/YYYY-MM-DD-morning.json or content/YYYY/MM/YYYY-MM-DD-evening.json`,
    );
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
  const edition = data.edition;
  if (typeof date !== 'string' || (edition !== 'morning' && edition !== 'evening')) {
    fail(`content/${rel} is missing a date or edition`);
  }
  if (date !== match[3] || edition !== match[4]) {
    fail(`content/${rel} does not match its date and edition fields`);
  }
  const sectionsRaw = data.sections;
  if (!sectionsRaw || typeof sectionsRaw !== 'object') fail(`content/${rel} is missing sections`);
  const sections: Record<string, Story[]> = {};
  for (const section of SECTIONS) {
    const list = (sectionsRaw as Record<string, unknown>)[section.id];
    if (!Array.isArray(list)) fail(`content/${rel} is missing sections.${section.id}`);
    sections[section.id] = list.map((story, index) =>
      asStory(story, `content/${rel} sections.${section.id}[${index}]`),
    );
  }
  const formatted = formatDate(date);
  const storyCount = SECTIONS.reduce((count, section) => count + sections[section.id].length, 0);
  return {
    date,
    edition,
    sample: data.sample === true,
    lead: typeof data.lead === 'string' ? data.lead : undefined,
    sections,
    slug: `${date}-${edition}`,
    weekday: formatted.weekday,
    dateLabel: formatted.dateLabel,
    editionLabel: editionKindLabel(edition),
    storyCount,
  };
}

export function getEditions(): Edition[] {
  const contentRoot = path.join(process.cwd(), 'content');
  const editions = walk(contentRoot).map((file) => loadEdition(contentRoot, file));
  if (editions.length === 0) {
    fail('No editions found. Add content/YYYY/MM/YYYY-MM-DD-morning.json');
  }
  editions.sort(compareEditionsDesc);
  return editions;
}

export function hasRealEdition(editions: Edition[] = getEditions()): boolean {
  return editions.some((edition) => !edition.sample);
}

export interface DayGroup {
  date: string;
  dayLabel: string;
  weekday: string;
  editions: Edition[];
}

export interface MonthGroup {
  key: string;
  label: string;
  days: DayGroup[];
}

export function groupByMonth(editions: Edition[]): MonthGroup[] {
  const months: MonthGroup[] = [];
  for (const edition of editions) {
    const key = edition.date.slice(0, 7);
    const formatted = formatDate(edition.date);
    let month = months.find((item) => item.key === key);
    if (!month) {
      month = { key, label: formatted.monthLabel, days: [] };
      months.push(month);
    }
    let day = month.days.find((item) => item.date === edition.date);
    if (!day) {
      day = {
        date: edition.date,
        dayLabel: formatted.dayLabel,
        weekday: formatted.weekday,
        editions: [],
      };
      month.days.push(day);
    }
    day.editions.push(edition);
  }
  return months;
}

export function editionDescription(edition: Edition): string {
  if (edition.lead) return edition.lead;
  for (const section of SECTIONS) {
    const story = edition.sections[section.id]?.[0];
    if (story) return story.summary;
  }
  return '朝夕每日新闻简报。';
}
