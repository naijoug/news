import React, { useState, useEffect } from 'react';
import { Platform, PlatformTestResult } from '../types';
import {
  fetchPlatforms,
  createPlatform,
  updatePlatform,
  deletePlatform,
  testPlatform,
} from '../services/platformService';
import PlatformForm from './PlatformForm';
import PlatformTestModal from './PlatformTestModal';

const PlatformManagement: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [testResult, setTestResult] = useState<PlatformTestResult | null>(null);
  const [testingPlatformId, setTestingPlatformId] = useState<string | null>(null);

  // 加载平台列表
  const loadPlatforms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchPlatforms(false);
      setPlatforms(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatforms();
  }, []);

  // 处理创建/更新平台
  const handleSavePlatform = async (platform: Platform) => {
    try {
      if (editingPlatform) {
        await updatePlatform(platform.id, platform);
      } else {
        await createPlatform(platform);
      }
      await loadPlatforms();
      setShowForm(false);
      setEditingPlatform(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 处理删除平台
  const handleDeletePlatform = async (id: string) => {
    if (!confirm('确定要删除这个平台吗？')) {
      return;
    }

    try {
      await deletePlatform(id);
      await loadPlatforms();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 处理测试平台
  const handleTestPlatform = async (id: string) => {
    try {
      setTestingPlatformId(id);
      const result = await testPlatform(id);
      setTestResult(result);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTestingPlatformId(null);
    }
  };

  // 处理启用/禁用平台
  const handleToggleEnabled = async (platform: Platform) => {
    try {
      await updatePlatform(platform.id, { enabled: !platform.enabled });
      await loadPlatforms();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 处理编辑平台
  const handleEditPlatform = (platform: Platform) => {
    setEditingPlatform(platform);
    setShowForm(true);
  };

  // 处理添加新平台
  const handleAddPlatform = () => {
    setEditingPlatform(null);
    setShowForm(true);
  };

  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadPlatforms}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">平台管理</h2>
        <button
          onClick={handleAddPlatform}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          添加平台
        </button>
      </div>

      {/* 平台列表 */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                平台
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                类型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {platforms.map((platform) => (
              <tr key={platform.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={platform.iconUrl}
                      alt={platform.name}
                      className="w-8 h-8 rounded-full mr-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/%3E%3C/svg%3E';
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {platform.name}
                      </div>
                      <div className="text-sm text-gray-500">{platform.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {platform.config?.type || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleEnabled(platform)}
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      platform.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {platform.enabled ? '已启用' : '已禁用'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleTestPlatform(platform.id)}
                    disabled={testingPlatformId === platform.id}
                    className="text-blue-600 hover:text-blue-900 disabled:text-gray-400"
                  >
                    {testingPlatformId === platform.id ? '测试中...' : '测试'}
                  </button>
                  <button
                    onClick={() => handleEditPlatform(platform)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeletePlatform(platform.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 平台表单模态框 */}
      {showForm && (
        <PlatformForm
          platform={editingPlatform}
          onSave={handleSavePlatform}
          onCancel={() => {
            setShowForm(false);
            setEditingPlatform(null);
          }}
        />
      )}

      {/* 测试结果模态框 */}
      {testResult && (
        <PlatformTestModal
          result={testResult}
          onClose={() => setTestResult(null)}
        />
      )}
    </div>
  );
};

export default PlatformManagement;
