import React from 'react';

interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
}

const NetworkError: React.FC<NetworkErrorProps> = ({ 
  message = '网络连接失败，请检查您的网络设置',
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-red-600"
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
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          网络错误
        </h3>
        
        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            重新加载
          </button>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            如果问题持续存在，请稍后再试
          </p>
        </div>
      </div>
    </div>
  );
};

export default NetworkError;
