import { BaseCrawler } from './BaseCrawler';
import { NewsItem } from '../types';

/**
 * Crawler for dynamic pages using Puppeteer
 * Note: Puppeteer is not included in dependencies by default
 * This is a placeholder implementation that throws an error
 */
export class DynamicCrawler extends BaseCrawler {
  /**
   * Fetch content using Puppeteer
   */
  protected async fetch(): Promise<any> {
    throw new Error(
      'DynamicCrawler requires Puppeteer to be installed. ' +
        'Run: npm install puppeteer @types/puppeteer'
    );
  }

  /**
   * Parse content
   */
  protected async parse(_data: any): Promise<any[]> {
    return [];
  }

  /**
   * Transform item
   */
  protected transformItem(_item: any): Omit<NewsItem, 'platformId' | 'crawlTime'> {
    throw new Error('DynamicCrawler not implemented');
  }
}
