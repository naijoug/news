import apiClient from './api';
import { NewsItem, NewsFilter, ApiResponse } from '../types';

// 本地缓存
interface CacheEntry {
  data: ApiResponse<NewsItem[]>;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 分钟缓存

// 生成缓存键
const getCacheKey = (filter?: NewsFilter): string => {
  return JSON.stringify(filter || {});
};

// 检查缓存是否有效
const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_DURATION;
};

// 获取新闻列表
export const fetchNews = async (
  filter?: NewsFilter,
  useCache: boolean = true
): Promise<ApiResponse<NewsItem[]>> => {
  const cacheKey = getCacheKey(filter);

  // 检查缓存
  if (useCache) {
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && isCacheValid(cachedEntry)) {
      console.log('Using cached news data');
      return cachedEntry.data;
    }
  }

  try {
    // 构建查询参数
    const params: Record<string, any> = {};
    
    if (filter?.platformIds && filter.platformIds.length > 0) {
      params.platforms = filter.platformIds.join(',');
    }
    if (filter?.startTime) {
      params.startTime = filter.startTime;
    }
    if (filter?.endTime) {
      params.endTime = filter.endTime;
    }
    if (filter?.limit) {
      params.limit = filter.limit;
    }
    if (filter?.offset) {
      params.offset = filter.offset;
    }

    const response = await apiClient.get<ApiResponse<NewsItem[]>>('/news', { params });

    // 更新缓存
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching news:', error);
    throw new Error('获取新闻数据失败，请稍后重试');
  }
};

// 清除缓存
export const clearNewsCache = (): void => {
  cache.clear();
};

// 手动触发爬取（管理员功能）
export const triggerCrawl = async (): Promise<void> => {
  try {
    await apiClient.post('/crawl/trigger');
    // 清除缓存以获取最新数据
    clearNewsCache();
  } catch (error) {
    console.error('Error triggering crawl:', error);
    throw new Error('触发爬取失败');
  }
};
