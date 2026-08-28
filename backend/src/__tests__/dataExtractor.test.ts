import * as cheerio from 'cheerio';
import { DataExtractor } from '../crawlers/utils/DataExtractor';

describe('DataExtractor', () => {
  describe('extractWithSelector', () => {
    const $ = cheerio.load(`
      <article class="item">
        <a class="title" href="/posts/agent-proof"> Agent proof loop </a>
        <span class="score"> 1,234 </span>
      </article>
    `);
    const item = $('.item').get(0)!;

    it('extracts text and attribute values from a scoped element', () => {
      expect(DataExtractor.extractWithSelector($, item, '.title')).toBe('Agent proof loop');
      expect(DataExtractor.extractWithSelector($, item, '.title@href')).toBe('/posts/agent-proof');
    });

    it('returns the element text when the scoped element itself matches the selector', () => {
      expect(DataExtractor.extractWithSelector($, item, '.item')).toContain('Agent proof loop');
    });

    it('returns null for missing selectors or invalid selector syntax', () => {
      expect(DataExtractor.extractWithSelector($, item, '.missing')).toBeNull();
      expect(DataExtractor.extractWithSelector($, item, 'a[')).toBeNull();
    });
  });

  describe('extractWithJsonPath and extractNestedField', () => {
    const payload = {
      response: {
        items: [
          {
            title: 'First item',
            metrics: { score: '2,500' },
          },
          {
            title: 'Second item',
            metrics: { score: '900' },
          },
        ],
      },
    };

    it('navigates object paths, array indices, wildcard arrays, and root payloads', () => {
      expect(DataExtractor.extractWithJsonPath(payload, '$')).toBe(payload);
      expect(DataExtractor.extractWithJsonPath(payload, '$.response.items[0].title')).toBe(
        'First item'
      );
      expect(DataExtractor.extractWithJsonPath(payload, '$.response.items[*]')).toBe(
        payload.response.items
      );
      expect(DataExtractor.extractNestedField(payload.response.items[1], 'metrics.score')).toBe(
        '900'
      );
    });

    it('returns null for missing branches and non-object traversal', () => {
      expect(DataExtractor.extractWithJsonPath(payload, '$.response.items[9].title')).toBeNull();
      expect(DataExtractor.extractNestedField('not-object', 'metrics.score')).toBeNull();
      expect(DataExtractor.extractNestedField(payload, '')).toBeNull();
    });
  });

  describe('parsers and URL normalization', () => {
    it('parses dates from Date, seconds, milliseconds, and ISO strings', () => {
      const date = new Date('2026-08-28T00:00:00.000Z');

      expect(DataExtractor.parseDate(date)).toBe(date);
      expect(DataExtractor.parseDate(1787875200)?.toISOString()).toBe('2026-08-28T00:00:00.000Z');
      expect(DataExtractor.parseDate(1787875200000)?.toISOString()).toBe(
        '2026-08-28T00:00:00.000Z'
      );
      expect(DataExtractor.parseDate('2026-08-28T00:00:00.000Z')?.toISOString()).toBe(
        '2026-08-28T00:00:00.000Z'
      );
      expect(DataExtractor.parseDate('not-a-date')).toBeNull();
    });

    it('parses formatted numbers and rejects unsupported values', () => {
      expect(DataExtractor.parseNumber(42)).toBe(42);
      expect(DataExtractor.parseNumber('1,234 567.89')).toBe(1234567.89);
      expect(DataExtractor.parseNumber('score: high')).toBeNull();
      expect(DataExtractor.parseNumber({ value: 10 })).toBeNull();
    });

    it('normalizes absolute, protocol-relative, relative, and invalid relative URLs', () => {
      expect(DataExtractor.normalizeUrl('https://example.com/a')).toBe('https://example.com/a');
      expect(DataExtractor.normalizeUrl('//cdn.example.com/a')).toBe('https://cdn.example.com/a');
      expect(DataExtractor.normalizeUrl('/posts/1', 'https://example.com/news/')).toBe(
        'https://example.com/posts/1'
      );
      expect(DataExtractor.normalizeUrl('/posts/1')).toBe('/posts/1');
    });
  });
});
