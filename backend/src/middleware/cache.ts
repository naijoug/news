import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Simple in-memory cache entry
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  etag: string;
}

/**
 * In-memory cache store
 */
class CacheStore {
  private store: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Get cached data
   */
  get(key: string): CacheEntry | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache has expired
    const now = Date.now();
    if (now - entry.timestamp > this.defaultTTL) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Set cache data
   */
  set(key: string, data: any, etag: string): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      etag,
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.store.size;
  }
}

// Singleton cache instance
const cacheStore = new CacheStore();

// Clear expired entries every minute. Do not keep CLI/test processes alive only
// because the cache maintenance timer exists.
const cacheCleanupTimer = setInterval(() => {
  cacheStore.clearExpired();
}, 60 * 1000);
cacheCleanupTimer.unref?.();

/**
 * Generate ETag from data
 */
const generateETag = (data: any): string => {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`;
};

/**
 * Cache middleware with ETag support
 * Implements HTTP caching best practices:
 * - Server-side caching for performance
 * - ETag for cache validation
 * - 304 Not Modified for bandwidth optimization
 * - Cache-Control headers for client-side caching
 */
export const cacheMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    next();
    return;
  }

  // Generate cache key from URL and query params
  const cacheKey = `${req.path}:${JSON.stringify(req.query)}`;

  // Try to get cached response
  const cachedEntry = cacheStore.get(cacheKey);

  if (cachedEntry) {
    // Check if client has a cached version (If-None-Match header)
    const clientETag = req.headers['if-none-match'];

    if (clientETag && clientETag === cachedEntry.etag) {
      // Client has the latest version, return 304 Not Modified
      res.status(304).end();
      return;
    }

    // Client doesn't have the latest version or no ETag provided
    // Return cached data with ETag
    res.setHeader('ETag', cachedEntry.etag);
    res.setHeader('Cache-Control', 'public, max-age=60'); // 客户端可缓存 60 秒
    res.status(200).json(cachedEntry.data);
    return;
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to cache response
  res.json = function (data: any) {
    // Only cache successful responses
    if (data && data.success !== false) {
      const etag = generateETag(data);
      cacheStore.set(cacheKey, data, etag);

      // Set cache headers
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=60'); // 客户端可缓存 60 秒
    }

    return originalJson(data);
  };

  next();
};

/**
 * Clear cache manually
 */
export const clearCache = (): void => {
  cacheStore.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: cacheStore.size(),
  };
};
