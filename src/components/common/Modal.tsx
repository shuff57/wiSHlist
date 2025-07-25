import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-4">{title}</h2>
        <div className="text-gray-700 dark:text-gray-300 mb-6">
          {children}
        </div>
        <div className="flex justify-end space-x-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-neutral-600"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};
