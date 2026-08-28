import { NextFunction, Request, Response } from 'express';
import { CrawlerController } from '../controllers/CrawlerController';
import { CrawlerScheduler } from '../services/CrawlerScheduler';

const createResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<Response>;

  return res;
};

const createController = () => {
  const scheduler = {
    isCrawlInProgress: jest.fn(),
    isSchedulerRunning: jest.fn(),
    runNow: jest.fn(),
  } as unknown as jest.Mocked<CrawlerScheduler>;

  return {
    controller: new CrawlerController(scheduler),
    scheduler,
    req: {} as Request,
    res: createResponse(),
    next: jest.fn() as NextFunction,
  };
};

describe('CrawlerController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerCrawl', () => {
    it('returns 409 without running the scheduler when a crawl is already in progress', async () => {
      const { controller, scheduler, req, res, next } = createController();
      scheduler.isCrawlInProgress.mockReturnValue(true);

      await controller.triggerCrawl(req, res, next);

      expect(scheduler.runNow).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Crawl already in progress',
        code: 'CRAWL_IN_PROGRESS',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('runs the scheduler and returns its result payload', async () => {
      const { controller, scheduler, req, res, next } = createController();
      const runResult = {
        success: true,
        message: 'Crawled 2/2 platforms successfully',
        results: [
          {
            platformId: 'alpha',
            platformName: 'Alpha',
            success: true,
            itemCount: 3,
            duration: 120,
          },
        ],
        statistics: {
          totalPlatforms: 2,
          successCount: 2,
          failureCount: 0,
          totalItems: 3,
          duration: 220,
        },
      };
      scheduler.isCrawlInProgress.mockReturnValue(false);
      scheduler.runNow.mockResolvedValue(runResult);

      await controller.triggerCrawl(req, res, next);

      expect(scheduler.runNow).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: runResult.message,
        data: runResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('passes scheduler errors to Express error middleware', async () => {
      const { controller, scheduler, req, res, next } = createController();
      const error = new Error('repository unavailable');
      scheduler.isCrawlInProgress.mockReturnValue(false);
      scheduler.runNow.mockRejectedValue(error);

      await controller.triggerCrawl(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getCrawlStatus', () => {
    it('returns scheduler and crawl status flags', async () => {
      const { controller, scheduler, req, res, next } = createController();
      scheduler.isSchedulerRunning.mockReturnValue(true);
      scheduler.isCrawlInProgress.mockReturnValue(false);

      await controller.getCrawlStatus(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          schedulerRunning: true,
          crawlInProgress: false,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('passes status lookup errors to Express error middleware', async () => {
      const { controller, scheduler, req, res, next } = createController();
      const error = new Error('status unavailable');
      scheduler.isSchedulerRunning.mockImplementation(() => {
        throw error;
      });

      await controller.getCrawlStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
