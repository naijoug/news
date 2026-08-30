import { NextFunction, Request, Response } from 'express';
import { NewsController } from '../controllers/NewsController';
import { NewsRepository } from '../repositories/NewsRepository';
import { NewsItem, NewsFilter } from '../types';

type MockResponse = Partial<Response> & {
  json: jest.Mock;
};

type MockNewsRepository = jest.Mocked<Pick<NewsRepository, 'getNews' | 'getNewsCount'>>;

const createResponse = (): MockResponse => ({
  json: jest.fn().mockReturnThis(),
});

const createRepository = (): MockNewsRepository => ({
  getNews: jest.fn(),
  getNewsCount: jest.fn(),
});

const createController = () => {
  const newsRepo = createRepository();
  const controller = new NewsController(newsRepo as unknown as NewsRepository);
  const res = createResponse();
  const next = jest.fn() as NextFunction;

  return { controller, newsRepo, res, next };
};

const createNewsItem = (overrides: Partial<NewsItem> = {}): NewsItem => ({
  id: 1,
  title: 'Example item',
  url: 'https://example.com/news/1',
  platformId: 'weibo',
  publishTime: new Date('2026-01-01T00:00:00.000Z'),
  hotScore: 42,
  crawlTime: new Date('2026-01-01T00:01:00.000Z'),
  ...overrides,
});

const expectRepositoryFilter = (newsRepo: MockNewsRepository, expectedFilter: NewsFilter): void => {
  expect(newsRepo.getNews).toHaveBeenCalledWith(expectedFilter);
  expect(newsRepo.getNewsCount).toHaveBeenCalledWith(expectedFilter);
};

describe('NewsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNews', () => {
    it('builds the default pagination filter and response envelope', async () => {
      const { controller, newsRepo, res, next } = createController();
      const newsItems = [createNewsItem()];
      newsRepo.getNews.mockResolvedValue(newsItems);
      newsRepo.getNewsCount.mockResolvedValue(1);

      await controller.getNews({ query: {} } as Request, res as Response, next);

      expectRepositoryFilter(newsRepo, { limit: 50, offset: 0 });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: newsItems,
        total: 1,
        limit: 50,
        offset: 0,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('trims comma-separated platforms and parses time range before querying', async () => {
      const { controller, newsRepo, res, next } = createController();
      const startTime = '2026-01-01T00:00:00.000Z';
      const endTime = '2026-01-02T00:00:00.000Z';
      newsRepo.getNews.mockResolvedValue([]);
      newsRepo.getNewsCount.mockResolvedValue(0);

      await controller.getNews(
        {
          query: {
            platforms: 'weibo, zhihu',
            startTime,
            endTime,
            limit: '10',
            offset: '5',
          },
        } as unknown as Request,
        res as Response,
        next
      );

      expectRepositoryFilter(newsRepo, {
        platformIds: ['weibo', 'zhihu'],
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        limit: 10,
        offset: 5,
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        total: 0,
        limit: 10,
        offset: 5,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('passes repository failures to Express error middleware without writing a response', async () => {
      const { controller, newsRepo, res, next } = createController();
      const error = new Error('database unavailable');
      newsRepo.getNews.mockRejectedValue(error);
      newsRepo.getNewsCount.mockResolvedValue(0);

      await controller.getNews({ query: {} } as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
