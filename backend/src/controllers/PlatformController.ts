import { Request, Response, NextFunction } from 'express';
import { PlatformRepository } from '../repositories/PlatformRepository';
import { ConfigValidator } from '../utils/configValidator';
import { CrawlerFactory } from '../crawlers/CrawlerFactory';
import { Platform } from '../types';

export class PlatformController {
  private platformRepo: PlatformRepository;

  constructor(platformRepo: PlatformRepository) {
    this.platformRepo = platformRepo;
  }

  /**
   * GET /api/platforms
   * Get all platforms
   */
  getPlatforms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { enabled } = req.query;
      const enabledOnly = enabled === 'true';

      const platforms = await this.platformRepo.getAllPlatforms(enabledOnly);

      res.json({
        success: true,
        data: platforms,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/platforms
   * Create a new platform
   */
  createPlatform = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const platformData = req.body;

      // Validate platform configuration
      const validation = ConfigValidator.validatePlatform(platformData);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'Invalid platform configuration',
          code: 'VALIDATION_ERROR',
          details: validation.errors,
        });
        return;
      }

      // Check if platform already exists
      const exists = await this.platformRepo.platformExists(platformData.id);
      if (exists) {
        res.status(409).json({
          success: false,
          error: `Platform with id '${platformData.id}' already exists`,
          code: 'PLATFORM_EXISTS',
        });
        return;
      }

      // Create platform
      await this.platformRepo.createPlatform(platformData);

      res.status(201).json({
        success: true,
        message: 'Platform created successfully',
        data: platformData,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/platforms/:id
   * Update an existing platform
   */
  updatePlatform = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if platform exists
      const platform = await this.platformRepo.getPlatformById(id);
      if (!platform) {
        res.status(404).json({
          success: false,
          error: `Platform with id '${id}' not found`,
          code: 'PLATFORM_NOT_FOUND',
        });
        return;
      }

      // Validate updates if config is being updated
      if (updates.config) {
        const configErrors = ConfigValidator.validateCrawlerConfig(updates.config);
        if (configErrors.length > 0) {
          res.status(400).json({
            success: false,
            error: 'Invalid crawler configuration',
            code: 'VALIDATION_ERROR',
            details: configErrors,
          });
          return;
        }
      }

      // Update platform
      await this.platformRepo.updatePlatform(id, updates);

      // Get updated platform
      const updatedPlatform = await this.platformRepo.getPlatformById(id);

      res.json({
        success: true,
        message: 'Platform updated successfully',
        data: updatedPlatform,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/platforms/:id
   * Delete a platform
   */
  deletePlatform = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if platform exists
      const exists = await this.platformRepo.platformExists(id);
      if (!exists) {
        res.status(404).json({
          success: false,
          error: `Platform with id '${id}' not found`,
          code: 'PLATFORM_NOT_FOUND',
        });
        return;
      }

      // Delete platform
      await this.platformRepo.deletePlatform(id);

      res.json({
        success: true,
        message: 'Platform deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/platforms/:id/test
   * Test a platform's crawler configuration
   */
  testPlatform = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Get platform
      const platform = await this.platformRepo.getPlatformById(id);
      if (!platform) {
        res.status(404).json({
          success: false,
          error: `Platform with id '${id}' not found`,
          code: 'PLATFORM_NOT_FOUND',
        });
        return;
      }

      // Create crawler and test
      const startTime = Date.now();
      let newsItems;
      let error = null;

      try {
        const crawler = CrawlerFactory.createCrawler(platform);
        newsItems = await crawler.crawl();
      } catch (crawlError: any) {
        error = crawlError.message || 'Unknown error occurred during crawling';
      }

      const duration = Date.now() - startTime;

      res.json({
        success: !error,
        data: {
          platformId: platform.id,
          platformName: platform.name,
          itemsFound: newsItems ? newsItems.length : 0,
          duration: `${duration}ms`,
          items: newsItems || [],
          error,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
