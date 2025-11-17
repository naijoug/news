import React from 'react';
import { NewsItem, Platform } from '../types';
import LazyImage from './LazyImage';

interface NewsCardProps {
  news: NewsItem;
  platform: Platform;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, platform }) => {
  // 格式化时间显示
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    // 超过7天显示具体日期
    return date.toLocaleDateString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 处理点击事件
  const handleClick = () => {
    window.open(news.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 lg:p-5 cursor-pointer group touch-target"
      role="article"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* 平台信息和时间 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {/* 平台图标 */}
          <LazyImage
            src={platform.iconUrl}
            alt={platform.name}
            className="w-5 h-5 object-contain"
            onError={(e) => {
              // 图标加载失败时显示默认图标
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/%3E%3C/svg%3E';
            }}
          />
          {/* 平台名称 */}
          <span className="text-sm font-medium text-gray-600">
            {platform.name}
          </span>
        </div>
        {/* 发布时间 */}
        <span className="text-xs text-gray-400">
          {formatTime(news.publishTime)}
        </span>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-gray-100 mb-3"></div>

      {/* 新闻标题 */}
      <h3 className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
        {news.title}
      </h3>

      {/* 热度信息（如果有） */}
      {news.hotScore !== undefined && news.hotScore !== null && (
        <div className="mt-2 flex items-center">
          <svg
            className="w-4 h-4 text-orange-500 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs text-gray-500">
            {news.hotScore.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default NewsCard;
