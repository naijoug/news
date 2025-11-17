import { Request, Response, NextFunction } from 'express';
import { CrawlerScheduler } from '../services/CrawlerScheduler';

export class CrawlerController {
  private scheduler: CrawlerScheduler;

  constructor(scheduler: CrawlerScheduler) {
    this.scheduler = scheduler;
  }

  /**
   * POST /api/crawl/trigger
   * Manually trigger crawling
   */
  triggerCrawl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if crawl is already in progress
      if (this.scheduler.isCrawlInProgress()) {
        res.status(409).json({
          success: false,
          error: 'Crawl already in progress',
          code: 'CRAWL_IN_PROGRESS',
        });
        return;
      }

      // Trigger crawl
      const result = await this.scheduler.runNow();

      res.json({
        success: result.success,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/crawl/status
   * Get crawler status
   */
  getCrawlStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = {
        schedulerRunning: this.scheduler.isSchedulerRunning(),
        crawlInProgress: this.scheduler.isCrawlInProgress(),
      };

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };
}
