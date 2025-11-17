import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { fetchNews } from '../services/newsService';
import { NewsFilter } from '../types';

// 自定义 Hook 用于管理新闻数据
export const useNews = () => {
  const {
    newsData,
    loading,
    error,
    hasMore,
    selectedPlatforms,
    setNewsData,
    appendNewsData,
    setLoading,
    setError,
    setHasMore,
    resetNews,
  } = useAppContext();

  // 加载新闻数据
  const loadNews = useCallback(
    async (filter?: NewsFilter, append: boolean = false) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchNews(filter);
        
        if (append) {
          appendNewsData(response.data);
        } else {
          setNewsData(response.data);
        }

        // 判断是否还有更多数据
        const limit = filter?.limit || 50;
        setHasMore(response.data.length >= limit);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '加载新闻失败';
        setError(errorMessage);
        console.error('Failed to load news:', err);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setNewsData, appendNewsData, setHasMore]
  );

  // 加载更多新闻（用于无限滚动）
  const loadMore = useCallback(
    async (offset: number) => {
      if (loading || !hasMore) return;

      const filter: NewsFilter = {
        platformIds: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
        limit: 50,
        offset,
      };

      await loadNews(filter, true);
    },
    [loading, hasMore, selectedPlatforms, loadNews]
  );

  // 刷新新闻（重新加载）
  const refreshNews = useCallback(async () => {
    resetNews();
    const filter: NewsFilter = {
      platformIds: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      limit: 50,
      offset: 0,
    };
    await loadNews(filter, false);
  }, [selectedPlatforms, loadNews, resetNews]);

  return {
    newsData,
    loading,
    error,
    hasMore,
    loadNews,
    loadMore,
    refreshNews,
  };
};
