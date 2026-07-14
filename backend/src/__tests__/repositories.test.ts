import { NewsRepository } from '../repositories/NewsRepository';
import { PlatformRepository } from '../repositories/PlatformRepository';
import { closeDatabase, initializeDatabase } from '../utils/database';
import { NewsItem, Platform } from '../types';

describe('Repository Tests', () => {
  let newsRepo: NewsRepository;
  let platformRepo: PlatformRepository;

  beforeAll(async () => {
    await initializeDatabase();
    newsRepo = new NewsRepository();
    platformRepo = new PlatformRepository();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('NewsRepository', () => {
    let testPlatformId: string;
    let testNewsItem: NewsItem;

    beforeAll(async () => {
      // Create a test platform first to satisfy foreign key constraint
      testPlatformId = 'test-platform-' + Date.now();
      const testPlatform: Platform = {
        id: testPlatformId,
        name: 'Test Platform for News',
        iconUrl: '/icons/test.svg',
        enabled: true,
        config: {
          type: 'static',
          url: 'https://example.com',
          parser: {
            title: '.title',
            url: '.link',
          },
        },
      };
      await platformRepo.createPlatform(testPlatform);

      testNewsItem = {
        title: 'Test News',
        url: 'https://example.com/test-' + Date.now(),
        platformId: testPlatformId,
        publishTime: new Date(),
        hotScore: 100,
      };
    });

    it('should save news items', async () => {
      await expect(newsRepo.saveNews([testNewsItem])).resolves.not.toThrow();
    });

    it('should get news items', async () => {
      const news = await newsRepo.getNews({ limit: 10, offset: 0 });
      expect(Array.isArray(news)).toBe(true);
    });

    it('should filter news by platform', async () => {
      const news = await newsRepo.getNews({
        platformIds: ['test-platform'],
        limit: 10,
      });
      expect(Array.isArray(news)).toBe(true);
    });

    it('should get news count', async () => {
      const count = await newsRepo.getNewsCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should handle duplicate URLs', async () => {
      const duplicateItem = { ...testNewsItem };
      // Should not throw error due to INSERT OR IGNORE
      await expect(newsRepo.saveNews([duplicateItem])).resolves.not.toThrow();
    });
  });

  describe('PlatformRepository', () => {
    const testPlatform: Platform = {
      id: 'test-platform-' + Date.now(),
      name: 'Test Platform',
      iconUrl: '/icons/test.svg',
      enabled: true,
      config: {
        type: 'static',
        url: 'https://example.com',
        parser: {
          title: '.title',
          url: '.link',
        },
      },
    };

    it('should create a platform', async () => {
      await expect(platformRepo.createPlatform(testPlatform)).resolves.not.toThrow();
    });

    it('should get all platforms', async () => {
      const platforms = await platformRepo.getAllPlatforms();
      expect(Array.isArray(platforms)).toBe(true);
      expect(platforms.length).toBeGreaterThan(0);
    });

    it('should get only enabled platforms', async () => {
      const platforms = await platformRepo.getAllPlatforms(true);
      expect(Array.isArray(platforms)).toBe(true);
      platforms.forEach(platform => {
        expect(platform.enabled).toBe(true);
      });
    });

    it('should get platform by ID', async () => {
      const platform = await platformRepo.getPlatformById(testPlatform.id);
      expect(platform).not.toBeNull();
      if (platform) {
        expect(platform.id).toBe(testPlatform.id);
        expect(platform.name).toBe(testPlatform.name);
      }
    });

    it('should return null for non-existent platform', async () => {
      const platform = await platformRepo.getPlatformById('non-existent');
      expect(platform).toBeNull();
    });

    it('should check if platform exists', async () => {
      const exists = await platformRepo.platformExists(testPlatform.id);
      expect(exists).toBe(true);

      const notExists = await platformRepo.platformExists('non-existent');
      expect(notExists).toBe(false);
    });

    it('should update platform', async () => {
      await expect(
        platformRepo.updatePlatform(testPlatform.id, {
          name: 'Updated Test Platform',
        })
      ).resolves.not.toThrow();

      const updated = await platformRepo.getPlatformById(testPlatform.id);
      expect(updated?.name).toBe('Updated Test Platform');
    });

    it('should delete platform', async () => {
      await expect(platformRepo.deletePlatform(testPlatform.id)).resolves.not.toThrow();

      const deleted = await platformRepo.getPlatformById(testPlatform.id);
      expect(deleted).toBeNull();
    });
  });
});
