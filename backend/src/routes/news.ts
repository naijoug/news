import { Router } from 'express';
import { NewsController } from '../controllers/NewsController';
import { NewsRepository } from '../repositories/NewsRepository';
import { validateNewsQuery } from '../middleware/validation';

const router = Router();
const newsRepo = new NewsRepository();
const newsController = new NewsController(newsRepo);

/**
 * GET /api/news
 * Get news items with optional filters
 * Query params: platforms, startTime, endTime, limit, offset
 */
router.get('/', validateNewsQuery, newsController.getNews);

export default router;
