import { ICrawler } from './ICrawler';
import { NewsItem, CrawlerConfig } from '../types';

/**
 * Abstract base class for all crawlers
 * Provides common error handling and logging functionality
 */
export abstract class BaseCrawler implements ICrawler {
  public readonly platformId: string;
  public readonly platformName: string;
  protected readonly config: CrawlerConfig;

  constructor(platformId: string, platformName: string, config: CrawlerConfig) {
    this.platformId = platformId;
    this.platformName = platformName;
    this.config = config;
  }

  /**
   * Main crawl method - implements template method pattern
   */
  async crawl(): Promise<NewsItem[]> {
    try {
      this.log('Starting crawl');
      
      const rawData = await this.fetch();
      const parsed = await this.parse(rawData);
      const transformed = this.transform(parsed);
      
      this.log(`Successfully crawled ${transformed.length} items`);
      return transformed;
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  /**
   * Fetch raw data from the platform
   */
  protected abstract fetch(): Promise<any>;

  /**
   * Parse raw data into structured format
   */
  protected abstract parse(data: any): Promise<any[]>;

  /**
   * Transform parsed data into NewsItem format
   */
  protected transform(items: any[]): NewsItem[] {
    const newsItems: NewsItem[] = [];
    const now = new Date();

    for (const item of items) {
      try {
        const newsItem = this.transformItem(item);
        if (newsItem && this.validateNewsItem(newsItem)) {
          newsItems.push({
            ...newsItem,
            platformId: this.platformId,
            crawlTime: now,
          });
        }
      } catch (error) {
        this.log(`Failed to transform item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return newsItems;
  }

  /**
   * Transform a single item
   */
  protected abstract transformItem(item: any): Omit<NewsItem, 'platformId' | 'crawlTime'>;

  /**
   * Validate a news item
   */
  protected validateNewsItem(item: Omit<NewsItem, 'platformId' | 'crawlTime'>): boolean {
    if (!item.title || typeof item.title !== 'string' || item.title.trim() === '') {
      this.log('Invalid item: missing or empty title');
      return false;
    }

    if (!item.url || typeof item.url !== 'string' || item.url.trim() === '') {
      this.log('Invalid item: missing or empty URL');
      return false;
    }

    if (!item.publishTime || !(item.publishTime instanceof Date) || isNaN(item.publishTime.getTime())) {
      this.log('Invalid item: missing or invalid publishTime');
      return false;
    }

    return true;
  }

  /**
   * Log a message with platform context
   */
  protected log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.platformName}] ${message}`);
  }

  /**
   * Handle errors with logging
   */
  protected handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error(`[${new Date().toISOString()}] [${this.platformName}] Error: ${errorMessage}`);
    if (errorStack) {
      console.error(`[${new Date().toISOString()}] [${this.platformName}] Stack: ${errorStack}`);
    }
  }

  /**
   * Get timeout value from config or use default
   */
  protected getTimeout(): number {
    return this.config.timeout || 10000;
  }
}
