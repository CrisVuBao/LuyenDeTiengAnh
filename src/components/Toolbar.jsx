import React from 'react';
import { Shuffle, Filter } from 'lucide-react';

export default function Toolbar({ onShuffle, filterUnsure, setFilterUnsure }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button 
        onClick={onShuffle}
        className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
      >
        <Shuffle size={16} /> Xáo trộn
      </button>
      
      <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-all">
        <Filter size={16} className={filterUnsure ? "text-orange-500" : ""} />
        <span className={filterUnsure ? "text-orange-600" : ""}>Chỉ hiện câu "Chưa chắc"</span>
        <input 
          type="checkbox" 
          className="hidden" 
          checked={filterUnsure} 
          onChange={(e) => setFilterUnsure(e.target.checked)} 
        />
      </label>
    </div>
  );
}
