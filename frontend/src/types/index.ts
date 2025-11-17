// 新闻条目类型
export interface NewsItem {
  id: number;
  title: string;
  url: string;
  platform_id: string;
  publish_time: string;
  hot_score?: number;
  crawl_time: string;
}

// 爬虫配置类型
export interface CrawlerConfig {
  type: 'static' | 'dynamic' | 'api';
  url: string;
  selector?: string;
  apiConfig?: {
    endpoint: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    params?: Record<string, any>;
    body?: any;
    dataPath: string;
  };
  parser: {
    title: string;
    url: string;
    time?: string;
    hotScore?: string;
    itemEndpoint?: string;
  };
  rateLimit?: number;
  timeout?: number;
}

// 平台类型
export interface Platform {
  id: string;
  name: string;
  icon_url: string;
  enabled: boolean;
  config?: CrawlerConfig;
  created_at?: string;
  updated_at?: string;
}

// 平台测试结果类型
export interface PlatformTestResult {
  platformId: string;
  platformName: string;
  itemsFound: number;
  duration: string;
  items: NewsItem[];
  error?: string;
}

// 新闻查询过滤器
export interface NewsFilter {
  platformIds?: string[];
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

// API 响应类型
export interface ApiResponse<T> {
  data: T;
  total?: number;
}

// 错误响应类型
export interface ApiError {
  error: string;
  code: string;
}
