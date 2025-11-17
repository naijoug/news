import request from 'supertest';
import express from 'express';
import apiRoutes from '../routes';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import { cacheMiddleware } from '../middleware/cache';
import { initializeDatabase } from '../utils/database';
import { NewsRepository } from '../repositories/NewsRepository';
import { PlatformRepository } from '../repositories/PlatformRepository';
import { NewsItem, Platform } from '../types';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', cacheMiddleware, apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('API Integration Tests', () => {
  let app: express.Application;
  let newsRepo: NewsRepository;
  let platformRepo: PlatformRepository;

  beforeAll(async () => {
    // Initialize test database
    await initializeDatabase();
    app = createTestApp();
    newsRepo = new NewsRepository();
    platformRepo = new PlatformRepository();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    // Note: In a real scenario, you'd use a separate test database
  });

  describe('GET /api/platforms', () => {
    it('should return all platforms', async () => {
      const response = await request(app)
        .get('/api/platforms')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return only enabled platforms when enabled=true', async () => {
      const response = await request(app)
        .get('/api/platforms?enabled=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All platforms should be enabled
      response.body.data.forEach((platform: Platform) => {
        expect(platform.enabled).toBe(true);
      });
    });

    it('should return 400 for invalid enabled parameter', async () => {
      const response = await request(app)
        .get('/api/platforms?enabled=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/news', () => {
    it('should return news items with default pagination', async () => {
      const response = await request(app)
        .get('/api/news')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter news by platform', async () => {
      const response = await request(app)
        .get('/api/news?platforms=weibo,zhihu')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/news?limit=10&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(0);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/news?limit=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for limit out of range', async () => {
      const response = await request(app)
        .get('/api/news?limit=200')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for negative offset', async () => {
      const response = await request(app)
        .get('/api/news?offset=-1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should filter by time range', async () => {
      const startTime = new Date('2024-01-01').toISOString();
      const endTime = new Date('2024-12-31').toISOString();

      const response = await request(app)
        .get(`/api/news?startTime=${startTime}&endTime=${endTime}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid time format', async () => {
      const response = await request(app)
        .get('/api/news?startTime=invalid-date')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when startTime is after endTime', async () => {
      const startTime = new Date('2024-12-31').toISOString();
      const endTime = new Date('2024-01-01').toISOString();

      const response = await request(app)
        .get(`/api/news?startTime=${startTime}&endTime=${endTime}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/crawl/trigger', () => {
    it('should trigger crawl successfully', async () => {
      const response = await request(app)
        .post('/api/crawl/trigger')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
    }, 15000); // Increase timeout to 15 seconds for crawling

    it('should return 409 if crawl is already in progress', async () => {
      // Trigger first crawl (don't await it)
      const firstRequest = request(app).post('/api/crawl/trigger');
      
      // Wait a bit to ensure first crawl starts
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Trigger second crawl while first is in progress
      const secondResponse = await request(app).post('/api/crawl/trigger');

      // Second request should return 409
      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.code).toBe('CRAWL_IN_PROGRESS');
      
      // Wait for first crawl to complete
      await firstRequest;
    }, 15000);
  });

  describe('GET /api/crawl/status', () => {
    it('should return crawler status', async () => {
      const response = await request(app)
        .get('/api/crawl/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('schedulerRunning');
      expect(response.body.data).toHaveProperty('crawlInProgress');
      expect(typeof response.body.data.schedulerRunning).toBe('boolean');
      expect(typeof response.body.data.crawlInProgress).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/crawl/trigger')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      // Express body-parser returns 400 for malformed JSON
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });
});
