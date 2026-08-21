import React from 'react';

export default function ConfidenceButtons({ isConfident, onMark }) {
  return (
    <div className="flex gap-4">
      <button 
        onClick={() => onMark(true)}
        className={`flex items-center gap-2 px-4 py-1.5 font-bold transition-all border ${
          isConfident 
            ? 'bg-green-100 border-green-600 text-green-800' 
            : 'bg-white border-gray-300 text-gray-500 hover:bg-green-50'
        }`}
      >
        ✓ Nhớ rồi
      </button>
      
      <button 
        onClick={() => onMark(false)}
        className={`flex items-center gap-2 px-4 py-1.5 font-bold transition-all border ${
          isConfident === false 
            ? 'bg-orange-100 border-orange-500 text-orange-800' 
            : 'bg-white border-gray-300 text-gray-500 hover:bg-orange-50'
        }`}
      >
        ? Chưa chắc
      </button>
    </div>
  );
}
