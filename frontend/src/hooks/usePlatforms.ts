import { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { fetchPlatforms } from '../services/platformService';
import { Platform } from '../types';

// 自定义 Hook 用于管理平台数据
export const usePlatforms = () => {
  const {
    platforms,
    selectedPlatforms,
    loading,
    error,
    setPlatforms,
    setSelectedPlatforms,
    setLoading,
    setError,
  } = useAppContext();

  // 加载平台列表
  const loadPlatforms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchPlatforms();
      setPlatforms(response.data);

      // 默认选中所有启用的平台
      if (selectedPlatforms.length === 0) {
        const enabledPlatformIds = response.data
          .filter((p: Platform) => p.enabled)
          .map((p: Platform) => p.id);
        setSelectedPlatforms(enabledPlatformIds);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载平台列表失败';
      setError(errorMessage);
      console.error('Failed to load platforms:', err);
    } finally {
      setLoading(false);
    }
  }, [setPlatforms, setSelectedPlatforms, setLoading, setError, selectedPlatforms.length]);

  // 切换平台选择
  const togglePlatform = useCallback(
    (platformId: string) => {
      setSelectedPlatforms((prev: string[]) => {
        if (prev.includes(platformId)) {
          return prev.filter((id: string) => id !== platformId);
        } else {
          return [...prev, platformId];
        }
      });
    },
    [setSelectedPlatforms]
  );

  // 全选平台
  const selectAllPlatforms = useCallback(() => {
    const allPlatformIds = platforms.filter(p => p.enabled).map(p => p.id);
    setSelectedPlatforms(allPlatformIds);
  }, [platforms, setSelectedPlatforms]);

  // 取消全选
  const deselectAllPlatforms = useCallback(() => {
    setSelectedPlatforms([]);
  }, [setSelectedPlatforms]);

  // 组件挂载时加载平台列表
  useEffect(() => {
    if (platforms.length === 0) {
      loadPlatforms();
    }
  }, [loadPlatforms, platforms.length]);

  return {
    platforms,
    selectedPlatforms,
    loading,
    error,
    loadPlatforms,
    togglePlatform,
    selectAllPlatforms,
    deselectAllPlatforms,
    setSelectedPlatforms,
  };
};
