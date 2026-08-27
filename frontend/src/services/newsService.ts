import apiClient from './api';
import { NewsItem, NewsFilter, ApiResponse } from '../types';

// 获取新闻列表
// 使用 HTTP 缓存机制（ETag + 304），不需要应用层缓存
export const fetchNews = async (filter?: NewsFilter): Promise<ApiResponse<NewsItem[]>> => {
  try {
    // 构建查询参数
    const params: Record<string, string | number> = {};

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

    return response.data;
  } catch (error) {
    console.error('Error fetching news:', error);
    throw new Error('获取新闻数据失败，请稍后重试');
  }
};

// 手动触发爬取（管理员功能）
export const triggerCrawl = async (): Promise<void> => {
  try {
    await apiClient.post('/crawl/trigger');
  } catch (error) {
    console.error('Error triggering crawl:', error);
    throw new Error('触发爬取失败');
  }
};
