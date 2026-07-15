import axios from 'axios';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { BaseCrawler } from './BaseCrawler';
import { NewsItem } from '../types';
import { DataExtractor } from './utils/DataExtractor';

type StaticParsedItem = {
  element: AnyNode;
  $: cheerio.CheerioAPI;
};

/**
 * Crawler for static HTML pages using Cheerio
 */
export class StaticCrawler extends BaseCrawler {
  /**
   * Fetch HTML content from the URL
   */
  protected async fetch(): Promise<string> {
    const response = await axios.get(this.config.url, {
      timeout: this.getTimeout(),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    return response.data;
  }

  /**
   * Parse HTML and extract items using CSS selectors
   */
  protected async parse(html: unknown): Promise<StaticParsedItem[]> {
    if (typeof html !== 'string') {
      throw new Error('Static crawler expected HTML string response');
    }

    const $ = cheerio.load(html);
    const items: StaticParsedItem[] = [];

    if (!this.config.selector) {
      throw new Error('Selector is required for static crawler');
    }

    $(this.config.selector).each((_, element) => {
      items.push({
        element,
        $,
      });
    });

    return items;
  }

  /**
   * Transform parsed item into NewsItem
   */
  protected transformItem(item: unknown): Omit<NewsItem, 'platformId' | 'crawlTime'> {
    if (!isStaticParsedItem(item)) {
      throw new Error('Invalid static crawler item');
    }

    const { element, $ } = item;
    const parser = this.config.parser;

    // Extract title
    const title = DataExtractor.extractWithSelector($, element, parser.title);
    if (!title) {
      throw new Error('Failed to extract title');
    }

    // Extract URL
    let url = DataExtractor.extractWithSelector($, element, parser.url);
    if (!url) {
      throw new Error('Failed to extract URL');
    }
    url = DataExtractor.normalizeUrl(url, this.config.url);

    // Extract publish time (optional, default to now)
    let publishTime: Date;
    if (parser.time) {
      const timeStr = DataExtractor.extractWithSelector($, element, parser.time);
      const parsedTime = DataExtractor.parseDate(timeStr);
      publishTime = parsedTime || new Date();
    } else {
      publishTime = new Date();
    }

    // Extract hot score (optional)
    let hotScore: number | undefined;
    if (parser.hotScore) {
      const scoreStr = DataExtractor.extractWithSelector($, element, parser.hotScore);
      const parsedScore = DataExtractor.parseNumber(scoreStr);
      hotScore = parsedScore !== null ? parsedScore : undefined;
    }

    return {
      title: title.trim(),
      url,
      publishTime,
      hotScore,
    };
  }
}

function isStaticParsedItem(item: unknown): item is StaticParsedItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'element' in item &&
    '$' in item &&
    typeof item.$ === 'function'
  );
}
