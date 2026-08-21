import React from 'react';
import { Smile, Frown } from 'lucide-react';

export default function ConfidenceButtons({ isConfident, onMark }) {
  return (
    <div className="flex justify-center gap-4 mt-6 pt-6 border-t border-gray-100">
      <button 
        onClick={() => onMark(true)}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
          isConfident 
            ? 'bg-green-100 text-green-700 ring-2 ring-green-500 scale-105' 
            : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'
        }`}
      >
        <Smile size={20} /> Nhớ rồi
      </button>
      
      <button 
        onClick={() => onMark(false)}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
          isConfident === false 
            ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500 scale-105' 
            : 'bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-600'
        }`}
      >
        <Frown size={20} /> Chưa chắc
      </button>
    </div>
  );
}
