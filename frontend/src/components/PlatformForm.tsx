import React, { useState, useEffect } from 'react';
import { Platform } from '../types';

interface PlatformFormProps {
  platform: Platform | null;
  onSave: (platform: Platform) => void;
  onCancel: () => void;
}

const PlatformForm: React.FC<PlatformFormProps> = ({ platform, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Platform>({
    id: '',
    name: '',
    iconUrl: '',
    enabled: true,
    config: {
      type: 'static',
      url: '',
      selector: '',
      parser: {
        title: '',
        url: '',
      },
    },
  });

  useEffect(() => {
    if (platform) {
      setFormData(platform);
    }
  }, [platform]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleConfigChange = (field: string, value: string | number | undefined) => {
    setFormData({
      ...formData,
      config: {
        ...formData.config!,
        [field]: value,
      },
    });
  };

  const handleParserChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      config: {
        ...formData.config!,
        parser: {
          ...formData.config!.parser,
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {platform ? '编辑平台' : '添加平台'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 基本信息 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">平台 ID *</label>
            <input
              type="text"
              value={formData.id}
              onChange={e => setFormData({ ...formData, id: e.target.value })}
              disabled={!!platform}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">平台名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">图标 URL *</label>
            <input
              type="text"
              value={formData.iconUrl}
              onChange={e => setFormData({ ...formData, iconUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
              启用平台
            </label>
          </div>

          {/* 爬虫配置 */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-md font-semibold text-gray-900 mb-3">爬虫配置</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">爬虫类型 *</label>
              <select
                value={formData.config?.type}
                onChange={e => handleConfigChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="static">静态页面 (Static)</option>
                <option value="dynamic">动态页面 (Dynamic)</option>
                <option value="api">API</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标 URL *</label>
              <input
                type="text"
                value={formData.config?.url}
                onChange={e => handleConfigChange('url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {(formData.config?.type === 'static' || formData.config?.type === 'dynamic') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSS 选择器 *</label>
                <input
                  type="text"
                  value={formData.config?.selector || ''}
                  onChange={e => handleConfigChange('selector', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题解析规则 *</label>
              <input
                type="text"
                value={formData.config?.parser.title}
                onChange={e => handleParserChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">链接解析规则 *</label>
              <input
                type="text"
                value={formData.config?.parser.url}
                onChange={e => handleParserChange('url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时间解析规则</label>
              <input
                type="text"
                value={formData.config?.parser.time || ''}
                onChange={e => handleParserChange('time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">热度解析规则</label>
              <input
                type="text"
                value={formData.config?.parser.hotScore || ''}
                onChange={e => handleParserChange('hotScore', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                超时时间 (毫秒)
              </label>
              <input
                type="number"
                value={formData.config?.timeout || ''}
                onChange={e => handleConfigChange('timeout', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlatformForm;
