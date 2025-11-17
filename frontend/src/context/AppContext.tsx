import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NewsItem, Platform } from '../types';

// 应用状态接口
interface AppState {
  selectedPlatforms: string[];
  newsData: NewsItem[];
  platforms: Platform[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

// Context 操作接口
interface AppContextType extends AppState {
  setSelectedPlatforms: React.Dispatch<React.SetStateAction<string[]>>;
  setNewsData: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  appendNewsData: (news: NewsItem[]) => void;
  setPlatforms: React.Dispatch<React.SetStateAction<Platform[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  resetNews: () => void;
}

// 创建 Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider 组件
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // 追加新闻数据（用于无限滚动）
  const appendNewsData = useCallback((news: NewsItem[]) => {
    setNewsData((prev) => [...prev, ...news]);
  }, []);

  // 重置新闻数据
  const resetNews = useCallback(() => {
    setNewsData([]);
    setHasMore(true);
    setError(null);
  }, []);

  const value: AppContextType = {
    selectedPlatforms,
    newsData,
    platforms,
    loading,
    error,
    hasMore,
    setSelectedPlatforms,
    setNewsData,
    appendNewsData,
    setPlatforms,
    setLoading,
    setError,
    setHasMore,
    resetNews,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 自定义 Hook 用于访问 Context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
