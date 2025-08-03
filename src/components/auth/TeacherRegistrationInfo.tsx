import React from 'react';

export const TeacherRegistrationInfo: React.FC = () => (
  <div className="w-full bg-yellow-50 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 rounded-md px-3 py-3 flex flex-col items-center justify-center text-center shadow-sm text-base mt-2">
    <span className="font-semibold mb-1 text-lg">Teachers:</span>
    <span className="mb-1">Interested in registering?</span>
    <a href="mailto:shuff@chicousd.org" className="underline font-semibold break-all mb-1">Contact: shuff@chicousd.org</a>
    <span className="block mt-1 text-sm text-yellow-800 dark:text-yellow-200">Registration is limited for testing.</span>
  </div>
);
