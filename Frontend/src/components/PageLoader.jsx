import React from 'react';

export default function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-950"></div>
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 animate-pulse">
        Đang tải trang...
      </p>
    </div>
  );
}
