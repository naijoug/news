import React, { useEffect, useRef, useCallback } from 'react';
import { NewsItem, Platform } from '../types';
import NewsCard from './NewsCard';

interface TimelineProps {
  newsItems: NewsItem[];
  platforms: Platform[];
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
}

const Timeline: React.FC<TimelineProps> = ({
  newsItems,
  platforms,
  onLoadMore,
  loading,
  hasMore,
  error,
}) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  // 创建平台映射以便快速查找
  const platformMap = React.useMemo(() => {
    const map = new Map<string, Platform>();
    platforms.forEach((platform) => {
      map.set(platform.id, platform);
    });
    return map;
  }, [platforms]);

  // 无限滚动实现
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin: '100px', // 提前100px触发加载
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [handleObserver]);

  // 空状态
  if (!loading && newsItems.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
        <p className="text-gray-500 text-lg">暂无新闻数据</p>
        <p className="text-gray-400 text-sm mt-2">请稍后再试或选择其他平台</p>
      </div>
    );
  }

  // 错误状态
  if (error && newsItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <svg
          className="w-16 h-16 text-red-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-red-500 text-lg mb-2">加载失败</p>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative timeline-container">
      {/* 时间线容器 */}
      <div className="relative">
        {/* 垂直连接线 */}
        <div
          className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 timeline-line-mobile"
          aria-hidden="true"
        ></div>

        {/* 新闻列表 */}
        <div className="space-y-6">
          {newsItems.map((news, index) => {
            const platform = platformMap.get(news.platformId);
            
            // 如果找不到平台信息，跳过该新闻
            if (!platform) {
              console.warn(`Platform not found for news: ${news.platformId}`);
              return null;
            }

            return (
              <div key={`${news.id}-${index}`} className="relative pl-16 timeline-item-mobile">
                {/* 时间线圆点 */}
                <div
                  className="absolute left-4 top-6 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-md timeline-dot-mobile"
                  aria-hidden="true"
                ></div>

                {/* 新闻卡片 */}
                <NewsCard news={news} platform={platform} />
              </div>
            );
          })}
        </div>

        {/* 加载更多指示器 */}
        {hasMore && (
          <div
            ref={observerTarget}
            className="flex justify-center py-8"
          >
            {loading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>加载中...</span>
              </div>
            )}
          </div>
        )}

        {/* 没有更多数据提示 */}
        {!hasMore && newsItems.length > 0 && (
          <div className="flex justify-center py-8">
            <p className="text-gray-400 text-sm">没有更多新闻了</p>
          </div>
        )}
      </div>

      {/* 初始加载状态 */}
      {loading && newsItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <svg
            className="animate-spin h-12 w-12 text-blue-500 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-500">正在加载新闻...</p>
        </div>
      )}
    </div>
  );
};

export default Timeline;
