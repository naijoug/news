import { Request, Response, NextFunction } from 'express';
import { NewsRepository } from '../repositories/NewsRepository';
import { NewsFilter } from '../types';

export class NewsController {
  private newsRepo: NewsRepository;

  constructor(newsRepo: NewsRepository) {
    this.newsRepo = newsRepo;
  }

  /**
   * GET /api/news
   * Get news items with optional filters
   */
  getNews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        platforms,
        startTime,
        endTime,
        limit = '50',
        offset = '0',
      } = req.query;

      // Build filter object
      const filter: NewsFilter = {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      };

      // Parse platform IDs
      if (platforms) {
        if (typeof platforms === 'string') {
          filter.platformIds = platforms.split(',').map(p => p.trim());
        } else if (Array.isArray(platforms)) {
          filter.platformIds = platforms as string[];
        }
      }

      // Parse time range
      if (startTime && typeof startTime === 'string') {
        filter.startTime = new Date(startTime);
      }

      if (endTime && typeof endTime === 'string') {
        filter.endTime = new Date(endTime);
      }

      // Fetch news and total count
      const [newsItems, total] = await Promise.all([
        this.newsRepo.getNews(filter),
        this.newsRepo.getNewsCount(filter),
      ]);

      res.json({
        success: true,
        data: newsItems,
        total,
        limit: filter.limit,
        offset: filter.offset,
      });
    } catch (error) {
      next(error);
    }
  };
}
