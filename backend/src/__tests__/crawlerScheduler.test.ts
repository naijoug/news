import { CrawlerFactory } from '../crawlers/CrawlerFactory';
import { ICrawler } from '../crawlers/ICrawler';
import { NewsRepository } from '../repositories/NewsRepository';
import { PlatformRepository } from '../repositories/PlatformRepository';
import { CrawlerScheduler } from '../services/CrawlerScheduler';
import { NewsItem, Platform } from '../types';

jest.mock('../crawlers/CrawlerFactory', () => ({
  CrawlerFactory: {
    createCrawlers: jest.fn(),
  },
}));

const mockedCreateCrawlers = CrawlerFactory.createCrawlers as jest.MockedFunction<
  typeof CrawlerFactory.createCrawlers
>;

const createPlatform = (id: string): Platform => ({
  id,
  name: `${id} platform`,
  iconUrl: `/icons/${id}.svg`,
  enabled: true,
  config: {
    type: 'static',
    url: `https://example.com/${id}`,
    selector: '.item',
    parser: {
      title: '.title',
      url: '.link',
    },
  },
});

const createNewsItem = (platformId: string, title: string): NewsItem => ({
  title,
  url: `https://example.com/${platformId}/${title}`,
  platformId,
  publishTime: new Date('2026-08-28T00:00:00.000Z'),
});

const createCrawler = (platformId: string, crawlResult: Promise<NewsItem[]>): ICrawler => ({
  platformId,
  platformName: `${platformId} platform`,
  crawl: jest.fn(() => crawlResult),
});

const createScheduler = () => {
  const platformRepo = {
    getAllPlatforms: jest.fn(),
  } as unknown as jest.Mocked<PlatformRepository>;
  const newsRepo = {
    saveNews: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<NewsRepository>;

  return {
    scheduler: new CrawlerScheduler(platformRepo, newsRepo),
    platformRepo,
    newsRepo,
  };
};

describe('CrawlerScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a successful no-op result when there are no enabled platforms', async () => {
    const { scheduler, platformRepo, newsRepo } = createScheduler();
    platformRepo.getAllPlatforms.mockResolvedValue([]);

    const result = await scheduler.runNow();

    expect(platformRepo.getAllPlatforms).toHaveBeenCalledWith(true);
    expect(mockedCreateCrawlers).not.toHaveBeenCalled();
    expect(newsRepo.saveNews).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      message: 'No enabled platforms to crawl',
      results: [],
    });
    expect(scheduler.isCrawlInProgress()).toBe(false);
  });

  it('runs created crawlers concurrently, persists successful items, and reports aggregate statistics', async () => {
    const { scheduler, platformRepo, newsRepo } = createScheduler();
    const platforms = [createPlatform('alpha'), createPlatform('beta')];
    const alphaItems = [createNewsItem('alpha', 'a1'), createNewsItem('alpha', 'a2')];
    const alphaCrawler = createCrawler('alpha', Promise.resolve(alphaItems));
    const betaCrawler = createCrawler('beta', Promise.resolve([]));

    platformRepo.getAllPlatforms.mockResolvedValue(platforms);
    mockedCreateCrawlers.mockReturnValue([alphaCrawler, betaCrawler]);

    const result = await scheduler.runNow();

    expect(mockedCreateCrawlers).toHaveBeenCalledWith(platforms);
    expect(alphaCrawler.crawl).toHaveBeenCalledTimes(1);
    expect(betaCrawler.crawl).toHaveBeenCalledTimes(1);
    expect(newsRepo.saveNews).toHaveBeenCalledTimes(1);
    expect(newsRepo.saveNews).toHaveBeenCalledWith(alphaItems);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Crawled 2/2 platforms successfully');
    expect(result.results).toEqual([
      expect.objectContaining({
        platformId: 'alpha',
        platformName: 'alpha platform',
        success: true,
        itemCount: 2,
      }),
      expect.objectContaining({
        platformId: 'beta',
        platformName: 'beta platform',
        success: true,
        itemCount: 0,
      }),
    ]);
    expect(result.statistics).toEqual(
      expect.objectContaining({
        totalPlatforms: 2,
        successCount: 2,
        failureCount: 0,
        totalItems: 2,
      })
    );
  });

  it('isolates crawler failures and exposes per-platform errors in the final result', async () => {
    const { scheduler, platformRepo, newsRepo } = createScheduler();
    const goodItems = [createNewsItem('good', 'g1')];
    const goodCrawler = createCrawler('good', Promise.resolve(goodItems));
    const badCrawler = createCrawler('bad', Promise.reject(new Error('network timeout')));

    platformRepo.getAllPlatforms.mockResolvedValue([createPlatform('good'), createPlatform('bad')]);
    mockedCreateCrawlers.mockReturnValue([goodCrawler, badCrawler]);

    const result = await scheduler.runNow();

    expect(newsRepo.saveNews).toHaveBeenCalledTimes(1);
    expect(newsRepo.saveNews).toHaveBeenCalledWith(goodItems);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Crawled 1/2 platforms successfully');
    expect(result.results).toEqual([
      expect.objectContaining({ platformId: 'good', success: true, itemCount: 1 }),
      expect.objectContaining({
        platformId: 'bad',
        success: false,
        itemCount: 0,
        error: 'network timeout',
      }),
    ]);
    expect(result.statistics).toEqual(
      expect.objectContaining({
        totalPlatforms: 2,
        successCount: 1,
        failureCount: 1,
        totalItems: 1,
      })
    );
    expect(scheduler.isCrawlInProgress()).toBe(false);
  });

  it('rejects overlapping manual runs while an existing crawl is in progress', async () => {
    const { scheduler, platformRepo } = createScheduler();
    let releaseCrawler: (items: NewsItem[]) => void = () => undefined;
    const slowCrawler = createCrawler(
      'slow',
      new Promise(resolve => {
        releaseCrawler = resolve;
      })
    );

    platformRepo.getAllPlatforms.mockResolvedValue([createPlatform('slow')]);
    mockedCreateCrawlers.mockReturnValue([slowCrawler]);

    const firstRun = scheduler.runNow();
    await Promise.resolve();

    const overlappingResult = await scheduler.runNow();
    expect(overlappingResult).toEqual({
      success: false,
      message: 'Crawl already in progress',
      results: [],
    });

    releaseCrawler([createNewsItem('slow', 's1')]);
    const firstResult = await firstRun;

    expect(firstResult.success).toBe(true);
    expect(scheduler.isCrawlInProgress()).toBe(false);
  });
});
