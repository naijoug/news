export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface NewsItem {
  id?: number;
  title: string;
  url: string;
  platformId: string;
  publishTime: Date;
  hotScore?: number;
  crawlTime?: Date;
}

export interface Platform {
  id: string;
  name: string;
  iconUrl: string;
  enabled: boolean;
  config: CrawlerConfig;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CrawlerConfig {
  type: 'static' | 'dynamic' | 'api';
  url: string;
  selector?: string;
  apiConfig?: {
    endpoint: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    params?: Record<string, JsonValue>;
    body?: JsonValue;
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

export interface NewsFilter {
  platformIds?: string[];
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}
