import { Router } from 'express';
import { CrawlerController } from '../controllers/CrawlerController';
import { CrawlerScheduler } from '../services/CrawlerScheduler';
import { PlatformRepository } from '../repositories/PlatformRepository';
import { NewsRepository } from '../repositories/NewsRepository';

const router = Router();

// Create scheduler instance (singleton pattern)
const platformRepo = new PlatformRepository();
const newsRepo = new NewsRepository();
const scheduler = new CrawlerScheduler(platformRepo, newsRepo);

const crawlerController = new CrawlerController(scheduler);

/**
 * POST /api/crawl/trigger
 * Manually trigger crawling
 */
router.post('/trigger', crawlerController.triggerCrawl);

/**
 * GET /api/crawl/status
 * Get crawler status
 */
router.get('/status', crawlerController.getCrawlStatus);

// Export scheduler for use in main app
export { scheduler };
export default router;
