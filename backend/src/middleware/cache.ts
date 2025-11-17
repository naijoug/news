import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory cache entry
 */
interface CacheEntry {
  data: any;
  timestamp: number;
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
  get(key: string): any | null {
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

    return entry.data;
  }

  /**
   * Set cache data
   */
  set(key: string, data: any): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
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

// Clear expired entries every minute
setInterval(() => {
  cacheStore.clearExpired();
}, 60 * 1000);

/**
 * Cache middleware
 * Caches GET requests for specified duration
 */
export const cacheMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    next();
    return;
  }

  // Generate cache key from URL and query params
  const cacheKey = `${req.path}:${JSON.stringify(req.query)}`;

  // Try to get cached response
  const cachedData = cacheStore.get(cacheKey);
  if (cachedData) {
    res.json(cachedData);
    return;
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to cache response
  res.json = function (data: any) {
    // Only cache successful responses
    if (data && data.success !== false) {
      cacheStore.set(cacheKey, data);
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
