import { NextFunction, Request, Response } from 'express';
import { PlatformController } from '../controllers/PlatformController';
import { CrawlerFactory } from '../crawlers/CrawlerFactory';
import { PlatformRepository } from '../repositories/PlatformRepository';
import { NewsItem, Platform } from '../types';

jest.mock('../crawlers/CrawlerFactory', () => ({
  CrawlerFactory: {
    createCrawler: jest.fn(),
  },
}));

type MockResponse = Partial<Response> & {
  status: jest.Mock;
  json: jest.Mock;
};

type MockPlatformRepository = jest.Mocked<
  Pick<
    PlatformRepository,
    | 'getAllPlatforms'
    | 'platformExists'
    | 'createPlatform'
    | 'getPlatformById'
    | 'updatePlatform'
    | 'deletePlatform'
  >
>;

const createResponse = (): MockResponse => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const createPlatform = (overrides: Partial<Platform> = {}): Platform => ({
  id: 'weibo',
  name: 'Weibo',
  iconUrl: '/icons/weibo.svg',
  enabled: true,
  config: {
    type: 'static',
    url: 'https://example.com/weibo',
    selector: '.item',
    parser: {
      title: '.title',
      url: '.link',
    },
  },
  ...overrides,
});

const createRepository = (): MockPlatformRepository => ({
  getAllPlatforms: jest.fn(),
  platformExists: jest.fn(),
  createPlatform: jest.fn(),
  getPlatformById: jest.fn(),
  updatePlatform: jest.fn(),
  deletePlatform: jest.fn(),
});

const createController = () => {
  const platformRepo = createRepository();
  const controller = new PlatformController(platformRepo as unknown as PlatformRepository);
  const res = createResponse();
  const next = jest.fn() as NextFunction;

  return { controller, platformRepo, res, next };
};

const expectErrorResponse = (res: MockResponse, statusCode: number, payload: object): void => {
  expect(res.status).toHaveBeenCalledWith(statusCode);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining(payload));
};

