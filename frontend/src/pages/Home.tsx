import React, { useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNews } from '../hooks/useNews';
import { usePlatforms } from '../hooks/usePlatforms';
import Timeline from '../components/Timeline';
import PlatformFilter from '../components/PlatformFilter';
import { OfflineNotice } from '../components';
import { NewsFilter } from '../types';

const Home: React.FC = () => {
  const {
    selectedPlatforms,
    setSelectedPlatforms,
    newsData,
    platforms,
    loading,
    error,
    hasMore,
    resetNews,
  } = useAppContext();

  const { loadNews, loadMore } = useNews();
  const { loadPlatforms } = usePlatforms();
  
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // 初始化：加载平台列表
  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  // 当平台列表加载完成后，默认选择所有平台
  useEffect(() => {
    if (platforms.length > 0 && selectedPlatforms.length === 0) {
      const allPlatformIds = platforms.filter((p) => p.enabled).map((p) => p.id);
      setSelectedPlatforms(allPlatformIds);
    }
  }, [platforms, selectedPlatforms.length, setSelectedPlatforms]);

  // 当选中的平台改变时，重新加载新闻
  useEffect(() => {
    if (selectedPlatforms.length > 0) {
      resetNews();
      const filter: NewsFilter = {
        platformIds: selectedPlatforms,
        limit: 50,
        offset: 0,
      };
      loadNews(filter, false);
    }
  }, [selectedPlatforms, loadNews, resetNews]);

  // 处理平台筛选变化
  const handlePlatformChange = useCallback(
    (platformIds: string[]) => {
      setSelectedPlatforms(platformIds);
    },
    [setSelectedPlatforms]
  );

  // 处理加载更多
  const handleLoadMore = useCallback(() => {
    loadMore(newsData.length);
  }, [loadMore, newsData.length]);

  // 处理重试
  const handleRetry = useCallback(() => {
    resetNews();
    const filter: NewsFilter = {
      platformIds: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      limit: 50,
      offset: 0,
    };
    loadNews(filter, false);
  }, [selectedPlatforms, loadNews, resetNews]);

  return (
    <>
      {/* 离线状态提示 */}
      <OfflineNotice />
      
      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 平台筛选器 - Desktop/Tablet: sticky, Mobile: hidden (use drawer) */}
        {platforms.length > 0 && (
          <div className="platform-filter-sticky hidden md:block">
            <PlatformFilter
              platforms={platforms}
              selectedPlatforms={selectedPlatforms}
              onChange={handlePlatformChange}
            />
          </div>
        )}

        {/* 全局错误提示 */}
        {error && newsData.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">加载失败</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
                >
                  点击重试
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 时间线 */}
        <Timeline
          newsItems={newsData}
          platforms={platforms}
          onLoadMore={handleLoadMore}
          loading={loading}
          hasMore={hasMore}
          error={error}
        />

        {/* 平台加载状态 */}
        {platforms.length === 0 && !error && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4"
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
              <p className="text-gray-500">正在加载平台列表...</p>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Platform Filter Drawer */}
      {platforms.length > 0 && (
        <>
          {/* Overlay */}
          <div
            className={`platform-drawer-overlay md:hidden ${isDrawerOpen ? 'open' : ''}`}
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
          
          {/* Drawer */}
          <div className={`platform-drawer md:hidden ${isDrawerOpen ? 'open' : ''}`}>
            {/* Drawer handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">平台筛选</h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 touch-target"
                aria-label="关闭筛选器"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            {/* Drawer content */}
            <div className="p-4">
              <PlatformFilter
                platforms={platforms}
                selectedPlatforms={selectedPlatforms}
                onChange={(platformIds) => {
                  handlePlatformChange(platformIds);
                  // Auto-close drawer after selection on mobile
                  setTimeout(() => setIsDrawerOpen(false), 300);
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Mobile filter button - fixed at bottom */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="md:hidden fixed bottom-6 right-6 flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors touch-target z-40"
        aria-label="打开筛选器"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="text-sm">筛选</span>
        {selectedPlatforms.length > 0 && (
          <span className="bg-white text-blue-600 text-xs rounded-full px-2 py-0.5 font-semibold">
            {selectedPlatforms.length}
          </span>
        )}
      </button>
    </>
  );
};

export default Home;
