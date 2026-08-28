import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { cacheMiddleware, clearCache, getCacheStats } from '../middleware/cache';

const md5Of = (data: unknown): string =>
  `"${crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')}"`;

describe('Cache Middleware Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let setHeaderMock: jest.Mock;
  let endMock: jest.Mock;
  let headers: Record<string, unknown>;

  const resetMocks = () => {
    headers = {};
    jsonMock = jest.fn();
    endMock = jest.fn();
    setHeaderMock = jest.fn((name: string, value: unknown) => {
      headers[name.toLowerCase()] = value;
    });
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, end: endMock });

    mockRequest = {
      method: 'GET',
      path: '/api/news',
      query: { limit: '10' },
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock as unknown as Response['json'],
      end: endMock,
      setHeader: setHeaderMock,
    };

    mockNext = jest.fn();
  };

  beforeEach(() => {
    clearCache();
    resetMocks();
  });

  describe('non-GET requests', () => {
    it('should skip caching and call next for POST requests', () => {
      mockRequest.method = 'POST';

      cacheMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
      expect(getCacheStats().size).toBe(0);
    });
  });

  describe('cache miss', () => {
    it('should call next and cache a successful GET response with ETag', () => {
      const originalJson = jest.fn();
      mockResponse.json = originalJson as unknown as Response['json'];

      cacheMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);

      const payload = { success: true, data: [] };
      (mockResponse.json as jest.Mock)(payload);

      expect(getCacheStats().size).toBe(1);
      expect(originalJson).toHaveBeenCalledWith(payload);
      expect(headers['etag']).toBe(md5Of(payload));
      expect(headers['cache-control']).toBe('public, max-age=60');
    });

    it('should not cache a failed response', () => {
      cacheMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      const payload = { success: false, error: 'boom' };
      (mockResponse.json as jest.Mock)(payload);

      expect(getCacheStats().size).toBe(0);
      expect(headers['etag']).toBeUndefined();
      expect(headers['cache-control']).toBeUndefined();
    });
  });

  describe('cache hit', () => {
    const primeCache = (): { payload: unknown; etag: string } => {
      cacheMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      const payload = { success: true, data: [{ id: 'n1' }] };
      (mockResponse.json as jest.Mock)(payload);
      const etag = headers['etag'] as string;
      expect(etag).toBe(md5Of(payload));

      resetMocks();
      return { payload, etag };
    };

    it('should return cached payload with ETag on second GET', () => {
      const { payload } = primeCache();

      cacheMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(JSON.parse(JSON.stringify(payload)));
      expect(headers['etag']).toBe(md5Of(payload));
      expect(headers['cache-control']).toBe('public, max-age=60');
    });

    it('should return 304 when If-None-Match matches the stored ETag', () => {
      const { etag } = primeCache();
      mockRequest.headers = { 'if-none-match': etag };

      cacheMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(304);
      expect(endMock).toHaveBeenCalledTimes(1);
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should serve fresh cached data when If-None-Match does not match', () => {
      primeCache();
      mockRequest.headers = { 'if-none-match': '"stale-etag"' };

      cacheMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache key isolation', () => {
    it('should keep different query params in separate cache entries', () => {
      cacheMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      (mockResponse.json as jest.Mock)({ success: true, data: [] });
      expect(getCacheStats().size).toBe(1);

      const secondNext = jest.fn();
      const secondJson = jest.fn();
      const secondResponse: Partial<Response> = {
        status: jest.fn().mockReturnValue({ json: secondJson }),
        json: secondJson as unknown as Response['json'],
        end: jest.fn(),
        setHeader: jest.fn(),
      };
      const secondRequest: Partial<Request> = {
        method: 'GET',
        path: '/api/news',
        query: { limit: '20' },
        headers: {},
      };

      cacheMiddleware(secondRequest as Request, secondResponse as Response, secondNext);

      // Different query string means a cache miss, not a hit on the limit=10 entry
      expect(secondNext).toHaveBeenCalledTimes(1);
      (secondResponse.json as jest.Mock)({ success: true, data: [] });
      expect(getCacheStats().size).toBe(2);
    });
  });
});
