import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function FocusModeToggle({ isFocusMode, setIsFocusMode }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
      <div className="flex flex-col">
        <span className="font-semibold text-gray-800 text-sm">Focus Mode (Lọc nhiễu)</span>
        <span className="text-xs text-gray-500">Chỉ hiện đáp án đúng</span>
      </div>
      
      <button
        onClick={() => setIsFocusMode(!isFocusMode)}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isFocusMode ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span className="sr-only">Toggle Focus Mode</span>
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            isFocusMode ? 'translate-x-7' : 'translate-x-1'
          }`}
        >
          <span className="absolute inset-0 flex items-center justify-center transition-opacity">
            {isFocusMode ? (
              <Eye className="h-4 w-4 text-blue-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </span>
      </button>
    </div>
  );
}
