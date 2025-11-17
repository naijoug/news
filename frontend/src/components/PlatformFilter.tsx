import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from '../types';

interface PlatformFilterProps {
  platforms: Platform[];
  selectedPlatforms: string[];
  onChange: (platformIds: string[]) => void;
}

const PlatformFilter: React.FC<PlatformFilterProps> = ({
  platforms,
  selectedPlatforms,
  onChange,
}) => {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedPlatforms);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // 同步外部选择状态
  useEffect(() => {
    setLocalSelection(selectedPlatforms);
  }, [selectedPlatforms]);

  // 防抖处理（300ms）
  const debouncedOnChange = useCallback(
    (newSelection: string[]) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        onChange(newSelection);
      }, 300);

      setDebounceTimer(timer);
    },
    [debounceTimer, onChange]
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // 处理单个平台的选择/取消
  const handleTogglePlatform = (platformId: string) => {
    const newSelection = localSelection.includes(platformId)
      ? localSelection.filter((id) => id !== platformId)
      : [...localSelection, platformId];

    setLocalSelection(newSelection);
    debouncedOnChange(newSelection);
  };

  // 全选
  const handleSelectAll = () => {
    const allPlatformIds = platforms
      .filter((p) => p.enabled)
      .map((p) => p.id);
    setLocalSelection(allPlatformIds);
    debouncedOnChange(allPlatformIds);
  };

  // 全不选
  const handleDeselectAll = () => {
    setLocalSelection([]);
    debouncedOnChange([]);
  };

  // 判断是否全选
  const isAllSelected = platforms.filter((p) => p.enabled).length === localSelection.length;
  const isNoneSelected = localSelection.length === 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      {/* 标题和快捷操作 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900">平台筛选</h2>
          {/* Collapse button for tablet */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="md:inline-flex lg:hidden items-center text-gray-500 hover:text-gray-700 hidden"
            aria-label={isCollapsed ? '展开筛选器' : '收起筛选器'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSelectAll}
            disabled={isAllSelected}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed touch-target"
          >
            全选
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={handleDeselectAll}
            disabled={isNoneSelected}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed touch-target"
          >
            全不选
          </button>
        </div>
      </div>

      {/* 平台列表 - Collapsible on tablet */}
      <div 
        className={`platform-filter-collapsible overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'max-h-0' : 'max-h-[2000px]'
        }`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {platforms
          .filter((platform) => platform.enabled)
          .map((platform) => {
            const isSelected = localSelection.includes(platform.id);

            return (
              <label
                key={platform.id}
                className={`
                  flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all touch-target
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {/* 复选框 */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleTogglePlatform(platform.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />

                {/* 平台图标 */}
                <img
                  src={platform.icon_url}
                  alt={platform.name}
                  className="w-5 h-5 object-contain flex-shrink-0"
                  onError={(e) => {
                    // 图标加载失败时显示默认图标
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/%3E%3C/svg%3E';
                  }}
                />

                {/* 平台名称 */}
                <span
                  className={`text-sm md:text-xs lg:text-sm font-medium truncate ${
                    isSelected ? 'text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {platform.name}
                </span>
              </label>
            );
          })}
        </div>

        {/* 选中数量提示 */}
        <div className="mt-4 text-sm text-gray-500">
          已选择 {localSelection.length} / {platforms.filter((p) => p.enabled).length} 个平台
        </div>

        {/* 空状态 */}
        {platforms.filter((p) => p.enabled).length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>暂无可用平台</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformFilter;
