import React, { ReactNode } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
  const tooltipId = React.useId(); // Create a unique ID for each tooltip instance
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default:
        return 'bottom-full mb-2';
    }
  };

  const tooltipStyle = `
    [data-tooltip-id="${tooltipId}"] [data-tooltip-content] {
      opacity: 0;
      transition: opacity 300ms;
    }
    [data-tooltip-id="${tooltipId}"]:hover [data-tooltip-content] {
      opacity: 1;
    }
  `;

  return (
    <>
      <div data-tooltip-id={tooltipId} className="relative inline-flex items-center">
        {children}
        <div 
          className={`absolute ${getPositionClasses()} w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none z-10`}
          data-tooltip-content
        >
          {text}
        </div>
      </div>
      <style>{tooltipStyle}</style>
    </>
  );
};
