import React, { useState } from "react";

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

export const HoverCard: React.FC<HoverCardProps> = ({ children, content }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block"
         onMouseEnter={() => setShow(true)}
         onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-4 mb-2 min-w-[220px] max-w-xs w-max bg-white dark:bg-gray-900 rounded-xl shadow-xl p-4 border border-gray-200 dark:border-gray-700 transition-all flex flex-col items-center justify-center text-center z-20">
          {content}
        </div>
      )}
    </div>
  );
};
