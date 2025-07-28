import React from 'react';

interface LoadingBarProps {
  isLoading: boolean;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div 
          className="h-full bg-sky-600"
          style={{
            animation: 'loadingBar 2s ease-in-out infinite',
          }}
        ></div>
      </div>
      <style>{`
        @keyframes loadingBar {
          0% {
            width: 0%;
            transform: translateX(0);
          }
          50% {
            width: 70%;
            transform: translateX(15%);
          }
          100% {
            width: 100%;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
