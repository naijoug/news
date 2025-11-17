import apiClient from './api';
import { Platform, ApiResponse, PlatformTestResult } from '../types';

// 获取平台列表
// 使用 HTTP 缓存机制（ETag + 304），不需要应用层缓存
export const fetchPlatforms = async (): Promise<ApiResponse<Platform[]>> => {
  try {
    const response = await apiClient.get<ApiResponse<Platform[]>>('/platforms');
    return response.data;
  } catch (error) {
    console.error('Error fetching platforms:', error);
    throw new Error('获取平台列表失败，请稍后重试');
  }
};

// 创建新平台
export const createPlatform = async (platform: Platform): Promise<Platform> => {
  try {
    const response = await apiClient.post<{ success: boolean; data: Platform }>('/platforms', platform);
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
