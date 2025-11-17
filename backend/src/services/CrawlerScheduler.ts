import * as cron from 'node-cron';
import { PlatformRepository } from '../repositories/PlatformRepository';
import { NewsRepository } from '../repositories/NewsRepository';
import { CrawlerFactory } from '../crawlers/CrawlerFactory';
import { ICrawler } from '../crawlers/ICrawler';

/**
 * Scheduler for managing crawler tasks
 */
export class CrawlerScheduler {
  private platformRepo: PlatformRepository;
  private newsRepo: NewsRepository;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  constructor(
    platformRepo: PlatformRepository,
    newsRepo: NewsRepository
  ) {
    this.platformRepo = platformRepo;
    this.newsRepo = newsRepo;
  }

  /**
   * Start the scheduler with cron schedule
   * Default: Run at 8:00 AM and 8:00 PM every day
   */
  start(schedule: string = '0 8,20 * * *'): void {
    if (this.cronJob) {
      this.log('Scheduler is already running');
      return;
    }

    this.log(`Starting scheduler with schedule: ${schedule}`);
    
    this.cronJob = cron.schedule(schedule, async () => {
      await this.runCrawlers();
    });

    this.log('Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.log('Scheduler stopped');
    }
  }

  /**
   * Manually trigger crawling immediately
   */
  async runNow(): Promise<CrawlResult> {
    this.log('Manual crawl triggered');
    return await this.runCrawlers();
  }

  /**
   * Run all enabled crawlers
   */
  private async runCrawlers(): Promise<CrawlResult> {
    if (this.isRunning) {
      this.log('Crawl already in progress, skipping');
      return {
        success: false,
        message: 'Crawl already in progress',
        results: [],
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    this.log('Starting crawl execution');

    try {
      // Get all enabled platforms
      const platforms = await this.platformRepo.getAllPlatforms(true);
      this.log(`Found ${platforms.length} enabled platforms`);

      if (platforms.length === 0) {
        this.log('No enabled platforms found');
        return {
          success: true,
          message: 'No enabled platforms to crawl',
          results: [],
        };
      }

      // Create crawlers
      const crawlers = CrawlerFactory.createCrawlers(platforms);
      this.log(`Created ${crawlers.length} crawlers`);

      // Run all crawlers concurrently with error isolation
      const results = await this.runCrawlersConcurrently(crawlers);

      // Calculate statistics
      const totalItems = results.reduce((sum, r) => sum + r.itemCount, 0);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const duration = Date.now() - startTime;

      this.log(
        `Crawl completed: ${successCount} succeeded, ${failureCount} failed, ` +
        `${totalItems} items collected in ${duration}ms`
      );

      return {
        success: true,
        message: `Crawled ${successCount}/${crawlers.length} platforms successfully`,
        results,
        statistics: {
          totalPlatforms: crawlers.length,
          successCount,
          failureCount,
          totalItems,
          duration,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Crawl execution failed: ${errorMessage}`);
      
      return {
        success: false,
        message: `Crawl execution failed: ${errorMessage}`,
        results: [],
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run crawlers concurrently with error isolation
   */
  private async runCrawlersConcurrently(crawlers: ICrawler[]): Promise<PlatformCrawlResult[]> {
    const promises = crawlers.map(crawler => this.runSingleCrawler(crawler));
    return await Promise.all(promises);
  }

  /**
   * Run a single crawler with error handling
   */
  private async runSingleCrawler(crawler: ICrawler): Promise<PlatformCrawlResult> {
    const startTime = Date.now();
    
    try {
      this.log(`Starting crawler for ${crawler.platformName}`);
      
      // Execute crawler
      const newsItems = await crawler.crawl();
      
      // Save to database
      if (newsItems.length > 0) {
        await this.newsRepo.saveNews(newsItems);
      }
      
      const duration = Date.now() - startTime;
      this.log(
        `Crawler for ${crawler.platformName} completed: ` +
        `${newsItems.length} items in ${duration}ms`
      );
      
      return {
        platformId: crawler.platformId,
        platformName: crawler.platformName,
        success: true,
        itemCount: newsItems.length,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.log(`Crawler for ${crawler.platformName} failed: ${errorMessage}`);
      
      return {
        platformId: crawler.platformId,
        platformName: crawler.platformName,
        success: false,
        itemCount: 0,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Log with timestamp
   */
  private log(message: string): void {
    console.log(`[${new Date().toISOString()}] [Scheduler] ${message}`);
  }

  /**
   * Check if scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.cronJob !== null;
  }

  /**
   * Check if crawl is in progress
   */
  isCrawlInProgress(): boolean {
    return this.isRunning;
  }
}

/**
 * Result of a single platform crawl
 */
export interface PlatformCrawlResult {
  platformId: string;
  platformName: string;
  success: boolean;
  itemCount: number;
  duration: number;
  error?: string;
}

/**
 * Overall crawl result
 */
export interface CrawlResult {
  success: boolean;
  message: string;
  results: PlatformCrawlResult[];
  statistics?: {
    totalPlatforms: number;
    successCount: number;
    failureCount: number;
    totalItems: number;
    duration: number;
  };
}
