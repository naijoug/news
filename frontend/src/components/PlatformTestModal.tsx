import React from 'react';
import { PlatformTestResult } from '../types';

interface PlatformTestModalProps {
  result: PlatformTestResult;
  onClose: () => void;
}

const PlatformTestModal: React.FC<PlatformTestModalProps> = ({ result, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            测试结果 - {result.platformName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 测试摘要 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">状态</div>
              <div className={`text-lg font-semibold ${result.error ? 'text-red-600' : 'text-green-600'}`}>
                {result.error ? '失败' : '成功'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">抓取数量</div>
              <div className="text-lg font-semibold text-gray-900">{result.itemsFound} 条</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">耗时</div>
              <div className="text-lg font-semibold text-gray-900">{result.duration}</div>
            </div>
          </div>

          {/* 错误信息 */}
          {result.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800">错误信息</h4>
                  <p className="text-sm text-red-700 mt-1">{result.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 抓取结果 */}
          {result.items.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">抓取的新闻</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {item.title}
                        </a>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.publish_time && (
                            <span>时间: {new Date(item.publish_time).toLocaleString()}</span>
                          )}
                          {item.hot_score && (
                            <span className="ml-3">热度: {item.hot_score}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 无结果提示 */}
          {!result.error && result.items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              未抓取到任何新闻
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformTestModal;
