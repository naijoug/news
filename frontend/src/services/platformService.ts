import apiClient from './api';
import { Platform, ApiResponse, PlatformTestResult } from '../types';

// 本地缓存
interface CacheEntry {
  data: ApiResponse<Platform[]>;
  timestamp: number;
}

let platformCache: CacheEntry | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 分钟缓存（平台列表变化较少）

// 检查缓存是否有效
const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_DURATION;
};

// 获取平台列表
export const fetchPlatforms = async (
  useCache: boolean = true
): Promise<ApiResponse<Platform[]>> => {
  // 检查缓存
  if (useCache && platformCache && isCacheValid(platformCache)) {
    console.log('Using cached platform data');
    return platformCache.data;
  }

  try {
    const response = await apiClient.get<ApiResponse<Platform[]>>('/platforms');

    // 更新缓存
    platformCache = {
      data: response.data,
      timestamp: Date.now(),
    };

    return response.data;
  } catch (error) {
    console.error('Error fetching platforms:', error);
    throw new Error('获取平台列表失败，请稍后重试');
  }
};

// 清除缓存
export const clearPlatformCache = (): void => {
  platformCache = null;
};

// 重新加载平台列表（强制刷新）
export const reloadPlatforms = async (): Promise<ApiResponse<Platform[]>> => {
  clearPlatformCache();
  return fetchPlatforms(false);
};

// 创建新平台
export const createPlatform = async (platform: Platform): Promise<Platform> => {
  try {
    const response = await apiClient.post<{ success: boolean; data: Platform }>('/platforms', platform);
    clearPlatformCache(); // 清除缓存以便重新加载
    return response.data.data;
  } catch (error: any) {
    console.error('Error creating platform:', error);
    const message = error.response?.data?.error || '创建平台失败，请稍后重试';
    throw new Error(message);
  }
};

// 更新平台
export const updatePlatform = async (id: string, updates: Partial<Platform>): Promise<Platform> => {
  try {
    const response = await apiClient.put<{ success: boolean; data: Platform }>(`/platforms/${id}`, updates);
    clearPlatformCache(); // 清除缓存以便重新加载
    return response.data.data;
  } catch (error: any) {
    console.error('Error updating platform:', error);
    const message = error.response?.data?.error || '更新平台失败，请稍后重试';
    throw new Error(message);
  }
};

// 删除平台
export const deletePlatform = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/platforms/${id}`);
    clearPlatformCache(); // 清除缓存以便重新加载
  } catch (error: any) {
    console.error('Error deleting platform:', error);
    const message = error.response?.data?.error || '删除平台失败，请稍后重试';
    throw new Error(message);
  }
};

// 测试平台爬虫
export const testPlatform = async (id: string): Promise<PlatformTestResult> => {
  try {
    const response = await apiClient.post<{ success: boolean; data: PlatformTestResult }>(`/platforms/${id}/test`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error testing platform:', error);
    const message = error.response?.data?.error || '测试平台失败，请稍后重试';
    throw new Error(message);
  }
};