describe('PlatformController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlatforms', () => {
    it('passes enabled=true through as enabledOnly and returns platforms', async () => {
      const { controller, platformRepo, res, next } = createController();
      const platforms = [createPlatform()];
      platformRepo.getAllPlatforms.mockResolvedValue(platforms);

      await controller.getPlatforms(
        { query: { enabled: 'true' } } as unknown as Request,
        res as Response,
        next
      );

      expect(platformRepo.getAllPlatforms).toHaveBeenCalledWith(true);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: platforms });
      expect(next).not.toHaveBeenCalled();
    });

    it('treats missing or false enabled query as all platforms', async () => {
      const { controller, platformRepo, res, next } = createController();
      platformRepo.getAllPlatforms.mockResolvedValue([]);

      await controller.getPlatforms(
        { query: { enabled: 'false' } } as unknown as Request,
        res as Response,
        next
      );

      expect(platformRepo.getAllPlatforms).toHaveBeenCalledWith(false);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('createPlatform', () => {
    it('returns validation details without writing invalid platform data', async () => {
      const { controller, platformRepo, res, next } = createController();
      const invalidPlatform = { id: 'broken' };

      await controller.createPlatform({ body: invalidPlatform } as Request, res as Response, next);

      expect(platformRepo.platformExists).not.toHaveBeenCalled();
      expect(platformRepo.createPlatform).not.toHaveBeenCalled();
      expectErrorResponse(res, 400, {
        success: false,
        error: 'Invalid platform configuration',
        code: 'VALIDATION_ERROR',
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining(['Platform name is required and must be a string']),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('returns conflict when the platform id already exists', async () => {
      const { controller, platformRepo, res, next } = createController();
      const platform = createPlatform();
      platformRepo.platformExists.mockResolvedValue(true);

      await controller.createPlatform({ body: platform } as Request, res as Response, next);

      expect(platformRepo.platformExists).toHaveBeenCalledWith('weibo');
      expect(platformRepo.createPlatform).not.toHaveBeenCalled();
      expectErrorResponse(res, 409, {
        success: false,
        error: "Platform with id 'weibo' already exists",
        code: 'PLATFORM_EXISTS',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('creates a valid new platform and returns 201', async () => {
      const { controller, platformRepo, res, next } = createController();
      const platform = createPlatform();
      platformRepo.platformExists.mockResolvedValue(false);
      platformRepo.createPlatform.mockResolvedValue();

      await controller.createPlatform({ body: platform } as Request, res as Response, next);

      expect(platformRepo.createPlatform).toHaveBeenCalledWith(platform);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Platform created successfully',
        data: platform,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('updatePlatform', () => {
    it('returns 404 when updating a missing platform', async () => {
      const { controller, platformRepo, res, next } = createController();
      platformRepo.getPlatformById.mockResolvedValue(null);

      await controller.updatePlatform(
        { params: { id: 'missing' }, body: { name: 'Missing' } } as unknown as Request,
        res as Response,
        next
      );

      expect(platformRepo.updatePlatform).not.toHaveBeenCalled();
      expectErrorResponse(res, 404, {
        success: false,
        error: "Platform with id 'missing' not found",
        code: 'PLATFORM_NOT_FOUND',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('validates crawler config updates before writing', async () => {
      const { controller, platformRepo, res, next } = createController();
      platformRepo.getPlatformById.mockResolvedValue(createPlatform());

      await controller.updatePlatform(
        { params: { id: 'weibo' }, body: { config: { type: 'static' } } } as unknown as Request,
        res as Response,
        next
      );

      expect(platformRepo.updatePlatform).not.toHaveBeenCalled();
      expectErrorResponse(res, 400, {
        success: false,
        error: 'Invalid crawler configuration',
        code: 'VALIDATION_ERROR',
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining(['Config url is required and must be a string']),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('updates and returns the refreshed platform', async () => {
      const { controller, platformRepo, res, next } = createController();
      const existing = createPlatform();
      const updated = createPlatform({ name: 'Weibo Updated' });
      platformRepo.getPlatformById.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);
      platformRepo.updatePlatform.mockResolvedValue();

      await controller.updatePlatform(
        { params: { id: 'weibo' }, body: { name: 'Weibo Updated' } } as unknown as Request,
        res as Response,
        next
      );

      expect(platformRepo.updatePlatform).toHaveBeenCalledWith('weibo', { name: 'Weibo Updated' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Platform updated successfully',
        data: updated,
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('deletePlatform', () => {
    it('returns 404 when deleting a missing platform', async () => {
      const { controller, platformRepo, res, next } = createController();
      platformRepo.platformExists.mockResolvedValue(false);

      await controller.deletePlatform(
        { params: { id: 'missing' } } as unknown as Request,
        res as Response,
        next
      );

      expect(platformRepo.deletePlatform).not.toHaveBeenCalled();
      expectErrorResponse(res, 404, {
        success: false,
        error: "Platform with id 'missing' not found",
        code: 'PLATFORM_NOT_FOUND',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deletes an existing platform', async () => {
      const { controller, platformRepo, res, next } = createController();
      platformRepo.platformExists.mockResolvedValue(true);
      platformRepo.deletePlatform.mockResolvedValue();

      await controller.deletePlatform(
        { params: { id: 'weibo' } } as unknown as Request,
        res as Response,
        next
      );

      expect(platformRepo.deletePlatform).toHaveBeenCalledWith('weibo');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Platform deleted successfully',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('testPlatform', () => {
    it('returns 404 without creating a crawler when platform is missing', async () => {
      const { controller, platformRepo, res, next } = createController();
      platformRepo.getPlatformById.mockResolvedValue(null);

      await controller.testPlatform(
        { params: { id: 'missing' } } as unknown as Request,
        res as Response,
        next
      );

      expect(CrawlerFactory.createCrawler).not.toHaveBeenCalled();
      expectErrorResponse(res, 404, {
        success: false,
        error: "Platform with id 'missing' not found",
        code: 'PLATFORM_NOT_FOUND',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns crawler sample items when the platform test succeeds', async () => {
      const { controller, platformRepo, res, next } = createController();
      const platform = createPlatform();
      const newsItems: NewsItem[] = [
        {
          title: 'Hot item',
          url: 'https://example.com/hot',
          platformId: 'weibo',
          publishTime: new Date('2024-01-01T00:00:00.000Z'),
        },
      ];
      platformRepo.getPlatformById.mockResolvedValue(platform);
      (CrawlerFactory.createCrawler as jest.Mock).mockReturnValue({
        crawl: jest.fn().mockResolvedValue(newsItems),
      });

      await controller.testPlatform(
        { params: { id: 'weibo' } } as unknown as Request,
        res as Response,
        next
      );

      expect(CrawlerFactory.createCrawler).toHaveBeenCalledWith(platform);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          platformId: 'weibo',
          platformName: 'Weibo',
          itemsFound: 1,
          items: newsItems,
          error: null,
        }),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns a failed test payload when crawler creation or crawl fails', async () => {
      const { controller, platformRepo, res, next } = createController();
      const platform = createPlatform();
      platformRepo.getPlatformById.mockResolvedValue(platform);
      (CrawlerFactory.createCrawler as jest.Mock).mockImplementation(() => {
        throw new Error('selector failed');
      });

      await controller.testPlatform(
        { params: { id: 'weibo' } } as unknown as Request,
        res as Response,
        next
      );

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: expect.objectContaining({
          platformId: 'weibo',
          platformName: 'Weibo',
          itemsFound: 0,
          items: [],
          error: 'selector failed',
        }),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  it('passes repository errors to Express error middleware', async () => {
    const { controller, platformRepo, res, next } = createController();
    const error = new Error('database offline');
    platformRepo.getAllPlatforms.mockRejectedValue(error);

    await controller.getPlatforms({ query: {} } as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
