import React from 'react'

interface UrlPreviewProps {
  data: {
    title: string | null
    description: string | null
    image: string | null
    url: string
    price: string | null
    success: boolean
    fallback?: boolean
  } | null
  loading: boolean
  error: string | null
  onRetry?: () => void
  className?: string
}

export function UrlPreview({ data, loading, error, onRetry, className }: UrlPreviewProps) {
  if (loading) {
    return (
      <div className={`border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 ${className || ''}`}>
        <div className="animate-pulse">
          <div className="flex space-x-4">
            <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading preview...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20 ${className || ''}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Preview Error</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline mt-2"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={`relative border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow ${className || ''}`}>
      {/* Show warning banner for fallback or error scenarios */}
      {(error || (data && data.fallback)) && (
        <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800 dark:text-yellow-200">
              {data && data.fallback ? 'Limited preview - website blocking prevented full content extraction' : error}
            </span>
          </div>
        </div>
      )}
      {data ? (
        <a 
          href={data?.url || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded p-2 -m-2 overflow-hidden max-w-full"
        >
          <div className="flex space-x-4 overflow-hidden max-w-full">
            {data?.image && (
              <div className="flex-shrink-0">
                <img
                  src={data?.image ?? undefined}
                  alt={data?.title ?? 'Preview'}
                  className="w-20 h-20 object-cover rounded border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden max-w-full">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {data?.title && (
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1 overflow-hidden max-w-full">
                      {data?.title}
                    </h3>
                  )}
                  {data?.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 overflow-hidden max-w-full">
                      {data?.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate overflow-hidden max-w-full">
                    {data?.url}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5-1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
            Click to open link
          </div>
          {data?.price && (
            <div className="absolute left-4 right-4 bottom-4 flex justify-end">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-600 dark:bg-green-700 text-gray-100 dark:text-gray-300 shadow">
                {data.price}
              </span>
            </div>
          )}
        </a>
      ) : null}
    </div>
  );
}
