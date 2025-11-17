import { NewsItem } from '../types';

/**
 * Interface for all crawler implementations
 */
export interface ICrawler {
  platformId: string;
  platformName: string;
  crawl(): Promise<NewsItem[]>;
}
